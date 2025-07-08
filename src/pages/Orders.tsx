import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getMyOrders, cancelOrder, checkoutCart, getBranches } from '../services/api';
import { Order, Branch } from '../types';
import './styles/Orders.css';

const Orders: React.FC = () => {  // Cart state
  const { cart, loading: cartLoading, updateQuantity, removeItem, clearCartItems, getCartItemCount, getCartTotal } = useCart();
  
  // Auth state
  const { user } = useAuth();
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
    // UI state
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [showCheckout, setShowCheckout] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Load orders and branches
  useEffect(() => {
    fetchOrders();
    fetchBranches();
  }, []);

  // Filter orders when status changes
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [orders, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const ordersData = await getMyOrders();
      setOrders(ordersData);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const branchesData = await getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await cancelOrder(orderId);
      await fetchOrders(); // Refresh orders
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };
  const handleCheckout = async () => {
    if (!cart || cart.cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    try {
      setCheckoutLoading(true);
      await checkoutCart(selectedPaymentMethod, selectedBranch || undefined);
      setShowCheckout(false);
      setSelectedBranch(null);
      setSelectedPaymentMethod('');
      setActiveTab('orders');
      await fetchOrders(); // Refresh orders to show new order
    } catch (error: any) {
      console.error('Error during checkout:', error);
      alert('Checkout failed: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'CONFIRMED': return '#3b82f6';
      case 'PREPARING': return '#8b5cf6';
      case 'READY': return '#10b981';
      case 'DELIVERED': return '#059669';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'CONFIRMED': return '✅';
      case 'PREPARING': return '👨‍🍳';
      case 'READY': return '🍽️';
      case 'DELIVERED': return '📦';
      case 'CANCELLED': return '❌';
      default: return '❓';
    }
  };

  if (!user) {
    return (
      <div className="orders-page">
        <div className="login-prompt">
          <h2>Please log in to view your orders and cart</h2>
          <p>You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders & Cart</h1>
        <p>Manage your cart and track your orders</p>
      </div>

      {/* Tab Navigation */}
      <div className="orders-tabs">
        <button 
          className={`tab-button ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => setActiveTab('cart')}
        >
          🛒 Cart ({getCartItemCount()})
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 My Orders
        </button>
      </div>

      {/* Cart Tab */}
      {activeTab === 'cart' && (
        <div className="cart-section">
          {cartLoading ? (
            <div className="loading">Loading cart...</div>
          ) : !cart || cart.cartItems.length === 0 ? (
            <div className="empty-cart">
              <h3>Your cart is empty</h3>
              <p>Add some delicious items from our menu!</p>
              <button 
                className="browse-menu-btn"
                onClick={() => window.location.href = '/menu'}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="cart-content">
              <div className="cart-items">
                {cart.cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-image">
                      {item.menuItem.imageUrl && (
                        <img src={item.menuItem.imageUrl} alt={item.menuItem.name} />
                      )}
                    </div>
                    <div className="item-details">
                      <h4>{item.menuItem.name}</h4>
                      <p>{item.menuItem.description}</p>
                      <span className="item-price">€{item.menuItem.price.toFixed(2)}</span>
                    </div>
                    <div className="item-quantity">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-total">
                      €{(item.menuItem.price * item.quantity).toFixed(2)}
                    </div>
                    <button 
                      className="remove-item"
                      onClick={() => removeItem(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-total">
                  <h3>Total: €{getCartTotal().toFixed(2)}</h3>
                </div>
                <div className="cart-actions">
                  <button 
                    className="clear-cart-btn"
                    onClick={clearCartItems}
                  >
                    Clear Cart
                  </button>
                  <button 
                    className="checkout-btn"
                    onClick={() => setShowCheckout(true)}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="orders-section">
          {/* Status Filter */}
          <div className="orders-filter">
            <label>Filter by status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button
            style={{ marginBottom: 12, background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            onClick={async () => {
              setLoadingOrders(true);
              try {
                const ordersData = await getMyOrders();
                setOrders(ordersData);
              } catch {}
              setLoadingOrders(false);
            }}
          >
            Refresh Orders
          </button>

          {loadingOrders ? (
            <div className="loading">Loading orders...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="no-orders">
              <h3>No orders found</h3>
              <p>You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h4>Order #{order.id}</h4>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="order-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                    </div>
                  </div>                  {order.branch && (
                    <div className="order-branch">
                      📍 {order.branch.name} - {order.branch.address}
                    </div>
                  )}

                  {order.paymentMethod && (
                    <div className="order-payment">
                      💳 Payment: {order.paymentMethod.replace('_', ' ')} 
                      <span className={`payment-status ${order.paymentStatus.toLowerCase()}`}>
                        ({order.paymentStatus})
                      </span>
                    </div>
                  )}

                  <div className="order-items">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="order-item">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span>€{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <strong>Total: €{order.total.toFixed(2)}</strong>
                    </div>
                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                      <button 
                        className="cancel-order-btn"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel Order
                      </button>
                    )}
                    {order.paymentStatus === 'COMPLETED' && (
                      <button
                        className="print-receipt-btn"
                        onClick={async () => {
                          try {
                            const receipt = await import('../services/api').then(m => m.generateReceipt(order.id));
                            // Print logic: open a new window with receipt details
                            const receiptWindow = window.open('', '_blank', 'width=400,height=600');
                            if (receiptWindow) {
                              receiptWindow.document.write(`<html><head><title>Receipt</title></head><body>`);
                              receiptWindow.document.write(`<h2>Receipt #${receipt.receiptNumber}</h2>`);
                              receiptWindow.document.write(`<p>Date: ${new Date(receipt.generatedAt).toLocaleString()}</p>`);
                              receiptWindow.document.write(`<hr/>`);
                              receiptWindow.document.write(`<h4>Order #${receipt.order.id}</h4>`);
                              receiptWindow.document.write(`<ul>`);
                              receipt.order.orderItems.forEach((item: any) => {
                                receiptWindow.document.write(`<li>${item.quantity}x ${item.menuItem.name} - €${(item.price * item.quantity).toFixed(2)}</li>`);
                              });
                              receiptWindow.document.write(`</ul>`);
                              receiptWindow.document.write(`<strong>Total: €${receipt.order.total.toFixed(2)}</strong>`);
                              receiptWindow.document.write(`<br/><br/>Thank you for your purchase!`);
                              receiptWindow.document.write(`</body></html>`);
                              receiptWindow.print();
                            }
                          } catch (err) {
                            alert('Failed to generate or print receipt');
                          }
                        }}
                      >
                        Print Receipt
                      </button>
                    )}
                  </div>
                  <div className="order-customer-info">
                    <span className="info-label">Customer</span>
                    <span className="info-value">
                      {/* Show walk-in name if present, else username, else fallback */}
                      {order.walkInName ? order.walkInName : (order.user?.username || 'Unknown')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="checkout-modal">
          <div className="modal-content">
            <h3>Checkout</h3>
            <div className="checkout-summary">
              <p>Total: €{getCartTotal().toFixed(2)}</p>
              <p>Items: {getCartItemCount()}</p>
            </div>
              <div className="branch-selection">
              <label>Select pickup location (optional):</label>
              <select 
                value={selectedBranch || ''} 
                onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">No specific branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.address}
                  </option>
                ))}
              </select>
            </div>

            <div className="payment-method-selection">
              <label>Payment Method *:</label>
              <select 
                value={selectedPaymentMethod} 
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                required
              >
                <option value="">Select payment method</option>
                <option value="CREDIT_CARD">💳 Credit Card</option>
                <option value="DEBIT_CARD">💳 Debit Card</option>
                <option value="CASH">💵 Cash on Pickup</option>
                <option value="DIGITAL_WALLET">📱 Digital Wallet</option>
                <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
              </select>
            </div>

            <div className="payment-note">
              <p>⚠️ Payment is required to confirm your order. Your order will be processed once payment is completed.</p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowCheckout(false);
                  setSelectedBranch(null);
                  setSelectedPaymentMethod('');
                }}
                disabled={checkoutLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleCheckout}
                disabled={checkoutLoading || !selectedPaymentMethod}
                className="confirm-order-btn"
              >
                {checkoutLoading ? 'Processing Payment...' : 'Pay & Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
