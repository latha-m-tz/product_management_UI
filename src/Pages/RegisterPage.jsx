import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import 'react-toastify/dist/ReactToastify.css';

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    // Optional: auto-close toast config
    const toastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light", // or "white"
};


    const handleRegister = async (e) => {
        e.preventDefault();

        let newErrors = {};
        let messages = [];

        if (!formData.username) {
            newErrors.username = "Name is required!";
            // messages.push("Name is required!");
        }
        if (!formData.email) {
            newErrors.email = "Email is required!";
            // messages.push("Email is required!");
        }
        if (!formData.password) {
            newErrors.password = "Password is required!";
            // messages.push("Password is required!");
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match!";
            messages.push("Passwords do not match!");
        }

        setErrors(newErrors);

        // Show all errors as toast
        if (messages.length > 0) {
            messages.forEach(msg => toast.error(msg, toastOptions));
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${API_BASE_URL}/register`, {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
            });

            // Success toast
            toast.success("Registration successful! Redirecting to login...", toastOptions);

            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors?.email) {
                toast.error(err.response.data.errors.email[0] || "Email already taken", toastOptions);
            } else {
                toast.error(err.response?.data?.message || "Registration failed", toastOptions);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 vw-100 bg-light">
            {/* Toast container inside this component */}
            <ToastContainer />

            <div className="d-flex flex-row shadow w-100 h-100" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                {/* Left Side */}
                <div
                    className="d-none d-md-flex flex-column justify-content-start align-items-start text-white"
                    style={{
                        backgroundColor: '#0E1239',
                        width: '50%',
                        height: '100%',
                        padding: '50px',
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
                            <h2 className="fw-bold mb-2">Create Account</h2>
                            <p className="text-muted mb-4">Register to start using the website</p>
                        </div>

                        <Form noValidate onSubmit={handleRegister}>
                            {/* Username */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter your name"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    isInvalid={!!errors.username}
                                />
                                {errors.username && <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>}
                            </Form.Group>

                            {/* Email */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    isInvalid={!!errors.email}
                                />
                                {errors.email && <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>}
                            </Form.Group>

                            {/* Password */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Password</Form.Label>
                                <div className="position-relative">
                                    <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        isInvalid={!!errors.password}
                                    />
                                    <i
                                        className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            right: '10px',
                                            transform: 'translateY(-50%)',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            color: '#00000080',
                                            zIndex: 10,
                                        }}
                                    ></i>
                                </div>
                                {errors.password && <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>}
                            </Form.Group>

                            {/* Confirm Password */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Confirm Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Confirm password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    isInvalid={!!errors.confirmPassword}
                                />
                                {errors.confirmPassword && <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>}
                            </Form.Group>

                            {/* Submit */}
                            <Button variant="success" type="submit" className="w-100" disabled={loading}>
                                {loading ? <Spinner size="sm" animation="border" /> : "Register"}
                            </Button>
                            <div className="text-center mt-3">
                                <span className="text-muted me-1">Already have an account?</span>
                                <Button
                                    variant="link"
                                    className="p-0"
                                    style={{ color: "#278C58" }}
                                    onClick={() => navigate('/login')}
                                >
                                    Login
                                </Button>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}
