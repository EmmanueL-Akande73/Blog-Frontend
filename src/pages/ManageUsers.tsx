import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllUsers, createUser, updateUser, updateUserRole, deleteUser, getBranches } from '../services/api';
import { User, UsersResponse, Branch } from '../types';
import './styles/ManageUsers.css';

interface CreateUserForm {
  username: string;
  password: string;
  role: string;
  branchId: string;
}

interface EditUserForm {
  username: string;
  password: string;
  branchId: string;
}

const ManageUsers: React.FC = () => {
  const { user: currentUser, login } = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    password: '',
    role: 'CUSTOMER',
    branchId: ''
  });

  const [editForm, setEditForm] = useState<EditUserForm>({
    username: '',
    password: '',
    branchId: ''
  });

  const roleOptions = [
    'CUSTOMER',
    'CHEF', 
    'CASHIER',
    'BRANCH_MANAGER',
    'HEADQUARTER_MANAGER',
    'ADMIN'
  ];
  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response: UsersResponse = await getAllUsers(page, 10);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const branchesData = await getBranches();
      setBranches(branchesData);
    } catch (err: any) {
      console.error('Failed to fetch branches:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const branchId = createForm.branchId ? Number(createForm.branchId) : undefined;
      await createUser(createForm.username, createForm.password, createForm.role, branchId);
      setSuccess('User created successfully');
      setShowCreateModal(false);
      setCreateForm({ username: '', password: '', role: 'CUSTOMER', branchId: '' });
      fetchUsers(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);
      const updates: any = {};
      if (editForm.username.trim()) updates.username = editForm.username.trim();
      if (editForm.password.trim()) updates.password = editForm.password.trim();
      if (editForm.branchId) updates.branchId = Number(editForm.branchId);

      if (Object.keys(updates).length === 0) {
        setError('Please provide at least one field to update');
        return;
      }

      const response = await updateUser(selectedUser.id, updates);
      setSuccess('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      setEditForm({ username: '', password: '', branchId: '' });
      // If the updated user is the current user, update AuthContext and localStorage
      if (currentUser && response.user && response.user.id === currentUser.id) {
        const token = localStorage.getItem('token');
        if (token) {
          login(token, response.user);
        }
      }
      fetchUsers(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };
  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setLoading(true);
      setError(null);
      await updateUserRole(userId, newRole);
      setSuccess('User role updated successfully');
      fetchUsers(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchAssignment = async (userId: number, branchId: string) => {
    try {
      setLoading(true);
      setError(null);
      const updates: any = {};
      if (branchId) {
        updates.branchId = Number(branchId);
      } else {
        updates.branchId = null;
      }
      const response = await updateUser(userId, updates);
      setSuccess('Branch assignment updated successfully');
      // If the updated user is the current user, update AuthContext and localStorage
      if (currentUser && response.user && response.user.id === currentUser.id) {
        const token = localStorage.getItem('token');
        if (token) {
          login(token, response.user);
        }
      }
      fetchUsers(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update branch assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);
      await deleteUser(selectedUser.id);
      setSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      password: '',
      branchId: user.branchId ? user.branchId.toString() : ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Only allow edit if currentUser is ADMIN, or HQ_MANAGER editing non-admin
  const canEditUser = (user: User): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'HEADQUARTER_MANAGER' && user.role !== 'ADMIN') return true;
    return false;
  };
  // Only allow delete if currentUser is ADMIN, or HQ_MANAGER deleting non-admin and not self
  const canDeleteUser = (user: User): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN' && user.id !== currentUser.id) return true;
    if (currentUser.role === 'HEADQUARTER_MANAGER' && user.role !== 'ADMIN' && user.id !== currentUser.id) return true;
    return false;
  };

  // Allow both ADMIN and HQ_MANAGER to access
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'HEADQUARTER_MANAGER')) {
    return (
      <div className="manage-users-container">
        <div className="error-message">
          Access denied. Only administrators and HQ managers can manage users.
        </div>
      </div>
    );
  }

  return (
    <div className="manage-users-container">
      <div className="manage-users-header">
        <h1>Manage Users</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create New User
        </button>
      </div>

      {error && (
        <div className="message error-message">
          {error}
          <button onClick={clearMessages} className="close-btn">&times;</button>
        </div>
      )}

      {success && (
        <div className="message success-message">
          {success}
          <button onClick={clearMessages} className="close-btn">&times;</button>
        </div>
      )}

      {loading && <div className="loading">Loading...</div>}

      <div className="users-table-container">
        <table className="users-table">          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={!canEditUser(user) || loading}
                    className="role-select"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </td>                <td>
                  {['BRANCH_MANAGER', 'CASHIER', 'CHEF'].includes(user.role) ? (
                    <select
                      value={user.branchId || ''}
                      onChange={(e) => handleBranchAssignment(user.id, e.target.value)}
                      disabled={!canEditUser(user) || loading}
                      className="branch-select"
                    >
                      <option value="">No Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="actions-cell">
                  {canEditUser(user) && (
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={() => openEditModal(user)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteUser(user) && (
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => openDeleteModal(user)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => fetchUsers(pagination.page - 1)}
          disabled={!pagination.hasPrev || loading}
          className="btn btn-small"
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} total users)
        </span>
        <button
          onClick={() => fetchUsers(pagination.page + 1)}
          disabled={!pagination.hasNext || loading}
          className="btn btn-small"
        >
          Next
        </button>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New User</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-content">
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                />
              </div>              <div className="form-group">
                <label>Role:</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              {['BRANCH_MANAGER', 'CASHIER', 'CHEF'].includes(createForm.role) && (
                <div className="form-group">
                  <label>Branch:</label>
                  <select
                    value={createForm.branchId}
                    onChange={(e) => setCreateForm({ ...createForm, branchId: e.target.value })}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Create User
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit User: {selectedUser.username}</h2>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleEditUser} className="modal-content">
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="Leave empty to keep current username"
                />
              </div>              <div className="form-group">
                <label>New Password:</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave empty to keep current password"
                />
              </div>
              {selectedUser && ['BRANCH_MANAGER', 'CASHIER', 'CHEF'].includes(selectedUser.role) && (
                <div className="form-group">
                  <label>Branch:</label>
                  <select
                    value={editForm.branchId}
                    onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value })}
                  >
                    <option value="">No Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Update User
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Delete User</h2>
              <button
                className="close-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to delete user <strong>{selectedUser.username}</strong>?
                This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteUser}
                  disabled={loading}
                >
                  Delete User
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
