import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSettings, setSettings } from '../game/settings.js';
import Avatar from '../game/Avatar.jsx';

export default function Profile() {
  const { user, profile, logout } = useAuth();
  const s = useSettings();
  const nav = useNavigate();
  return (
    <main className="page narrow">
      <header className="topbar"><Link to="/home">← Home</Link></header>
      <section className="hero"><Avatar appearance={profile.appearance} expression="happy" />
        <div><h1 className="display">{profile.displayName}</h1><p className="muted">@{user.username} · {profile.pronouns}</p><Link className="btn ghost" to="/create">Edit character</Link></div></section>

      <h2>Settings</h2>
      <div className="stack settings">
        <label>Music <input type="range" min="0" max="1" step="0.05" value={s.musicVol} onChange={(e) => setSettings({ musicVol: +e.target.value })} /></label>
        <label>Sound effects <input type="range" min="0" max="1" step="0.05" value={s.sfxVol} onChange={(e) => setSettings({ sfxVol: +e.target.value })} /></label>
        <label>Text speed
          <select value={s.textSpeed} onChange={(e) => setSettings({ textSpeed: +e.target.value })}>
            <option value="25">Slow</option><option value="45">Normal</option><option value="90">Fast</option><option value="200">Instant</option>
          </select></label>
        <label className="check"><input type="checkbox" checked={s.muted} onChange={(e) => setSettings({ muted: e.target.checked })} /> Mute everything</label>
      </div>
      <button className="btn ghost" onClick={async () => { await logout(); nav('/'); }}>Log out</button>
    </main>
  );
}
