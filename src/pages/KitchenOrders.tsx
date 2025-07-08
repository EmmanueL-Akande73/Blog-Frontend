import React, { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus } from '../services/api';
import { Order } from '../types';
import './styles/KitchenOrders.css';

const KitchenOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const allOrders = await getAllOrders();
        // Only show orders that are not delivered/cancelled
        setOrders(allOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'));
      } catch (e) {
        setError('Failed to load orders');
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setSuccessMsg('Order status updated!');
      // Refresh orders
      const allOrders = await getAllOrders();
      setOrders(allOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'));
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (e) {
      setError('Failed to update order status');
      setTimeout(() => setError(null), 2000);
    }
  };

  return (
    <div className="kitchen-orders-bg">
      <div className="kitchen-orders-card">
        <h1>Kitchen Orders</h1>
        {loading ? <div>Loading...</div> : error ? <div style={{color: 'red'}}>{error}</div> : (
          <table className="kitchen-orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Items</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.status}</td>
                  <td>
                    <ul style={{margin:0,padding:0}}>
                      {order.orderItems.map(item => (
                        <li key={item.id}>{item.quantity}x {item.menuItem.name}</li>
                      ))}
                    </ul>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    {(order.status === 'CONFIRMED' || order.status === 'PENDING') && (
                      <button onClick={() => handleStatusChange(order.id, 'PREPARING')}>Start Preparing</button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button onClick={() => handleStatusChange(order.id, 'READY')}>Mark as Ready</button>
                    )}
                    {order.status === 'READY' && (
                      <button onClick={() => handleStatusChange(order.id, 'DELIVERED')}>Mark as Delivered</button>
                    )}
                    {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                      <span style={{color:'#22c55e'}}>Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {successMsg && <div style={{color:'#22c55e',marginTop:8}}>{successMsg}</div>}
      </div>
    </div>
  );
};

export default KitchenOrders;
