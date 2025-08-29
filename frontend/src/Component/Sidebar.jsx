import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <nav className="nav">
      <div className="logo">ViewTube</div>
      <ul>
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            🏠 Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/subscriptions" className={({ isActive }) => isActive ? 'active' : ''}>
            📜 subscription
          </NavLink>
        </li>
        <li>
          <NavLink to="/you" className={({ isActive }) => isActive ? 'active' : ''}>
            🎵 you
          </NavLink>
        </li>
      </ul>
      <div className="auth-cta">
        <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>Sign in</NavLink>
      </div>
    </nav>
  )
}