import React, { useState } from 'react';
import { colleges } from '../data';
import './Registration.css';

const Registration = () => {
  const [userType, setUserType] = useState('student');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed) {
      alert('Please agree to the campus safety rules');
      return;
    }
    
    // Simulate registration
    const userData = {
      userType,
      idNumber,
      email,
      college: selectedCollege,
      verified: true
    };
    
    console.log('Registration data:', userData);
    alert('Identity verification submitted! Check your USTP email for confirmation.');
  };

  return (
    <div className="registration-container">
      <header className="registration-header">
        <h1>QuickSlot USTP</h1>
        <p className="subtitle">CAMPUS - VERIFIED GADGET RENTAL</p>
      </header>

      <div className="registration-card">
        <h2>Identity Verification</h2>
        <p className="description">Create your secure campus account to start renting.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label>I am a:</label>
            <div className="user-type-options">
              {['student', 'faculty', 'staff'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`type-btn ${userType === type ? 'active' : ''}`}
                  onClick={() => setUserType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="idNumber">USTP Student/Staff ID Number</label>
            <input
              type="text"
              id="idNumber"
              placeholder="XXXX-XXXXXXX"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              pattern="\d{4}-\d{7}"
              required
            />
            <small>Example: 2023-0001234</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">University Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="name@ustp.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="college">College / Department</label>
            <select
              id="college"
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              required
            >
              <option value="">Select your College</option>
              {colleges.map((college, index) => (
                <option key={index} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="agreement">
              I agree to the <strong>USTP Campus Safety Rules and gadget handling policies</strong>.
            </label>
          </div>

          <button type="submit" className="submit-btn">
            VERIFY IDENTITY & REGISTER
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="#login">Login here</a>
        </div>
      </div>

      <footer className="registration-footer">
        <p>© 2024 QuickSlot USTP. For University Project Purposes Only.</p>
        <div className="footer-details">
          <span>SSL Secured</span>
          <span>•</span>
          <span>CDO Campus</span>
        </div>
      </footer>
    </div>
  );
};

export default Registration;