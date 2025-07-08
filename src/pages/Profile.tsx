import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateUser, getMe } from '../services/api';
import './styles/Profile.css';

const Profile: React.FC = () => {
  const { user, login } = useContext(AuthContext);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [form, setForm] = useState({ username: user?.username || '' });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) {
    return <div className="profile-page">Please log in to view your profile.</div>;
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUser(user.id, { username: form.username });
      // Fetch the latest user profile from backend
      const latestUser = await getMe();
      login(localStorage.getItem('token')!, latestUser);
      setSuccess('Profile updated successfully!');
      setEditOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (passwordForm.password !== passwordForm.confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    try {
      await updateUser(user.id, { password: passwordForm.password });
      setSuccess('Password changed successfully!');
      setPasswordOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{user.username}</h1>
            <span className="role-badge">{user.role.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="profile-details">
          <h2>Account Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Username</label>
              <span>{user.username}</span>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <span>{user.email}</span>
            </div>
            <div className="detail-item">
              <label>Role</label>
              <span>{user.role.replace('_', ' ')}</span>
            </div>
            <div className="detail-item">
              <label>Member Since</label>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="edit-profile-btn" onClick={() => setEditOpen(true)}>Edit Profile</button>
          <button className="change-password-btn" onClick={() => setPasswordOpen(true)}>Change Password</button>
        </div>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      </div>
      {editOpen && (
        <div className="modal">
          <form className="modal-content" onSubmit={handleEdit}>
            <h3>Edit Profile</h3>
            <label>Username</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            <div className="modal-actions">
              <button type="submit" disabled={loading}>Save</button>
              <button type="button" onClick={() => setEditOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {passwordOpen && (
        <div className="modal">
          <form className="modal-content" onSubmit={handlePassword}>
            <h3>Change Password</h3>
            <label>New Password</label>
            <input type="password" value={passwordForm.password} onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))} required />
            <label>Confirm Password</label>
            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} required />
            <div className="modal-actions">
              <button type="submit" disabled={loading}>Change</button>
              <button type="button" onClick={() => setPasswordOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
