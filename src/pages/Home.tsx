import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFeaturedMenuItems, createOrder, getAllUsers, getBranches, getAllOrders } from '../services/api';
import { MenuItem, Order } from '../types';
import { scrollToTop } from '../utils/scrollUtils';
import { AuthContext } from '../context/AuthContext';
import './styles/Home.css';

const Home: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [featuredDishes, setFeaturedDishes] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderingItems, setOrderingItems] = useState<Record<number, boolean>>({});
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  // Admin dashboard state
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalBranches: 0,
    totalOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  useEffect(() => {
    // Redirect branch manager to their home page
    if (user?.role === 'BRANCH_MANAGER') {
      navigate('/branch/home', { replace: true });
      return;
    }
    // Redirect cashier to their home page
    if (user?.role === 'CASHIER') {
      navigate('/cashier/home', { replace: true });
      return;
    }
    // Redirect chef to their home page
    if (user?.role === 'CHEF') {
      navigate('/chef/home', { replace: true });
      return;
    }

    // Use the utility function for reliable scroll to top
    scrollToTop({ immediate: true, retries: 5 });
    
    const fetchData = async () => {
      try {
        if (user?.role === 'ADMIN') {
          // Fetch admin dashboard data
          setDashboardLoading(true);          try {
            const [usersResponse, branches, orders] = await Promise.all([
              getAllUsers(1, 100), // Get first 100 users for count
              getBranches(),
              getAllOrders()
            ]);
              setDashboardStats({
              totalUsers: usersResponse.users.length,
              totalBranches: branches.length,
              totalOrders: orders.length
            });
            
            // Get recent orders (last 5)
            const sortedOrders = orders.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setRecentOrders(sortedOrders.slice(0, 5));
          } catch (error) {
            console.error('Error fetching dashboard data:', error);            setDashboardStats({
              totalUsers: 0,
              totalBranches: 0,
              totalOrders: 0
            });
          }
          setDashboardLoading(false);
        } else {
          // Fetch featured dishes for regular users
          const dishes = await getFeaturedMenuItems();
          setFeaturedDishes(dishes);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        setDashboardLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  // Place handleOrder function here, outside of useEffect
  const handleOrder = async (menuItemId: number, quantity: number = 1) => {
    try {
      setOrderingItems(prev => ({ ...prev, [menuItemId]: true }));
      await createOrder([{ menuItemId, quantity }]);
      setOrderSuccess(menuItemId);
      setTimeout(() => setOrderSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error creating order:', error);
      let errorMessage = 'Failed to place order. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setOrderingItems(prev => ({ ...prev, [menuItemId]: false }));
    }
  };

  return (
    <div className="home">
      {user?.role === 'ADMIN' ? (
        // Admin Dashboard
        <div className="admin-dashboard">
          <div className="dashboard-header">
            <h1>Admin Dashboard</h1>
            <p>Overview of system health, user activity logs, and recent changes.</p>
          </div>

          {dashboardLoading ? (
            <div className="loading-spinner">Loading dashboard...</div>
          ) : (
            <div className="dashboard-content">
              <div className="quick-stats">
                <h2>Quick Stats</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <h3>{dashboardStats.totalUsers}</h3>
                      <p>Total Users</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-info">
                      <h3>{dashboardStats.totalBranches}</h3>
                      <p>Restaurant Branches</p>
                    </div>
                  </div>
                    <div className="stat-card">
                    <div className="stat-icon">�</div>
                    <div className="stat-info">
                      <h3>{dashboardStats.totalOrders}</h3>
                      <p>Total Orders</p>                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">                  <Link to="/admin/users" className="action-card">
                    <div className="action-icon">👤</div>
                    <h3>Manage Users</h3>
                    <p>View and manage user accounts</p>
                  </Link>
                  
                  <Link to="/admin/branches" className="action-card">
                    <div className="action-icon">🏢</div>
                    <h3>Branch Management</h3>
                    <p>Manage restaurant branches</p>
                  </Link>
                  
                  <div className="action-card">
                    <div className="action-icon">📊</div>
                    <h3>Analytics</h3>
                    <p>View detailed reports</p>
                  </div>
                </div>
              </div>              <div className="recent-activity">
                <h2>Recent Orders</h2>
                <div className="activity-list">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div key={order.id} className="activity-item">
                        <div className="activity-time">
                          {getRelativeTime(order.createdAt)}
                        </div>
                        <div className="activity-description">
                          Order #{order.id} - €{order.total.toFixed(2)} - {order.status}
                          {order.user && ` by ${order.user.username}`}
                          {order.walkInName ? order.walkInName : (order.user?.username || 'Unknown')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="activity-item">
                      <div className="activity-description">No recent orders found</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : user?.role === 'HEADQUARTER_MANAGER' ? (
        // HQ Manager Dashboard
        <div className="hq-manager-dashboard">
          <div className="welcome-header">
            <div className="welcome-content">
              <h1>Welcome back, {user.username}</h1>
              <div className="user-info">
                <span className="user-role">Headquarter Manager</span>
                <span className="last-login">
                  Last login: {new Date(user.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
            <div className="profile-section">
              <div className="profile-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="hq-manager-content">
            <div className="overview-cards">
              <div className="overview-card">
                <div className="card-icon">🏢</div>
                <div className="card-content">
                  <h3>Multi-Branch Operations</h3>
                  <p>Oversee and coordinate operations across all restaurant locations</p>
                </div>
              </div>
              
              <div className="overview-card">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <h3>Performance Analytics</h3>
                  <p>Monitor branch performance, sales metrics, and operational efficiency</p>
                </div>
              </div>
              
              <div className="overview-card">
                <div className="card-icon">🍽️</div>
                <div className="card-content">
                  <h3>Menu Coordination</h3>
                  <p>Manage global menu updates and ensure consistency across locations</p>
                </div>
              </div>
            </div>

            <div className="quick-access">
              <h2>Quick Access</h2>
              <div className="access-grid">
                <Link to="/hq/branches" className="access-card">
                  <div className="access-icon">🏢</div>
                  <h3>All Branches</h3>
                  <p>View and manage all restaurant locations</p>
                </Link>
                
                <Link to="/admin/orders-reservations" className="access-card">
                  <div className="access-icon">📋</div>
                  <h3>Orders & Reservations</h3>
                  <p>Monitor all orders and reservations across branches</p>
                </Link>
                
                <Link to="/hq/analytics" className="access-card">
                  <div className="access-icon">📈</div>
                  <h3>Analytics</h3>
                  <p>View comprehensive business analytics and reports</p>
                </Link>
                
                <Link to="/admin/users" className="access-card">
                  <div className="access-icon">👥</div>
                  <h3>Manage Users</h3>
                  <p>Full user management: create, edit, delete, and assign roles</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Regular User Homepage
        <>
          <section className="hero">
            <div className="hero-content">
              <div className="hero-card">
                <div className="hero-badge">🔥 Exclusive dining privileges</div>
                <h1>DINE OUT &amp; SAVE MORE</h1>
                <p>Discover great new dining spots with ease and save more<br />with Steakz's exclusive offers</p>
                <div className="hero-buttons">
                  <Link to="/menu" className="download-btn">View Menu</Link>
                  {user ? (
                    <Link to="/menu" className="order-btn">Order Now</Link>
                  ) : (
                    <Link to="/login" className="order-btn">Login to Order</Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="about-section">
            <div className="about-content">
              <h2>About Steakz</h2>
              <div className="about-text">
                <p>
                  At Steakz Premium Steakhouse, we are passionate about delivering an exceptional dining experience 
                  that celebrates the art of perfectly prepared steaks. Our mission is to provide our guests with 
                  the finest cuts of premium beef, expertly grilled to perfection and served in an atmosphere of 
                  refined elegance.
                </p>
                <p>
                  We source only the highest quality, hand-selected steaks from trusted suppliers, ensuring every 
                  bite delivers the rich flavors and tender textures our guests expect. Our experienced chefs combine 
                  traditional grilling techniques with modern culinary innovation, creating dishes that honor the 
                  natural taste of premium beef while adding our signature touch.
                </p>
                <p>
                  From our signature dry-aged ribeyes to our tender filet mignon, every dish is crafted with fresh, 
                  locally-sourced ingredients and an unwavering commitment to quality. Whether you're celebrating 
                  a special occasion or simply enjoying a memorable meal, Steakz offers an unforgettable dining 
                  experience where exceptional food meets outstanding service.
                </p>
              </div>
            </div>
          </section>

          <section className="signature-dishes">
            <div className="signature-content">
              <h2>Our Signature Dishes</h2>
              <p className="signature-subtitle">Experience our most popular and expertly crafted steaks</p>
              {loading ? (
                <div className="loading-message">Loading signature dishes...</div>
              ) : (
                <div className="dishes-grid">
                  {featuredDishes.map((dish) => (
                    <div key={dish.id} className="dish-card">
                      <div className="dish-image">
                        <img src={dish.imageUrl || 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&q=80'} alt={dish.name} />
                      </div>
                      <div className="dish-info">
                        <h3>{dish.name}</h3>
                        <p>{dish.description}</p>
                        <div className="dish-price-order">
                          <span className="price">€{dish.price.toFixed(2)}</span>
                          {user ? (
                            orderSuccess === dish.id ? (
                              <div className="order-success-home">✓ Added!</div>
                            ) : (
                              <button
                                className="order-btn-home"
                                onClick={() => handleOrder(dish.id)}
                                disabled={orderingItems[dish.id]}
                              >
                                {orderingItems[dish.id] ? 'Adding...' : 'Order'}
                              </button>
                            )
                          ) : (
                            <Link to="/login" className="login-to-order-btn">Login to Order</Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="view-menu-section">
                <Link to="/menu" className="view-full-menu-btn">View Full Menu</Link>
              </div>
            </div>
          </section>

          <section id="locations" className="find-us-section">
            <div className="find-us-content">
              <h2>Find Us</h2>
              <p className="find-us-subtitle">Visit our premium steakhouse locations</p>
              
              <div className="locations-grid">
                <div className="location-card">
                  <h3>Downtown Location</h3>
                  <div className="location-info">
                    <div className="address">
                      <h4>📍 Address</h4>
                      <p>123 Gourmet Boulevard<br />
                      City Center, Downtown<br />
                      12345 Premium District</p>
                    </div>
                    
                    <div className="contact">
                      <h4>📞 Contact</h4>
                      <p>Phone: +1 (555) 123-4567<br />
                      Email: downtown@steakz.com</p>
                    </div>
                    
                    <div className="hours">
                      <h4>🕒 Opening Hours</h4>
                      <p>Monday - Thursday: 5:00 PM - 11:00 PM<br />
                      Friday - Saturday: 5:00 PM - 12:00 AM<br />
                      Sunday: 4:00 PM - 10:00 PM</p>
                    </div>
                  </div>
                  
                  <div className="location-features">
                    <span className="feature">🅿️ Valet Parking</span>
                    <span className="feature">🍷 Wine Cellar</span>
                    <span className="feature">👔 Private Dining</span>
                  </div>
                </div>
                
                <div className="location-card">
                  <h3>Waterfront Location</h3>
                  <div className="location-info">
                    <div className="address">
                      <h4>📍 Address</h4>
                      <p>456 Marina Drive<br />
                      Waterfront District<br />
                      12346 Harbor View</p>
                    </div>
                    
                    <div className="contact">
                      <h4>📞 Contact</h4>
                      <p>Phone: +1 (555) 234-5678<br />
                      Email: waterfront@steakz.com</p>
                    </div>
                    
                    <div className="hours">
                      <h4>🕒 Opening Hours</h4>
                      <p>Monday - Thursday: 5:30 PM - 11:00 PM<br />
                      Friday - Saturday: 5:30 PM - 12:30 AM<br />
                      Sunday: 4:30 PM - 10:30 PM</p>
                    </div>
                  </div>
                  
                  <div className="location-features">
                    <span className="feature">🌊 Ocean View</span>
                    <span className="feature">🛥️ Boat Access</span>
                    <span className="feature">🎉 Event Space</span>
                  </div>
                </div>
              </div>
              
              <div className="reservation-cta">
                <h3>Ready to Experience Steakz?</h3>
                <p>Reserve your table today for an unforgettable dining experience</p>
                <div className="cta-buttons">
                  <Link to="/reservations" className="reserve-btn">Make Reservation</Link>
                  <a href="tel:+15551234567" className="call-btn">Call Now</a>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Home;

