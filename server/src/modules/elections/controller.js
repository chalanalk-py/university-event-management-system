import { query } from '../../config/database.js';

// Create election/nomination period (Admin)
export const createElection = async (req, res) => {
  try {
    const { event_id, title, description, nomination_start, nomination_end, voting_start, voting_end, positions } = req.body;
    const result = await query(
      `INSERT INTO elections (event_id, title, description, nomination_start, nomination_end, voting_start, voting_end, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [event_id, title, description, nomination_start, nomination_end, voting_start, voting_end, req.user.id]
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
    const result = await query('SELECT * FROM elections WHERE event_id = $1 ORDER BY created_at DESC', [req.params.eventId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get election details with positions, nominees, results
export const getElection = async (req, res) => {
  try {
    const election = await query('SELECT * FROM elections WHERE id = $1', [req.params.id]);
    if (!election.rows.length) return res.status(404).json({ error: 'Election not found' });

    const positions = await query('SELECT * FROM committee_positions WHERE election_id = $1', [req.params.id]);

    // Get nominees for each position
    const positionsWithNominees = await Promise.all(positions.rows.map(async (pos) => {
      const nominees = await query(
        `SELECT n.id, n.nominee_id, u.username FROM nominations n 
         JOIN users u ON n.nominee_id = u.id WHERE n.position_id = $1`,
        [pos.id]
      );

      // Get vote counts only if election closed (keep confidential during voting)
      let results = [];
      if (election.rows[0].status === 'closed') {
        results = (await query(
          `SELECT nominee_id, COUNT(*) as vote_count FROM votes WHERE position_id = $1 GROUP BY nominee_id ORDER BY vote_count DESC`,
          [pos.id]
        )).rows;
      }

      return { ...pos, nominees: nominees.rows, results };
    }));

    res.json({ ...election.rows[0], positions: positionsWithNominees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Nominate self or another student
export const nominate = async (req, res) => {
  try {
    const { position_id, nominee_id } = req.body;
    const result = await query(
      'INSERT INTO nominations (position_id, nominee_id, nominated_by) VALUES ($1, $2, $3) RETURNING *',
      [position_id, nominee_id || req.user.id, req.user.id]
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

    const election = await query("SELECT id FROM elections WHERE id = $1 AND status = 'voting'", [pos.rows[0].election_id]);
    if (!election.rows.length) return res.status(400).json({ error: 'Voting is not open' });

    const result = await query(
      'INSERT INTO votes (position_id, nominee_id, voter_id) VALUES ($1, $2, $3) RETURNING id',
      [position_id, nominee_id, req.user.id]
    );
    // Return minimal info to maintain confidentiality
    res.status(201).json({ message: 'Vote recorded' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already voted for this position' });
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
