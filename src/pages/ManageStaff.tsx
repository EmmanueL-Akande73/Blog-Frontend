import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getBranchById, getAllUsers, createUser, updateUser, deleteUser, branchManagerCreateStaff, branchManagerUpdateStaff, branchManagerDeleteStaff, branchManagerGetStaff } from '../services/api';
import { User, Branch } from '../types';
import './styles/ManageStaff.css';

const ManageStaff: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [staff, setStaff] = useState<User[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'CASHIER' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.branchId) {
        setError('No branch assigned.');
        setLoading(false);
        return;
      }
      try {
        const branchData = await getBranchById(user.branchId);
        setBranch(branchData);
        let usersData;
        if (user.role === 'BRANCH_MANAGER') {
          usersData = await branchManagerGetStaff();
          setStaff(usersData.users);
        } else {
          usersData = await getAllUsers();
          setStaff(usersData.users.filter((u: any) => user && u.branchId === user.branchId && u.role !== 'BRANCH_MANAGER'));
        }
      } catch (err) {
        setError('Failed to load staff data.');
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.branchId) {
      alert('No branch assigned.');
      return;
    }
    setLoading(true); // Set loading true only for the fetch, not for the whole page
    try {
      if (user.role === 'BRANCH_MANAGER') {
        await branchManagerCreateStaff(form.username, form.password, form.role);
        setError(null);
        alert('Staff created successfully!');
      } else {
        await createUser(form.username, form.password, form.role, user.branchId);
        setError(null);
        alert('Staff created successfully!');
      }
      setForm({ username: '', email: '', password: '', role: 'CASHIER' });
      // Only fetch and update staff, do not reload the whole page
      let usersData;
      if (user && user.role === 'BRANCH_MANAGER') {
        usersData = await branchManagerGetStaff();
        setStaff(usersData.users);
      } else if (user) {
        usersData = await getAllUsers();
        setStaff(usersData.users.filter(u => user && u.branchId === user.branchId && u.role !== 'BRANCH_MANAGER'));
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to create staff.');
      setLoading(false);
    }
  };

  const handleEdit = (staff: User) => {
    setEditingId(staff.id);
    setForm({ username: staff.username, email: staff.email, password: '', role: staff.role });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !user || !user.branchId) return;
    setLoading(true); // Set loading true only for the fetch, not for the whole page
    try {
      if (user.role === 'BRANCH_MANAGER') {
        await branchManagerUpdateStaff(editingId, { username: form.username, password: form.password, role: form.role });
        setError(null);
        alert('Staff updated successfully!');
      } else {
        await updateUser(editingId, { ...form, branchId: user.branchId });
        setError(null);
        alert('Staff updated successfully!');
      }
      setEditingId(null);
      setForm({ username: '', email: '', password: '', role: 'CASHIER' });
      // Only fetch and update staff, do not reload the whole page
      let usersData;
      if (user && user.role === 'BRANCH_MANAGER') {
        usersData = await branchManagerGetStaff();
        setStaff(usersData.users);
      } else if (user) {
        usersData = await getAllUsers();
        setStaff(usersData.users.filter(u => user && u.branchId === user.branchId && u.role !== 'BRANCH_MANAGER'));
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to update staff.');
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    setLoading(true); // Set loading true only for the fetch, not for the whole page
    try {
      if (user && user.role === 'BRANCH_MANAGER') {
        await branchManagerDeleteStaff(id);
        setError(null);
        alert('Staff deleted successfully!');
      } else {
        await deleteUser(id);
        setError(null);
        alert('Staff deleted successfully!');
      }
      // Only fetch and update staff, do not reload the whole page
      let usersData;
      if (user && user.role === 'BRANCH_MANAGER') {
        usersData = await branchManagerGetStaff();
        setStaff(usersData.users);
      } else if (user) {
        usersData = await getAllUsers();
        setStaff(usersData.users.filter(u => user && u.branchId === user.branchId && u.role !== 'BRANCH_MANAGER'));
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to delete staff.');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="manage-staff-page">
      <h1>Manage Staff for {branch?.name}</h1>
      <form onSubmit={editingId ? handleUpdate : handleCreate} className="staff-form">
        <input name="username" value={form.username} onChange={handleInputChange} placeholder="Username" required />
        <input name="email" value={form.email} onChange={handleInputChange} placeholder="Email" required type="email" />
        <input name="password" value={form.password} onChange={handleInputChange} placeholder="Password" type="password" required={!editingId} />
        <select name="role" value={form.role} onChange={handleInputChange} required>
          <option value="CASHIER">Cashier</option>
          <option value="CHEF">Chef</option>
        </select>
        <button type="submit">{editingId ? 'Update' : 'Create'} Staff</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ username: '', email: '', password: '', role: 'CASHIER' }); }}>Cancel</button>}
      </form>
      <table className="staff-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map(s => (
            <tr key={s.id}>
              <td>{s.username}</td>
              <td>{s.email}</td>
              <td>{s.role}</td>
              <td>
                <button onClick={() => handleEdit(s)}>Edit</button>
                <button onClick={() => handleDelete(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageStaff;
