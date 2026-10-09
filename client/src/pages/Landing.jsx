import { Link } from 'react-router-dom';
import Avatar from '../game/Avatar.jsx';

const cast = [
  { skin: '#6b4226', hair: 'braids', hairColor: '#15110f', outfit: 'ankara', outfitColor: '#e07a1f', accessory: 'earrings', brows: 'arched' },
  { skin: '#4a2c17', hair: 'fade', hairColor: '#15110f', outfit: 'kaftan', outfitColor: '#212529', accessory: 'chain', face: 'square', brows: 'thick' },
  { skin: '#8d5a3b', hair: 'gele', hairColor: '#d6336c', outfit: 'dress', outfitColor: '#2f9e44', accessory: 'earrings', face: 'round' },
];

export default function Landing() {
  return (
    <main className="landing">
      <div className="landing-cast">{cast.map((c, i) => <Avatar key={i} appearance={c} expression={['happy', 'confident', 'surprised'][i]} />)}</div>
      <div className="landing-copy">
        <p className="eyebrow">An interactive story</p>
        <h1 className="display huge">The Last Summer</h1>
        <p className="lede">Lagos. A grandmother's secret. A blue door. Every choice you make follows you.</p>
        <div className="row">
          <Link className="btn primary" to="/register">Play free</Link>
          <Link className="btn ghost" to="/login">I have an account</Link>
        </div>
      </div>
    </main>
  );
}
