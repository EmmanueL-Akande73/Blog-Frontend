import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/GlobalMenu.css';
import './styles/Inventory.css';

const GlobalMenuPage: React.FC = () => {
  const [menu, setMenu] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryEdits, setInventoryEdits] = useState<{[key: string]: number | ''}>({});
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventorySuccess, setInventorySuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/global-menu', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMenu(res.data.menu);
        setBranches(res.data.branches);
      } catch (err: any) {
        setError('Failed to fetch global menu');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const handleInventoryChange = (menuItemId: number, branchId: number, value: string) => {
    const key = `${menuItemId}_${branchId}`;
    setInventoryEdits({ ...inventoryEdits, [key]: value === '' ? '' : Number(value) });
  };

  const handleInventorySave = async (menuItemId: number, branchId: number) => {
    setInventoryLoading(true);
    setInventoryError(null);
    setInventorySuccess(null);
    const key = `${menuItemId}_${branchId}`;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/global-menu/inventory', {
        menuItemId,
        branchId,
        quantity: inventoryEdits[key]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventorySuccess('Inventory updated!');
      setTimeout(() => setInventorySuccess(null), 1500);
      setInventoryEdits({ ...inventoryEdits, [key]: '' });
      // Refresh menu
      const res = await axios.get('/api/global-menu', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenu(res.data.menu);
    } catch (err: any) {
      setInventoryError('Failed to update inventory');
      setTimeout(() => setInventoryError(null), 2000);
    } finally {
      setInventoryLoading(false);
    }
  };

  if (loading) return <div className="global-menu-page">Loading global menu...</div>;
  if (error) return <div className="global-menu-page">{error}</div>;

  return (
    <div className="global-menu-page">
      <div className="global-menu-header">Global Menu</div>
      <div className="global-menu-sub">View all menu items and their inventories across all branches.</div>
      <div style={{overflowX: 'auto'}}>
        <table className="global-menu-table">
          <thead>
            <tr>
              <th>Menu Item</th>
              <th>Category</th>
              {branches.map((branch: any) => (
                <th key={branch.id}>{branch.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {menu.map((item: any) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                {item.inventories.map((inv: any) => (
                  <td key={inv.branchId} className={inv.quantity === null ? 'na' : ''}>
                    {inv.quantity !== null ? inv.quantity : <span className="na">N/A</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Inventory Management Section */}
      <div className="inventory-section">
        <div className="inventory-header">Inventory Management</div>
        {inventoryError && <div style={{color:'red',marginBottom:8}}>{inventoryError}</div>}
        {inventorySuccess && <div style={{color:'green',marginBottom:8}}>{inventorySuccess}</div>}
        <div style={{overflowX: 'auto'}}>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Menu Item</th>
                <th>Category</th>
                {branches.map((branch: any) => (
                  <th key={branch.id}>{branch.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menu.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  {item.inventories.map((inv: any) => {
                    const key = `${item.id}_${inv.branchId}`;
                    return (
                      <td key={inv.branchId}>
                        <input
                          className="inventory-edit-input"
                          type="number"
                          min={0}
                          value={inventoryEdits[key] !== undefined ? inventoryEdits[key] : (inv.quantity !== null ? inv.quantity : '')}
                          onChange={e => handleInventoryChange(item.id, inv.branchId, e.target.value)}
                          disabled={inventoryLoading}
                        />
                        <button
                          className="inventory-edit-btn"
                          onClick={() => handleInventorySave(item.id, inv.branchId)}
                          disabled={inventoryLoading || inventoryEdits[key] === '' || inventoryEdits[key] === inv.quantity}
                        >
                          Save
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GlobalMenuPage;
