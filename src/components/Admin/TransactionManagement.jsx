import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, dbOperations } from '../../database/db';
import AdminLayout from './AdminLayout';
import './Admin.css';

const TransactionManagement = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [users, setUsers] = useState([]);
  const [gadgets, setGadgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    overdue: 0,
    completed: 0,
    totalRevenue: 0,
    pendingFees: 0
  });

  // Return form state
  const [returnData, setReturnData] = useState({
    condition: 'good',
    lateFee: 0,
    notes: ''
  });

  useEffect(() => {
    const admin = localStorage.getItem('adminUser');
    if (!admin) {
      navigate('/admin');
      return;
    }

    loadTransactionData();
  }, [navigate]);

  const loadTransactionData = () => {
    const rentalList = db.rentals || [];
    const userList = db.mobileUsers || [];
    const gadgetList = db.gadgets || [];

    setRentals(rentalList);
    setFilteredRentals(rentalList);
    setUsers(userList);
    setGadgets(gadgetList);

    // Calculate stats
    const activeRentals = rentalList.filter(r => r.status === 'active').length;
    const overdueRentals = rentalList.filter(r => r.status === 'overdue').length;
    const completedRentals = rentalList.filter(r => r.status === 'completed').length;
    const totalRevenue = rentalList.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const pendingFees = rentalList
      .filter(r => r.status === 'active' || r.status === 'overdue')
      .reduce((sum, r) => sum + (r.lateFee || 0), 0);

    setStats({
      total: rentalList.length,
      active: activeRentals,
      overdue: overdueRentals,
      completed: completedRentals,
      totalRevenue,
      pendingFees
    });

    setLoading(false);
  };

  // Filter transactions
  useEffect(() => {
    let filtered = [...rentals];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.gadgetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userId?.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Apply date range
    if (dateRange.start) {
      filtered = filtered.filter(r => r.rentDate >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(r => r.rentDate <= dateRange.end);
    }

    setFilteredRentals(filtered);
  }, [searchTerm, filterStatus, dateRange, rentals]);

  const handleReturnProcess = (rental) => {
    setSelectedRental(rental);
    
    // Calculate late fee if applicable
    const today = new Date();
    const expectedReturn = new Date(rental.expectedReturn);
    const daysLate = Math.max(0, Math.ceil((today - expectedReturn) / (1000 * 60 * 60 * 24)));
    const lateFee = daysLate * 50; // ₱50 per day late fee

    setReturnData({
      condition: 'good',
      lateFee,
      notes: ''
    });
    
    setShowReturnModal(true);
  };

  const handleReturnSubmit = () => {
    if (!selectedRental) return;

    const index = db.rentals.findIndex(r => r.id === selectedRental.id);
    if (index !== -1) {
      const today = new Date().toISOString().split('T')[0];
      
      // Update rental record
      db.rentals[index] = {
        ...selectedRental,
        actualReturn: today,
        status: 'completed',
        lateFee: returnData.lateFee,
        totalAmount: selectedRental.totalAmount + returnData.lateFee,
        paidAmount: selectedRental.totalAmount + returnData.lateFee,
        returnNotes: returnData.notes
      };

      // Update gadget status
      const gadgetIndex = db.gadgets.findIndex(g => g.id === selectedRental.gadgetId);
      if (gadgetIndex !== -1) {
        db.gadgets[gadgetIndex].status = 'available';
        db.gadgets[gadgetIndex].condition = returnData.condition;
      }

      // Log activity
      db.logs.push({
        id: db.logs.length + 1,
        action: 'Processed return',
        user: JSON.parse(localStorage.getItem('adminUser')).email,
        timestamp: new Date().toISOString(),
        details: `Returned: ${selectedRental.gadgetName} - Late fee: ₱${returnData.lateFee}`
      });

      loadTransactionData();
      setShowReturnModal(false);
      setSelectedRental(null);
      alert('Return processed successfully!');
    }
  };

  const handleSendReminder = (rental) => {
    // Add notification
    db.notifications.push({
      id: `N${String(db.notifications.length + 1).padStart(3, '0')}`,
      userId: rental.userId,
      title: 'Rental Return Reminder',
      message: `Your rented item "${rental.gadgetName}" is due on ${rental.expectedReturn}. Please return it on time to avoid late fees.`,
      type: 'reminder',
      sentDate: new Date().toISOString().split('T')[0],
      read: false
    });

    alert(`Reminder sent to ${rental.userName}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: 'badge-active', text: 'Active' },
      overdue: { class: 'badge-overdue', text: 'Overdue' },
      completed: { class: 'badge-completed', text: 'Completed' },
      cancelled: { class: 'badge-cancelled', text: 'Cancelled' }
    };
    return badges[status] || badges.active;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysRemaining = (expectedReturn) => {
    const today = new Date();
    const expected = new Date(expectedReturn);
    const diffTime = expected - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading transaction data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="transaction-management">
        {/* Header */}
        <div className="transaction-header">
          <div className="header-left">
            <h1>Transaction Management</h1>
            <p className="welcome-text">Monitor and process all rental transactions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="transaction-stats">
          <div className="stat-card-compact">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <span className="stat-label">Total Transactions</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card-compact info">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <span className="stat-label">Active</span>
              <span className="stat-value">{stats.active}</span>
            </div>
          </div>
          <div className="stat-card-compact warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <span className="stat-label">Overdue</span>
              <span className="stat-value">{stats.overdue}</span>
            </div>
          </div>
          <div className="stat-card-compact success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{stats.completed}</span>
            </div>
          </div>
          <div className="stat-card-compact revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">₱{stats.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
          <div className="stat-card-compact fees">
            <div className="stat-icon">💸</div>
            <div className="stat-content">
              <span className="stat-label">Pending Fees</span>
              <span className="stat-value">₱{stats.pendingFees.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="transaction-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by ID, user, or gadget..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              placeholder="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <input
              type="date"
              placeholder="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="transaction-table-container">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Rental ID</th>
                <th>User</th>
                <th>Gadget</th>
                <th>Rent Date</th>
                <th>Expected Return</th>
                <th>Actual Return</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Late Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRentals.map(rental => {
                const statusBadge = getStatusBadge(rental.status);
                const daysRemaining = rental.status === 'active' ? 
                  calculateDaysRemaining(rental.expectedReturn) : null;
                
                return (
                  <tr key={rental.id} className={rental.status === 'overdue' ? 'overdue-row' : ''}>
                    <td className="rental-id">{rental.id}</td>
                    <td>
                      <div className="user-info">
                        <strong>{rental.userName}</strong>
                        <small>ID: {rental.userId}</small>
                      </div>
                    </td>
                    <td>
                      <div className="gadget-info">
                        <strong>{rental.gadgetName}</strong>
                        <small>{rental.gadgetId}</small>
                      </div>
                    </td>
                    <td>{formatDate(rental.rentDate)}</td>
                    <td className={daysRemaining < 0 ? 'text-danger' : ''}>
                      {formatDate(rental.expectedReturn)}
                      {daysRemaining !== null && daysRemaining < 0 && (
                        <span className="overdue-badge">Overdue</span>
                      )}
                    </td>
                    <td>{formatDate(rental.actualReturn)}</td>
                    <td>
                      <span className={`status-badge ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td className="amount">₱{rental.totalAmount?.toLocaleString()}</td>
                    <td className="late-fee">
                      {rental.lateFee > 0 ? `₱${rental.lateFee}` : '—'}
                    </td>
                    <td className="action-buttons">
                      {(rental.status === 'active' || rental.status === 'overdue') && (
                        <>
                          <button 
                            className="btn-action return"
                            onClick={() => handleReturnProcess(rental)}
                            title="Process return"
                          >
                            🔄 Return
                          </button>
                          <button 
                            className="btn-action reminder"
                            onClick={() => handleSendReminder(rental)}
                            title="Send reminder"
                          >
                            🔔 Remind
                          </button>
                        </>
                      )}
                      {rental.status === 'completed' && (
                        <span className="completed-label">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRentals.length === 0 && (
                <tr>
                  <td colSpan="10" className="empty-table">
                    No transactions found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Return Modal */}
        {showReturnModal && selectedRental && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Process Return</h2>
                <button className="modal-close" onClick={() => setShowReturnModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="return-summary">
                  <div className="summary-item">
                    <span className="summary-label">Rental ID:</span>
                    <span className="summary-value">{selectedRental.id}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">User:</span>
                    <span className="summary-value">{selectedRental.userName}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Gadget:</span>
                    <span className="summary-value">{selectedRental.gadgetName}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Expected Return:</span>
                    <span className="summary-value">{formatDate(selectedRental.expectedReturn)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Rental Amount:</span>
                    <span className="summary-value">₱{selectedRental.totalAmount}</span>
                  </div>
                </div>

                <div className="return-form">
                  <div className="form-group">
                    <label>Gadget Condition</label>
                    <select
                      value={returnData.condition}
                      onChange={(e) => setReturnData({...returnData, condition: e.target.value})}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Late Fee (₱) {returnData.lateFee > 0 && <span className="fee-warning">⚠️ Overdue</span>}</label>
                    <input
                      type="number"
                      value={returnData.lateFee}
                      onChange={(e) => setReturnData({...returnData, lateFee: parseInt(e.target.value)})}
                      min="0"
                      step="50"
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes (optional)</label>
                    <textarea
                      value={returnData.notes}
                      onChange={(e) => setReturnData({...returnData, notes: e.target.value})}
                      placeholder="Any issues with the return?"
                      rows="3"
                    />
                  </div>

                  <div className="return-total">
                    <span>Total Amount Due:</span>
                    <span className="total-amount">
                      ₱{(selectedRental.totalAmount + returnData.lateFee).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowReturnModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleReturnSubmit}>Process Return</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TransactionManagement;