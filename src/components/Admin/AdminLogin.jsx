import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, dbOperations } from '../../database/db';
import '../styles/AdminLogin.css';  // Updated import

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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.endsWith('@quickslot.ustp.edu.ph') && 
               !formData.email.endsWith('@ustp.edu.ph')) {
      newErrors.email = 'Please use a valid USTP email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email format';
    }

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
    
    if (isLocked) {
      setErrors({ general: `Too many failed attempts. Please wait ${lockTimeRemaining} seconds.` });
      return;
    }

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

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const admin = dbOperations.authenticateAdmin(formData.email, formData.password);

      if (admin) {
        setLoginAttempts(0);
        
        const adminSession = {
          ...admin,
          loginTime: new Date().toISOString(),
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent
        };
        
        localStorage.setItem('adminUser', JSON.stringify(adminSession));
        
        if (formData.rememberMe) {
          localStorage.setItem('rememberedAdminEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedAdminEmail');
        }
        
        db.logs.push({
          id: db.logs.length + 1,
          action: 'Admin Login',
          user: admin.email,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
        
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 500);
        
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
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
      <main className="admin-init-container">  {/* Keep main with className */}
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
      </main>
    );
  }

  return (
    <main className="admin-login-container">  {/* Keep main with className */}
      <div className="admin-login-wrapper">
        
        {/* Left side - Branding */}
        <aside className="admin-login-brand" aria-label="Brand information">
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
                <span className="feature-icon" aria-hidden="true">✓</span>
                <span>Manage Users</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">✓</span>
                <span>Track Rentals</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">✓</span>
                <span>Analytics Dashboard</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">✓</span>
                <span>Mobile Integration</span>
              </div>
            </div>
            <footer className="brand-footer">
              <p>© 2026 QuickSlot USTP</p>
              <p>Version 2.0.0</p>
            </footer>
          </div>
        </aside>

        {/* Right side - Login Form */}
        <section className="admin-login-card" aria-label="Login form">
          <header className="admin-login-header">
            <div className="header-badge">
              <span className="badge-icon" aria-hidden="true">📧</span>
              <span className="badge-text">ADMIN PORTAL</span>
            </div>
            <h2>Welcome Back</h2>
            <p className="admin-subtitle">Sign in to manage your rental system</p>
          </header>

          <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">
                <span className="label-icon" aria-hidden="true">🔒</span>
                Admin Email
              </label>
              <div className={`input-wrapper ${touched.email && errors.email ? 'error' : ''}`}>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="admin@quickslot.ustp.edu.ph"
                  disabled={isLoading || isLocked}
                  autoComplete="email"
                  className={formData.email ? 'filled' : ''}
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {formData.email && !errors.email && (
                  <span className="input-valid" aria-hidden="true">✓</span>
                )}
              </div>
              {touched.email && errors.email && (
                <span id="email-error" className="error-text" role="alert">{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">
                <span className="label-icon" aria-hidden="true">🔑</span>
                Password
              </label>
              <div className={`input-wrapper ${touched.password && errors.password ? 'error' : ''}`}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  disabled={isLoading || isLocked}
                  autoComplete="current-password"
                  className={formData.password ? 'filled' : ''}
                  aria-invalid={touched.password && !!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {touched.password && errors.password && (
                <span id="password-error" className="error-text" role="alert">{errors.password}</span>
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
                  aria-label="Remember me"
                />
                <span className="checkmark" aria-hidden="true"></span>
                <span className="checkbox-label">Remember me</span>
              </label>
              
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={handleForgotPassword}
                disabled={isLoading || isLocked}
                aria-label="Forgot password"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Messages */}
            {errors.general && (
              <div className="error-message" role="alert" aria-live="polite">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <span>{errors.general}</span>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="admin-login-btn"
              disabled={isLoading || isLocked || Object.keys(errors).some(k => k !== 'general')}
              aria-label={isLoading ? "Verifying credentials" : isLocked ? "Account locked" : "Access dashboard"}
            >
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>VERIFYING CREDENTIALS...</span>
                </>
              ) : isLocked ? (
                <>
                  <span className="lock-icon" aria-hidden="true">🔒</span>
                  <span>LOCKED ({lockTimeRemaining}s)</span>
                </>
              ) : (
                <>
                  <span className="btn-icon" aria-hidden="true">→</span>
                  <span>ACCESS DASHBOARD</span>
                </>
              )}
            </button>
          </form>

          <footer className="admin-login-footer">
            <p>⚠️ Authorized personnel only. All activities are logged and monitored.</p>
            <p className="footer-note">For technical support: it-support@quickslot.ustp.edu.ph</p>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default AdminLogin;