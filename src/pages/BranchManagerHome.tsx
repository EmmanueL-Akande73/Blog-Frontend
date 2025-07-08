import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getBranchById, getMe } from '../services/api';
import { Branch } from '../types';
import { useNavigate } from 'react-router-dom';
import './styles/Home.css';

const BranchManagerHome: React.FC = () => {
  const { user, token, login } = useContext(AuthContext);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Refresh user info from backend on mount
    const refreshUser = async () => {
      try {
        if (token) {
          const latestUser = await getMe();
          if (latestUser && user && latestUser.branchId !== user.branchId) {
            login(token, latestUser);
            window.location.reload(); // Force reload to ensure all state/UI is refreshed
          } else if (latestUser && user && latestUser.updatedAt !== user.updatedAt) {
            login(token, latestUser);
          }
        }
      } catch (err) {
        // ignore error, fallback to local user
      }
    };
    refreshUser();
  }, [login, token, user]);

  useEffect(() => {
    const fetchBranch = async () => {
      if (user?.branchId) {
        try {
          const branchData = await getBranchById(user.branchId);
          setBranch(branchData);
        } catch (err) {
          setError('Failed to load branch info');
        }
      }
      setLoading(false);
    };
    fetchBranch();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="branch-manager-dashboard">
      <div className="welcome-header">
        <div className="welcome-content">
          <h1>Welcome, {user?.username} – Branch Manager of {branch?.name || '...'}</h1>
          <div className="user-info">
            <span className="user-role">Branch Manager</span>
            <span className="last-login">
              Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="profile-section">
          <div className="profile-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
      <div className="branch-manager-content">
        <div className="overview-cards">
          <div className="overview-card">
            <div className="card-icon">⏰</div>
            <div className="card-content">
              <h3>Branch Open Hours</h3>
              <div>Monday: {branch?.mondayHours || 'N/A'}</div>
              <div>Tuesday: {branch?.tuesdayHours || 'N/A'}</div>
              <div>Wednesday: {branch?.wednesdayHours || 'N/A'}</div>
              <div>Thursday: {branch?.thursdayHours || 'N/A'}</div>
              <div>Friday: {branch?.fridayHours || 'N/A'}</div>
              <div>Saturday: {branch?.saturdayHours || 'N/A'}</div>
              <div>Sunday: {branch?.sundayHours || 'N/A'}</div>
            </div>
          </div>
          <div className="overview-card" onClick={() => navigate('/performance')} style={{ cursor: 'pointer' }}>
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Performance</h3>
              <p>Monitor your branch's sales and reservations in the analytics section.</p>
            </div>
          </div>
          <div className="overview-card" onClick={() => navigate('/menu-management')} style={{ cursor: 'pointer' }}>
            <div className="card-icon">🍽️</div>
            <div className="card-content">
              <h3>Menu Management</h3>
              <p>Update your branch's menu and inventory as needed.</p>
            </div>
          </div>
        </div>
        <div className="quick-access">
          <h2>Quick Access</h2>
          <div className="access-grid">
            <div className="access-card" onClick={() => navigate('/orders-and-reservations')} style={{ cursor: 'pointer' }}>
              <div className="access-icon">🧾</div>
              <h3>Orders & Reservations</h3>
              <p>View and manage branch orders and reservations</p>
            </div>
            <div className="access-card" onClick={() => navigate('/analytics')} style={{ cursor: 'pointer' }}>
              <div className="access-icon">📈</div>
              <h3>Analytics</h3>
              <p>View branch analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchManagerHome;
