import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getBranchOrdersAndReservations, updateOrderStatus, updateReservationStatus } from '../services/api';
import { Order, Reservation } from '../types';
import './styles/Orders.css';
import './styles/OrdersAndReservations.css';

const OrdersAndReservations: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const branchId = user?.branch?.id || user?.branchId;
    console.log('AuthContext user:', user);
    if (!branchId) {
      setError('No branch assigned.');
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        console.log('Fetching orders/reservations for branchId:', branchId);
        const data = await getBranchOrdersAndReservations(branchId);
        console.log('Fetched data:', data);
        if (isMounted) {
          setOrders(data.orders);
          setReservations(data.reservations);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load orders and reservations.');
      }
      if (isMounted) setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => { isMounted = false; clearInterval(interval); };
  }, [user]);


  if (loading) return <div style={{ color: 'red', fontWeight: 700, fontSize: 24, margin: 40 }}>Loading...</div>;
  if (error) return <div style={{ color: 'red', fontWeight: 700, fontSize: 24, margin: 40 }}>{error}</div>;

  return (
    <div className="orders-and-reservations-page">
      {/* Removed debug banner and user context output */}
      <h1>Orders and Reservations</h1>
      <div className="section">
        <h2>Orders</h2>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Status</th>
                <th>Total</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.walkInName ? order.walkInName : (order.user?.username || 'N/A')}</td>
                  <td>{order.status}</td>
                  <td>{order.total}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      onClick={async () => {
                        try {
                          await updateOrderStatus(order.id, 'CONFIRMED');
                          setOrders(orders => orders.map(o => o.id === order.id ? { ...o, status: 'CONFIRMED' } : o));
                        } catch (err) {
                          alert('Failed to confirm order.');
                        }
                      }}
                      disabled={order.status !== 'PENDING'}
                    >
                      Confirm
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="section" style={{ background: 'white', borderRadius: 12, padding: 24, marginTop: 24, boxShadow: '0 2px 12px #0001' }}>
        <h2 style={{ color: '#16a34a', fontWeight: 700, marginBottom: 16 }}>Reservations</h2>
        {reservations.length === 0 ? (
          <p>No reservations found.</p>
        ) : (
          <table className="reservations-table" style={{ width: '100%', background: '#f0fdf4', borderRadius: 8, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#bbf7d0' }}>
                <th style={{ padding: 10 }}>ID</th>
                <th style={{ padding: 10 }}>User</th>
                <th style={{ padding: 10 }}>Status</th>
                <th style={{ padding: 10 }}>Date</th>
                <th style={{ padding: 10 }}>Party Size</th>
                <th style={{ padding: 10 }}>Created At</th>
                <th style={{ padding: 10 }}>Status</th>
                <th style={{ padding: 10 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(res => (
                <tr key={res.id} style={{ background: res.status === 'PENDING' ? '#fef9c3' : '#fff' }}>
                  <td style={{ padding: 10 }}>{res.id}</td>
                  <td style={{ padding: 10 }}>{res.user?.username}</td>
                  <td style={{ padding: 10 }}>{res.status}</td>
                  <td style={{ padding: 10 }}>{new Date(res.date).toLocaleDateString()}</td>
                  <td style={{ padding: 10 }}>{res.partySize}</td>
                  <td style={{ padding: 10 }}>{new Date(res.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 10 }}>
                    {res.status === 'CONFIRMED' && <span style={{ color: '#22c55e', fontWeight: 600 }}>Confirmed</span>}
                    {res.status === 'PENDING' && <span style={{ color: '#f59e42', fontWeight: 600 }}>Pending</span>}
                    {res.status === 'CANCELLED' && <span style={{ color: '#ef4444', fontWeight: 600 }}>Cancelled</span>}
                  </td>
                  <td style={{ padding: 10 }}>
                    {user?.role === 'CASHIER' && res.status === 'PENDING' ? (
                      <button
                        style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #16a34a33', transition: 'all 0.2s' }}
                        onClick={async () => {
                          try {
                            await updateReservationStatus(res.id, 'CONFIRMED');
                            setReservations(reservations => reservations.map(r => r.id === res.id ? { ...r, status: 'CONFIRMED' } : r));
                          } catch (err) {
                            alert('Failed to confirm reservation.');
                          }
                        }}
                      >
                        Confirm
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrdersAndReservations;
