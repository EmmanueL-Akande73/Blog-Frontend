import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getBranchById, getBranchOrdersAndReservations } from '../services/api';
import { Order, Reservation, Branch } from '../types';
import './styles/Analytics.css';

const BranchReports: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
        const data = await getBranchOrdersAndReservations(user.branchId);
        setOrders(data.orders);
        setReservations(data.reservations);
      } catch (err) {
        setError('Failed to load branch report data.');
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Example metrics
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const confirmedReservations = reservations.filter(r => r.status === 'CONFIRMED').length;
  const pendingReservations = reservations.filter(r => r.status === 'PENDING').length;
  const cancelledReservations = reservations.filter(r => r.status === 'CANCELLED').length;

  return (
    <div className="analytics-page">
      <h1>Branch Report for {branch?.name}</h1>
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
      {/* Add more branch-specific analytics as needed */}
    </div>
  );
};

export default BranchReports;
