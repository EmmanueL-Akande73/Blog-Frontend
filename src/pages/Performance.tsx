import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getBranchOrdersAndReservations } from '../services/api';
import { Order, Reservation } from '../types';
import './styles/Performance.css';

const Performance: React.FC = () => {
  const { user } = useContext(AuthContext);
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
        const data = await getBranchOrdersAndReservations(user.branchId);
        setOrders(data.orders);
        setReservations(data.reservations);
      } catch (err) {
        setError('Failed to load performance data.');
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const confirmedReservations = reservations.filter(r => r.status === 'CONFIRMED').length;

  return (
    <div className="performance-page">
      <h1>Branch Performance</h1>
      <div className="performance-metrics">
        <div className="metric-card">
          <h2>Total Sales</h2>
          <p>${totalSales.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <h2>Confirmed Reservations</h2>
          <p>{confirmedReservations}</p>
        </div>
        <div className="metric-card">
          <h2>Total Orders</h2>
          <p>{orders.length}</p>
        </div>
      </div>
      {/* You can add more analytics here as needed */}
    </div>
  );
};

export default Performance;
