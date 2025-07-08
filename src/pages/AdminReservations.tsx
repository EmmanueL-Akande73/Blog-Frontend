import React, { useState, useEffect, useCallback } from 'react';
import { getAllReservations, updateReservationStatus, getBranches } from '../services/api';
import { Reservation, Branch } from '../types';
import './styles/AdminReservations.css';

const AdminReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    branchId: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllReservations(
        filters.branchId ? Number(filters.branchId) : undefined,
        filters.status || undefined,
        filters.page,
        filters.limit
      );
      setReservations(response.reservations);
      setPagination({
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.total,
        itemsPerPage: response.pagination.limit
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations');
      setLoading(false);
    }
  }, [filters.branchId, filters.status, filters.page, filters.limit]);

  useEffect(() => {
    fetchReservations();
    fetchBranches();
  }, [fetchReservations]);

  const fetchBranches = async () => {
    try {
      const branchData = await getBranches();
      setBranches(branchData);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const handleStatusUpdate = async (reservationId: number, newStatus: string) => {
    try {
      setUpdatingStatus(reservationId);
      await updateReservationStatus(reservationId, newStatus);
      await fetchReservations(); // Refresh the list
    } catch (err) {
      console.error('Error updating reservation status:', err);
      alert('Failed to update reservation status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'PENDING':
        return 'status-pending';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const getTodaysReservations = () => {
    const today = new Date().toDateString();
    return reservations.filter(reservation => 
      new Date(reservation.date).toDateString() === today
    );
  };

  const getUpcomingReservations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservations.filter(reservation => 
      new Date(reservation.date) >= today && reservation.status !== 'CANCELLED'
    );
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="admin-reservations-page">
        <div className="loading-spinner">Loading reservations...</div>
      </div>
    );
  }

  return (
    <div className="admin-reservations-page">
      <div className="admin-header">
        <h1>Reservation Management</h1>
        <div className="stats">
          <div className="stat-card">
            <span className="stat-number">{getTodaysReservations().length}</span>
            <span className="stat-label">Today's Reservations</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{getUpcomingReservations().length}</span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{pagination.totalItems}</span>
            <span className="stat-label">Total Reservations</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters">
          <select
            name="branchId"
            value={filters.branchId}
            onChange={handleFilterChange}
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="reservations-table-container">
        <table className="reservations-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Branch</th>
              <th>Date</th>
              <th>Time</th>
              <th>Party Size</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(reservation => (
              <tr key={reservation.id}>
                <td>
                  <div className="customer-info">
                    <div className="customer-name">{reservation.user.username}</div>
                    <div className="customer-email">{reservation.user.email}</div>
                  </div>
                </td>
                <td>{reservation.branch?.name || 'Any Location'}</td>
                <td>{formatDate(reservation.date)}</td>
                <td>{formatTime(reservation.time)}</td>
                <td>{reservation.partySize}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(reservation.status)}`}>
                    {reservation.status}
                  </span>
                </td>
                <td>
                  <div className="notes-cell">
                    {reservation.notes || '-'}
                  </div>
                </td>
                <td>
                  <div className="actions">
                    {reservation.status === 'PENDING' && (
                      <button
                        className="confirm-btn"
                        onClick={() => handleStatusUpdate(reservation.id, 'CONFIRMED')}
                        disabled={updatingStatus === reservation.id}
                      >
                        {updatingStatus === reservation.id ? 'Confirming...' : 'Confirm'}
                      </button>
                    )}
                    {reservation.status !== 'CANCELLED' && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleStatusUpdate(reservation.id, 'CANCELLED')}
                        disabled={updatingStatus === reservation.id}
                      >
                        {updatingStatus === reservation.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminReservations;
