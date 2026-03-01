import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, dbOperations } from '../../database/db';
import AdminLayout from './AdminLayout';
import '../styles/InventoryManagement.css';  // Updated import

const InventoryManagement = () => {
  const navigate = useNavigate();
  const [gadgets, setGadgets] = useState([]);
  const [filteredGadgets, setFilteredGadgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGadget, setSelectedGadget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    maintenance: 0
  });

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    specs: '',
    dailyRate: '',
    condition: 'good',
    location: '',
    status: 'available',
    imageUrl: '',
    qrCode: ''
  });

  useEffect(() => {
    // Check if admin is logged in
    const admin = localStorage.getItem('adminUser');
    if (!admin) {
      navigate('/admin');
      return;
    }

    loadInventoryData();
  }, [navigate]);

  const loadInventoryData = () => {
    // Get gadgets from database
    const gadgetList = db.gadgets || [];
    setGadgets(gadgetList);
    setFilteredGadgets(gadgetList);

    // Extract unique categories
    const uniqueCategories = [...new Set(gadgetList.map(g => g.category))];
    setCategories(uniqueCategories);

    // Calculate stats
    setStats({
      total: gadgetList.length,
      available: gadgetList.filter(g => g.status === 'available').length,
      rented: gadgetList.filter(g => g.status === 'rented').length,
      maintenance: gadgetList.filter(g => g.status === 'maintenance').length
    });

    setLoading(false);
  };

  // Filter gadgets based on search and filters
  useEffect(() => {
    let filtered = [...gadgets];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(g => g.status === filterStatus);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(g => g.category === filterCategory);
    }

    setFilteredGadgets(filtered);
  }, [searchTerm, filterStatus, filterCategory, gadgets]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      model: '',
      specs: '',
      dailyRate: '',
      condition: 'good',
      location: '',
      status: 'available',
      imageUrl: '',
      qrCode: ''
    });
  };

  const handleAddGadget = () => {
    // Generate new ID
    const newId = `G${String(gadgets.length + 1).padStart(3, '0')}`;
    
    // Create new gadget
    const newGadget = {
      id: newId,
      ...formData,
      dailyRate: parseFloat(formData.dailyRate),
      specs: formData.specs.split(',').map(s => s.trim()),
      listedDate: new Date().toISOString().split('T')[0],
      timesRented: 0
    };

    // Add to database
    db.gadgets.push(newGadget);
    
    // Log activity
    db.logs.push({
      id: db.logs.length + 1,
      action: 'Added new gadget',
      user: JSON.parse(localStorage.getItem('adminUser')).email,
      timestamp: new Date().toISOString(),
      details: `Added gadget: ${newGadget.name}`
    });

    // Reload data
    loadInventoryData();
    setShowAddModal(false);
    resetForm();
    alert('Gadget added successfully!');
  };

  const handleEditGadget = () => {
    if (!selectedGadget) return;

    // Update gadget
    const index = db.gadgets.findIndex(g => g.id === selectedGadget.id);
    if (index !== -1) {
      db.gadgets[index] = {
        ...selectedGadget,
        ...formData,
        dailyRate: parseFloat(formData.dailyRate),
        specs: formData.specs.split(',').map(s => s.trim())
      };

      // Log activity
      db.logs.push({
        id: db.logs.length + 1,
        action: 'Updated gadget',
        user: JSON.parse(localStorage.getItem('adminUser')).email,
        timestamp: new Date().toISOString(),
        details: `Updated gadget: ${formData.name}`
      });

      loadInventoryData();
      setShowEditModal(false);
      setSelectedGadget(null);
      resetForm();
      alert('Gadget updated successfully!');
    }
  };

  const handleDeleteGadget = (gadgetId) => {
    if (window.confirm('Are you sure you want to delete this gadget? This action cannot be undone.')) {
      const index = db.gadgets.findIndex(g => g.id === gadgetId);
      if (index !== -1) {
        const deleted = db.gadgets[index];
        db.gadgets.splice(index, 1);

        // Log activity
        db.logs.push({
          id: db.logs.length + 1,
          action: 'Deleted gadget',
          user: JSON.parse(localStorage.getItem('adminUser')).email,
          timestamp: new Date().toISOString(),
          details: `Deleted gadget: ${deleted.name}`
        });

        loadInventoryData();
        alert('Gadget deleted successfully!');
      }
    }
  };

  const handleStatusChange = (gadgetId, newStatus) => {
    const index = db.gadgets.findIndex(g => g.id === gadgetId);
    if (index !== -1) {
      db.gadgets[index].status = newStatus;

      // Log activity
      db.logs.push({
        id: db.logs.length + 1,
        action: 'Changed gadget status',
        user: JSON.parse(localStorage.getItem('adminUser')).email,
        timestamp: new Date().toISOString(),
        details: `Changed ${db.gadgets[index].name} status to ${newStatus}`
      });

      loadInventoryData();
    }
  };

  const openEditModal = (gadget) => {
    setSelectedGadget(gadget);
    setFormData({
      name: gadget.name || '',
      category: gadget.category || '',
      brand: gadget.brand || '',
      model: gadget.model || '',
      specs: gadget.specs ? gadget.specs.join(', ') : '',
      dailyRate: gadget.dailyRate || '',
      condition: gadget.condition || 'good',
      location: gadget.location || '',
      status: gadget.status || 'available',
      imageUrl: gadget.imageUrl || '',
      qrCode: gadget.qrCode || ''
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: { class: 'badge-available', text: 'Available' },
      rented: { class: 'badge-rented', text: 'Rented' },
      maintenance: { class: 'badge-maintenance', text: 'Maintenance' },
      lost: { class: 'badge-lost', text: 'Lost' }
    };
    return badges[status] || badges.available;
  };

  const getConditionBadge = (condition) => {
    const badges = {
      excellent: { class: 'badge-excellent', text: 'Excellent' },
      good: { class: 'badge-good', text: 'Good' },
      fair: { class: 'badge-fair', text: 'Fair' },
      poor: { class: 'badge-poor', text: 'Poor' }
    };
    return badges[condition] || badges.good;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading inventory data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="inventory-management">
        {/* Header */}
        <div className="inventory-header">
          <div className="header-left">
            <h1>Gadget Inventory Management</h1>
            <p className="welcome-text">Manage all rental gadgets in the system</p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <span className="btn-icon">➕</span>
            Add New Gadget
          </button>
        </div>

        {/* Stats Cards */}
        <div className="inventory-stats">
          <div className="stat-card-small">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <span className="stat-label">Total Gadgets</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card-small success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-label">Available</span>
              <span className="stat-value">{stats.available}</span>
            </div>
          </div>
          <div className="stat-card-small warning">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <span className="stat-label">Rented</span>
              <span className="stat-value">{stats.rented}</span>
            </div>
          </div>
          <div className="stat-card-small danger">
            <div className="stat-icon">🔧</div>
            <div className="stat-content">
              <span className="stat-label">Maintenance</span>
              <span className="stat-value">{stats.maintenance}</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="inventory-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, brand, category, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="lost">Lost</option>
            </select>

            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Gadgets Table */}
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Gadget</th>
                <th>Category</th>
                <th>Brand/Model</th>
                <th>Daily Rate</th>
                <th>Status</th>
                <th>Condition</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGadgets.map(gadget => {
                const statusBadge = getStatusBadge(gadget.status);
                const conditionBadge = getConditionBadge(gadget.condition);
                return (
                  <tr key={gadget.id}>
                    <td className="gadget-id">{gadget.id}</td>
                    <td className="gadget-name">
                      <strong>{gadget.name}</strong>
                      {gadget.qrCode && <span className="qr-badge">📱 QR</span>}
                    </td>
                    <td>{gadget.category}</td>
                    <td>{gadget.brand} {gadget.model}</td>
                    <td className="gadget-rate">₱{gadget.dailyRate}/day</td>
                    <td>
                      <span className={`status-badge ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td>
                      <span className={`condition-badge ${conditionBadge.class}`}>
                        {conditionBadge.text}
                      </span>
                    </td>
                    <td>{gadget.location || '—'}</td>
                    <td className="action-buttons">
                      <button 
                        className="btn-icon-small edit"
                        onClick={() => openEditModal(gadget)}
                        title="Edit gadget"
                      >
                        ✏️
                      </button>
                      <select 
                        className="status-select"
                        value={gadget.status}
                        onChange={(e) => handleStatusChange(gadget.id, e.target.value)}
                        title="Change status"
                      >
                        <option value="available">Available</option>
                        <option value="rented">Rented</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="lost">Lost</option>
                      </select>
                      <button 
                        className="btn-icon-small delete"
                        onClick={() => handleDeleteGadget(gadget.id)}
                        title="Delete gadget"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredGadgets.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-table">
                    No gadgets found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Gadget Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h2>Add New Gadget</h2>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Gadget Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., MacBook Pro 14"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Camera">Camera</option>
                      <option value="Phone">Phone</option>
                      <option value="Projector">Projector</option>
                      <option value="Accessory">Accessory</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      placeholder="e.g., Apple, Dell, Canon"
                    />
                  </div>
                  <div className="form-group">
                    <label>Model</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      placeholder="e.g., XPS 13, EOS 90D"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Specifications (comma separated)</label>
                    <input
                      type="text"
                      name="specs"
                      value={formData.specs}
                      onChange={handleInputChange}
                      placeholder="e.g., 16GB RAM, 512GB SSD, Intel i7"
                    />
                  </div>
                  <div className="form-group">
                    <label>Daily Rate (₱) *</label>
                    <input
                      type="number"
                      name="dailyRate"
                      value={formData.dailyRate}
                      onChange={handleInputChange}
                      placeholder="350"
                      min="0"
                      step="10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Condition</label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., IT Lab A, Media Center"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>QR Code (optional)</label>
                    <input
                      type="text"
                      name="qrCode"
                      value={formData.qrCode}
                      onChange={handleInputChange}
                      placeholder="e.g., QR-MBP-001"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddGadget}>Add Gadget</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Gadget Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h2>Edit Gadget</h2>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Gadget Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Camera">Camera</option>
                      <option value="Phone">Phone</option>
                      <option value="Projector">Projector</option>
                      <option value="Accessory">Accessory</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Model</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Specifications (comma separated)</label>
                    <input
                      type="text"
                      name="specs"
                      value={formData.specs}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Daily Rate (₱) *</label>
                    <input
                      type="number"
                      name="dailyRate"
                      value={formData.dailyRate}
                      onChange={handleInputChange}
                      min="0"
                      step="10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Condition</label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="available">Available</option>
                      <option value="rented">Rented</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleEditGadget}>Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InventoryManagement;