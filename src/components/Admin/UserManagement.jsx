import React, { useState, useEffect } from 'react';
import { db, dbOperations } from '../../database/db';
import AdminLayout from './AdminLayout';
import '../styles/UserManagement.css';  // Updated import

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    active: 0,
    suspended: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, activeFilter, searchTerm]);

  const loadUsers = () => {
    const allUsers = db.mobileUsers || [];
    setUsers(allUsers);
    setStats({
      all: allUsers.length,
      pending: allUsers.filter(u => u.status === 'pending').length,
      active: allUsers.filter(u => u.status === 'active').length,
      suspended: allUsers.filter(u => u.status === 'suspended').length
    });
  };

  const filterUsers = () => {
    let filtered = [...users];
    if (activeFilter !== 'all') {
      filtered = filtered.filter(user => user.status === activeFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.id.toString().includes(term)
      );
    }
    setFilteredUsers(filtered);
  };

  const handleStatusChange = (userId, newStatus) => {
    if (dbOperations.updateUserStatus(userId, newStatus)) {
      alert(`User status updated to ${newStatus}`);
      loadUsers();
    }
  };

  const handleSendNotification = (user) => {
    alert(`${user.name} has been notified`);
    // In a real app, this would send an actual notification
    dbOperations.sendNotification(user.id, 'Admin Notification', `Notification sent to ${user.name}`, 'info');
  };

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <h1 style={{ marginBottom: '8px', fontSize: '28px', fontWeight: '600', color: '#1a1a2e' }}>User Management</h1>
        <p style={{ marginBottom: '24px', color: '#6c757d', fontSize: '15px' }}>Manage mobile app users (students, faculty, staff) across all campus locations.</p>

        {/* Dropdown Scroll Bar for Choices & Search Bar Container */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
          
          {/* Status Dropdown (Scrollable Choices) */}
          <select 
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            style={{ 
              padding: '12px 16px',
              minWidth: '200px',
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
          >
            <option value="all">Users ({stats.all})</option>
            <option value="pending">Pending ({stats.pending})</option>
            <option value="active">Active ({stats.active})</option>
            <option value="suspended">Suspended ({stats.suspended})</option>
          </select>

          {/* Search bar */}
          <input 
            type="text" 
            placeholder="Search by name, email, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '12px 16px', 
              flex: '1',
              maxWidth: '500px',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6c5ce7'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
        </div>

        {/* Table */}
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          backgroundColor: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: '40px'
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: '#f8f9fa'
            }}>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#495057' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#495057' }}>USER</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#495057' }}>EMAIL</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#495057' }}>TYPE</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#495057' }}>COLLEGE</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#495057' }}>STATUS</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#495057' }}>RENTALS</th>
              <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#495057' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user.id} style={{ 
                backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
              }}>
                <td style={{ padding: '16px', color: '#212529' }}>{user.id}</td>
                <td style={{ padding: '16px', color: '#212529', fontWeight: '500' }}>{user.name}</td>
                <td style={{ padding: '16px', color: '#6c757d' }}>{user.email}</td>
                <td style={{ padding: '16px', color: '#212529' }}>{user.userType}</td>
                <td style={{ padding: '16px', color: '#212529' }}>{user.college}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '30px',
                    backgroundColor: user.status === 'active' ? '#e8f5e9' : 
                                   user.status === 'pending' ? '#fff8e1' : '#ffebee',
                    color: user.status === 'active' ? '#2e7d32' : 
                           user.status === 'pending' ? '#f57c00' : '#c62828',
                    fontWeight: '500',
                    fontSize: '13px'
                  }}>
                    <span style={{ fontSize: '18px' }}>●</span>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '16px', fontWeight: '600', color: '#212529' }}>{user.totalRentals}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {user.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusChange(user.id, 'active')}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#2e7d32',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        Approve
                      </button>
                    )}
                    {user.status === 'active' && (
                      <button 
                        onClick={() => handleStatusChange(user.id, 'suspended')}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#c62828',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        Suspend
                      </button>
                    )}
                    {user.status === 'suspended' && (
                      <button 
                        onClick={() => handleStatusChange(user.id, 'active')}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#2e7d32',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        Activate
                      </button>
                    )}
                    <button 
                      onClick={() => handleSendNotification(user)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#6c5ce7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      Notify
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;