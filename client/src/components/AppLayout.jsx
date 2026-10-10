import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AppLayout() {
  const { user } = useAuth();
  const items = [['/home', 'Home', '🏠'], ['/stories', 'Discover', '🧭'], ['/profile', 'Profile', '👤']];
  if (user?.role === 'admin') items.push(['/admin', 'Studio', '🎬']);
  return (
    <div className="has-nav">
      <Outlet />
      <nav className="appnav" aria-label="Main">
        {items.map(([to, label, icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'on' : '')}>
            <span>{icon}</span>{label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
