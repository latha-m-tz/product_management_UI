import React, { useEffect, useState } from 'react';
import { Form, Button, Modal, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../api';

export default function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showModal, setShowModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotData, setForgotData] = useState({ email: '', otp: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  };

  // useEffect(() => {
  //   const token = localStorage.getItem('authToken');
  //   if (token) {
  //     setTimeout(() => {
  //       navigate('/overview', { replace: true });
  //     }, 500); 
  //   }
  // }, []);
  const handleLogin = async (e) => {
    e.preventDefault();

    let hasError = false;
    if (!formData.email) {
      toast.error("Email is required!", toastOptions);
      hasError = true;
    }
    if (!formData.password) {
      toast.error("Password is required!", toastOptions);
      hasError = true;
    }
    if (hasError) return;

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/login`, formData);

      localStorage.setItem('authToken', res.data.data.token);
      localStorage.setItem('authEmail', res.data.data.user.email);
      localStorage.setItem('authName', res.data.data.user.username);

      toast.success("Login successful!", toastOptions);

      // Wait for toast to display before navigating
      setTimeout(() => {
        onLogin?.();
        navigate('/overview', { replace: true });
      }, 800); // 0.8 seconds
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed', toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!forgotData.email) {
      toast.error("Email is required!", toastOptions);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/forgot-password`, { email: forgotData.email });
      if (res.data.status === "success") {
        toast.success("OTP sent to your email", toastOptions);
        setForgotStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending OTP", toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!forgotData.otp) {
      toast.error("OTP is required!", toastOptions);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/verify-otp`, { email: forgotData.email, otp: forgotData.otp });
      if (res.data.status === "success") {
        toast.success("OTP verified", toastOptions);
        setForgotStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed", toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotData.password || !forgotData.confirmPassword) {
      toast.error("Both password fields are required!", toastOptions);
      return;
    }
    if (forgotData.password !== forgotData.confirmPassword) {
      toast.error("Passwords do not match!", toastOptions);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/reset-password`, {
        email: forgotData.email,
        password: forgotData.password,
        password_confirmation: forgotData.confirmPassword,
      });
      if (res.data.status === "success") {
        toast.success("Password reset successfully", toastOptions);
        setShowModal(false);
        setForgotStep(1);
        setForgotData({ email: '', otp: '', password: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed", toastOptions);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 vw-100 bg-light">
      <ToastContainer />
      <div className="d-flex flex-row shadow w-100 h-100" style={{ maxWidth: '100%', maxHeight: '100%' }}>
        {/* Left Side */}
        <div className="d-none d-md-flex flex-column justify-content-start align-items-start text-white"
          style={{ backgroundColor: '#0E1239', width: '50%', height: '100%', padding: '50px', position: 'relative', overflow: 'hidden' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '360px', marginBottom: '20px' }} />
          <div className="w-100 d-flex justify-content-center align-items-center flex-grow-1">
            <img src="/side-image.png" alt="Illustration" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Right Side */}
        <div className="bg-white d-flex justify-content-center align-items-start" style={{ width: '50%', height: '100%', padding: '100px' }}>
          <div style={{ width: '700px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h2 className="fw-bold mb-2">Welcome Back</h2>
              <p className="text-muted mb-4">Login to continue using the website</p>
            </div>

            <Form noValidate onSubmit={handleLogin}>
              {/* Email */}
              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Label className="fw-bold">Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter Email"
                />
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-3" controlId="formPassword">
                <div className="position-relative">
                  <Form.Label className="fw-bold">Password</Form.Label>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", top: "74%", right: "10px", transform: "translateY(-50%)", cursor: "pointer", fontSize: "1.2rem", color: "#00000080", zIndex: 10 }}
                  ></i>
                </div>
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <Button variant="link" className="p-0 text-decoration-none" style={{ color: "#278C58" }}
                  onClick={() => setShowModal(true)}>Forgot Password?</Button>
              </div>

              <Button variant="success" type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : "Login"}
              </Button>
              <div className="text-center mt-3">
                <span className="text-muted me-1">Don't have an account?</span>
                <Button variant="link" className="p-0" style={{ color: "#278C58" }} onClick={() => navigate("/register")}>Register</Button>
              </div>
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
