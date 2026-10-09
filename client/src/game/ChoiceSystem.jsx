export default function ChoiceSystem({ choice, onPick }) {
  return (
    <div className="choices" role="dialog" aria-label="Choose">
      <h2 className="choice-prompt">{choice.prompt}</h2>
      <div className="choice-list">
        {choice.options.map((o, i) => (
          <button key={o.id} className={`choice-btn ${o.locked ? 'locked' : ''} ${o.premium ? 'premium' : ''}`}
            style={{ '--i': i }} disabled={o.locked} onClick={() => onPick(o.id)}>
            {o.premium && <span className="badge">◆ Premium choice</span>}
            {o.locked && <span className="badge">🔒 {o.hint ?? 'Not available yet'}</span>}
            <span>{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
