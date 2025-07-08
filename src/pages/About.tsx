import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBranches } from '../services/api';
import { Branch } from '../types';
import './styles/About.css';

const About: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchData = await getBranches();
        setBranches(branchData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branch information');
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About Steakz</h1>
          <p>Premium Steakhouse Experience Since 2018</p>
        </div>
      </section>

      <section className="about-story">
        <div className="about-story-content">
          <h2>Our Story</h2>
          <div className="story-text">
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
      </section>      <section className="about-locations">
        <div className="about-locations-content">
          <h2>Our Locations</h2>
          <p className="locations-subtitle">Visit our premium steakhouse locations</p>
          
          {loading ? (
            <div className="loading-message">Loading locations...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="locations-grid">
              {branches.map((branch) => (
                <div key={branch.id} className="location-card">
                  <h3>{branch.name}</h3>
                  <div className="location-info">
                    <div className="address">
                      <h4>� Address</h4>
                      <p>{branch.address}<br />
                      {branch.city}, {branch.district}</p>
                    </div>
                    
                    <div className="contact">
                      <h4>📞 Contact</h4>
                      <p>Phone: {branch.phone}<br />
                      Email: {branch.email}</p>
                    </div>
                    
                    <div className="hours">
                      <h4>� Opening Hours</h4>
                      <p>
                        {branch.mondayHours && `Monday: ${branch.mondayHours}`}<br />
                        {branch.tuesdayHours && `Tuesday: ${branch.tuesdayHours}`}<br />
                        {branch.wednesdayHours && `Wednesday: ${branch.wednesdayHours}`}<br />
                        {branch.thursdayHours && `Thursday: ${branch.thursdayHours}`}<br />
                        {branch.fridayHours && `Friday: ${branch.fridayHours}`}<br />
                        {branch.saturdayHours && `Saturday: ${branch.saturdayHours}`}<br />
                        {branch.sundayHours && `Sunday: ${branch.sundayHours}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="location-features">
                    {branch.features.map((feature, index) => (
                      <span key={index} className="feature">{feature}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="about-values">
        <div className="about-values-content">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🥩</div>
              <h3>Premium Quality</h3>
              <p>We source only the finest cuts of beef from trusted suppliers, ensuring exceptional quality in every dish.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">👨‍🍳</div>
              <h3>Expert Craftsmanship</h3>
              <p>Our experienced chefs combine traditional techniques with modern innovation to create culinary masterpieces.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🏆</div>
              <h3>Exceptional Service</h3>
              <p>We pride ourselves on providing attentive, professional service that makes every visit memorable.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌟</div>
              <h3>Elegant Atmosphere</h3>
              <p>Our sophisticated dining rooms provide the perfect ambiance for any occasion, from intimate dinners to celebrations.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-cta-content">
          <h2>Experience Steakz Today</h2>
          <p>Ready to taste the difference? Reserve your table and discover why Steakz is the premier destination for steak lovers.</p>
          <div className="cta-buttons">
            <Link to="/menu" className="menu-btn">View Our Menu</Link>
            <Link to="/login" className="reserve-btn">Make Reservation</Link>
            <a href="tel:+15551234567" className="call-btn">Call Now</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
