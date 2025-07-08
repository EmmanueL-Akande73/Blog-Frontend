import React, { useEffect, useState } from 'react';
import { getBranchOrdersAndReservations } from '../services/api';
import { Order, Reservation } from '../types';
import './styles/CashierOrdersAndReservations.css';

const CashierOrdersAndReservations: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const assignedBranchId = user?.branch?.id || user?.branchId || localStorage.getItem('assignedBranchId');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!assignedBranchId) throw new Error('No branch assigned.');
        const data = await getBranchOrdersAndReservations(Number(assignedBranchId));
        setOrders(data.orders || []);
        setReservations(data.reservations || []);
      } catch (error) {
        // handle error
      }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [assignedBranchId]);

  return (
    <div className="cashier-or-bg">
      <div className="cashier-or-card">
        <h1>Orders & Reservations</h1>
        {loading ? <div>Loading...</div> : (
          <>
            <section>
              <h2>Orders</h2>
              <table className="cashier-or-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Created</th>
                    <th>Branch</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.walkInName ? order.walkInName : (order.user?.username || 'N/A')}</td>
                      <td>{order.status}</td>
                      <td>€{order.total?.toFixed(2)}</td>
                      <td>{new Date(order.createdAt).toLocaleString()}</td>
                      <td>{order.branch?.name || order.branchId || 'N/A'}</td>
                      <td>
                        <button
                          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: order.paymentStatus !== 'COMPLETED' && order.branchId?.toString() !== assignedBranchId ? 'not-allowed' : 'pointer', opacity: order.paymentStatus !== 'COMPLETED' && order.branchId?.toString() !== assignedBranchId ? 0.5 : 1 }}
                          disabled={order.paymentStatus !== 'COMPLETED' && order.branchId?.toString() !== assignedBranchId}
                          onClick={async () => {
                            if (order.paymentStatus !== 'COMPLETED') {
                              if (order.branchId?.toString() !== assignedBranchId) {
                                alert('You can only confirm orders for your assigned branch.');
                                return;
                              }
                              if (!window.confirm('Are you sure you want to mark this order as completed?')) return;
                              try {
                                const { setOrderPaymentCompleted } = await import('../services/api');
                                await setOrderPaymentCompleted(order.id);
                                alert('Order marked as completed!');
                                window.location.reload();
                              } catch (err) {
                                alert('Failed to mark as completed');
                              }
                            } else {
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
                            }
                          }}
                        >
                          {order.paymentStatus !== 'COMPLETED' ? 'Mark as Completed' : 'Print Receipt'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section style={{ marginTop: 32 }}>
              <h2>Reservations</h2>
              <table className="cashier-or-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res: any) => (
                    <tr key={res.id}>
                      <td>{res.id}</td>
                      <td>{res.user?.username || 'N/A'}</td>
                      <td>{res.status || 'N/A'}</td>
                      <td>{new Date(res.createdAt).toLocaleString()}</td>
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

export default CashierOrdersAndReservations;
