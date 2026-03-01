import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, dbOperations } from '../../database/db';
import AdminLayout from './AdminLayout';
import '../styles/AdminDashboard.css'; // Updated import

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    activeRentals: 0,
    overdueItems: 0,
    availableGadgets: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    completedRentals: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const [recentRentals, setRecentRentals] = useState([]);
  const [topGadgets, setTopGadgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const admin = localStorage.getItem('adminUser');
    if (!admin) {
      navigate('/admin');
      return;
    }

    loadDashboardData();
    setTimeout(() => setLoading(false), 1000);
  }, [navigate]);

  const loadDashboardData = () => {
    setStats({
      totalUsers: db.mobileUsers.length,
      pendingUsers: dbOperations.getPendingUsers().length,
      activeRentals: dbOperations.getActiveRentals().length,
      overdueItems: dbOperations.getOverdueRentals().length,
      availableGadgets: dbOperations.getAvailableGadgets().length,
      totalRevenue: db.analytics.totalRevenue,
      monthlyRevenue: db.analytics.monthlyRevenue,
      completedRentals: dbOperations.getCompletedRentals().length
    });

    setQuickStats([
      {
        id: 1,
        label: 'Total Users',
        value: db.mobileUsers.length,
        change: '+12%',
        icon: '👥',
        color: '#4299e1',
        bgColor: '#ebf8ff',
        details: `${db.mobileUsers.filter(u => u.userType === 'student').length} students, ${db.mobileUsers.filter(u => u.userType === 'faculty').length} faculty`
      },
      {
        id: 2,
        label: 'Active Rentals',
        value: dbOperations.getActiveRentals().length,
        change: `${dbOperations.getOverdueRentals().length} overdue`,
        icon: '🔄',
        color: '#48bb78',
        bgColor: '#f0fff4',
        details: `${dbOperations.getActiveRentals().length} items currently rented`
      },
      {
        id: 3,
        label: 'Available Gadgets',
        value: dbOperations.getAvailableGadgets().length,
        change: `${db.gadgets.length} total`,
        icon: '📦',
        color: '#ed8936',
        bgColor: '#fffaf0',
        details: `${db.gadgets.filter(g => g.status === 'maintenance').length} under maintenance`
      },
      {
        id: 4,
        label: 'Monthly Revenue',
        value: `₱${db.analytics.monthlyRevenue.toLocaleString()}`,
        change: '+8.2%',
        icon: '💰',
        color: '#9f7aea',
        bgColor: '#faf5ff',
        details: `Total revenue: ₱${db.analytics.totalRevenue.toLocaleString()}`
      }
    ]);

    setRecentActivities(db.logs.slice(-8).reverse());
    setNotifications(db.notifications.slice(-4).reverse());
    setRecentRentals(db.rentals.slice(-5).reverse());

    setTopGadgets(db.analytics.topRentedGadgets || [
      { name: 'MacBook Pro', count: 45 },
      { name: 'iPad Pro', count: 38 },
      { name: 'Canon Camera', count: 27 },
      { name: 'iPhone 15', count: 22 }
    ]);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: 'badge-active', text: 'Active' },
      overdue: { class: 'badge-overdue', text: 'Overdue' },
      completed: { class: 'badge-completed', text: 'Completed' },
      pending: { class: 'badge-pending', text: 'Pending' },
      maintenance: { class: 'badge-maintenance', text: 'Maintenance' }
    };
    return badges[status] || badges.active;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="dashboard-loading">  {/* Keep as div for loading state */}
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="admin-dashboard">  {/* Keep main with className */}
        
        {/* Welcome Header - Use header with className */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Dashboard Overview</h1>
            <p className="welcome-text">
              Welcome back, <strong>{JSON.parse(localStorage.getItem('adminUser'))?.name}</strong>
            </p>
          </div>
          <div className="header-right">
            <div className="date-display">
              <span className="date-icon" aria-hidden="true">📅</span>
              <span>{new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </header>

        {/* Quick Stats Grid - Use section with className */}
        <section className="stats-grid-enhanced">
          {quickStats.map(stat => (
            <article key={stat.id} className="stat-card-enhanced" style={{ backgroundColor: stat.bgColor }}>
              <div className="stat-icon-wrapper" style={{ backgroundColor: stat.color }} aria-hidden="true">
                <span>{stat.icon}</span>
              </div>
              <div className="stat-content">
                <h2 className="stat-label">{stat.label}</h2>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-change">{stat.change}</div>
                <div className="stat-details">{stat.details}</div>
              </div>
            </article>
          ))}
        </section>

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          
          {/* Recent Activity - Use section with className */}
          <section className="grid-card activity-card">
            <div className="card-header">
              <h2>Recent Activity</h2>
              <button
                type="button"
                className="view-all-btn"
                onClick={() => navigate('/admin/analytics')}
                aria-label="View all activities"
              >
                View All →
              </button>
            </div>
            <div className="activity-timeline">
              {recentActivities.map((activity, index) => (
                <div key={`${activity.timestamp}-${index}`} className="timeline-item">
                  <div className="timeline-dot" aria-hidden="true"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-action">{activity.action}</span>
                      <span className="timeline-time">{formatDate(activity.timestamp)}</span>
                    </div>
                    <div className="timeline-user">{activity.user}</div>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div className="empty-state">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Rentals - Use section with className */}
          <section className="grid-card rentals-card">
            <div className="card-header">
              <h2>Recent Rentals</h2>
              <button
                type="button"
                className="view-all-btn"
                onClick={() => navigate('/admin/transactions')}
                aria-label="View all rentals"
              >
                View All →
              </button>
            </div>
            <div className="rentals-list">
              {recentRentals.map((rental, index) => {
                const status = getStatusBadge(rental.status);
                return (
                  <article key={`${rental.id}-${index}`} className="rental-item">
                    <div className="rental-info">
                      <h3 className="rental-gadget">{rental.gadgetName}</h3>
                      <div className="rental-user">{rental.userName}</div>
                      <div className="rental-dates">
                        <span>📅 {new Date(rental.rentDate).toLocaleDateString()}</span>
                        {rental.expectedReturn && (
                          <span> → {new Date(rental.expectedReturn).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="rental-status">
                      <span className={`status-badge ${status.class}`}>{status.text}</span>
                      {rental.lateFee > 0 && (
                        <span className="late-fee">+₱{rental.lateFee}</span>
                      )}
                    </div>
                  </article>
                );
              })}
              {recentRentals.length === 0 && (
                <div className="empty-state">
                  <p>No recent rentals</p>
                </div>
              )}
            </div>
          </section>

          {/* Top Rented Gadgets - Use section with className */}
          <section className="grid-card top-gadgets-card">
            <div className="card-header">
              <h2>Most Popular Items</h2>
              <button
                type="button"
                className="view-all-btn"
                onClick={() => navigate('/admin/analytics')}
                aria-label="View details"
              >
                Details →
              </button>
            </div>
            <div className="top-gadgets-list">
              {topGadgets.map((gadget, index) => (
                <article key={`${gadget.name}-${index}`} className="gadget-rank-item">
                  <div className="gadget-rank">
                    <span className="rank-number">#{index + 1}</span>
                    <span className="rank-name">{gadget.name}</span>
                  </div>
                  <div className="rank-count">
                    <span className="count-badge">{gadget.count} rentals</span>
                    <div className="progress-bar" role="progressbar" aria-valuenow={(gadget.count / 50) * 100} aria-valuemin="0" aria-valuemax="100">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(gadget.count / 50) * 100}%`,
                          backgroundColor: index === 0 ? '#4299e1' :
                                         index === 1 ? '#48bb78' :
                                         index === 2 ? '#ed8936' : '#9f7aea'
                        }}
                      ></div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Notifications - Use section with className */}
          <section className="grid-card notifications-card">
            <div className="card-header">
              <h2>Notifications</h2>
              <button
                type="button"
                className="view-all-btn"
                onClick={() => navigate('/admin/notifications')}
                aria-label="Manage notifications"
              >
                Manage →
              </button>
            </div>
            <div className="notifications-list">
              {notifications.map((notification, index) => (
                <article key={`${notification.id}-${index}`} className={`notification-item-enhanced ${notification.type}`}>
                  <div className="notification-icon" aria-hidden="true">
                    {notification.type === 'warning' ? '⚠️' :
                     notification.type === 'success' ? '✅' : '📢'}
                  </div>
                  <div className="notification-content">
                    <h3 className="notification-title">{notification.title}</h3>
                    <p className="notification-message">{notification.message}</p>
                    <div className="notification-meta">
                      <span className="notification-user">To: User #{notification.userId}</span>
                      <span className="notification-time">{notification.sentDate}</span>
                    </div>
                  </div>
                  {!notification.read && <span className="notification-badge">New</span>}
                </article>
              ))}
              {notifications.length === 0 && (
                <div className="empty-state">
                  <p>No new notifications</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Quick Actions Section - Use section with className */}
        <section className="quick-actions-enhanced">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <button
              type="button"
              className="action-btn users"
              onClick={() => navigate('/admin/users')}
              aria-label={`Manage users, pending: ${stats.pendingUsers}`}
            >
              <span className="action-icon" aria-hidden="true">👥</span>
              <span className="action-label">Manage Users</span>
              <span className="action-badge">{stats.pendingUsers} pending</span>
            </button>
            
            <button
              type="button"
              className="action-btn inventory"
              onClick={() => navigate('/admin/inventory')}
              aria-label={`Add gadget, available: ${stats.availableGadgets}`}
            >
              <span className="action-icon" aria-hidden="true">📦</span>
              <span className="action-label">Add Gadget</span>
              <span className="action-badge">{stats.availableGadgets} available</span>
            </button>
            
            <button
              type="button"
              className="action-btn returns"
              onClick={() => navigate('/admin/transactions')}
              aria-label={`Process returns, overdue: ${stats.overdueItems}`}
            >
              <span className="action-icon" aria-hidden="true">🔄</span>
              <span className="action-label">Process Returns</span>
              <span className="action-badge">{stats.overdueItems} overdue</span>
            </button>
            
            <button
              type="button"
              className="action-btn reports"
              onClick={() => navigate('/admin/analytics')}
              aria-label="View reports"
            >
              <span className="action-icon" aria-hidden="true">📊</span>
              <span className="action-label">View Reports</span>
              <span className="action-badge">+12% revenue</span>
            </button>
            
            <button
              type="button"
              className="action-btn notifications"
              onClick={() => navigate('/admin/notifications')}
              aria-label={`Send notification, ${notifications.length} new`}
            >
              <span className="action-icon" aria-hidden="true">🔔</span>
              <span className="action-label">Send Notification</span>
              <span className="action-badge">{notifications.length} new</span>
            </button>
            
            <button
              type="button"
              className="action-btn settings"
              onClick={() => navigate('/admin/settings')}
              aria-label="Configure settings"
            >
              <span className="action-icon" aria-hidden="true">⚙️</span>
              <span className="action-label">Settings</span>
              <span className="action-badge">configure</span>
            </button>
          </div>
        </section>

        {/* System Status - Use footer with className */}
        <footer className="system-status">
          <div className="status-item">
            <span className="status-indicator online" aria-hidden="true"></span>
            <span className="status-label">Database: Connected</span>
          </div>
          <div className="status-item">
            <span className="status-indicator online" aria-hidden="true"></span>
            <span className="status-label">API: Online</span>
          </div>
          <div className="status-item">
            <span className="status-indicator online" aria-hidden="true"></span>
            <span className="status-label">Mobile App: Active</span>
          </div>
          <div className="status-item">
            <span className="status-indicator" aria-hidden="true"></span>
            <span className="status-label">Last backup: Today 2:30 AM</span>
          </div>
        </footer>
      </main>
    </AdminLayout>
  );
};

export default AdminDashboard;