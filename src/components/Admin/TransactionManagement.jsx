import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../database/db';
import AdminLayout from './AdminLayout';
<<<<<<< HEAD
import '../styles/TransactionManagement.css';
=======
import '../styles/TransactionManagement.css';  // Updated import
>>>>>>> e4db55d0d5ad4727938b05454d7b58ccf22453f3

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

  useEffect(() => {
    let filtered = [...rentals];

    if (searchTerm) {
      filtered = filtered.filter(r => 
        (r.id && r.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.userName && r.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.gadgetName && r.gadgetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.userId && r.userId.toString().includes(searchTerm))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

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
    
    const today = new Date();
    const expectedReturn = new Date(rental.expectedReturn);
    const daysLate = Math.max(0, Math.ceil((today - expectedReturn) / (1000 * 60 * 60 * 24)));
    const lateFee = daysLate * 50;

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
      
      db.rentals[index] = {
        ...selectedRental,
        actualReturn: today,
        status: 'completed',
        lateFee: returnData.lateFee,
        totalAmount: selectedRental.totalAmount + returnData.lateFee,
        paidAmount: selectedRental.totalAmount + returnData.lateFee,
        returnNotes: returnData.notes
      };

      const gadgetIndex = db.gadgets.findIndex(g => g.id === selectedRental.gadgetId);
      if (gadgetIndex !== -1) {
        db.gadgets[gadgetIndex].status = 'available';
        db.gadgets[gadgetIndex].condition = returnData.condition;
      }

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
        <main className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading transaction data...</p>
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="transaction-management">
        
        <header className="transaction-header">
          <div className="header-left">
            <h1>Transaction Management</h1>
            <p className="welcome-text">Monitor and process all rental transactions</p>
          </div>
        </header>

        <section className="transaction-stats" aria-label="Transaction statistics">
          <article className="stat-card-compact">
            <div className="stat-icon" aria-hidden="true">📊</div>
            <div className="stat-content">
              <h2 className="stat-label">Total Transactions</h2>
              <p className="stat-value">{stats.total}</p>
            </div>
          </article>
          <article className="stat-card-compact info">
            <div className="stat-icon" aria-hidden="true">🔄</div>
            <div className="stat-content">
              <h2 className="stat-label">Active</h2>
              <p className="stat-value">{stats.active}</p>
            </div>
          </article>
          <article className="stat-card-compact warning">
            <div className="stat-icon" aria-hidden="true">⚠️</div>
            <div className="stat-content">
              <h2 className="stat-label">Overdue</h2>
              <p className="stat-value">{stats.overdue}</p>
            </div>
          </article>
          <article className="stat-card-compact success">
            <div className="stat-icon" aria-hidden="true">✅</div>
            <div className="stat-content">
              <h2 className="stat-label">Completed</h2>
              <p className="stat-value">{stats.completed}</p>
            </div>
          </article>
          <article className="stat-card-compact revenue">
            <div className="stat-icon" aria-hidden="true">💰</div>
            <div className="stat-content">
              <h2 className="stat-label">Total Revenue</h2>
              <p className="stat-value">₱{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </article>
          <article className="stat-card-compact fees">
            <div className="stat-icon" aria-hidden="true">💸</div>
            <div className="stat-content">
              <h2 className="stat-label">Pending Fees</h2>
              <p className="stat-value">₱{stats.pendingFees.toLocaleString()}</p>
            </div>
          </article>
        </section>

<<<<<<< HEAD
        <section className="transaction-filters" aria-label="Search and filter options">
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
=======
        {/* Improved Filters and Search Row */}
        <div className="transaction-filters" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          
          {/* Improved Search Bar with Icon */}
          <div className="search-box" style={{ flex: '1', maxWidth: '400px', position: 'relative' }}>
>>>>>>> e4db55d0d5ad4727938b05454d7b58ccf22453f3
            <input
              id="searchTransactions"
              type="text"
              placeholder="Search by ID, user, or gadget..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
<<<<<<< HEAD
              aria-label="Search transactions"
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
            {/* Search Icon */}
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
          
<<<<<<< HEAD
          <div className="filter-group">
            {/* Removed the "Filter by status" text label - only the select remains */}
            <select 
              id="statusFilter"
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
=======
          {/* Right-aligned Dropdown and Date Filters */}
          <div className="filter-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ 
                padding: '12px 16px',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                color: '#495057',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6c5ce7'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
>>>>>>> e4db55d0d5ad4727938b05454d7b58ccf22453f3
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Removed the "Start date" text label - only the input remains */}
            <input
              id="startDate"
              type="date"
<<<<<<< HEAD
              placeholder="dd/mm/yyyy"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              aria-label="Start date"
            />
            
            {/* Removed the "End date" text label - only the input remains */}
=======
              title="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              style={{ 
                padding: '12px 16px',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                color: '#495057',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6c5ce7'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            
>>>>>>> e4db55d0d5ad4727938b05454d7b58ccf22453f3
            <input
              id="endDate"
              type="date"
<<<<<<< HEAD
              placeholder="dd/mm/yyyy"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              aria-label="End date"
=======
              title="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              style={{ 
                padding: '12px 16px',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                color: '#495057',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6c5ce7'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
>>>>>>> e4db55d0d5ad4727938b05454d7b58ccf22453f3
            />
          </div>
        </section>

        <section className="transaction-table-container" aria-label="Transactions list">
          <table className="transaction-table">
            <thead>
              <tr>
                <th scope="col">Rental ID</th>
                <th scope="col">User</th>
                <th scope="col">Gadget</th>
                <th scope="col">Rent Date</th>
                <th scope="col">Expected Return</th>
                <th scope="col">Actual Return</th>
                <th scope="col">Status</th>
                <th scope="col">Amount</th>
                <th scope="col">Late Fee</th>
                <th scope="col">Actions</th>
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
                            type="button"
                            className="btn-action return"
                            onClick={() => handleReturnProcess(rental)}
                            aria-label={`Process return for ${rental.gadgetName}`}
                          >
                            <span aria-hidden="true">🔄</span> Return
                          </button>
                          <button 
                            type="button"
                            className="btn-action reminder"
                            onClick={() => handleSendReminder(rental)}
                            aria-label={`Send reminder to ${rental.userName}`}
                          >
                            <span aria-hidden="true">🔔</span> Remind
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
        </section>

        {showReturnModal && selectedRental && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="returnModalTitle">
            <div className="modal-content">
              <div className="modal-header">
                <h2 id="returnModalTitle">Process Return</h2>
                <button 
                  type="button"
                  className="modal-close" 
                  onClick={() => setShowReturnModal(false)}
                  aria-label="Close modal"
                >
                  <span aria-hidden="true">✕</span>
                </button>
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
                    <label htmlFor="returnCondition">Gadget Condition</label>
                    <select
                      id="returnCondition"
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
                    <label htmlFor="lateFee">Late Fee (₱) {returnData.lateFee > 0 && <span className="fee-warning">⚠️ Overdue</span>}</label>
                    <input
                      id="lateFee"
                      type="number"
                      value={returnData.lateFee}
                      onChange={(e) => setReturnData({...returnData, lateFee: parseInt(e.target.value, 10)})}
                      min="0"
                      step="50"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="returnNotes">Notes (optional)</label>
                    <textarea
                      id="returnNotes"
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
                <button 
                  type="button"
                  className="btn-secondary" 
                  onClick={() => setShowReturnModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-primary" 
                  onClick={handleReturnSubmit}
                >
                  Process Return
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  );
};

export default TransactionManagement;