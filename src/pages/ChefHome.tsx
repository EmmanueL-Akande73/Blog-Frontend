import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './styles/CashierHome.css';

const ChefHome: React.FC = () => {
  const { user } = useContext(AuthContext);
  const name = user?.username || 'Chef';
  const branchName = user?.branch?.name || 'Unknown Branch';
  const now = new Date();
  // Optional: Replace with real shift status if available
  const shiftStatus = 'On Duty';

  return (
    <div className="cashier-home-bg">
      <div className="cashier-welcome-card">
        <div className="cashier-welcome-content">
          <span className="cashier-role-badge">Chef</span>
          <h1 style={{ fontWeight: 700, fontSize: '2.2rem', margin: 0 }}>
            Welcome, Chef {name} – {branchName}
          </h1>
          <div className="cashier-date">Today is {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div className="cashier-shift">Shift status: {shiftStatus}</div>
        </div>
        <div className="cashier-avatar">{name.charAt(0).toUpperCase()}</div>
      </div>
    </div>
  );
};

export default ChefHome;
