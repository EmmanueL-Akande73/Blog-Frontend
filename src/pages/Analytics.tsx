import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getBranchOrdersAndReservations, getHqAnalytics } from '../services/api';
import { Order, Reservation } from '../types';
import './styles/Analytics.css';

const Analytics: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [hqAnalytics, setHqAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setError('Not logged in.');
        setLoading(false);
        return;
      }
      if (user.role === 'HEADQUARTER_MANAGER' || user.role === 'ADMIN') {
        try {
          const analytics = await getHqAnalytics();
          setHqAnalytics(analytics);
        } catch (err) {
          setError('Failed to load HQ analytics.');
        }
        setLoading(false);
        return;
      }
      if (!user.branchId) {
        setError('No branch assigned.');
        setLoading(false);
        return;
      }
      try {
        const data = await getBranchOrdersAndReservations(user.branchId);
        setOrders(data.orders);
        setReservations(data.reservations);
      } catch (err) {
        setError('Failed to load analytics data.');
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  if (hqAnalytics) {
    return (
      <div className="analytics-page">
        <h1>HQ Analytics (All Branches)</h1>
        <div className="analytics-metrics">
          <div className="metric-card">
            <h2>Total Sales</h2>
            <p>${hqAnalytics.totalSales.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h2>Total Reservations</h2>
            <p>{hqAnalytics.totalReservations}</p>
          </div>
          <div className="metric-card">
            <h2>Top Menu Items</h2>
            <ul>
              {hqAnalytics.topMenuItems.map((item: any) => (
                <li key={item.menuItemId}>{item.menuItem?.name || 'Unknown'}: {item._sum.quantity}</li>
              ))}
            </ul>
          </div>
        </div>
        <h2>Branch Performance</h2>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Total Sales</th>
              <th>Order Count</th>
              <th>Reservations</th>
            </tr>
          </thead>
          <tbody>
            {hqAnalytics.branchSales.map((b: any) => (
              <tr key={b.branchId}>
                <td>{b.branchName}</td>
                <td>${b._sum.total?.toFixed(2) || 0}</td>
                <td>{b._count.id}</td>
                <td>{(hqAnalytics.branchReservations.find((r: any) => r.branchId === b.branchId)?._count.id) || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Example analytics
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const confirmedReservations = reservations.filter(r => r.status === 'CONFIRMED').length;
  const pendingReservations = reservations.filter(r => r.status === 'PENDING').length;
  const cancelledReservations = reservations.filter(r => r.status === 'CANCELLED').length;

  return (
    <div className="analytics-page">
      <h1>Branch Analytics</h1>
      <div className="analytics-metrics">
        <div className="metric-card">
          <h2>Total Sales</h2>
          <p>${totalSales.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <h2>Total Orders</h2>
          <p>{totalOrders}</p>
        </div>
        <div className="metric-card">
          <h2>Confirmed Reservations</h2>
          <p>{confirmedReservations}</p>
        </div>
        <div className="metric-card">
          <h2>Pending Reservations</h2>
          <p>{pendingReservations}</p>
        </div>
        <div className="metric-card">
          <h2>Cancelled Reservations</h2>
          <p>{cancelledReservations}</p>
        </div>
      </div>
      <h2>Orders in Branch</h2>
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Created</th>
            <th>Processed By</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>${order.total.toFixed(2)}</td>
              <td>{order.status}</td>
              <td>{order.paymentMethod}</td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
              <td>{order.user ? `${order.user.username} (${order.user.role === 'CASHIER' ? 'Cashier' : order.user.role})` : (order.walkInName || 'Walk-in')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Add more analytics as needed */}
    </div>
  );
};

export default Analytics;
