import { query } from '../../config/database.js';

// Ensure schema is up to date
const ensureSchema = async () => {
  try {
    await query(`
      ALTER TABLE nominations ADD COLUMN IF NOT EXISTS manifesto TEXT;
      ALTER TABLE nominations ADD COLUMN IF NOT EXISTS candidate_name VARCHAR(150);
    `);
  } catch (err) {
    // Ignore if database is not connected yet during build
  }
};
ensureSchema();

// Create election/nomination period (Admin)
export const createElection = async (req, res) => {
  try {
    await ensureSchema();
    const { event_id, title, description, nomination_start, nomination_end, voting_start, voting_end, positions } = req.body;
    const result = await query(
      `INSERT INTO elections (event_id, title, description, nomination_start, nomination_end, voting_start, voting_end, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'voting', $8) RETURNING *`,
      [event_id, title, description, nomination_start || new Date(), nomination_end || new Date(), voting_start || new Date(), voting_end || new Date(), req.user.id]
    );

    // Create positions if provided
    if (positions && positions.length) {
      for (const pos of positions) {
        await query('INSERT INTO committee_positions (election_id, title, description) VALUES ($1, $2, $3)', [result.rows[0].id, pos.title, pos.description]);
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get elections for event
export const getElections = async (req, res) => {
  try {
    await ensureSchema();
    const result = await query('SELECT * FROM elections WHERE event_id = $1 ORDER BY created_at DESC', [req.params.eventId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get election details with positions, nominees, results
export const getElection = async (req, res) => {
  try {
    await ensureSchema();
    const election = await query('SELECT * FROM elections WHERE id = $1', [req.params.id]);
    if (!election.rows.length) return res.status(404).json({ error: 'Election not found' });

    const positions = await query('SELECT * FROM committee_positions WHERE election_id = $1 ORDER BY id ASC', [req.params.id]);

    // Get nominees for each position
    const positionsWithNominees = await Promise.all(positions.rows.map(async (pos) => {
      const nominees = await query(
        `SELECT n.id, n.nominee_id, 
         COALESCE(NULLIF(n.candidate_name, ''), u.username) as username, 
         u.email, 
         n.manifesto,
         COALESCE((SELECT COUNT(*) FROM votes v WHERE v.position_id = n.position_id AND v.nominee_id = n.nominee_id), 0)::int as vote_count
         FROM nominations n 
         JOIN users u ON n.nominee_id = u.id 
         WHERE n.position_id = $1
         ORDER BY vote_count DESC, n.created_at ASC`,
        [pos.id]
      );

      // Check total votes for this position
      const totalVotesRes = await query(
        `SELECT COUNT(*)::int as count FROM votes WHERE position_id = $1`,
        [pos.id]
      );
      const total_votes = totalVotesRes.rows[0]?.count || 0;

      // Check if current user voted
      let userVotedNomineeId = null;
      if (req.user?.id) {
        const userVote = await query(
          `SELECT nominee_id FROM votes WHERE position_id = $1 AND voter_id = $2`,
          [pos.id, req.user.id]
        );
        if (userVote.rows.length) {
          userVotedNomineeId = userVote.rows[0].nominee_id;
        }
      }

      // Get vote counts only if election closed or calculate results
      let results = [];
      if (election.rows[0].status === 'closed') {
        results = (await query(
          `SELECT nominee_id, COUNT(*) as vote_count FROM votes WHERE position_id = $1 GROUP BY nominee_id ORDER BY vote_count DESC`,
          [pos.id]
        )).rows;
      }

      return {
        ...pos,
        nominees: nominees.rows,
        total_votes,
        user_voted_nominee_id: userVotedNomineeId,
        results
      };
    }));

    res.json({ ...election.rows[0], positions: positionsWithNominees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Nominate self or another student
export const nominate = async (req, res) => {
  try {
    await ensureSchema();
    const { position_id, nominee_id, candidate_name, manifesto } = req.body;
    let targetNomineeId = nominee_id;

    if (!targetNomineeId && candidate_name) {
      const trimmed = candidate_name.trim();
      const userMatch = await query(
        `SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1`,
        [trimmed]
      );
      if (userMatch.rows.length) {
        targetNomineeId = userMatch.rows[0].id;
      } else {
        const partial = await query(
          `SELECT id FROM users WHERE LOWER(username) LIKE LOWER($1) LIMIT 1`,
          [`%${trimmed}%`]
        );
        if (partial.rows.length) {
          targetNomineeId = partial.rows[0].id;
        } else {
          targetNomineeId = req.user.id;
        }
      }
    }

    if (!targetNomineeId) {
      targetNomineeId = req.user.id;
    }

    const result = await query(
      `INSERT INTO nominations (position_id, nominee_id, nominated_by, manifesto, candidate_name) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (position_id, nominee_id) 
       DO UPDATE SET manifesto = EXCLUDED.manifesto, candidate_name = EXCLUDED.candidate_name 
       RETURNING *`,
      [position_id, targetNomineeId, req.user.id, manifesto || '', candidate_name || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already nominated for this position' });
    res.status(500).json({ error: err.message });
  }
};

// Vote (one vote per position per user)
export const vote = async (req, res) => {
  try {
    const { position_id, nominee_id } = req.body;

    // Verify election is in voting status
    const pos = await query('SELECT cp.election_id FROM committee_positions cp WHERE cp.id = $1', [position_id]);
    if (!pos.rows.length) return res.status(404).json({ error: 'Position not found' });

    const election = await query("SELECT id, status FROM elections WHERE id = $1", [pos.rows[0].election_id]);
    if (!election.rows.length) return res.status(400).json({ error: 'Election not found' });
    if (election.rows[0].status === 'closed') return res.status(400).json({ error: 'Voting is closed' });

    await query(
      'INSERT INTO votes (position_id, nominee_id, voter_id) VALUES ($1, $2, $3) RETURNING id',
      [position_id, nominee_id, req.user.id]
    );
    res.status(201).json({ message: 'Vote recorded' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already voted for this position' });
    res.status(500).json({ error: err.message });
  }
};

// Close election & elect winners (Admin)
export const closeElection = async (req, res) => {
  try {
    const { id } = req.params;
    await query("UPDATE elections SET status = 'closed' WHERE id = $1", [id]);

    const positions = await query('SELECT id FROM committee_positions WHERE election_id = $1', [id]);
    for (const pos of positions.rows) {
      const winner = await query(
        `SELECT nominee_id, COUNT(*) as vote_count 
         FROM votes WHERE position_id = $1 
         GROUP BY nominee_id ORDER BY vote_count DESC LIMIT 1`,
        [pos.id]
      );
      if (winner.rows.length) {
        await query(
          'INSERT INTO committee_members (election_id, position_id, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [id, pos.id, winner.rows[0].nominee_id]
        );
        await query(
          "UPDATE users SET role = 'Event Member' WHERE id = $1 AND role = 'Student'",
          [winner.rows[0].nominee_id]
        );
      }
    }

    res.json({ message: 'Voting closed and winners elected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get elected committee members
export const getCommittee = async (req, res) => {
  try {
    const result = await query(
      `SELECT cm.*, u.username, u.email, cp.title as position_title 
       FROM committee_members cm 
       JOIN users u ON cm.user_id = u.id 
       JOIN committee_positions cp ON cm.position_id = cp.id 
       WHERE cm.election_id = $1`,
      [req.params.electionId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
