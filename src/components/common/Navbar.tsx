import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { scrollToTopWithNavigation } from '../../utils/scrollUtils';
import './styles/Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleLocationsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // If on home page, smooth scroll to Find Us section
      const findUsSection = document.querySelector('.find-us-section');
      if (findUsSection) {
        findUsSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If not on home page, navigate to home and then scroll
      navigate('/');
      setTimeout(() => {
        const findUsSection = document.querySelector('.find-us-section');
        if (findUsSection) {
          findUsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    setIsMenuOpen(false);
  };  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Home button clicked!');
    console.log('Current pathname:', location.pathname);
    
    // Close mobile menu first
    setIsMenuOpen(false);
    
    // Use the utility function for reliable scrolling
    scrollToTopWithNavigation(navigate, location.pathname);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">
          <span className="logo-text">Steakz</span>
          <span className="logo-subtitle">Premium Steakhouse</span>
        </Link>
        
        <button className="mobile-menu-button" onClick={toggleMenu} aria-label="Toggle menu">
          <span className="hamburger"></span>
        </button>        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <span onClick={handleHomeClick} className="nav-link-span">Home</span>
          {/* Hide Menu for admin, HQ manager, branch manager, cashier, and chef users */}
          {(!user || (user.role !== 'ADMIN' && user.role !== 'HEADQUARTER_MANAGER' && user.role !== 'BRANCH_MANAGER' && user.role !== 'CASHIER' && user.role !== 'CHEF')) && (
            <Link to="/menu">Menu</Link>
          )}          {/* Hide About Us and Find Us for customers, admin, and HQ manager */}
          {!user && (
            <>
              <Link to="/about">About Us</Link>
              <a href="#locations" onClick={handleLocationsClick}>Find Us</a>
            </>
          )}
            {!user && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Register</Link>
            </>
          )}
          
          {user && (
            <>              {/* Customer features */}
              {user.role === 'CUSTOMER' && (
                <>
                  <Link to="/reservations">Reservations</Link>
                  <Link to="/orders" className="cart-link">
                    🛒 Cart & Orders {getCartItemCount() > 0 && <span className="cart-count">{getCartItemCount()}</span>}
                  </Link>
                </>
              )}
              
              {/* Chef features */}
              {user.role === 'CHEF' && (
                <>
                  <Link to="/chef/orders">Kitchen Orders</Link>
                  <Link to="/chef/inventory">Inventory</Link>
                </>
              )}
              
              {/* Cashier features */}
              {user.role === 'CASHIER' && (
                <>
                  <Link to="/cashier/orders-reservations">Orders & Reservations</Link>
                  <Link to="/cashier/pos">Point of Sale</Link>
                </>
              )}
              
              {/* Branch Manager features */}
              {user.role === 'BRANCH_MANAGER' && (
                <>
                  <Link to="/orders-and-reservations">Orders & Reservations</Link>
                  <Link to="/branch/staff">Manage Staff</Link>
                  <Link to="/branch/reports">Branch Reports</Link>
                </>
              )}
                {/* Headquarter Manager features */}
              {user.role === 'HEADQUARTER_MANAGER' && (
                <>
                  <Link to="/hq/branches">All Branches</Link>
                  <Link to="/admin/orders-reservations">Orders & Reservations</Link>
                  <Link to="/hq/analytics">Analytics</Link>
                  <Link to="/hq/menu">Global Menu</Link>
                </>
              )}                {/* Admin features (full access) */}
              {user.role === 'ADMIN' && (
                <>                  <Link to="/admin/branches">Manage Branches</Link>
                  <Link to="/admin/system">System Settings</Link>
                </>              )}
              
              {/* User Dropdown */}
              <div className="user-dropdown" ref={dropdownRef}>
                <button 
                  className="user-dropdown-trigger" 
                  onClick={toggleDropdown}
                  aria-label="User menu"
                >
                  <span className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <span className="user-name">{user.username}</span>
                  <svg 
                    className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} 
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none"
                  >
                    <path 
                      d="M3 4.5L6 7.5L9 4.5" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <div className="user-info">
                        <div className="user-name-dropdown">{user.username}</div>
                        <div className="user-role">{user.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path 
                          d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" 
                          fill="currentColor"
                        />
                        <path 
                          d="M8 10C3.58172 10 0 13.5817 0 18H16C16 13.5817 12.4183 10 8 10Z" 
                          fill="currentColor"
                        />
                      </svg>
                      Profile
                    </Link>
                    
                    {user.role === 'ADMIN' && (
                      <Link 
                        to="/admin/system" 
                        className="dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path 
                            d="M8 10C6.9 10 6 9.1 6 8C6 6.9 6.9 6 8 6C9.1 6 10 6.9 10 8C10 9.1 9.1 10 8 10Z" 
                            fill="currentColor"
                          />
                          <path 
                            d="M14.7 9.3L13.4 9.7C13.3 10 13.2 10.3 13 10.6L13.8 11.8C13.9 12 13.9 12.2 13.8 12.4L12.4 13.8C12.2 13.9 12 13.9 11.8 13.8L10.6 13C10.3 13.2 10 13.3 9.7 13.4L9.3 14.7C9.2 14.9 9 15 8.8 15H7.2C7 15 6.8 14.9 6.7 14.7L6.3 13.4C6 13.3 5.7 13.2 5.4 13L4.2 13.8C4 13.9 3.8 13.9 3.6 13.8L2.2 12.4C2.1 12.2 2.1 12 2.2 11.8L3 10.6C2.8 10.3 2.7 10 2.6 9.7L1.3 9.3C1.1 9.2 1 9 1 8.8V7.2C1 7 1.1 6.8 1.3 6.7L2.6 6.3C2.7 6 2.8 5.7 3 5.4L2.2 4.2C2.1 4 2.1 3.8 2.2 3.6L3.6 2.2C3.8 2.1 4 2.1 4.2 2.2L5.4 3C5.7 2.8 6 2.7 6.3 2.6L6.7 1.3C6.8 1.1 7 1 7.2 1H8.8C9 1 9.2 1.1 9.3 1.3L9.7 2.6C10 2.7 10.3 2.8 10.6 3L11.8 2.2C12 2.1 12.2 2.1 12.4 2.2L13.8 3.6C13.9 3.8 13.9 4 13.8 4.2L13 5.4C13.2 5.7 13.3 6 13.4 6.3L14.7 6.7C14.9 6.8 15 7 15 7.2V8.8C15 9 14.9 9.2 14.7 9.3Z" 
                            fill="currentColor"
                          />
                        </svg>
                        System Settings
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout} 
                      className="dropdown-item logout-item"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path 
                          d="M6 14H3C2.73478 14 2.48043 13.8946 2.29289 13.7071C2.10536 13.5196 2 13.2652 2 13V3C2 2.73478 2.10536 2.48043 2.29289 2.29289C2.48043 2.10536 2.73478 2 3 2H6" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M11 11L14 8L11 5" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M14 8H6" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// TODO: Students - Enhance the Navbar with the following:
// 1. Add responsive design (e.g., hamburger menu for mobile)
// 2. Add styling for active links using react-router-dom's NavLink
// 3. Add accessibility attributes (e.g., aria-labels)

