import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="topbar-container">
      <header className="topbar">
        <div className="topbar-logo">
          <Shield size={24} color="var(--orange)" />
          <span className="topbar-brand">OncoVision <span>XAI</span></span>
        </div>
        
        <nav className="topbar-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? "topbar-link active" : "topbar-link"}>Analysis</NavLink>
          <NavLink to="/metrics" className={({ isActive }) => isActive ? "topbar-link active" : "topbar-link"}>Metrics</NavLink>
          <NavLink to="/dataset" className={({ isActive }) => isActive ? "topbar-link active" : "topbar-link"}>Dataset</NavLink>
          <NavLink to="/architecture" className={({ isActive }) => isActive ? "topbar-link active" : "topbar-link"}>Architecture</NavLink>
        </nav>

        <div className="topbar-actions">
          <button className="btn-primary">Connect System</button>
        </div>
      </header>
    </div>
  );
}
