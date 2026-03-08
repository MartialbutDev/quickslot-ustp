import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../database/db';
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
    qrCode: ''
  });

  useEffect(() => {
    const admin = localStorage.getItem('adminUser');
    if (!admin) {
      navigate('/admin');
      return;
    }

    loadInventoryData();
  }, [navigate]);

  const loadInventoryData = () => {
    const gadgetList = db.gadgets || [];
    setGadgets(gadgetList);
    setFilteredGadgets(gadgetList);

    const uniqueCategories = [...new Set(gadgetList.map(g => g.category))];
    setCategories(uniqueCategories);

    setStats({
      total: gadgetList.length,
      available: gadgetList.filter(g => g.status === 'available').length,
      rented: gadgetList.filter(g => g.status === 'rented').length,
      maintenance: gadgetList.filter(g => g.status === 'maintenance').length
    });

    setLoading(false);
  };

  useEffect(() => {
    let filtered = [...gadgets];

    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.brand && g.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.category && g.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.id && g.id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(g => g.status === filterStatus);
    }

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
      qrCode: ''
    });
  };

  const handleAddGadget = () => {
    const newId = `G${String(gadgets.length + 1).padStart(3, '0')}`;
    
    const newGadget = {
      id: newId,
      ...formData,
      dailyRate: parseFloat(formData.dailyRate),
      specs: formData.specs ? formData.specs.split(',').map(s => s.trim()) : [],
      listedDate: new Date().toISOString().split('T')[0],
      timesRented: 0
    };

    db.gadgets.push(newGadget);
    
    db.logs.push({
      id: db.logs.length + 1,
      action: 'Added new gadget',
      user: JSON.parse(localStorage.getItem('adminUser')).email,
      timestamp: new Date().toISOString(),
      details: `Added gadget: ${newGadget.name}`
    });

    loadInventoryData();
    setShowAddModal(false);
    resetForm();
    alert('Gadget added successfully!');
  };

  const handleEditGadget = () => {
    if (!selectedGadget) return;

    const index = db.gadgets.findIndex(g => g.id === selectedGadget.id);
    if (index !== -1) {
      db.gadgets[index] = {
        ...selectedGadget,
        ...formData,
        dailyRate: parseFloat(formData.dailyRate),
        specs: formData.specs ? formData.specs.split(',').map(s => s.trim()) : []
      };

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
        <main className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading inventory data...</p>
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="inventory-management">
        
        <header className="inventory-header">
          <div className="header-left">
            <h1>Gadget Inventory Management</h1>
            <p className="welcome-text">Manage all rental gadgets in the system</p>
          </div>
          <button 
            type="button"
            className="btn-primary" 
            onClick={() => setShowAddModal(true)}
            aria-label="Add new gadget"
          >
            <span className="btn-icon" aria-hidden="true">➕</span>
            Add New Gadget
          </button>
        </header>

        <section className="inventory-stats" aria-label="Inventory statistics">
          <article className="stat-card-small">
            <div className="stat-icon" aria-hidden="true">📦</div>
            <div className="stat-content">
              <h2 className="stat-label">Total Gadgets</h2>
              <p className="stat-value">{stats.total}</p>
            </div>
          </article>
          <article className="stat-card-small success">
            <div className="stat-icon" aria-hidden="true">✅</div>
            <div className="stat-content">
              <h2 className="stat-label">Available</h2>
              <p className="stat-value">{stats.available}</p>
            </div>
          </article>
          <article className="stat-card-small warning">
            <div className="stat-icon" aria-hidden="true">🔄</div>
            <div className="stat-content">
              <h2 className="stat-label">Rented</h2>
              <p className="stat-value">{stats.rented}</p>
            </div>
          </article>
          <article className="stat-card-small danger">
            <div className="stat-icon" aria-hidden="true">🔧</div>
            <div className="stat-content">
              <h2 className="stat-label">Maintenance</h2>
              <p className="stat-value">{stats.maintenance}</p>
            </div>
          </article>
        </section>

<<<<<<< HEAD
        <section className="inventory-filters" aria-label="Search and filter options">
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
=======
        {/* Filters and Search */}
        <div className="inventory-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* IMPROVED SEARCH BOX */}
          <div className="search-box" style={{ flex: '1', maxWidth: '400px', position: 'relative' }}>
>>>>>>> e4db55d0d5ad4727938b05454d7b58ccf22453f3
            <input
              id="searchGadgets"
              type="text"
              placeholder="Search by name, brand, category, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
<<<<<<< HEAD
              aria-label="Search gadgets"
=======
              style={{
                padding: '12px 16px 12px 40px',
                width: '100%',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6c5ce7'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
>>>>>>> e4db55d0d5ad4727938b05454d7b58ccf22453f3
            />
            <svg 
              style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#adb5bd',
                pointerEvents: 'none'
              }} 
              width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="filter-group">
            <select 
              id="statusFilter"
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="lost">Lost</option>
            </select>

            <select 
              id="categoryFilter"
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="inventory-table-container" aria-label="Gadgets inventory list">
          <table className="inventory-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Gadget</th>
                <th scope="col">Category</th>
                <th scope="col">Brand/Model</th>
                <th scope="col">Daily Rate</th>
                <th scope="col">Status</th>
                <th scope="col">Condition</th>
                <th scope="col">Location</th>
                <th scope="col">Actions</th>
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
                      {gadget.qrCode && <span className="qr-badge" aria-label="Has QR code">📱 QR</span>}
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
                        type="button"
                        className="btn-icon-small edit"
                        onClick={() => openEditModal(gadget)}
                        aria-label={`Edit ${gadget.name}`}
                      >
                        <span aria-hidden="true">✏️</span>
                      </button>
                      <label htmlFor={`status-${gadget.id}`} className="sr-only">Change status for {gadget.name}</label>
                      <select 
                        id={`status-${gadget.id}`}
                        className="status-select"
                        value={gadget.status}
                        onChange={(e) => handleStatusChange(gadget.id, e.target.value)}
                        aria-label={`Change status for ${gadget.name}`}
                      >
                        <option value="available">Available</option>
                        <option value="rented">Rented</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="lost">Lost</option>
                      </select>
                      <button 
                        type="button"
                        className="btn-icon-small delete"
                        onClick={() => handleDeleteGadget(gadget.id)}
                        aria-label={`Delete ${gadget.name}`}
                      >
                        <span aria-hidden="true">🗑️</span>
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
        </section>

        {showAddModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="addModalTitle">
            <div className="modal-content large">
              <div className="modal-header">
                <h2 id="addModalTitle">Add New Gadget</h2>
                <button 
                  type="button"
                  className="modal-close" 
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close modal"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="add-name">Gadget Name *</label>
                    <input
                      id="add-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., MacBook Pro 14"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-category">Category *</label>
                    <select
                      id="add-category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      aria-required="true"
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
                    <label htmlFor="add-brand">Brand</label>
                    <input
                      id="add-brand"
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      placeholder="e.g., Apple, Dell, Canon"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-model">Model</label>
                    <input
                      id="add-model"
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      placeholder="e.g., XPS 13, EOS 90D"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="add-specs">Specifications (comma separated)</label>
                    <input
                      id="add-specs"
                      type="text"
                      name="specs"
                      value={formData.specs}
                      onChange={handleInputChange}
                      placeholder="e.g., 16GB RAM, 512GB SSD, Intel i7"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-dailyRate">Daily Rate (₱) *</label>
                    <input
                      id="add-dailyRate"
                      type="number"
                      name="dailyRate"
                      value={formData.dailyRate}
                      onChange={handleInputChange}
                      placeholder="350"
                      min="0"
                      step="10"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-condition">Condition</label>
                    <select
                      id="add-condition"
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
                    <label htmlFor="add-location">Location</label>
                    <input
                      id="add-location"
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., IT Lab A, Media Center"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-status">Status</label>
                    <select
                      id="add-status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-qrCode">QR Code (optional)</label>
                    <input
                      id="add-qrCode"
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
                <button 
                  type="button"
                  className="btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-primary" 
                  onClick={handleAddGadget}
                >
                  Add Gadget
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="editModalTitle">
            <div className="modal-content large">
              <div className="modal-header">
                <h2 id="editModalTitle">Edit Gadget</h2>
                <button 
                  type="button"
                  className="modal-close" 
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close modal"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="edit-name">Gadget Name *</label>
                    <input
                      id="edit-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-category">Category *</label>
                    <select
                      id="edit-category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      aria-required="true"
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
                    <label htmlFor="edit-brand">Brand</label>
                    <input
                      id="edit-brand"
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-model">Model</label>
                    <input
                      id="edit-model"
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="edit-specs">Specifications (comma separated)</label>
                    <input
                      id="edit-specs"
                      type="text"
                      name="specs"
                      value={formData.specs}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-dailyRate">Daily Rate (₱) *</label>
                    <input
                      id="edit-dailyRate"
                      type="number"
                      name="dailyRate"
                      value={formData.dailyRate}
                      onChange={handleInputChange}
                      min="0"
                      step="10"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-condition">Condition</label>
                    <select
                      id="edit-condition"
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
                    <label htmlFor="edit-location">Location</label>
                    <input
                      id="edit-location"
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-status">Status</label>
                    <select
                      id="edit-status"
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
                <button 
                  type="button"
                  className="btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-primary" 
                  onClick={handleEditGadget}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  );
};

export default InventoryManagement;