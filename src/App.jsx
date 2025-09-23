// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layout & Auth
import LoginPage from "./Pages/LoginPage";    
import AppLayout from "./Layout/AppLayout";

// Pages
import Overview from "./Overview/Overview";
import ComponentsPage from "./Pages/ComponentsPage";  
import SalesListPage from "./Pages/SalesListPage";
import AddSalesPage from "./Pages/AddSalesPage";
import AddProductPage from "./Pages/AddProductPage";
import EditSalesPage from "./Pages/EditSalesPage";
import ServiceList from "./Pages/ServiceList";
import AddServicePage from "./Pages/AddServicePage";
import EditService from "./Pages/EditService";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("authToken"));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("authToken"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");
    localStorage.removeItem("authName");
    setIsLoggedIn(false);
    window.location.href = "/login"; 
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <Routes>
        {/* Login route */}
        <Route
          path="/login"
          element={
            isLoggedIn ? <Navigate to="/overview" replace /> : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            isLoggedIn ? <AppLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />
          }
        >
          {/* Default redirect */}
          <Route index element={<Navigate to="overview" replace />} />

          {/* Pages */}
          <Route path="overview" element={<Overview />} />
          <Route path="sales-order" element={<SalesListPage />} />
          <Route path="sales/add" element={<AddSalesPage />} />
          <Route path="sales/edit/:id" element={<EditSalesPage />} />
          <Route path="add-product" element={<AddProductPage />} />
          {/* <Route path="product/edit/:id" element={<AddProductPage />} /> */}
          <Route path="service-product" element={<ServiceList />} />
          <Route path="service/add" element={<AddServicePage />} />
          <Route path="service/:id/edit" element={<EditService />} />
          <Route path="components" element={<ComponentsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
