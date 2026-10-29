import cron from 'node-cron';
import { query } from '../config/database.js';
import { notifyMany } from '../utils/notifications.js';

// Run every minute - close expired elections and tally votes
export const startElectionJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      // Find elections that voting_end has passed and status is still 'voting'
      const expired = await query(
        "SELECT id FROM elections WHERE status = 'voting' AND voting_end <= NOW()"
      );

      for (const election of expired.rows) {
        // Close election
        await query("UPDATE elections SET status = 'closed' WHERE id = $1", [election.id]);

        // Get all positions for this election
        const positions = await query(
          'SELECT id, title FROM committee_positions WHERE election_id = $1',
          [election.id]
        );

        for (const pos of positions.rows) {
          // Tally votes - get winner
          const winner = await query(
            `SELECT nominee_id, COUNT(*) as vote_count 
             FROM votes WHERE position_id = $1 
             GROUP BY nominee_id ORDER BY vote_count DESC LIMIT 1`,
            [pos.id]
          );

          if (winner.rows.length) {
            // Add winner to committee
            await query(
              'INSERT INTO committee_members (election_id, position_id, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
              [election.id, pos.id, winner.rows[0].nominee_id]
            );

            // Update winner role to Event Member
            await query(
              "UPDATE users SET role = 'Event Member' WHERE id = $1 AND role = 'Student'",
              [winner.rows[0].nominee_id]
            );
          }
        }

        // Notify all students about results
        const students = await query("SELECT id FROM users WHERE role IN ('Student', 'Event Member')");
        const studentIds = students.rows.map(s => s.id);
        await notifyMany(studentIds, 'election_result', 'Election Results', `Election #${election.id} results are now available.`);
      }

      // Also update election status based on time windows
      await query("UPDATE elections SET status = 'nominating' WHERE status = 'upcoming' AND nomination_start <= NOW() AND nomination_end > NOW()");
      await query("UPDATE elections SET status = 'voting' WHERE status = 'nominating' AND voting_start <= NOW() AND voting_end > NOW()");
    } catch (err) {
      console.error('Election job error:', err.message);
    }
  });
};
