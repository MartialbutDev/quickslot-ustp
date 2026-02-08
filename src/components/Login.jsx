import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  // Mock user data for demonstration
  const mockUsers = [
    { email: 'student@ustp.edu.ph', password: 'password123', name: 'John Doe', role: 'student' },
    { email: 'faculty@ustp.edu.ph', password: 'faculty123', name: 'Dr. Jane Smith', role: 'faculty' },
    { email: 'staff@ustp.edu.ph', password: 'staff123', name: 'Mark Johnson', role: 'staff' },
  ];

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate email format
    if (!formData.email.endsWith('@ustp.edu.ph')) {
      setError('Please use your official USTP email address');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    // Check mock credentials
    const user = mockUsers.find(
      user => user.email === formData.email && user.password === formData.password
    );

    if (user) {
      // Simulate successful login
      console.log('Login successful:', user);
      alert(`Welcome back, ${user.name}! Redirecting to dashboard...`);
      
      // In a real app, you would:
      // 1. Set authentication token
      // 2. Redirect to dashboard
      // 3. Update global state
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        rememberMe: false,
      });
    } else {
      setError('Invalid email or password. Please try again.');
    }

    setIsLoading(false);
  };

  const handleForgotPassword = () => {
    alert('Password reset link will be sent to your USTP email. Please check your inbox.');
  };

  const handleDemoLogin = (role) => {
    const demoUser = mockUsers.find(user => user.role === role);
    if (demoUser) {
      setFormData({
        email: demoUser.email,
        password: demoUser.password,
        rememberMe: false,
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>QuickSlot USTP</h1>
        <p className="subtitle">CAMPUS - VERIFIED GADGET RENTAL</p>
      </div>

      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="login-subtitle">Sign in to your campus account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">USTP EMAIL</label>
            <div className="input-with-icon">
              <i className="icon-email">✉️</i>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@ustp.edu.ph"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD</label>
            <div className="input-with-icon">
              <i className="icon-password">🔒</i>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-options">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <button
              type="button"
              className="forgot-password"
              onClick={handleForgotPassword}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading || !formData.email || !formData.password}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                SIGNING IN...
              </>
            ) : (
              'LOG IN'
            )}
          </button>
        </form>

        <div className="demo-login-section">
          <p className="demo-title">Quick Demo Logins:</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn student"
              onClick={() => handleDemoLogin('student')}
              disabled={isLoading}
            >
              Student Account
            </button>
            <button
              type="button"
              className="demo-btn faculty"
              onClick={() => handleDemoLogin('faculty')}
              disabled={isLoading}
            >
              Faculty Account
            </button>
            <button
              type="button"
              className="demo-btn staff"
              onClick={() => handleDemoLogin('staff')}
              disabled={isLoading}
            >
              Staff Account
            </button>
          </div>
        </div>

        <div className="register-link">
          Don't have an account? 
          <a href="/register" className="register-btn">
            Register Now
          </a>
        </div>

        <div className="security-info">
          <div className="security-item">
            <span className="security-icon">🔐</span>
            <span>SSL Secured Connection</span>
          </div>
          <div className="security-item">
            <span className="security-icon">🏛️</span>
            <span>CDO Campus Only</span>
          </div>
        </div>
      </div>

      <footer className="login-footer">
        <p>© 2024 QuickSlot USTP. For University Project Purposes Only.</p>
        <p className="footer-note">
          Need help? Contact Campus IT Support at <strong>it-support@ustp.edu.ph</strong>
        </p>
      </footer>
    </div>
  );
};

export default Login;