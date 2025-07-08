import React, { useState, useEffect } from 'react';
import { createReservation, getBranches } from '../services/api';
import { Branch } from '../types';
import { useNavigate } from 'react-router-dom';
import './styles/Reservation.css';

const Reservations: React.FC = () => {
  const [formData, setFormData] = useState({
    branchId: '',
    date: '',
    time: '',
    partySize: 2,
    notes: ''
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [depositAmount] = useState<number>(25); // Fixed deposit amount
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchData = await getBranches();
        setBranches(branchData);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branch information');
      }
    };

    fetchBranches();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate payment method is selected
      if (!selectedPaymentMethod) {
        throw new Error('Please select a payment method to secure your reservation');
      }

      // Combine date and time for the reservation
      const reservationDateTime = new Date(`${formData.date}T${formData.time}`);
      
      await createReservation(
        formData.date,
        reservationDateTime.toISOString(),
        formData.partySize,
        selectedPaymentMethod,
        depositAmount,
        formData.branchId ? parseInt(formData.branchId) : undefined,
        formData.notes || undefined
      );

      setSuccess(true);
      setTimeout(() => {
        navigate('/customer-reservations');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      setError(err.message || 'Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  if (success) {
    return (
      <div className="reservation-page">
        <div className="reservation-success">
          <div className="success-icon">✓</div>
          <h2>Reservation Confirmed!</h2>
          <p>Your reservation has been successfully submitted. We'll contact you shortly to confirm.</p>
          <p>Redirecting to your reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-page">
      <div className="reservation-header">
        <h1>Make a Reservation</h1>
        <p>Reserve your table at Steakz Premium Steakhouse</p>
      </div>

      <div className="reservation-container">
        <form onSubmit={handleSubmit} className="reservation-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="branchId">Preferred Location</label>
            <select
              id="branchId"
              name="branchId"
              value={formData.branchId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a location</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.city}
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
              <select
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              >
                <option value="">Select time</option>
                <option value="17:00">5:00 PM</option>
                <option value="17:30">5:30 PM</option>
                <option value="18:00">6:00 PM</option>
                <option value="18:30">6:30 PM</option>
                <option value="19:00">7:00 PM</option>
                <option value="19:30">7:30 PM</option>
                <option value="20:00">8:00 PM</option>
                <option value="20:30">8:30 PM</option>
                <option value="21:00">9:00 PM</option>
                <option value="21:30">9:30 PM</option>
                <option value="22:00">10:00 PM</option>
              </select>
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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(size => (
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
              placeholder="Any special requirements, dietary restrictions, or celebration notes..."
              rows={4}
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || !selectedPaymentMethod}
          >
            {loading ? 'Processing Payment...' : 'Pay Deposit & Reserve Table'}
          </button>
        </form>

        <div className="reservation-info">
          <h3>Reservation Information</h3>
          <div className="info-item">
            <strong>Reservation Policy:</strong>
            <p>Reservations are held for 15 minutes past the reserved time. For parties of 8 or more, a deposit may be required.</p>
          </div>
          <div className="info-item">
            <strong>Cancellation Policy:</strong>
            <p>Please provide at least 2 hours notice for cancellations. Same-day cancellations may incur a fee.</p>
          </div>
          <div className="info-item">
            <strong>Contact:</strong>
            <p>For immediate assistance or same-day reservations, please call us directly at the location you wish to visit.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reservations;
