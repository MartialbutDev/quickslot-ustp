import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../database/db';
import AdminLayout from './AdminLayout';
import '../styles/Analytics.css';  // Updated import

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
    const users = db.mobileUsers || [];
    const gadgets = db.gadgets || [];
    const rentals = db.rentals || [];

    const totalRevenue = rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const completedRentals = rentals.filter(r => r.status === 'completed').length;
    const totalRentals = rentals.length;
    const returnRate = totalRentals > 0 ? (completedRentals / totalRentals) * 100 : 0;

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

    const userByType = {
      student: users.filter(u => u.userType === 'student').length,
      faculty: users.filter(u => u.userType === 'faculty').length,
      staff: users.filter(u => u.userType === 'staff').length
    };

    const activeUserIds = new Set(rentals.filter(r => r.status === 'active').map(r => r.userId));
    const activeUsers = activeUserIds.size;

    const now = new Date();
    const rangeStart = new Date();
    if (timeRange === 'week') rangeStart.setDate(now.getDate() - 7);
    else if (timeRange === 'month') rangeStart.setMonth(now.getMonth() - 1);
    else if (timeRange === 'year') rangeStart.setFullYear(now.getFullYear() - 1);

    const newUsers = users.filter(u => {
      const regDate = new Date(u.registeredDate);
      return regDate >= rangeStart;
    }).length;

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

    const gadgetByCategory = {};
    gadgets.forEach(g => {
      gadgetByCategory[g.category] = (gadgetByCategory[g.category] || 0) + 1;
    });

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

    const availability = {
      available: gadgets.filter(g => g.status === 'available').length,
      rented: gadgets.filter(g => g.status === 'rented').length,
      maintenance: gadgets.filter(g => g.status === 'maintenance').length
    };

    const rentalByStatus = {
      active: rentals.filter(r => r.status === 'active').length,
      completed: rentals.filter(r => r.status === 'completed').length,
      overdue: rentals.filter(r => r.status === 'overdue').length
    };

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
        <main className="dashboard-loading"> {/* Changed to main */}
          <div className="loading-spinner"></div>
          <p>Calculating analytics...</p>
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="analytics-dashboard"> {/* Changed to main */}
        
        {/* Header - Changed to header */}
        <header className="analytics-header">
          <div className="header-left">
            <h1>Analytics Dashboard</h1>
            <p className="welcome-text">Data-driven insights for your rental system</p>
          </div>
          <div className="header-right">
            <label htmlFor="timeRangeSelect" className="sr-only">Select time range</label>
            <select 
              id="timeRangeSelect"
              className="time-range-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              aria-label="Select time range"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
            <button 
              type="button"
              className="btn-export" 
              onClick={() => exportReport('csv')}
              aria-label="Export data as CSV"
            >
              <span aria-hidden="true">📥</span> Export CSV
            </button>
          </div>
        </header>

        {/* KPI Cards - Changed to section */}
        <section className="kpi-grid" aria-label="Key performance indicators">
          <article className="kpi-card"> {/* Changed to article */}
            <div className="kpi-icon" aria-hidden="true">👥</div>
            <div className="kpi-content">
              <h2 className="kpi-label">Total Users</h2> {/* Changed to h2 */}
              <p className="kpi-value">{analytics.overview.totalUsers}</p>
              <p className="kpi-change">+{analytics.userStats.newUsers} new</p>
            </div>
          </article>
          
          <article className="kpi-card"> {/* Changed to article */}
            <div className="kpi-icon" aria-hidden="true">📦</div>
            <div className="kpi-content">
              <h2 className="kpi-label">Total Gadgets</h2> {/* Changed to h2 */}
              <p className="kpi-value">{analytics.overview.totalGadgets}</p>
              <p className="kpi-change">{analytics.gadgetStats.availability.available} available</p>
            </div>
          </article>
          
          <article className="kpi-card"> {/* Changed to article */}
            <div className="kpi-icon" aria-hidden="true">🔄</div>
            <div className="kpi-content">
              <h2 className="kpi-label">Total Rentals</h2> {/* Changed to h2 */}
              <p className="kpi-value">{analytics.overview.totalRentals}</p>
              <p className="kpi-change">{analytics.rentalStats.byStatus.active} active</p>
            </div>
          </article>
          
          <article className="kpi-card"> {/* Changed to article */}
            <div className="kpi-icon" aria-hidden="true">💰</div>
            <div className="kpi-content">
              <h2 className="kpi-label">Total Revenue</h2> {/* Changed to h2 */}
              <p className="kpi-value">₱{analytics.overview.totalRevenue.toLocaleString()}</p>
              <p className="kpi-change">₱{analytics.financialStats.monthlyRevenue.toLocaleString()} this month</p>
            </div>
          </article>
        </section>

        {/* Charts Row 1 */}
        <div className="charts-row">
          <section className="chart-card"> {/* Changed to section */}
            <div className="chart-header">
              <h2>Rental Trends</h2> {/* Changed to h2 */}
              <span className="chart-period">Monthly</span>
            </div>
            <div className="chart-container bar-chart" role="img" aria-label="Bar chart showing rental trends by month">
              {analytics.rentalStats.byMonth.map((item, index) => (
                <div key={`${item.month}-${index}`} className="chart-bar-wrapper">
                  <div className="chart-bar" style={{ height: `${(item.count / 10) * 100}px` }}>
                    <span className="bar-value">{item.count}</span>
                  </div>
                  <span className="bar-label">{item.month}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="chart-card"> {/* Changed to section */}
            <div className="chart-header">
              <h2>Revenue by Month</h2> {/* Changed to h2 */}
              <span className="chart-period">₱</span>
            </div>
            <div className="chart-container line-chart" role="img" aria-label="Line chart showing revenue by month">
              {analytics.rentalStats.revenueByMonth.map((item, index) => (
                <div key={`${item.month}-${index}`} className="line-point-wrapper">
                  <div className="line-point" style={{ bottom: `${(item.revenue / 20000) * 100}px` }}>
                    <span className="point-value">₱{(item.revenue / 1000).toFixed(0)}k</span>
                  </div>
                  <span className="point-label">{item.month}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Charts Row 2 */}
        <div className="charts-row">
          <section className="chart-card half"> {/* Changed to section */}
            <div className="chart-header">
              <h2>Users by Type</h2> {/* Changed to h2 */}
            </div>
            <div className="pie-chart-container">
              <div className="pie-chart" role="img" aria-label="Pie chart showing user distribution by type">
                <div className="pie-segment student" style={{ transform: `rotate(0deg)` }}>
                  <span className="pie-label">Students {analytics.userStats.byType.student}</span>
                </div>
                <div className="pie-segment faculty" style={{ transform: `rotate(${analytics.userStats.byType.student * 3.6}deg)` }}>
                  <span className="pie-label">Faculty {analytics.userStats.byType.faculty}</span>
                </div>
                <div className="pie-segment staff" style={{ transform: `rotate(${(analytics.userStats.byType.student + analytics.userStats.byType.faculty) * 3.6}deg)` }}>
                  <span className="pie-label">Staff {analytics.userStats.byType.staff}</span>
                </div>
              </div>
              <div className="pie-legend">
                <div className="legend-item">
                  <span className="legend-color student" aria-hidden="true"></span>
                  <span>Students ({analytics.userStats.byType.student})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color faculty" aria-hidden="true"></span>
                  <span>Faculty ({analytics.userStats.byType.faculty})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color staff" aria-hidden="true"></span>
                  <span>Staff ({analytics.userStats.byType.staff})</span>
                </div>
              </div>
            </div>
          </section>

          <section className="chart-card half"> {/* Changed to section */}
            <div className="chart-header">
              <h2>Gadget Status</h2> {/* Changed to h2 */}
            </div>
            <div className="status-chart">
              <div className="status-item">
                <span className="status-label">Available</span>
                <div className="progress-bar-container" role="progressbar" aria-valuenow={(analytics.gadgetStats.availability.available / analytics.overview.totalGadgets) * 100} aria-valuemin="0" aria-valuemax="100">
                  <div 
                    className="progress-bar available" 
                    style={{ width: `${(analytics.gadgetStats.availability.available / analytics.overview.totalGadgets) * 100}%` }}
                  ></div>
                </div>
                <span className="status-value">{analytics.gadgetStats.availability.available}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Rented</span>
                <div className="progress-bar-container" role="progressbar" aria-valuenow={(analytics.gadgetStats.availability.rented / analytics.overview.totalGadgets) * 100} aria-valuemin="0" aria-valuemax="100">
                  <div 
                    className="progress-bar rented" 
                    style={{ width: `${(analytics.gadgetStats.availability.rented / analytics.overview.totalGadgets) * 100}%` }}
                  ></div>
                </div>
                <span className="status-value">{analytics.gadgetStats.availability.rented}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Maintenance</span>
                <div className="progress-bar-container" role="progressbar" aria-valuenow={(analytics.gadgetStats.availability.maintenance / analytics.overview.totalGadgets) * 100} aria-valuemin="0" aria-valuemax="100">
                  <div 
                    className="progress-bar maintenance" 
                    style={{ width: `${(analytics.gadgetStats.availability.maintenance / analytics.overview.totalGadgets) * 100}%` }}
                  ></div>
                </div>
                <span className="status-value">{analytics.gadgetStats.availability.maintenance}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Top Lists */}
        <div className="top-lists-row">
          <section className="top-list-card"> {/* Changed to section */}
            <h2>Top Rented Gadgets</h2> {/* Changed to h2 */}
            <table className="top-list-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Gadget</th>
                  <th scope="col">Category</th>
                  <th scope="col">Times Rented</th>
                  <th scope="col">Revenue</th>
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
          </section>

          <section className="top-list-card"> {/* Changed to section */}
            <h2>Most Active Users</h2> {/* Changed to h2 */}
            <table className="top-list-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">User</th>
                  <th scope="col">Email</th>
                  <th scope="col">Rentals</th>
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
          </section>
        </div>

        {/* Financial Summary - Changed to section */}
        <section className="financial-summary" aria-label="Financial summary">
          <h2 style={{ marginBottom: '16px' }}>Financial Summary</h2> {/* Changed to h2 */}
          <div className="financial-grid">
            <article className="financial-item"> {/* Changed to article */}
              <h3 className="financial-label">Total Revenue</h3> {/* Changed to h3 */}
              <p className="financial-value large">₱{analytics.financialStats.totalRevenue.toLocaleString()}</p>
            </article>
            <article className="financial-item"> {/* Changed to article */}
              <h3 className="financial-label">Monthly Revenue</h3> {/* Changed to h3 */}
              <p className="financial-value">₱{analytics.financialStats.monthlyRevenue.toLocaleString()}</p>
            </article>
            <article className="financial-item"> {/* Changed to article */}
              <h3 className="financial-label">Avg Transaction</h3> {/* Changed to h3 */}
              <p className="financial-value">₱{analytics.financialStats.avgTransactionValue}</p>
            </article>
            <article className="financial-item"> {/* Changed to article */}
              <h3 className="financial-label">Pending Payments</h3> {/* Changed to h3 */}
              <p className="financial-value warning">₱{analytics.financialStats.pendingPayments.toLocaleString()}</p>
            </article>
            <article className="financial-item"> {/* Changed to article */}
              <h3 className="financial-label">Late Fees Collected</h3> {/* Changed to h3 */}
              <p className="financial-value">₱{analytics.financialStats.lateFeesCollected.toLocaleString()}</p>
            </article>
          </div>
        </section>

        {/* Quick Insights - Changed to section */}
        <section className="quick-insights" aria-label="Quick insights">
          <h2 style={{ marginBottom: '16px' }}>Quick Insights</h2> {/* Changed to h2 */}
          <div className="insights-grid">
            <article className="insight-card positive"> {/* Changed to article */}
              <div className="insight-icon" aria-hidden="true">📈</div>
              <div className="insight-content">
                <p className="insight-text">
                  Rental demand is <strong>{analytics.rentalStats.byStatus.active > 5 ? 'high' : 'moderate'}</strong> with {analytics.rentalStats.byStatus.active} active rentals
                </p>
              </div>
            </article>
            <article className="insight-card warning"> {/* Changed to article */}
              <div className="insight-icon" aria-hidden="true">⚠️</div>
              <div className="insight-content">
                <p className="insight-text">
                  <strong>{analytics.rentalStats.byStatus.overdue}</strong> items are overdue - process returns immediately
                </p>
              </div>
            </article>
            <article className="insight-card info"> {/* Changed to article */}
              <div className="insight-icon" aria-hidden="true">💡</div>
              <div className="insight-content">
                <p className="insight-text">
                  <strong>{analytics.gadgetStats.topGadgets[0]?.name || 'No data'}</strong> is your most popular item
                </p>
              </div>
            </article>
            <article className="insight-card success"> {/* Changed to article */}
              <div className="insight-icon" aria-hidden="true">✅</div>
              <div className="insight-content">
                <p className="insight-text">
                  Return rate is <strong>{analytics.overview.returnRate}%</strong> - {analytics.overview.returnRate > 80 ? 'excellent' : 'needs improvement'}
                </p>
              </div>
            </article>
          </div>
        </section>
      </main>
    </AdminLayout>
  );
};

export default Analytics;