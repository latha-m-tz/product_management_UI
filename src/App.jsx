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
import AddVendor from "./Pages/AddVendor";
import EditVendor from "./Pages/EditVendor";
import ViewVendor from "./Pages/ViewVendor";
import VendorPage from "./Pages/VendorPage";
import CustomerPage from "./Pages/CustomerPage";
import AddCustomer from "./Pages/AddCustomer";
import EditCustomer from "./Pages/EditCustomer";
import ViewCustomer from "./Pages/ViewCustomer";
import Spareparts from "./Pages/Spareparts";
import SparepartPurchase from "./Pages/SparepartPurchase";
import AddSparepartPurchase from "./Pages/AddSparepartPurchase";
import EditSparepartPurchase from "./Pages/EditSparepartPurchase";
import ProductPage from "./Pages/ProductPage";
import ProductTypePage from "./Pages/ProductTypePage";
import AddAssemblePage from "./Pages/AddAssemblePage";
import QrScannerPage from "./Pages/QrScannerPage";
import AssemblePage from "./Pages/AssemblePage";
import EditAssemblePage from "./Pages/EditAssemblePage";
import InventoryDetailsPage from "./Pages/InventoryDetailsPage";
import TrackingPage from "./Pages/TrackingPage";
import PurchaseViewPage from "./Pages/PurchaseViewPage";

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
          <Route path="vendor" element={<VendorPage />} />
          <Route path="vendor/add" element={<AddVendor />} />
          <Route path="vendor/edit/:id" element={<EditVendor />} />
          <Route path="/vendors/view/:id" element={<ViewVendor />} />
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="/customer/add" element={<AddCustomer />} />
          <Route path="/customer/:id/edit" element={<EditCustomer />} />
          <Route path="/customer/:id" element={<ViewCustomer />} />
          <Route path="/spare-parts" element={<Spareparts />} />
          <Route path="/spare-partsPurchase" element={<SparepartPurchase />} />
          <Route path="/spare-partsPurchase/add" element={<AddSparepartPurchase />} />
          <Route path="/spare-partsPurchase/:id" element={<EditSparepartPurchase />} />
                      <Route path="/spare-partsPurchase/view/:id" element={<PurchaseViewPage />}/>

          <Route path="product" element={<ProductPage />} />
          <Route path="product-type" element={<ProductTypePage />} />
          <Route path="add-assemble" element={<AddAssemblePage />} />
          <Route path="qr-scanner" element={<QrScannerPage />} />
          <Route path="assemble" element={<AssemblePage />} />
          <Route path="/inventory/edit/:fromSerial/:toSerial" element={<EditAssemblePage />} />
          <Route path="/inventory/:range" element={<InventoryDetailsPage />} />
<Route path="/tracking" element={<TrackingPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

