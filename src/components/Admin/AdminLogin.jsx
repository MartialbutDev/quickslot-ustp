import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, dbOperations } from '../../database/db';
import './Admin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [initializing, setInitializing] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const admin = localStorage.getItem('adminUser');
    if (admin) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  // Simulate initializing systems
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Lockout timer
  useEffect(() => {
    let timer;
    if (isLocked && lockTimeRemaining > 0) {
      timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockTimeRemaining]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.endsWith('@quickslot.ustp.edu.ph') && 
               !formData.email.endsWith('@ustp.edu.ph')) {
      newErrors.email = 'Please use a valid USTP email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const validationErrors = validateForm();
    if (validationErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: validationErrors[field] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if account is locked
    if (isLocked) {
      setErrors({ general: `Too many failed attempts. Please wait ${lockTimeRemaining} seconds.` });
      return;
    }

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({
        email: true,
        password: true
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Authenticate from mock database
      const admin = dbOperations.authenticateAdmin(formData.email, formData.password);

      if (admin) {
        console.log('✅ Admin login successful:', admin.name);
        
        // Reset login attempts on success
        setLoginAttempts(0);
        
        // Store admin session
        const adminSession = {
          ...admin,
          loginTime: new Date().toISOString(),
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent
        };
        
        localStorage.setItem('adminUser', JSON.stringify(adminSession));
        
        // If remember me is checked, store email
        if (formData.rememberMe) {
          localStorage.setItem('rememberedAdminEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedAdminEmail');
        }
        
        // Log the action
        db.logs.push({
          id: db.logs.length + 1,
          action: 'Admin Login',
          user: admin.email,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
        
        // Show success message before redirect
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 500);
        
      } else {
        // Increment login attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // Lock account after 5 failed attempts
        if (newAttempts >= 5) {
          setIsLocked(true);
          setLockTimeRemaining(300);
          setErrors({ general: 'Account temporarily locked due to too many failed attempts. Please try again in 5 minutes.' });
          
          db.logs.push({
            id: db.logs.length + 1,
            action: 'Account Locked',
            user: formData.email,
            timestamp: new Date().toISOString(),
            attempts: newAttempts
          });
        } else {
          setErrors({ 
            general: `Invalid credentials. ${5 - newAttempts} attempt(s) remaining.` 
          });
          
          db.logs.push({
            id: db.logs.length + 1,
            action: 'Failed Login Attempt',
            user: formData.email,
            timestamp: new Date().toISOString(),
            attempt: newAttempts
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Password reset link will be sent to your email. Please check your inbox.');
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedAdminEmail');
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }, []);

  if (initializing) {
    return (
      <div className="admin-init-container">
        <div className="init-content">
          <img 
            src={`${process.env.PUBLIC_URL}/Q-slot.png`}
            alt="QuickSlot Logo" 
            className="init-logo"
          />
          <h1 className="init-title">QuickSlot</h1>
          <p className="init-subtitle">SEARCH. RENT. POWER UP.</p>
          <div className="init-loader">
            <div className="init-bar"></div>
          </div>
          <p className="init-text">INITIALIZING SYSTEMS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-wrapper">
        {/* Left side - Branding */}
        <div className="admin-login-brand">
          <div className="brand-content">
            <img 
              src={`${process.env.PUBLIC_URL}/Q-slot.png`}
              alt="QuickSlot Logo" 
              className="brand-logo"
            />
            <h1 className="brand-title">QuickSlot</h1>
            <p className="brand-subtitle">Mobile Rental System</p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Manage Users</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Track Rentals</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Analytics Dashboard</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Mobile Integration</span>
              </div>
            </div>
            <div className="brand-footer">
              <p>© 2026 QuickSlot USTP</p>
              <p>Version 2.0.0</p>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="header-badge">
              <span className="badge-icon">🔒</span>
              <span className="badge-text">ADMIN PORTAL</span>
            </div>
            <h2>Welcome Back</h2>
            <p className="admin-subtitle">Sign in to manage your rental system</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            {/* Email Field */}
            <div className="form-group">
              <label>
                <span className="label-icon">📧</span>
                Admin Email
              </label>
              <div className={`input-wrapper ${touched.email && errors.email ? 'error' : ''}`}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="admin@quickslot.ustp.edu.ph"
                  disabled={isLoading || isLocked}
                  autoComplete="email"
                  className={formData.email ? 'filled' : ''}
                />
                {formData.email && !errors.email && (
                  <span className="input-valid">✓</span>
                )}
              </div>
              {touched.email && errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label>
                <span className="label-icon">🔑</span>
                Password
              </label>
              <div className={`input-wrapper ${touched.password && errors.password ? 'error' : ''}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  disabled={isLoading || isLocked}
                  autoComplete="current-password"
                  className={formData.password ? 'filled' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {touched.password && errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={isLoading || isLocked}
                />
                <span className="checkmark"></span>
                <span className="checkbox-label">Remember me</span>
              </label>
              
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={handleForgotPassword}
                disabled={isLoading || isLocked}
              >
                Forgot password?
              </button>
            </div>

            {/* Error Messages */}
            {errors.general && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{errors.general}</span>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="admin-login-btn"
              disabled={isLoading || isLocked || Object.keys(errors).some(k => k !== 'general')}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  <span>VERIFYING CREDENTIALS...</span>
                </>
              ) : isLocked ? (
                <>
                  <span className="lock-icon">🔒</span>
                  <span>LOCKED ({lockTimeRemaining}s)</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">→</span>
                  <span>ACCESS DASHBOARD</span>
                </>
              )}
            </button>
          </form>

          <div className="admin-login-footer">
            <p>⚠️ Authorized personnel only. All activities are logged and monitored.</p>
            <p className="footer-note">For technical support: it-support@quickslot.ustp.edu.ph</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;