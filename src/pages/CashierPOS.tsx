import React, { useEffect, useState } from 'react';
import { getMenu, getAllOrders, addToCart, clearCart } from '../services/api';
import { MenuItem, Order, PaymentMethodType } from '../types';
import './styles/CashierPOS.css';

const CashierPOS: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [id: number]: number }>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENTAGE'>('AMOUNT');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const assignedBranchIdNum = localStorage.getItem('assignedBranchId') ? Number(localStorage.getItem('assignedBranchId')) : null;

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const [menuData, ordersData] = await Promise.all([
          getMenu(),
          getAllOrders()
        ]);
        setMenu(menuData);
        setOrders(ordersData);
      } catch (error) {}
      setLoading(false);
    };
    fetchData();
  }, []);

  // Sync selectedItems with backend cart
  useEffect(() => {
    const syncCart = async () => {
      try {
        await clearCart();
        const entries = Object.entries(selectedItems).filter(([_, qty]) => qty > 0);
        for (const [menuItemId, quantity] of entries) {
          await addToCart(Number(menuItemId), quantity);
        }
      } catch (e) {
        // Optionally handle cart sync error
      }
    };
    syncCart();
  }, [selectedItems]);

  const handleQtyChange = (id: number, qty: number) => {
    setSelectedItems((prev) => ({ ...prev, [id]: qty }));
  };

  const handleAdd = (id: number) => {
    setSelectedItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };
  const handleRemove = (id: number) => {
    setSelectedItems((prev) => {
      const qty = (prev[id] || 0) - 1;
      if (qty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: qty };
    });
  };

  const total = menu.reduce((sum, item) => sum + (selectedItems[item.id] || 0) * item.price, 0);
  const discountedTotal = discountType === 'PERCENTAGE'
    ? Math.max(0, total - (total * (Math.min(discount, 100) / 100)))
    : Math.max(0, total - discount);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const items = Object.entries(selectedItems)
        .filter(([_, qty]) => qty > 0)
        .map(([menuItemId, quantity]) => ({ menuItemId: Number(menuItemId), quantity }));
      if (items.length === 0) return;
      if (!walkInName && !walkInPhone) {
        setSuccessMsg('Please enter walk-in customer name or phone.');
        setCheckoutLoading(false);
        setTimeout(() => setSuccessMsg(''), 2500);
        return;
      }
      if (!assignedBranchIdNum) {
        setSuccessMsg('No branch assigned. Please contact admin.');
        setCheckoutLoading(false);
        setTimeout(() => setSuccessMsg(''), 2500);
        return;
      }
      await import('../services/api').then(api =>
        api.checkoutCart(paymentMethod, assignedBranchIdNum, { name: walkInName, phone: walkInPhone })
      );
      setSuccessMsg('Order processed successfully!');
      setSelectedItems({});
      setDiscount(0);
      setDiscountType('AMOUNT');
      setWalkInName('');
      setWalkInPhone('');
      const [ordersData, menuData] = await Promise.all([
        getAllOrders(),
        getMenu()
      ]);
      setOrders(ordersData);
      setMenu(menuData);
    } catch (e) {
      setSuccessMsg('Error processing order.');
    }
    setCheckoutLoading(false);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  return (
    <div className="cashier-pos-bg">
      <div className="cashier-pos-card">
        <h1>Point of Sale</h1>
        {/* Show assigned branch indicator */}
        {assignedBranchIdNum ? (
          <div style={{ marginBottom: 12, color: '#2563eb', fontWeight: 600 }}>
            Assigned Branch: #{assignedBranchIdNum}
          </div>
        ) : (
          <div style={{ marginBottom: 12, color: '#ef4444', fontWeight: 600 }}>
            No branch assigned. Please contact admin.
          </div>
        )}
        {loading ? <div>Loading...</div> : (
          <>
            <section>
              <h2>Menu</h2>
              <table className="cashier-pos-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>€{item.price.toFixed(2)}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button type="button" onClick={() => handleRemove(item.id)} disabled={!(selectedItems[item.id] > 0)} style={{ width: 28 }}>-</button>
                        <input
                          type="number"
                          min={0}
                          value={selectedItems[item.id] || 0}
                          onChange={e => handleQtyChange(item.id, Math.max(0, Number(e.target.value)))}
                          style={{ width: 40, textAlign: 'center' }}
                        />
                        <button type="button" onClick={() => handleAdd(item.id)} style={{ width: 28 }}>+</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 16, display: 'flex', gap: 24, alignItems: 'center' }}>
                <label>
                  Discount:
                  <input
                    type="number"
                    min={0}
                    max={discountType === 'PERCENTAGE' ? 100 : total}
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    style={{ width: 80, marginLeft: 4 }}
                  />
                </label>
                <label>
                  Type:
                  <select value={discountType} onChange={e => setDiscountType(e.target.value as 'AMOUNT' | 'PERCENTAGE')} style={{ marginLeft: 4 }}>
                    <option value="AMOUNT">Amount (€)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </label>
                <label>
                  Payment Method:
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethodType)} style={{ marginLeft: 8 }}>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="DIGITAL_WALLET">Digital Wallet</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </label>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Total: €{discountedTotal.toFixed(2)}</span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 24, alignItems: 'center' }}>
                <label>
                  Walk-in Name:
                  <input
                    type="text"
                    value={walkInName}
                    onChange={e => setWalkInName(e.target.value)}
                    style={{ width: 140, marginLeft: 4 }}
                    placeholder="Customer name"
                  />
                </label>
                <label>
                  Walk-in Phone:
                  <input
                    type="text"
                    value={walkInPhone}
                    onChange={e => setWalkInPhone(e.target.value)}
                    style={{ width: 120, marginLeft: 4 }}
                    placeholder="Phone number"
                  />
                </label>
              </div>
              <button className="cashier-pos-btn" onClick={handleCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? 'Processing...' : 'Checkout'}
              </button>
              {successMsg && <div className="cashier-pos-success">{successMsg}</div>}
            </section>
            <section style={{ marginTop: 32 }}>
              <h2>Recent Orders</h2>
              <button
                style={{ marginBottom: 12, background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const ordersData = await getAllOrders();
                    setOrders(ordersData);
                  } catch {}
                  setLoading(false);
                }}
              >
                Refresh Orders
              </button>
              <table className="cashier-pos-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Discount</th>
                    <th>Discount Type</th>
                    <th>Payment</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.status}</td>
                      <td>€{order.total?.toFixed(2)}</td>
                      <td>{order.discount ? (order.discountType === 'PERCENTAGE' ? `${order.discount}%` : `€${order.discount}`) : '-'}</td>
                      <td>{order.discountType || '-'}</td>
                      <td>{order.paymentMethod}</td>
                      <td>{new Date(order.createdAt).toLocaleString()}</td>
                      <td>
                        {order.status === 'PENDING' && (
                          <button
                            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: 8 }}
                            onClick={async () => {
                              try {
                                const { updateOrderStatus, getAllOrders } = await import('../services/api');
                                await updateOrderStatus(order.id, 'CONFIRMED');
                                setSuccessMsg('Order confirmed!');
                                // Refresh orders without redirect
                                const ordersData = await getAllOrders();
                                setOrders(ordersData);
                                setTimeout(() => setSuccessMsg(''), 2500);
                              } catch (err) {
                                setSuccessMsg('Failed to update order status');
                                setTimeout(() => setSuccessMsg(''), 2500);
                              }
                            }}
                          >
                            Confirm Order
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button
                            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default CashierPOS;
