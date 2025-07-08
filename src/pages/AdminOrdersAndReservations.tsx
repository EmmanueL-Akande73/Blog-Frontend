import React, { useState, useEffect, useCallback } from 'react';
import { getAllReservations, updateReservationStatus, getBranches, getAllOrders, updateOrderStatus } from '../services/api';
import { Reservation, Branch, Order } from '../types';
import './styles/AdminOrdersAndReservations.css';

const AdminOrdersAndReservations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations'>('orders');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters for reservations
  const [reservationFilters, setReservationFilters] = useState({
    branchId: '',
    status: '',
    page: 1,
    limit: 20
  });
  
  // Filters for orders
  const [orderFilters, setOrderFilters] = useState({
    branchId: '',
    status: '',
    page: 1,
    limit: 20
  });
  
  const [reservationPagination, setReservationPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  
  const [orderPagination, setOrderPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [liveTotalReservations, setLiveTotalReservations] = useState<number>(0);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllReservations(
        reservationFilters.branchId ? Number(reservationFilters.branchId) : undefined,
        reservationFilters.status || undefined,
        reservationFilters.page,
        reservationFilters.limit
      );
      setReservations(response.reservations);
      setReservationPagination({
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
  }, [reservationFilters.branchId, reservationFilters.status, reservationFilters.page, reservationFilters.limit]);

  // Always fetch live total reservations for HQ manager
  useEffect(() => {
    const fetchLiveTotal = async () => {
      const res = await getAllReservations(undefined, undefined, 1, 1);
      setLiveTotalReservations(res.pagination.total);
    };
    fetchLiveTotal();
    const interval = setInterval(fetchLiveTotal, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      
      // Apply client-side filtering
      let filteredOrders = response;
      
      // Filter by branch
      if (orderFilters.branchId) {
        filteredOrders = filteredOrders.filter(order => 
          order.branchId === Number(orderFilters.branchId)
        );
      }
      
      // Filter by status
      if (orderFilters.status) {
        filteredOrders = filteredOrders.filter(order => 
          order.status === orderFilters.status
        );
      }
      
      // Calculate pagination
      const totalItems = filteredOrders.length;
      const totalPages = Math.ceil(totalItems / orderFilters.limit);
      const startIndex = (orderFilters.page - 1) * orderFilters.limit;
      const endIndex = startIndex + orderFilters.limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      
      setOrders(paginatedOrders);
      setOrderPagination({
        currentPage: orderFilters.page,
        totalPages: totalPages || 1,
        totalItems: totalItems,
        itemsPerPage: orderFilters.limit
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
      setLoading(false);
    }
  }, [orderFilters.branchId, orderFilters.status, orderFilters.page, orderFilters.limit]);

  const fetchBranches = async () => {
    try {
      const response = await getBranches();
      setBranches(response);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };
  useEffect(() => {
    if (activeTab === 'reservations') {
      fetchReservations();
    } else {
      fetchOrders();
    }
    if (!branches.length) {
      fetchBranches();
    }
  }, [activeTab, fetchReservations, fetchOrders, branches.length]);

  const handleReservationStatusUpdate = async (reservationId: number, newStatus: string) => {
    try {
      setUpdatingStatus(reservationId);
      await updateReservationStatus(reservationId, newStatus);
      await fetchReservations();
      setError(null);
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setError('Failed to update reservation status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleOrderStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await updateOrderStatus(orderId, newStatus);
      await fetchOrders();
      setError(null);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };
  const handleReservationFilterChange = (field: string, value: string | number) => {
    setReservationFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : Number(value)
    }));
  };

  const handleOrderFilterChange = (field: string, value: string | number) => {
    setOrderFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : Number(value)
    }));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
      case 'preparing':
        return 'status-confirmed';
      case 'ready':
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'delivered':
        return 'status-delivered';
      default:
        return 'status-default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  if (loading && (activeTab === 'reservations' ? reservations.length === 0 : orders.length === 0)) {
    return (
      <div className="admin-orders-reservations">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading {activeTab}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders-reservations">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1>Orders & Reservations</h1>
          <p>Comprehensive management of all orders and reservations across your restaurant network</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-value">{orderPagination.totalItems}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{liveTotalReservations}</span>
            <span className="stat-label">Total Reservations</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{branches.length}</span>
            <span className="stat-label">Active Branches</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <span className="tab-icon">🛒</span>
          <span className="tab-text">Orders</span>
          <span className="tab-count">{orderPagination.totalItems}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          <span className="tab-icon">📅</span>
          <span className="tab-text">Reservations</span>
          <span className="tab-count">{reservationPagination.totalItems}</span>
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="content-section">
          {/* Filters Card */}
          <div className="filters-card">
            <div className="filters-header">
              <h3>Filter Orders</h3>
              <div className="filter-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    handleOrderFilterChange('branchId', '');
                    handleOrderFilterChange('status', '');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Branch</label>
                <select
                  value={orderFilters.branchId}
                  onChange={(e) => handleOrderFilterChange('branchId', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.address}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={orderFilters.status}
                  onChange={(e) => handleOrderFilterChange('status', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Content */}
          <div className="content-card">
            <div className="content-header">
              <h3>Orders Overview</h3>
              <div className="view-toggle">
                <button className="view-btn active">Card View</button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛒</div>
                <h4>No Orders Found</h4>
                <p>No orders match your current filters</p>
              </div>
            ) : (
              <div className="cards-container">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="card-header">
                      <div className="card-title-section">
                        <h4>Order #{order.id}</h4>
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="card-actions">
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                          disabled={updatingStatus === order.id || order.status === 'CANCELLED'}
                          className="status-select"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PREPARING">Preparing</option>
                          <option value="READY">Ready</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Customer</span>
                          <span className="info-value">
                            {/* Show walk-in name if present, else username, else fallback */}
                            {order.walkInName ? order.walkInName : (order.user?.username || 'Unknown')}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Branch</span>
                          <span className="info-value">{order.branch?.name || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Total</span>
                          <span className="info-value price">{formatCurrency(order.total)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Payment</span>
                          <span className="info-value">
                            {order.paymentMethod?.replace('_', ' ')} 
                            <span className={`payment-status ${order.paymentStatus?.toLowerCase()}`}>
                              ({order.paymentStatus})
                            </span>
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Created</span>
                          <span className="info-value date">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {orders.length > 0 && (
              <div className="pagination">
                <button
                  onClick={() => handleOrderFilterChange('page', orderPagination.currentPage - 1)}
                  disabled={orderPagination.currentPage === 1}
                  className="pagination-button"
                >
                  ← Previous
                </button>
                <div className="pagination-info">
                  <span>Page {orderPagination.currentPage} of {orderPagination.totalPages}</span>
                  <span className="pagination-total">({orderPagination.totalItems} total orders)</span>
                </div>
                <button
                  onClick={() => handleOrderFilterChange('page', orderPagination.currentPage + 1)}
                  disabled={orderPagination.currentPage === orderPagination.totalPages}
                  className="pagination-button"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <div className="content-section">
          {/* Filters Card */}
          <div className="filters-card">
            <div className="filters-header">
              <h3>Filter Reservations</h3>
              <div className="filter-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    handleReservationFilterChange('branchId', '');
                    handleReservationFilterChange('status', '');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Branch</label>
                <select
                  value={reservationFilters.branchId}
                  onChange={(e) => handleReservationFilterChange('branchId', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} - {branch.address}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={reservationFilters.status}
                  onChange={(e) => handleReservationFilterChange('status', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reservations Content */}
          <div className="content-card">
            <div className="content-header">
              <h3>Reservations Overview</h3>
              <div className="view-toggle">
                <button className="view-btn active">Card View</button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading reservations...</p>
              </div>
            ) : reservations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h4>No Reservations Found</h4>
                <p>No reservations match your current filters</p>
              </div>
            ) : (
              <div className="cards-container">
                {reservations.map(reservation => (
                  <div key={reservation.id} className="reservation-card">
                    <div className="card-header">
                      <div className="card-title-section">
                        <h4>Reservation #{reservation.id}</h4>
                        <span className={`status-badge ${getStatusBadgeClass(reservation.status)}`}>
                          {reservation.status}
                        </span>
                      </div>
                      <div className="card-actions">
                        <select
                          value={reservation.status}
                          onChange={(e) => handleReservationStatusUpdate(reservation.id, e.target.value)}
                          disabled={updatingStatus === reservation.id || reservation.status === 'CANCELLED'}
                          className="status-select"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Customer</span>
                          <span className="info-value">{reservation.user?.username || 'Unknown'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Branch</span>
                          <span className="info-value">{reservation.branch?.name || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Date & Time</span>
                          <span className="info-value date">{`${reservation.date} ${reservation.time}`}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Party Size</span>
                          <span className="info-value">{reservation.partySize} people</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Deposit</span>
                          <span className="info-value price">{formatCurrency(reservation.depositAmount)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Payment</span>
                          <span className="info-value">
                            {reservation.paymentMethod?.replace('_', ' ')} 
                            <span className={`payment-status ${reservation.paymentStatus?.toLowerCase()}`}>
                              ({reservation.paymentStatus})
                            </span>
                          </span>
                        </div>
                        <div className="info-item full-width">
                          <span className="info-label">Special Requests</span>
                          <span className="info-value">{reservation.notes || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {reservations.length > 0 && (
              <div className="pagination">
                <button
                  onClick={() => handleReservationFilterChange('page', reservationPagination.currentPage - 1)}
                  disabled={reservationPagination.currentPage === 1}
                  className="pagination-button"
                >
                  ← Previous
                </button>
                <div className="pagination-info">
                  <span>Page {reservationPagination.currentPage} of {reservationPagination.totalPages}</span>
                  <span className="pagination-total">({reservationPagination.totalItems} total reservations)</span>
                </div>
                <button
                  onClick={() => handleReservationFilterChange('page', reservationPagination.currentPage + 1)}
                  disabled={reservationPagination.currentPage === reservationPagination.totalPages}
                  className="pagination-button"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersAndReservations;
