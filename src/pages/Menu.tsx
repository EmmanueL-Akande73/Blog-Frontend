import React, { useEffect, useState } from 'react';
import { getMenu } from '../services/api';
import { MenuItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './styles/Menu.css';

const Menu: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [menuItems, setMenuItems] = useState<Record<string, MenuItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('MAIN');
  const [addingItems, setAddingItems] = useState<Record<number, boolean>>({});
  const [addSuccess, setAddSuccess] = useState<number | null>(null);

  const categories = React.useMemo(() => ['APPETIZER', 'MAIN', 'DESSERT', 'BEVERAGE'], []);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const allItems = await getMenu();
        
        // Group items by category
        const itemsByCategory = allItems.reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        }, {} as Record<string, MenuItem[]>);

        setMenuItems(itemsByCategory);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch menu items');
        setLoading(false);
      }
    };

    fetchMenuItems();  }, [categories]);
  
  const handleAddToCart = async (menuItemId: number, quantity: number = 1) => {
    try {
      setAddingItems(prev => ({ ...prev, [menuItemId]: true }));
      
      await addToCart(menuItemId, quantity);
      
      setAddSuccess(menuItemId);
      setTimeout(() => setAddSuccess(null), 3000); // Clear success message after 3 seconds
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      
      // Get more specific error message
      let errorMessage = 'Failed to add item to cart. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setAddingItems(prev => ({ ...prev, [menuItemId]: false }));
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="menu-page">
      <div className="menu-header">
        <h1>Our Menu</h1>
        <p>Experience culinary excellence with our carefully curated selection</p>
      </div>

      <div className="category-tabs">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0) + category.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="menu-content">
        {categories.map((category) => (
          <div
            key={category}
            className={`menu-section ${activeCategory === category ? 'active' : ''}`}
          >
            <div className="menu-grid">
              {menuItems[category]?.map((item) => (                <div key={item.id} className="menu-item">
                  {item.imageUrl && (
                    <div className="menu-item-image-container">
                      <img src={item.imageUrl} alt={item.name} />
                    </div>
                  )}
                  <div className="menu-item-content">
                    <div className="menu-item-header">
                      <h3>{item.name}</h3>
                      <span className="price">€{item.price.toFixed(2)}</span>
                    </div>
                    <p className="description">{item.description}</p>                    <div className="menu-item-actions">                      {item.isAvailable ? (
                        <div className="order-section">
                          {user ? (
                            addSuccess === item.id ? (
                              <div className="order-success">✓ Added to cart!</div>
                            ) : (
                              <button
                                className="order-btn"
                                onClick={() => handleAddToCart(item.id)}
                                disabled={addingItems[item.id]}
                              >
                                {addingItems[item.id] ? 'Adding...' : 'Add to Cart'}
                              </button>
                            )
                          ) : (
                            <a href="/login" className="login-to-order-menu-btn">Login to Order</a>
                          )}
                        </div>
                      ) : (
                        <span className="unavailable-badge">Currently Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
