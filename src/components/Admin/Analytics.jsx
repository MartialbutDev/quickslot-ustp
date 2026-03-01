import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../database/db'; // Make sure dbOperations is imported here if you use it!
import AdminLayout from './AdminLayout';
import '../styles/Analytics.css';

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      totalGadgets: 0,
      totalRentals: 0,
      totalRevenue: 0,
      avgRentalDuration: 0,
      returnRate: 0
    },
    userStats: {
      byType: { student: 0, faculty: 0, staff: 0 },
      activeUsers: 0,
      newUsers: 0,
      topUsers: []
    },
    gadgetStats: {
      byCategory: {},
      topGadgets: [],
      availability: { available: 0, rented: 0, maintenance: 0 }
    },
    rentalStats: {
      byStatus: { active: 0, completed: 0, overdue: 0 },
      byMonth: [],
      revenueByMonth: []
    },
    financialStats: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      avgTransactionValue: 0,
      pendingPayments: 0,
      lateFeesCollected: 0
    }
  });

  useEffect(() => {
    const admin = localStorage.getItem('adminUser');
    if (!admin) {
      navigate('/admin');
      return;
    }

    calculateAnalytics();
  }, [navigate, timeRange]);

  const calculateAnalytics = () => {
    // Get data from database
    const users = db.mobileUsers || [];
    const gadgets = db.gadgets || [];
    const rentals = db.rentals || [];

    // Overview calculations
    const totalRevenue = rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const completedRentals = rentals.filter(r => r.status === 'completed').length;
    const totalRentals = rentals.length;
    const returnRate = totalRentals > 0 ? (completedRentals / totalRentals) * 100 : 0;

    // Calculate average rental duration
    const durations = rentals
      .filter(r => r.actualReturn)
      .map(r => {
        const start = new Date(r.rentDate);
        const end = new Date(r.actualReturn);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      });
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    // User stats by type
    const userByType = {
      student: users.filter(u => u.userType === 'student').length,
      faculty: users.filter(u => u.userType === 'faculty').length,
      staff: users.filter(u => u.userType === 'staff').length
    };

    // Get active users (users with active rentals)
    const activeUserIds = new Set(rentals.filter(r => r.status === 'active').map(r => r.userId));
    const activeUsers = activeUserIds.size;

    // Get new users in selected time range
    const now = new Date();
    const rangeStart = new Date();
    if (timeRange === 'week') rangeStart.setDate(now.getDate() - 7);
    else if (timeRange === 'month') rangeStart.setMonth(now.getMonth() - 1);
    else if (timeRange === 'year') rangeStart.setFullYear(now.getFullYear() - 1);

    const newUsers = users.filter(u => {
      const regDate = new Date(u.registeredDate);
      return regDate >= rangeStart;
    }).length;

    // Top users by rental count
    const userRentalCount = {};
    rentals.forEach(r => {
      userRentalCount[r.userId] = (userRentalCount[r.userId] || 0) + 1;
    });

    const topUsers = Object.entries(userRentalCount)
      .map(([userId, count]) => {
        const user = users.find(u => u.id === parseInt(userId));
        return {
          id: userId,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          rentals: count
        };
      })
      .sort((a, b) => b.rentals - a.rentals)
      .slice(0, 5);

    // Gadget stats by category
    const gadgetByCategory = {};
    gadgets.forEach(g => {
      gadgetByCategory[g.category] = (gadgetByCategory[g.category] || 0) + 1;
    });

    // Top gadgets by times rented
    const gadgetRentalCount = {};
    rentals.forEach(r => {
      gadgetRentalCount[r.gadgetId] = (gadgetRentalCount[r.gadgetId] || 0) + 1;
    });

    const topGadgets = Object.entries(gadgetRentalCount)
      .map(([gadgetId, count]) => {
        const gadget = gadgets.find(g => g.id === gadgetId);
        return {
          id: gadgetId,
          name: gadget?.name || 'Unknown',
          category: gadget?.category || '',
          count,
          revenue: rentals
            .filter(r => r.gadgetId === gadgetId)
            .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Gadget availability
    const availability = {
      available: gadgets.filter(g => g.status === 'available').length,
      rented: gadgets.filter(g => g.status === 'rented').length,
      maintenance: gadgets.filter(g => g.status === 'maintenance').length
    };

    // Rental stats by status
    const rentalByStatus = {
      active: rentals.filter(r => r.status === 'active').length,
      completed: rentals.filter(r => r.status === 'completed').length,
      overdue: rentals.filter(r => r.status === 'overdue').length
    };

    // Monthly rental data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const rentalByMonth = months.map((month, index) => {
      const count = rentals.filter(r => {
        const date = new Date(r.rentDate);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      }).length;
      return { month, count };
    });

    const revenueByMonth = months.map((month, index) => {
      const revenue = rentals
        .filter(r => {
          const date = new Date(r.rentDate);
          return date.getMonth() === index && date.getFullYear() === currentYear;
        })
        .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
      return { month, revenue };
    });

    // Financial stats
    const monthlyRevenue = rentals
      .filter(r => {
        const date = new Date(r.rentDate);
        return date.getMonth() === new Date().getMonth() && 
               date.getFullYear() === new Date().getFullYear();
      })
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    const avgTransactionValue = totalRentals > 0 ? totalRevenue / totalRentals : 0;

    const pendingPayments = rentals
      .filter(r => r.status === 'active' || r.status === 'overdue')
      .reduce((sum, r) => sum + ((r.totalAmount || 0) - (r.paidAmount || 0)), 0);

    const lateFeesCollected = rentals
      .filter(r => r.lateFee)
      .reduce((sum, r) => sum + (r.lateFee || 0), 0);

    setAnalytics({
      overview: {
        totalUsers: users.length,
        totalGadgets: gadgets.length,
        totalRentals: rentals.length,
        totalRevenue,
        avgRentalDuration: avgDuration.toFixed(1),
        returnRate: returnRate.toFixed(1)
      },
      userStats: {
        byType: userByType,
        activeUsers,
        newUsers,
        topUsers
      },
      gadgetStats: {
        byCategory: gadgetByCategory,
        topGadgets,
        availability
      },
      rentalStats: {
        byStatus: rentalByStatus,
        byMonth: rentalByMonth,
        revenueByMonth
      },
      financialStats: {
        totalRevenue,
        monthlyRevenue,
        avgTransactionValue: avgTransactionValue.toFixed(2),
        pendingPayments,
        lateFeesCollected
      }
    });

    setLoading(false);
  };

  const exportReport = (format) => {
    if (format === 'csv') {
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Users', analytics.overview.totalUsers],
        ['Total Gadgets', analytics.overview.totalGadgets],
        ['Total Rentals', analytics.overview.totalRentals],
        ['Total Revenue', `₱${analytics.overview.totalRevenue}`],
        ['Active Users', analytics.userStats.activeUsers],
        ['New Users', analytics.userStats.newUsers],
        ['Active Rentals', analytics.rentalStats.byStatus.active],
        ['Completed Rentals', analytics.rentalStats.byStatus.completed],
        ['Overdue Rentals', analytics.rentalStats.byStatus.overdue]
      ];

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quicklot-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (format === 'pdf') {
      alert('PDF export would be implemented here (requires additional library)');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Calculating analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  // Dynamic Pie Chart Calculation
  const totalUserTypes = analytics.userStats.byType.student + analytics.userStats.byType.faculty + analytics.userStats.byType.staff;
  const studentDeg = totalUserTypes > 0 ? (analytics.userStats.byType.student / totalUserTypes) * 360 : 0;
  const facultyDeg = totalUserTypes > 0 ? (analytics.userStats.byType.faculty / totalUserTypes) * 360 : 0;
  
  const pieGradient = `conic-gradient(
    #3498db 0deg ${studentDeg}deg, 
    #2ecc71 ${studentDeg}deg ${studentDeg + facultyDeg}deg, 
    #e67e22 ${studentDeg + facultyDeg}deg 360deg
  )`;

  return (
    <AdminLayout>
      <div className="analytics-dashboard">
        
        {/* Header */}
        <div className="analytics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className="header-left">
            <h1>Analytics Dashboard</h1>
            <p className="welcome-text">Data-driven insights for your rental system</p>
          </div>
          <div className="header-right" style={{ display: 'flex', gap: '12px' }}>
            <select 
              className="time-range-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ padding: '10px 16px', border: '1px solid #e9ecef', borderRadius: '12px', outline: 'none', backgroundColor: 'white', cursor: 'pointer' }}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
            <button className="btn-export" onClick={() => exportReport('csv')} style={{ padding: '10px 20px', backgroundColor: '#6c5ce7', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">👥</div>
            <div className="kpi-content">
              <span className="kpi-label">Total Users</span>
              <span className="kpi-value">{analytics.overview.totalUsers}</span>
              <span className="kpi-change">+{analytics.userStats.newUsers} new</span>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon">📦</div>
            <div className="kpi-content">
              <span className="kpi-label">Total Gadgets</span>
              <span className="kpi-value">{analytics.overview.totalGadgets}</span>
              <span className="kpi-change">{analytics.gadgetStats.availability.available} available</span>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon">🔄</div>
            <div className="kpi-content">
              <span className="kpi-label">Total Rentals</span>
              <span className="kpi-value">{analytics.overview.totalRentals}</span>
              <span className="kpi-change">{analytics.rentalStats.byStatus.active} active</span>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <span className="kpi-label">Total Revenue</span>
              <span className="kpi-value">₱{analytics.overview.totalRevenue.toLocaleString()}</span>
              <span className="kpi-change">₱{analytics.financialStats.monthlyRevenue.toLocaleString()} this month</span>
            </div>
          </div>
        </div>

        {/* Charts Row 1 (Bar & Line Charts) */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Rental Trends</h3>
              <span className="chart-period">Monthly</span>
            </div>
            <div className="chart-container bar-chart">
              {analytics.rentalStats.byMonth.map((item, index) => (
                <div key={index} className="chart-bar-wrapper">
                  {/* Assuming height calculation maxes around 10 for your UI */}
                  <div className="chart-bar" style={{ height: `${Math.min((item.count / 10) * 100, 100)}%` }}>
                    <span className="bar-value">{item.count}</span>
                  </div>
                  <span className="bar-label">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Revenue by Month</h3>
              <span className="chart-period">₱</span>
            </div>
            <div className="chart-container line-chart">
              {analytics.rentalStats.revenueByMonth.map((item, index) => (
                <div key={index} className="line-point-wrapper">
                  {/* Assuming height calculation maxes around 20k for your UI */}
                  <div className="line-point" style={{ bottom: `${Math.min((item.revenue / 20000) * 100, 100)}%` }}>
                    <span className="point-value">₱{(item.revenue / 1000).toFixed(0)}k</span>
                  </div>
                  <span className="point-label">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="charts-row">
          <div className="chart-card half">
            <div className="chart-header">
              <h3>Users by Type</h3>
            </div>
            <div className="pie-chart-container" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              {/* Using a modern CSS conic-gradient to fix the overlapping text issue! */}
              <div 
                className="pie-chart" 
                style={{ 
                  background: pieGradient,
                  borderRadius: '50%',
                  width: '150px',
                  height: '150px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
              ></div>
              <div className="pie-legend">
                <div className="legend-item" style={{ marginBottom: '10px' }}>
                  <span className="legend-color student" style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#3498db', marginRight: '8px', borderRadius: '3px' }}></span>
                  <span>Students ({analytics.userStats.byType.student})</span>
                </div>
                <div className="legend-item" style={{ marginBottom: '10px' }}>
                  <span className="legend-color faculty" style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#2ecc71', marginRight: '8px', borderRadius: '3px' }}></span>
                  <span>Faculty ({analytics.userStats.byType.faculty})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color staff" style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#e67e22', marginRight: '8px', borderRadius: '3px' }}></span>
                  <span>Staff ({analytics.userStats.byType.staff})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card half">
            <div className="chart-header">
              <h3>Gadget Status</h3>
            </div>
            <div className="status-chart">
              <div className="status-item">
                <span className="status-label">Available</span>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar available" 
                    style={{ width: `${(analytics.gadgetStats.availability.available / Math.max(analytics.overview.totalGadgets, 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="status-value">{analytics.gadgetStats.availability.available}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Rented</span>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar rented" 
                    style={{ width: `${(analytics.gadgetStats.availability.rented / Math.max(analytics.overview.totalGadgets, 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="status-value">{analytics.gadgetStats.availability.rented}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Maintenance</span>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar maintenance" 
                    style={{ width: `${(analytics.gadgetStats.availability.maintenance / Math.max(analytics.overview.totalGadgets, 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="status-value">{analytics.gadgetStats.availability.maintenance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Lists */}
        <div className="top-lists-row">
          <div className="top-list-card">
            <h3>Top Rented Gadgets</h3>
            <table className="top-list-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Gadget</th>
                  <th>Category</th>
                  <th>Times Rented</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.gadgetStats.topGadgets.map((gadget, index) => (
                  <tr key={gadget.id}>
                    <td className="rank">#{index + 1}</td>
                    <td>{gadget.name}</td>
                    <td>{gadget.category}</td>
                    <td className="count">{gadget.count}</td>
                    <td className="revenue">₱{gadget.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="top-list-card">
            <h3>Most Active Users</h3>
            <table className="top-list-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Rentals</th>
                </tr>
              </thead>
              <tbody>
                {analytics.userStats.topUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td className="rank">#{index + 1}</td>
                    <td>{user.name}</td>
                    <td className="email">{user.email}</td>
                    <td className="count">{user.rentals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="financial-summary">
          <h3>Financial Summary</h3>
          <div className="financial-grid">
            <div className="financial-item">
              <span className="financial-label">Total Revenue</span>
              <span className="financial-value large">₱{analytics.financialStats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Monthly Revenue</span>
              <span className="financial-value">₱{analytics.financialStats.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Avg Transaction</span>
              <span className="financial-value">₱{analytics.financialStats.avgTransactionValue}</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Pending Payments</span>
              <span className="financial-value warning">₱{analytics.financialStats.pendingPayments.toLocaleString()}</span>
            </div>
            <div className="financial-item">
              <span className="financial-label">Late Fees Collected</span>
              <span className="financial-value">₱{analytics.financialStats.lateFeesCollected.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="quick-insights">
          <h3>Quick Insights</h3>
          <div className="insights-grid">
            <div className="insight-card positive">
              <div className="insight-icon">📈</div>
              <div className="insight-content">
                <p className="insight-text">
                  Rental demand is <strong>{analytics.rentalStats.byStatus.active > 5 ? 'high' : 'moderate'}</strong> with {analytics.rentalStats.byStatus.active} active rentals
                </p>
              </div>
            </div>
            <div className="insight-card warning">
              <div className="insight-icon">⚠️</div>
              <div className="insight-content">
                <p className="insight-text">
                  <strong>{analytics.rentalStats.byStatus.overdue}</strong> items are overdue - process returns immediately
                </p>
              </div>
            </div>
            <div className="insight-card info">
              <div className="insight-icon">💡</div>
              <div className="insight-content">
                <p className="insight-text">
                  <strong>{analytics.gadgetStats.topGadgets[0]?.name || 'No data'}</strong> is your most popular item
                </p>
              </div>
            </div>
            <div className="insight-card success">
              <div className="insight-icon">✅</div>
              <div className="insight-content">
                <p className="insight-text">
                  Return rate is <strong>{analytics.overview.returnRate}%</strong> - {analytics.overview.returnRate > 80 ? 'excellent' : 'needs improvement'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;