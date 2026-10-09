import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../game/Avatar.jsx';
import AvatarCustomizer from '../game/AvatarCustomizer.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { DEFAULT_APPEARANCE } from '../game/constants.js';

export default function CharacterCreation() {
  const { profile, saveProfile } = useAuth();
  const nav = useNavigate();
  const [a, setA] = useState({ ...DEFAULT_APPEARANCE, ...(profile?.appearance ?? {}) });
  const [name, setName] = useState(profile?.displayName ?? '');
  const [pronouns, setPronouns] = useState(profile?.pronouns ?? 'they/them');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true); setError('');
    try { await saveProfile({ displayName: name.trim(), pronouns, appearance: a, onboarded: true }); nav('/home'); }
    catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <main className="creator">
      <div className="preview"><Avatar appearance={a} expression="happy" /></div>
      <div className="panel">
        <h1 className="display">Who are you?</h1>
        <input className="input" value={name} maxLength={24} placeholder="Your name" onChange={(e) => setName(e.target.value)} />
        <div className="seg">{['she/her', 'he/him', 'they/them'].map((p) => <button key={p} className={pronouns === p ? 'on' : ''} onClick={() => setPronouns(p)}>{p}</button>)}</div>
        <AvatarCustomizer value={a} onChange={setA} />
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={!name.trim() || busy} onClick={save}>{busy ? 'Saving…' : 'Enter the story'}</button>
      </div>
    </main>
  );
}
