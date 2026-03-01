import React, { useState, useEffect } from 'react';
import { db, dbOperations } from '../../database/db';
import AdminLayout from './AdminLayout';
import '../styles/UserManagement.css';  // Updated import

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = () => {
    if (filter === 'pending') {
      setUsers(dbOperations.getPendingUsers());
    } else if (filter === 'active') {
      setUsers(dbOperations.getActiveUsers());
    } else if (filter === 'suspended') {
      setUsers(dbOperations.getSuspendedUsers());
    } else {
      setUsers(db.mobileUsers);
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    if (dbOperations.updateUserStatus(userId, newStatus)) {
      alert(`User status updated to ${newStatus}`);
      loadUsers();
    }
  };

  const handleSendNotification = (user) => {
    const message = prompt('Enter notification message:');
    if (message) {
      dbOperations.sendNotification(
        user.id,
        'Admin Notification',
        message,
        'info'
      );
      alert('Notification sent to user\'s mobile app');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>User Management</h1>
          <p>Manage mobile app users (students, faculty, staff)</p>
        </div>

        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All Users ({db.mobileUsers.length})
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''} 
            onClick={() => setFilter('pending')}
          >
            Pending ({dbOperations.getPendingUsers().length})
          </button>
          <button 
            className={filter === 'active' ? 'active' : ''} 
            onClick={() => setFilter('active')}
          >
            Active ({dbOperations.getActiveUsers().length})
          </button>
          <button 
            className={filter === 'suspended' ? 'active' : ''} 
            onClick={() => setFilter('suspended')}
          >
            Suspended ({dbOperations.getSuspendedUsers().length})
          </button>
        </div>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>College</th>
                <th>Status</th>
                <th>Rentals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.userType}</td>
                  <td>{user.college}</td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.totalRentals}</td>
                  <td>
                    <div className="action-buttons-small">
                      {user.status === 'pending' && (
                        <button 
                          className="btn-approve"
                          onClick={() => handleStatusChange(user.id, 'active')}
                        >
                          Approve
                        </button>
                      )}
                      {user.status === 'active' && (
                        <button 
                          className="btn-suspend"
                          onClick={() => handleStatusChange(user.id, 'suspended')}
                        >
                          Suspend
                        </button>
                      )}
                      {user.status === 'suspended' && (
                        <button 
                          className="btn-activate"
                          onClick={() => handleStatusChange(user.id, 'active')}
                        >
                          Activate
                        </button>
                      )}
                      <button 
                        className="btn-notify"
                        onClick={() => handleSendNotification(user)}
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
      </div>
    </AdminLayout>
  );
};

export default UserManagement;