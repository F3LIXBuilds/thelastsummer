import Avatar from './Avatar.jsx';

export default function CharacterRenderer({ actor, def, speaking, dim }) {
  const cls = ['actor', `pos-${actor.position}`, speaking && 'speaking', dim && 'dim', actor.leaving && `leave-${actor.exit}`].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div key={actor.k} className={`actor-in enter-${actor.enter}`}>
        <Avatar appearance={def?.appearance} expression={actor.expression} />
      </div>
    </div>
  );
}
