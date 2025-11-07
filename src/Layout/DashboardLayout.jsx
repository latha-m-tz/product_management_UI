import React, { useState, useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function DashboardLayout({ onLogout }) {
  const navigate = useNavigate();
  const logoutRef = useRef(null);

  // Header state
  const [showLogout, setShowLogout] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("authEmail");
    const name = localStorage.getItem("authName");
    if (email) setUserEmail(email);
    if (name) setUserName(name);
  }, []);

  const getInitial = () =>
    userName
      ? userName.charAt(0).toUpperCase()
      : userEmail
      ? userEmail.charAt(0).toUpperCase()
      : "U";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");
    localStorage.removeItem("authName");
    onLogout?.();
    navigate("/login");
  };

  // Close logout dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="p-2 border-bottom bg-white shadow-sm"
      style={{
        fontSize: "14px",
        zIndex: 20,
        position: "sticky",
        top: 0,
      }}
    >
      <div className="d-flex justify-content-end align-items-center gap-3 position-relative">
        {/* User Info */}
        <div className="d-flex align-items-center gap-2 position-relative" ref={logoutRef}>
          <div className="text-end">
            <div className="fw-bold">{userName || "User"}</div>
            <div style={{ fontWeight: 400, color: "#5f6368", fontSize: "12px" }}>
              {userEmail}
            </div>
          </div>

          <div
            className="rounded-circle d-flex justify-content-center align-items-center"
            style={{
              width: "36px",
              height: "36px",
              cursor: "pointer",
              backgroundColor: "#2E3A59",
              color: "#4ade80",
              fontWeight: "bold",
              fontSize: "18px",
            }}
            onClick={() => setShowLogout((prev) => !prev)}
          >
            {getInitial()}
          </div>

          {showLogout && (
            <div
              className="position-absolute top-100 end-0 mt-2 bg-white border shadow-sm p-2 rounded"
              style={{ zIndex: 2100, minWidth: "80px" }}
            >
              <Button
                variant="outline-danger"
                onClick={handleLogout}
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  width: "100%",
                  fontWeight: "400",
                  borderRadius: "4px",
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
