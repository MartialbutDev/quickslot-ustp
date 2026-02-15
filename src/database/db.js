// Mock Database for Quick-Slot Admin Portal
// This simulates a real database for demonstration

export const db = {
  // Admin users (only these can access web portal)
  admins: [
    { 
      id: 1, 
      email: 'admin@quickslot.ustp.edu.ph', 
      password: 'Admin@123', 
      name: 'System Administrator',
      role: 'superadmin',
      lastLogin: '2026-02-15T08:30:00'
    },
    { 
      id: 2, 
      email: 'manager@quickslot.ustp.edu.ph', 
      password: 'Manager@123', 
      name: 'Inventory Manager',
      role: 'manager',
      lastLogin: '2026-02-14T14:20:00'
    },
    { 
      id: 3, 
      email: 'staff@quickslot.ustp.edu.ph', 
      password: 'Staff@123', 
      name: 'Support Staff',
      role: 'staff',
      lastLogin: '2026-02-15T09:15:00'
    }
  ],

  // Mobile app users (students, faculty, staff)
  mobileUsers: [
    { 
      id: 1001, 
      name: 'John Doe', 
      email: 'john.doe@ustp.edu.ph', 
      idNumber: '2023-0001234',
      userType: 'student',
      college: 'College of Information Technology and Computing',
      status: 'active',
      verified: true,
      registeredDate: '2026-01-15',
      totalRentals: 5,
      currentRentals: 1
    },
    { 
      id: 1002, 
      name: 'Dr. Jane Smith', 
      email: 'jane.smith@ustp.edu.ph', 
      idNumber: '2021-0005678',
      userType: 'faculty',
      college: 'College of Engineering',
      status: 'active',
      verified: true,
      registeredDate: '2026-01-10',
      totalRentals: 3,
      currentRentals: 0
    },
    { 
      id: 1003, 
      name: 'Mark Johnson', 
      email: 'mark.johnson@ustp.edu.ph', 
      idNumber: '2022-0009012',
      userType: 'staff',
      college: 'Administration',
      status: 'suspended',
      verified: true,
      registeredDate: '2026-01-05',
      totalRentals: 2,
      currentRentals: 1
    },
    { 
      id: 1004, 
      name: 'Maria Garcia', 
      email: 'maria.garcia@ustp.edu.ph', 
      idNumber: '2024-0003456',
      userType: 'student',
      college: 'College of Science and Mathematics',
      status: 'pending',
      verified: false,
      registeredDate: '2026-02-14',
      totalRentals: 0,
      currentRentals: 0
    },
    { 
      id: 1005, 
      name: 'Robert Chen', 
      email: 'robert.chen@ustp.edu.ph', 
      idNumber: '2023-0007890',
      userType: 'student',
      college: 'College of Technology',
      status: 'active',
      verified: true,
      registeredDate: '2026-01-20',
      totalRentals: 2,
      currentRentals: 1
    }
  ],

  // Gadgets inventory
  gadgets: [
    { 
      id: 'G001', 
      name: 'MacBook Pro 14', 
      category: 'Laptop',
      brand: 'Apple',
      specs: 'M3 Pro, 16GB RAM, 512GB SSD',
      qrCode: 'QR-MBP-001',
      dailyRate: 350,
      status: 'available',
      condition: 'excellent',
      location: 'IT Lab A',
      lastMaintenance: '2026-02-01'
    },
    { 
      id: 'G002', 
      name: 'iPad Pro 12.9', 
      category: 'Tablet',
      brand: 'Apple',
      specs: 'M2, 256GB, Magic Keyboard',
      qrCode: 'QR-IPD-002',
      dailyRate: 200,
      status: 'rented',
      condition: 'good',
      location: 'Engineering Lab',
      lastMaintenance: '2026-01-15'
    },
    { 
      id: 'G003', 
      name: 'Canon EOS 90D', 
      category: 'Camera',
      brand: 'Canon',
      specs: '32.5MP, 18-135mm lens',
      qrCode: 'QR-CAM-003',
      dailyRate: 300,
      status: 'available',
      condition: 'good',
      location: 'Media Center',
      lastMaintenance: '2026-02-10'
    },
    { 
      id: 'G004', 
      name: 'Epson EB-695Wi', 
      category: 'Projector',
      brand: 'Epson',
      specs: 'Ultra Short Throw, 3500 lumens',
      qrCode: 'QR-PRO-004',
      dailyRate: 400,
      status: 'maintenance',
      condition: 'needs repair',
      location: 'AV Room',
      lastMaintenance: '2026-01-20'
    },
    { 
      id: 'G005', 
      name: 'Wacom Intuos Pro', 
      category: 'Graphics Tablet',
      brand: 'Wacom',
      specs: 'Large, Bluetooth',
      qrCode: 'QR-TAB-005',
      dailyRate: 150,
      status: 'available',
      condition: 'excellent',
      location: 'Design Studio',
      lastMaintenance: '2026-02-05'
    },
    { 
      id: 'G006', 
      name: 'Dell XPS 15', 
      category: 'Laptop',
      brand: 'Dell',
      specs: 'i9, 32GB RAM, RTX 4060',
      qrCode: 'QR-DEL-006',
      dailyRate: 380,
      status: 'available',
      condition: 'excellent',
      location: 'IT Lab B',
      lastMaintenance: '2026-02-12'
    },
    { 
      id: 'G007', 
      name: 'GoPro Hero 12', 
      category: 'Camera',
      brand: 'GoPro',
      specs: '5.3K video, Waterproof',
      qrCode: 'QR-GOP-007',
      dailyRate: 180,
      status: 'rented',
      condition: 'good',
      location: 'Media Center',
      lastMaintenance: '2026-01-25'
    }
  ],

  // Active rentals
  rentals: [
    {
      id: 'R001',
      userId: 1001,
      userName: 'John Doe',
      gadgetId: 'G002',
      gadgetName: 'iPad Pro 12.9',
      rentDate: '2026-02-10',
      expectedReturn: '2026-02-17',
      actualReturn: null,
      status: 'active',
      dailyRate: 200,
      totalAmount: 1400,
      paid: 700,
      lateFee: 0
    },
    {
      id: 'R002',
      userId: 1003,
      userName: 'Mark Johnson',
      gadgetId: 'G007',
      gadgetName: 'GoPro Hero 12',
      rentDate: '2026-02-12',
      expectedReturn: '2026-02-15',
      actualReturn: null,
      status: 'overdue',
      dailyRate: 180,
      totalAmount: 540,
      paid: 180,
      lateFee: 180
    },
    {
      id: 'R003',
      userId: 1005,
      userName: 'Robert Chen',
      gadgetId: 'G001',
      gadgetName: 'MacBook Pro 14',
      rentDate: '2026-02-14',
      expectedReturn: '2026-02-16',
      actualReturn: null,
      status: 'active',
      dailyRate: 350,
      totalAmount: 700,
      paid: 350,
      lateFee: 0
    },
    {
      id: 'R004',
      userId: 1002,
      userName: 'Dr. Jane Smith',
      gadgetId: 'G003',
      gadgetName: 'Canon EOS 90D',
      rentDate: '2026-02-05',
      expectedReturn: '2026-02-12',
      actualReturn: '2026-02-12',
      status: 'completed',
      dailyRate: 300,
      totalAmount: 2100,
      paid: 2100,
      lateFee: 0
    },
    {
      id: 'R005',
      userId: 1001,
      userName: 'John Doe',
      gadgetId: 'G005',
      gadgetName: 'Wacom Intuos Pro',
      rentDate: '2026-02-01',
      expectedReturn: '2026-02-08',
      actualReturn: '2026-02-09',
      status: 'completed',
      dailyRate: 150,
      totalAmount: 1200,
      paid: 1200,
      lateFee: 150
    }
  ],

  // Notifications (to be sent to mobile app)
  notifications: [
    {
      id: 'N001',
      userId: 1003,
      title: 'Overdue Rental',
      message: 'Your GoPro rental is overdue. Please return immediately.',
      type: 'warning',
      sentDate: '2026-02-15',
      read: false
    },
    {
      id: 'N002',
      userId: 1004,
      title: 'Registration Approved',
      message: 'Your account has been verified. You can now rent gadgets.',
      type: 'success',
      sentDate: '2026-02-14',
      read: true
    }
  ],

  // System logs
  logs: [
    { id: 1, action: 'Admin Login', user: 'admin@quickslot.ustp.edu.ph', timestamp: '2026-02-15T08:30:00' },
    { id: 2, action: 'Added new gadget', user: 'manager@quickslot.ustp.edu.ph', timestamp: '2026-02-14T15:20:00' },
    { id: 3, action: 'Approved user registration', user: 'staff@quickslot.ustp.edu.ph', timestamp: '2026-02-14T10:15:00' }
  ],

  // Analytics data
  analytics: {
    totalUsers: 156,
    activeRentals: 23,
    overdueItems: 5,
    availableGadgets: 42,
    totalRevenue: 125000,
    monthlyRevenue: 32450,
    topRentedGadgets: [
      { name: 'MacBook Pro', count: 45 },
      { name: 'iPad Pro', count: 38 },
      { name: 'Canon Camera', count: 27 }
    ]
  }
};

