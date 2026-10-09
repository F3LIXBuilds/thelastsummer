import { query } from '../db/pool.js';

export async function loadMe(id) {
  const { rows: [r] } = await query(
    `SELECT u.id, u.email, u.username, u.role, u.created_at, p.display_name, p.pronouns, p.appearance, p.onboarded
       FROM users u JOIN player_profiles p ON p.user_id = u.id WHERE u.id = $1`, [id]);
  if (!r) return null;
  return {
    user: { id: r.id, email: r.email, username: r.username, role: r.role, createdAt: r.created_at },
    profile: { displayName: r.display_name, pronouns: r.pronouns, appearance: r.appearance, onboarded: r.onboarded },
  };
}
