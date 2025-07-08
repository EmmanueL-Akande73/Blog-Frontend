import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  updatedAt: string;
  menuItem?: {
    name: string;
    category?: string;
    updatedAt?: string;
  };
}

const Inventory: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchInventory = async () => {
      if (!user?.branch?.id) {
        if (isMounted) {
          setError('No branch assigned.');
          setLoading(false);
        }
        return;
      }
      try {
        if (isMounted) setLoading(true);
        if (isMounted) setError(null);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `/api/global-menu/inventory/branch/${user.branch.id}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (isMounted && Array.isArray(response.data)) {
          // Find the latest updatedAt timestamp in the inventory
          const latest = response.data.reduce((max: string, item: any) => {
            const date = item.updatedAt || (item.menuItem ? item.menuItem.updatedAt : null);
            return date && (!max || new Date(date) > new Date(max)) ? date : max;
          }, '');
          if (latest !== lastUpdate) {
            setInventory(response.data.map((item: any) => ({
              id: item.id,
              name: item.name || (item.menuItem ? item.menuItem.name : ''),
              category: item.category || (item.menuItem ? item.menuItem.category : ''),
              quantity: item.quantity,
              updatedAt: item.updatedAt,
              menuItem: item.menuItem ? {
                name: item.menuItem.name,
                category: item.menuItem.category,
                updatedAt: item.menuItem.updatedAt
              } : undefined
            })));
            setLastUpdate(latest);
          }
        }
      } catch (err: any) {
        if (isMounted) setError('Failed to fetch inventory.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInventory();
    const interval = setInterval(fetchInventory, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, lastUpdate]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    const fetchInventory = async () => {
      if (!user?.branch?.id) {
        setError('No branch assigned.');
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `/api/global-menu/inventory/branch/${user.branch.id}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (Array.isArray(response.data)) {
          const latest = response.data.reduce((max: string, item: any) => {
            const date = item.updatedAt || (item.menuItem ? item.menuItem.updatedAt : null);
            return date && (!max || new Date(date) > new Date(max)) ? date : max;
          }, '');
          if (latest !== lastUpdate) {
            setInventory(response.data.map((item: any) => ({
              id: item.id,
              name: item.name || (item.menuItem ? item.menuItem.name : ''),
              category: item.category || (item.menuItem ? item.menuItem.category : ''),
              quantity: item.quantity,
              updatedAt: item.updatedAt,
              menuItem: item.menuItem ? {
                name: item.menuItem.name,
                category: item.menuItem.category,
                updatedAt: item.menuItem.updatedAt
              } : undefined
            })));
            setLastUpdate(latest);
          }
        }
      } catch (err: any) {
        setError('Failed to fetch inventory.');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  };

  if (loading) return <div>Loading inventory...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="inventory-page" style={{ minHeight: '70vh', overflowX: 'auto' }}>
      <h2>Branch Inventory</h2>
      <button onClick={handleRefresh} style={{ marginBottom: 16 }}>Refresh</button>
      <table className="inventory-table" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th>Menu Item</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map(item => (
            <tr key={item.id}>
              <td>{item.menuItem?.name || item.name}</td>
              <td>{item.menuItem?.category || item.category}</td>
              <td>{item.quantity}</td>
              <td>{item.menuItem?.updatedAt
                ? new Date(item.menuItem.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : new Date(item.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
              }</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inventory;