// Helper functions to simulate database operations
export const dbOperations = {
  // Admin authentication
  authenticateAdmin: (email, password) => {
    return db.admins.find(admin => admin.email === email && admin.password === password) || null;
  },

  // User management
  getPendingUsers: () => db.mobileUsers.filter(user => user.status === 'pending'),
  getActiveUsers: () => db.mobileUsers.filter(user => user.status === 'active'),
  getSuspendedUsers: () => db.mobileUsers.filter(user => user.status === 'suspended'),
  
  updateUserStatus: (userId, newStatus) => {
    const user = db.mobileUsers.find(u => u.id === userId);
    if (user) {
      user.status = newStatus;
      return true;
    }
    return false;
  },

  // Gadget management
  getAvailableGadgets: () => db.gadgets.filter(g => g.status === 'available'),
  getRentedGadgets: () => db.gadgets.filter(g => g.status === 'rented'),
  getMaintenanceGadgets: () => db.gadgets.filter(g => g.status === 'maintenance'),

  // Rental management
  getActiveRentals: () => db.rentals.filter(r => r.status === 'active'),
  getOverdueRentals: () => db.rentals.filter(r => r.status === 'overdue'),
  getCompletedRentals: () => db.rentals.filter(r => r.status === 'completed'),

  // Notifications
  sendNotification: (userId, title, message, type) => {
    const newNotification = {
      id: `N${String(db.notifications.length + 1).padStart(3, '0')}`,
      userId,
      title,
      message,
      type,
      sentDate: new Date().toISOString().split('T')[0],
      read: false
    };
    db.notifications.push(newNotification);
    return newNotification;
  }
};