import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';

// If the character has a "portrait" name, we try <portrait>_<expression> then <portrait>
// from the uploaded images, and fall back to the drawn avatar if neither exists.
export default function Figure({ def, appearance, expression = 'neutral', speaking = false }) {
  const base = def?.portrait;
  const [stage, setStage] = useState(0); // 0 = expression image, 1 = base image, 2 = give up
  useEffect(() => setStage(0), [base, expression]);

  if (!base || stage > 1)
    return <Avatar appearance={appearance ?? def?.appearance} expression={expression} speaking={speaking} />;

  const name = stage === 0 ? `${base}_${expression}` : base;
  return (
    <img className="portrait" src={`/api/media/${encodeURIComponent(name)}`} alt={def?.name ?? ''}
      draggable={false} onError={() => setStage((s) => s + 1)} />
  );
}
