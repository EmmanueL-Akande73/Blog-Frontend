import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMenu, getBranchById } from '../services/api';
import { MenuItem, Branch } from '../types';
import './styles/MenuManagement.css';

const MenuManagement: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.branchId) {
        setError('No branch assigned.');
        setLoading(false);
        return;
      }
      try {
        const branchData = await getBranchById(user.branchId);
        setBranch(branchData);
        const menuData = await getMenu();
        // For now, show all menu items (since MenuItem is not branch-specific in the schema)
        setMenu(menuData);
      } catch (err) {
        setError('Failed to load menu data.');
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="menu-management-page">
      <h1>Menu Management</h1>
      <h2>Branch: {branch?.name}</h2>
      <table className="menu-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody>
          {menu.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>{item.category}</td>
              <td>{item.isAvailable ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MenuManagement;
