import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/AdminLayout.css';  // Updated import

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = JSON.parse(localStorage.getItem('adminUser'));

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
    { path: '/admin/inventory', icon: '📦', label: 'Inventory' },
    { path: '/admin/transactions', icon: '💰', label: 'Transactions' },
    { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Quick-Slot</h2>
          <p className="sidebar-subtitle">Admin Portal</p>
          <div className="admin-info">
            <p className="admin-name">{admin?.name}</p>
            <p className="admin-role">{admin?.role}</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <button onClick={handleLogout} className="logout-btn">
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </aside>
      
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;