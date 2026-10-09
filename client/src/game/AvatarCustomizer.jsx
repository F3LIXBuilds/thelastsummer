import { useState } from 'react';
import * as C from './constants.js';

export const AVATAR_TABS = [
  ['skin', 'Skin', 'swatch', C.SKIN], ['hair', 'Hair', 'pick', C.HAIR_STYLES], ['hairColor', 'Hair colour', 'swatch', C.HAIR_COLORS],
  ['face', 'Face', 'pick', C.FACES], ['brows', 'Brows', 'pick', C.BROWS], ['eyes', 'Eyes', 'swatch', C.EYE_COLORS],
  ['outfit', 'Outfit', 'pick', C.OUTFITS], ['outfitColor', 'Colour', 'swatch', C.OUTFIT_COLORS], ['accessory', 'Extras', 'pick', C.ACCESSORIES],
];

const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v ?? '');

export default function AvatarCustomizer({ value, onChange }) {
  const [tab, setTab] = useState('skin');
  const current = AVATAR_TABS.find((t) => t[0] === tab);
  const set = (k, v) => onChange({ ...value, [k]: v });

  return (
    <>
      <div className="tabs">
        {AVATAR_TABS.map(([k, label]) => <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>)}
      </div>
      <div className="options">
        {current[2] === 'swatch' ? (
          <>
            {current[3].map((c) => (
              <button key={c} type="button" aria-label={c} className={`swatch ${value[tab] === c ? 'on' : ''}`} style={{ background: c }} onClick={() => set(tab, c)} />
            ))}
            <label className="swatch custom" title="Custom colour">
              <input type="color" value={isHex(value[tab]) ? value[tab] : '#888888'} onChange={(e) => set(tab, e.target.value)} />
            </label>
          </>
        ) : (
          current[3].map(([id, label]) => (
            <button key={id} type="button" className={`pill ${value[tab] === id ? 'on' : ''}`} onClick={() => set(tab, id)}>{label}</button>
          ))
        )}
      </div>
    </>
  );
}
