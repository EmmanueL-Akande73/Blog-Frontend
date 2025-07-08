import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Orders from './pages/Orders';
import Reservation from './pages/Reservation';
import CustomerReservations from './pages/CustomerReservations';
import AdminOrdersAndReservations from './pages/AdminOrdersAndReservations';
import ManageUsers from './pages/ManageUsers';
import ManageBranches from './pages/ManageBranches';
import SystemSettings from './pages/SystemSettings';
import Profile from './pages/Profile';
import Signup from './pages/Signup';
import Login from './pages/Login';
import AnalyticsPage from './pages/Analytics';
import GlobalMenuPage from './pages/GlobalMenu';
import BranchManagerHome from './pages/BranchManagerHome';
import OrdersAndReservations from './pages/OrdersAndReservations';
import Performance from './pages/Performance';
import MenuManagement from './pages/MenuManagement';
import ManageStaff from './pages/ManageStaff';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import BranchReports from './pages/BranchReports';
import CashierHome from './pages/CashierHome';
// import CashierOrdersAndReservations from './pages/CashierOrdersAndReservations';
import CashierPOS from './pages/CashierPOS';
import KitchenOrders from './pages/KitchenOrders';
import ChefHome from './pages/ChefHome';
import Inventory from './pages/Inventory';

// Protected Route component
const ProtectedRoute: React.FC<{
  element: React.ReactElement;
  allowedRoles?: string[];
}> = ({ element, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navbar />
        <Routes>          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/about" element={<About />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />          {/* Protected Customer Routes */}
          <Route
            path="/reservation"
            element={<ProtectedRoute element={<Reservation />} />}
          />          <Route
            path="/reservations"
            element={<ProtectedRoute element={<CustomerReservations />} allowedRoles={['CUSTOMER']} />}
          />          <Route
            path="/my-orders"
            element={<ProtectedRoute element={<div>My Orders Page</div>} />}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute element={<Profile />} />}
          />
          
          {/* Orders page for customers */}
          <Route
            path="/orders"
            element={<ProtectedRoute element={<Orders />} allowedRoles={['CUSTOMER']} />}
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/orders-reservations"
            element={
              <ProtectedRoute
                element={<AdminOrdersAndReservations />}
                allowedRoles={['HEADQUARTER_MANAGER']}
              />
            }          />          <Route
            path="/admin/users"
            element={
              <ProtectedRoute
                element={<ManageUsers />}
                allowedRoles={['ADMIN', 'HEADQUARTER_MANAGER']}
              />
            }
          />
          
          <Route
            path="/admin/branches"
            element={
              <ProtectedRoute
                element={<ManageBranches />}
                allowedRoles={['ADMIN']}
              />
            }
          />
          
          <Route
            path="/admin/system"
            element={
              <ProtectedRoute
                element={<SystemSettings />}
                allowedRoles={['ADMIN']}
              />
            }
          />

          <Route
            path="/hq/branches"
            element={
              <ProtectedRoute
                element={<ManageBranches />}
                allowedRoles={['HEADQUARTER_MANAGER']}
              />
            }
          />

          <Route
            path="/hq/analytics"
            element={
              <ProtectedRoute
                element={<AnalyticsPage />}
                allowedRoles={['HEADQUARTER_MANAGER', 'ADMIN']}
              />
            }
          />

          <Route
            path="/hq/menu"
            element={<ProtectedRoute element={<GlobalMenuPage />} allowedRoles={['HEADQUARTER_MANAGER', 'ADMIN']} />}
          />

          {/* Protected Staff Routes */}
          <Route
            path="/staff/orders"
            element={
              <ProtectedRoute
                element={<div>Staff Orders View</div>}
                allowedRoles={['STAFF', 'ADMIN']}
              />
            }
          />
          <Route
            path="/staff/reservations"
            element={
              <ProtectedRoute
                element={<div>Staff Reservations View</div>}
                allowedRoles={['STAFF', 'ADMIN']}
              />
            }
          />          <Route
            path="/branch/home"
            element={<ProtectedRoute element={<BranchManagerHome />} allowedRoles={['BRANCH_MANAGER']} />}
          />          <Route
            path="/orders-and-reservations"
            element={<ProtectedRoute element={<OrdersAndReservations />} allowedRoles={['BRANCH_MANAGER']} />}
          />          <Route
            path="/performance"
            element={<ProtectedRoute element={<Performance />} allowedRoles={['BRANCH_MANAGER']} />}
          />
          <Route
            path="/menu-management"
            element={<ProtectedRoute element={<MenuManagement />} allowedRoles={['BRANCH_MANAGER']} />}
          />          <Route
  path="/analytics"
  element={<ProtectedRoute element={<AnalyticsPage />} allowedRoles={['BRANCH_MANAGER']} />}
/>
          <Route
            path="/branch/staff"
            element={<ProtectedRoute element={<ManageStaff />} allowedRoles={['BRANCH_MANAGER']} />}
          />
          <Route
            path="/branch/reports"
            element={<ProtectedRoute element={<BranchReports />} allowedRoles={['BRANCH_MANAGER']} />}
          />
          <Route
            path="/cashier/home"
            element={<ProtectedRoute element={<CashierHome />} allowedRoles={['CASHIER']} />}
          />
          <Route
            path="/cashier/orders-reservations"
            element={<ProtectedRoute element={<OrdersAndReservations />} allowedRoles={['CASHIER']} />}
          />
          <Route
            path="/cashier/pos"
            element={<ProtectedRoute element={<CashierPOS />} allowedRoles={['CASHIER']} />}
          />
          {/* Chef Home Route */}
          <Route
            path="/chef/home"
            element={<ProtectedRoute element={<ChefHome />} allowedRoles={['CHEF']} />}
          />
          {/* Chef Inventory Route */}
          <Route
            path="/chef/inventory"
            element={<ProtectedRoute element={<Inventory />} allowedRoles={['CHEF']} />}
          />
          {/* Chef Kitchen Orders */}
          <Route
            path="/chef/orders"
            element={<ProtectedRoute element={<KitchenOrders />} allowedRoles={['CHEF']} />}
          />
          {/* 404 Route */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;

// TODO: Students - Complete the routing setup by:
// 1. Implementing the MyPosts page (/my-posts) to show the logged-in user's posts
// 2. Adding protected route logic to restrict access to certain routes based on user role
// 3. Adding a 404 page for invalid routes
