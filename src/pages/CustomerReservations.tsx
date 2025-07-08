import React, { useState, useEffect } from 'react';
import { createReservation, getBranches, getUserReservations, cancelReservation } from '../services/api';
import { Branch, Reservation } from '../types';
import './styles/CustomerReservations.css';

const CustomerReservations: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState({
    branchId: '',
    date: '',
    time: '',
    partySize: 2,
    notes: ''
  });
  
  // Data state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [loading, setLoading] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [depositAmount] = useState<number>(25); // Fixed deposit amount

  useEffect(() => {
    fetchBranches();
    fetchReservations();
  }, []);

  const fetchBranches = async () => {
    try {
      const branchData = await getBranches();
      setBranches(branchData);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branch information');
    }
  };

  const fetchReservations = async () => {
    try {
      const data = await getUserReservations();
      setReservations(data);
      setLoadingReservations(false);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setLoadingReservations(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.branchId || !formData.date || !formData.time) {
        throw new Error('Please fill in all required fields');
      }

      // Validate payment method is selected
      if (!selectedPaymentMethod) {
        throw new Error('Please select a payment method to secure your reservation');
      }

      // Combine date and time into a proper datetime string
      const dateTimeString = `${formData.date}T${formData.time}:00.000Z`;
      
      await createReservation(
        formData.date,
        dateTimeString,
        formData.partySize,
        selectedPaymentMethod,
        depositAmount,
        parseInt(formData.branchId),
        formData.notes || undefined
      );

      setSuccess(true);
      setFormData({
        branchId: '',
        date: '',
        time: '',
        partySize: 2,
        notes: ''
      });
      setSelectedPaymentMethod('');

      // Refresh reservations list
      await fetchReservations();

      // Switch to existing reservations tab to show the new reservation
      setTimeout(() => {
        setActiveTab('existing');
        setSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('Error creating reservation:', err);
      setError(err.response?.data?.error || 'Failed to create reservation');
    } finally {
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
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="customer-reservations">
      <div className="reservations-header">
        <h1>Reservations</h1>
        <p>Manage your dining reservations at Steakz</p>
      </div>

      <div className="reservation-tabs">
        <button 
          className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          Make New Reservation
        </button>
        <button 
          className={`tab-button ${activeTab === 'existing' ? 'active' : ''}`}
          onClick={() => setActiveTab('existing')}
        >
          My Reservations ({reservations.length})
        </button>
      </div>

      {activeTab === 'new' && (
        <div className="new-reservation-section">
          <div className="reservation-form-container">
            <form onSubmit={handleSubmit} className="reservation-form">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">Reservation created successfully!</div>}

              <div className="form-group">
                <label htmlFor="branchId">Select Location</label>
                <select
                  id="branchId"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Choose a location</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={today}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Time</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="partySize">Party Size</label>
                <select
                  id="partySize"
                  name="partySize"
                  value={formData.partySize}
                  onChange={handleInputChange}
                  required
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(size => (
                    <option key={size} value={size}>
                      {size} {size === 1 ? 'person' : 'people'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method *</label>
                <select
                  id="paymentMethod"
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  required
                >
                  <option value="">Select payment method</option>
                  <option value="CREDIT_CARD">💳 Credit Card</option>
                  <option value="DEBIT_CARD">💳 Debit Card</option>
                  <option value="CASH">💵 Cash on Arrival</option>
                  <option value="DIGITAL_WALLET">📱 Digital Wallet</option>
                  <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                </select>
              </div>

              <div className="deposit-info">
                <div className="deposit-notice">
                  <h4>💰 Reservation Deposit: ${depositAmount}</h4>
                  <p>A deposit of ${depositAmount} is required to secure your reservation. This amount will be credited toward your final bill.</p>
                  <p>⚠️ Payment is required to confirm your reservation.</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Special Requests (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special dietary requirements, celebration details, or other requests..."
                  rows={3}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !selectedPaymentMethod} 
                className="submit-button"
              >
                {loading ? 'Processing Payment...' : 'Pay Deposit & Reserve Table'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'existing' && (
        <div className="existing-reservations-section">
          {loadingReservations ? (
            <div className="loading-spinner">Loading your reservations...</div>
          ) : reservations.length === 0 ? (
            <div className="no-reservations">
              <div className="no-reservations-content">
                <h3>No Reservations Yet</h3>
                <p>You haven't made any reservations yet. Create your first one!</p>
                <button 
                  className="create-first-button"
                  onClick={() => setActiveTab('new')}
                >
                  Make Your First Reservation
                </button>
              </div>
            </div>
          ) : (
            <div className="reservations-grid">
              {reservations.map(reservation => (
                <div key={reservation.id} className="reservation-card">
                  <div className="reservation-header">
                    <div className="reservation-id">#{reservation.id}</div>
                    <div 
                      className="reservation-status"
                      style={{ backgroundColor: getStatusColor(reservation.status) }}
                    >
                      {reservation.status}
                    </div>
                  </div>

                  <div className="reservation-details">
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{reservation.branch?.name}</span>
                    </div>
                      <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDate(reservation.date)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">{formatTime(reservation.time)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Party Size:</span>
                      <span className="detail-value">{reservation.partySize} {reservation.partySize === 1 ? 'person' : 'people'}</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Deposit:</span>
                      <span className="detail-value">${reservation.depositAmount}</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Payment:</span>
                      <span className="detail-value">
                        {reservation.paymentMethod?.replace('_', ' ')} 
                        <span className={`payment-status ${reservation.paymentStatus?.toLowerCase()}`}>
                          ({reservation.paymentStatus})
                        </span>
                      </span>
                    </div>

                    {reservation.notes && (
                      <div className="detail-item notes">
                        <span className="detail-label">Notes:</span>
                        <span className="detail-value">{reservation.notes}</span>
                      </div>
                    )}
                  </div>

                  {reservation.status === 'PENDING' || reservation.status === 'CONFIRMED' ? (
                    <button
                      className="cancel-button"
                      onClick={() => handleCancelReservation(reservation.id)}
                      disabled={cancellingId === reservation.id}
                    >
                      {cancellingId === reservation.id ? 'Cancelling...' : 'Cancel Reservation'}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerReservations;
