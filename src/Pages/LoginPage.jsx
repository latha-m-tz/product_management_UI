import React, { useEffect, useState } from 'react';
import { Form, Button, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../api';

export default function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const [showModal, setShowModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotData, setForgotData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('authToken')) {
      navigate('/batch', { replace: true });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/login`, formData);
      localStorage.setItem('authToken', res.data.data.token);
      localStorage.setItem('authEmail', formData.email);
      localStorage.setItem('authName', res.data.data.user.name);

      onLogin();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login Failed' );
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/forgot-password`, {
        email: forgotData.email
      });
      toast.success('OTP sent to your email');
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/verify-otp`, {
        email: forgotData.email,
        otp: forgotData.otp
      });
      toast.success('OTP verified');
      setForgotStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (forgotData.password !== forgotData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/reset-password`, {
        email: forgotData.email,
        password: forgotData.password,
        password_confirmation: forgotData.confirmPassword
      });
      toast.success('Password reset successfully');
      setShowModal(false);
      setForgotStep(1);
      setForgotData({ email: '', otp: '', password: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 vw-100 bg-light">
      <div className="d-flex flex-row shadow w-100 h-100" style={{ maxWidth: '100%', maxHeight: '100%' }}>
        {/* Left Side */}
        <div
          className="d-none d-md-flex flex-column justify-content-start align-items-start text-white"
          style={{
            backgroundColor: '#0E1239',
            width: '50%',
            height: '100%',
            padding: '50px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <img src="/logo.png" alt="Logo" style={{ width: '360px', marginBottom: '20px' }} />
          <div className="w-100 d-flex justify-content-center align-items-center flex-grow-1">
            <img
              src="/side-image.png"
              alt="Illustration"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Right Side */}
        <div
          className="bg-white d-flex justify-content-center align-items-start"
          style={{ width: '50%', height: '100%', padding: '100px' }}
        >
          <div style={{ width: '700px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h2 className="fw-bold mb-2">Welcome Back</h2>
              <p className="text-muted mb-4">Login to continue using the website</p>
            </div>

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Label className="fw-bold">Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter Email"
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
              <div className="position-relative">
                <Form.Label className="fw-bold">Password</Form.Label>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="pe-5 rounded-0"
                />
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    top: "74%",
                    right: "10px",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    color: "#00000080",   // <-- changed color
                    zIndex: 10,
                  }}
                ></i>
              </div>

              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <Form.Check type="checkbox" label="Remember Me" />
                <Button variant="link" className="p-0 text-decoration-none" style={{color:"#278C58"}} onClick={() => setShowModal(true)}>
                  Forgot Password?
                </Button>
              </div>

              <Button variant="success" type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : 'Login'}
              </Button>
            </Form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {forgotStep === 1 && 'Forgot Password'}
            {forgotStep === 2 && 'Enter OTP'}
            {forgotStep === 3 && 'Reset Password'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {forgotStep === 1 && (
            <>
              <Form.Group controlId="forgotEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  required
                  value={forgotData.email}
                  onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                />
              </Form.Group>
              <Button variant="primary" className="mt-3 w-100" onClick={handleSendOtp} disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          )}

          {forgotStep === 2 && (
            <>
              <Form.Group controlId="otp">
                <Form.Label>OTP</Form.Label>
                <Form.Control
                  type="text"
                  value={forgotData.otp}
                  onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value })}
                />
              </Form.Group>
              <Button variant="success" className="mt-3 w-100" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </>
          )}

          {forgotStep === 3 && (
            <>
              <Form.Group controlId="newPass">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={forgotData.password}
                  onChange={(e) => setForgotData({ ...forgotData, password: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="confirmPass" className="mt-2">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  value={forgotData.confirmPassword}
                  onChange={(e) => setForgotData({ ...forgotData, confirmPassword: e.target.value })}
                />
              </Form.Group>
              <Button variant="success" className="mt-3 w-100" onClick={handleResetPassword} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}