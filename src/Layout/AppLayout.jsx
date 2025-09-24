// src/Layout/AppLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import DashboardLayout from "./DashboardLayout"; // your top navbar

export default function AppLayout({ onLogout }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  // Collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      setAutoCollapsed(window.innerWidth < 992);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isCollapsed = autoCollapsed && !hovered;

  return (
    <div
      className="d-flex"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      {/* Sidebar */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: isCollapsed ? "80px" : "260px",
          flexShrink: 0,
          transition: "width 0.3s",
          backgroundColor: "#2E3A59",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Sidebar collapsed={isCollapsed} />
      </div>

      {/* Main Section */}
      <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
        {/* Top Navbar/Header */}
        <DashboardLayout onLogout={handleLogout} />

        {/* Page Content */}
        <div
          className="flex-grow-1 overflow-auto"
          style={{
            backgroundColor: "#f8f9fa",
            padding: "16px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
