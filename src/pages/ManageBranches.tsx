import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './styles/ManageBranches.css';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  description?: string;
  features: string[];
  mondayHours?: string;
  tuesdayHours?: string;
  wednesdayHours?: string;
  thursdayHours?: string;
  fridayHours?: string;
  saturdayHours?: string;
  sundayHours?: string;
  isActive: boolean;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_FEATURES = [
  'WiFi',
  'Parking',
  'Outdoor Seating',
  'Private Dining',
  'Bar',
  'Takeaway',
  'Delivery',
  'Live Music',
  'TV Screens',
  'Pet Friendly',
  'Wheelchair Accessible',
  'Air Conditioning'
];

const ManageBranches: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    district: '',
    phone: '',
    email: '',
    description: '',
    features: [] as string[],
    mondayHours: '',
    tuesdayHours: '',
    wednesdayHours: '',
    thursdayHours: '',
    fridayHours: '',
    saturdayHours: '',
    sundayHours: '',
    imageUrl: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      alert('Error fetching branches');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      district: '',
      phone: '',
      email: '',
      description: '',
      features: [],
      mondayHours: '',
      tuesdayHours: '',
      wednesdayHours: '',
      thursdayHours: '',
      fridayHours: '',
      saturdayHours: '',
      sundayHours: '',
      imageUrl: '',
      latitude: '',
      longitude: ''
    });
    setEditingBranch(null);
    setShowCreateForm(false);
  };

  const handleConfirmCreate = async () => {
    if (!validateForm()) return;
    
    const confirmMessage = `Are you sure you want to create the branch "${formData.name}" in ${formData.city}?`;
    if (window.confirm(confirmMessage)) {
      await handleCreate();
    }
  };
  
  const handleConfirmUpdate = async () => {
    if (!validateForm()) return;
    if (!editingBranch) return;
    
    const confirmMessage = `Are you sure you want to update the branch "${formData.name}"?`;
    if (window.confirm(confirmMessage)) {
      await handleUpdate();
    }
  };

  const handleCreate = async () => {    
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };
      
      await api.post('/branches', payload);
      alert('Branch created successfully!');
      fetchBranches();
      resetForm();
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Error creating branch');
    }
  };

  const handleUpdate = async () => {
    if (!editingBranch) return;

    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };
      
      await api.put(`/branches/${editingBranch.id}`, payload);
      alert('Branch updated successfully!');
      fetchBranches();
      resetForm();
    } catch (error) {
      console.error('Error updating branch:', error);
      alert('Error updating branch');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      city: branch.city,
      district: branch.district,
      phone: branch.phone,
      email: branch.email,
      description: branch.description || '',
      features: branch.features || [],
      mondayHours: branch.mondayHours || '',
      tuesdayHours: branch.tuesdayHours || '',
      wednesdayHours: branch.wednesdayHours || '',
      thursdayHours: branch.thursdayHours || '',
      fridayHours: branch.fridayHours || '',
      saturdayHours: branch.saturdayHours || '',
      sundayHours: branch.sundayHours || '',
      imageUrl: branch.imageUrl || '',
      latitude: branch.latitude?.toString() || '',
      longitude: branch.longitude?.toString() || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate "${name}"?`)) {
      try {
        await api.delete(`/branches/${id}`);
        alert('Branch deactivated successfully!');
        fetchBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert('Error deactivating branch');
      }
    }
  };

  const validateForm = () => {
    const requiredFields = ['name', 'address', 'city', 'phone', 'email'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  return (
    <div className="manage-branches">
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">{user?.role === 'ADMIN' ? 'Manage Branches' : 'All Branches'}</h1>
            <p className="page-subtitle">
              {user?.role === 'ADMIN' 
                ? 'Create, edit, and manage all restaurant branches' 
                : 'View all restaurant locations and their details'
              }
            </p>
          </div>
          {user?.role === 'ADMIN' && (
            <button 
              className="btn-primary-modern"
              onClick={() => setShowCreateForm(true)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add New Branch
            </button>
          )}
        </div>

        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <span className="stat-number">{branches.length}</span>
              <span className="stat-label">Total Branches</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌍</div>
            <div className="stat-content">
              <span className="stat-number">{new Set(branches.map(b => b.city)).size}</span>
              <span className="stat-label">Cities</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-number">{branches.filter(b => b.isActive).length}</span>
              <span className="stat-label">Active</span>
            </div>
          </div>
        </div>

      {showCreateForm && user?.role === 'ADMIN' && (
        <div className="modal-overlay-modern">
          <div className="modal-container-modern">
            <div className="modal-header-modern">
              <div className="modal-title-section">
                <h2 className="modal-title">{editingBranch ? 'Edit Branch' : 'Create New Branch'}</h2>
                <p className="modal-subtitle">
                  {editingBranch ? 'Update branch information and settings' : 'Add a new restaurant location to your network'}
                </p>
              </div>
              <button className="modal-close-btn" onClick={resetForm}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="modal-content-modern">
              <form className="form-modern">
                <div className="form-section-modern">
                  <div className="section-header">
                    <h3 className="section-title">Basic Information</h3>
                    <p className="section-description">Essential details about the branch location</p>
                  </div>
                  <div className="form-grid-modern">
                    <div className="form-group-modern">
                      <label className="form-label-modern">Branch Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-input-modern"
                        placeholder="e.g., Downtown Steakz"
                        required
                      />
                    </div>
                    <div className="form-group-modern">
                      <label className="form-label-modern">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="form-input-modern"
                        placeholder="e.g., New York"
                        required
                      />
                    </div>
                    <div className="form-group-modern">
                      <label className="form-label-modern">District</label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="form-input-modern"
                        placeholder="e.g., Manhattan"
                      />
                    </div>
                    <div className="form-group-modern full-width">
                      <label className="form-label-modern">Full Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-input-modern"
                        placeholder="e.g., 123 Main Street, Suite 100"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section-modern">
                  <div className="section-header">
                    <h3 className="section-title">Contact Information</h3>
                    <p className="section-description">How customers can reach this location</p>
                  </div>
                  <div className="form-grid-modern">
                    <div className="form-group-modern">
                      <label className="form-label-modern">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input-modern"
                        placeholder="e.g., +1 (555) 123-4567"
                        required
                      />
                    </div>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input-modern"
                        placeholder="e.g., downtown@steakz.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group-modern">
                    <label className="form-label-modern">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="form-textarea-modern"
                      placeholder="Brief description of this location..."
                    />
                  </div>
                </div>

                <div className="form-section-modern">
                  <div className="section-header">
                    <h3 className="section-title">Available Features</h3>
                    <p className="section-description">Select all amenities available at this location</p>
                  </div>
                  <div className="features-grid-form-modern">
                    {AVAILABLE_FEATURES.map(feature => (
                      <label key={feature} className="feature-checkbox-modern">
                        <input
                          type="checkbox"
                          checked={formData.features.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          className="feature-input-modern"
                        />
                        <span className="feature-label-modern">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-section-modern">
                  <div className="section-header">
                    <h3 className="section-title">Operating Hours</h3>
                    <p className="section-description">When is this location open for business</p>
                  </div>
                  <div className="hours-grid-modern">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <div key={day} className="form-group-modern">
                        <label className="form-label-modern">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                        <input
                          type="text"
                          name={`${day}Hours`}
                          value={formData[`${day}Hours` as keyof typeof formData] as string}
                          onChange={handleInputChange}
                          className="form-input-modern"
                          placeholder="9:00 AM - 10:00 PM"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-section-modern">
                  <div className="section-header">
                    <h3 className="section-title">Additional Details</h3>
                    <p className="section-description">Optional information for enhanced functionality</p>
                  </div>
                  <div className="form-grid-modern">
                    <div className="form-group-modern full-width">
                      <label className="form-label-modern">Image URL</label>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        className="form-input-modern"
                        placeholder="https://example.com/branch-photo.jpg"
                      />
                    </div>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        className="form-input-modern"
                        placeholder="40.7128"
                      />
                    </div>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="form-input-modern"
                        placeholder="-74.0060"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer-modern">
              <button type="button" className="btn-secondary-modern" onClick={resetForm}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary-modern" 
                onClick={editingBranch ? handleConfirmUpdate : handleConfirmCreate}
              >
                {editingBranch ? 'Update Branch' : 'Create Branch'}
              </button>
            </div>
          </div>
        </div>
      )}

        <div className="branches-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>Loading branches...</span>
            </div>
          ) : branches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No branches found</h3>
              <p>Get started by creating your first branch location.</p>
            </div>
          ) : (
            <div className="branches-grid-modern">
              {branches.map((branch) => (
                <div key={branch.id} className="branch-card-modern">
                  <div className="card-header-modern">
                    <div className="branch-info">
                      <h3 className="branch-name">{branch.name}</h3>
                      <p className="branch-location">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 8.5C8.82843 8.5 9.5 7.82843 9.5 7C9.5 6.17157 8.82843 5.5 8 5.5C7.17157 5.5 6.5 6.17157 6.5 7C6.5 7.82843 7.17157 8.5 8 8.5Z" fill="currentColor"/>
                          <path d="M8 1C5.79086 1 4 2.79086 4 5C4 8.5 8 15 8 15C8 15 12 8.5 12 5C12 2.79086 10.2091 1 8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {branch.city}, {branch.district}
                      </p>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <div className="card-actions-modern">
                        <button 
                          className="btn-icon-modern edit"
                          onClick={() => handleEdit(branch)}
                          title="Edit branch"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 12H14M11 3L13 5L6 12H4V10L11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className="btn-icon-modern delete"
                          onClick={() => handleDelete(branch.id, branch.name)}
                          title="Deactivate branch"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 6V10M10 6V10M4 4V13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13V4M4 4H12M4 4H2M12 4H14M7 2H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-content-modern">
                    <div className="contact-info">
                      <div className="info-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 4L8 7L13 4M3 4V12C3 12.5523 3.44772 13 4 13H12C12.5523 13 13 12.5523 13 12V4M3 4C3 3.44772 3.44772 3 4 3H12C12.5523 3 13 3.44772 13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{branch.email}</span>
                      </div>
                      <div className="info-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M14 11V13C14 13.5523 13.5523 14 13 14C6.92487 14 2 9.07513 2 3C2 2.44772 2.44772 2 3 2H5C5.55228 2 6 2.44772 6 3V5.5C6 6.05228 5.55228 6.5 5 6.5H4C4 9.03757 6.46243 11.5 9 11.5V10.5C9 9.94772 9.44772 9.5 10 9.5H12.5C13.0523 9.5 13.5 9.94772 13.5 10.5V11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{branch.phone}</span>
                      </div>
                    </div>
                    
                    <div className="address-section">
                      <p className="address-text">{branch.address}</p>
                    </div>

                    {branch.description && (
                      <div className="description-section">
                        <p className="description-text">{branch.description}</p>
                      </div>
                    )}

                    {branch.features.length > 0 && (
                      <div className="features-section">
                        <div className="features-grid-modern">
                          {branch.features.slice(0, 4).map(feature => (
                            <span key={feature} className="feature-tag-modern">{feature}</span>
                          ))}
                          {branch.features.length > 4 && (
                            <span className="feature-more">+{branch.features.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-footer-modern">
                    <div className="status-indicator">
                      <div className={`status-dot ${branch.isActive ? 'active' : 'inactive'}`}></div>
                      <span className="status-text">{branch.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="branch-meta">
                      <span className="meta-text">ID: {branch.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageBranches;
