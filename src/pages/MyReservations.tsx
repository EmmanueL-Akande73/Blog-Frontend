import React, { useState, useEffect } from 'react';
import { getUserReservations, cancelReservation } from '../services/api';
import { Reservation } from '../types';
import { Link } from 'react-router-dom';
import './styles/MyReservations.css';

const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const data = await getUserReservations();
      setReservations(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations');
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      setCancellingId(id);
      await cancelReservation(id);
      await fetchReservations(); // Refresh the list
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      alert('Failed to cancel reservation. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const canCancelReservation = (reservation: Reservation) => {
    if (reservation.status === 'CANCELLED') return false;
    
    // Check if reservation is more than 2 hours from now
    const reservationTime = new Date(reservation.time);
    const now = new Date();
    const timeDiff = reservationTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff > 2;
  };

  if (loading) {
    return (
      <div className="my-reservations-page">
        <div className="loading-spinner">Loading your reservations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-reservations-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="my-reservations-page">
      <div className="reservations-header">
        <h1>My Reservations</h1>
        <Link to="/reservation" className="new-reservation-btn">
          Make New Reservation
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div className="no-reservations">
          <div className="no-reservations-icon">📅</div>
          <h2>No Reservations Found</h2>
          <p>You haven't made any reservations yet.</p>
          <Link to="/reservation" className="make-reservation-btn">
            Make Your First Reservation
          </Link>
        </div>
      ) : (
        <div className="reservations-container">
          {reservations.map(reservation => (
            <div key={reservation.id} className="reservation-card">
              <div className="reservation-header">
                <div className="reservation-info">
                  <h3>{reservation.branch?.name || 'Location TBD'}</h3>
                  <p className="location">{reservation.branch?.city}</p>
                </div>
                <div className={`status-badge ${getStatusColor(reservation.status)}`}>
                  {reservation.status}
                </div>
              </div>

              <div className="reservation-details">
                <div className="detail-item">
                  <span className="label">Date:</span>
                  <span className="value">{formatDate(reservation.date)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Time:</span>
                  <span className="value">{formatTime(reservation.time)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Party Size:</span>
                  <span className="value">{reservation.partySize} people</span>
                </div>
                {reservation.notes && (
                  <div className="detail-item">
                    <span className="label">Notes:</span>
                    <span className="value">{reservation.notes}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">Created:</span>
                  <span className="value">{formatDate(reservation.createdAt)}</span>
                </div>
              </div>

              {reservation.branch && (
                <div className="branch-contact">
                  <h4>Contact Information</h4>
                  <p>📍 {reservation.branch.address}</p>
                  <p>📞 {reservation.branch.phone}</p>
                  <p>✉️ {reservation.branch.email}</p>
                </div>
              )}

              {canCancelReservation(reservation) && (
                <div className="reservation-actions">
                  <button
                    onClick={() => handleCancelReservation(reservation.id)}
                    className="cancel-btn"
                    disabled={cancellingId === reservation.id}
                  >
                    {cancellingId === reservation.id ? 'Cancelling...' : 'Cancel Reservation'}
                  </button>
                </div>
              )}

              {reservation.status === 'CANCELLED' && (
                <div className="cancellation-note">
                  This reservation has been cancelled.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReservations;
