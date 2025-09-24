// src/Layout/DashboardLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function DashboardLayout({ onLogout }) {
  const navigate = useNavigate();
  const logoutRef = useRef(null);

  // Header state
  const [showLogout, setShowLogout] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  // Load user info
  useEffect(() => {
    const email = localStorage.getItem("authEmail");
    const name = localStorage.getItem("authName");
    if (email) setUserEmail(email);
    if (name) setUserName(name);
  }, []);

  const getInitial = () =>
    userName ? userName.charAt(0).toUpperCase() : userEmail ? userEmail.charAt(0).toUpperCase() : "M";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");
    localStorage.removeItem("authName");
    onLogout?.();
  };

  // Hide logout dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search setup
  const labelMap = {
    overview: "Overview",
    vendor: "Vendor",
    "spare-parts": "Spare Parts",
    assemble: "Assemble",
    "product/list": "Product List",
    "product/add": "Add Product",
    customer: "Customer",
    "sales-order": "Sales",
    "service-product": "Service Product",
  };
  const searchableItems = Object.keys(labelMap);

  const handleInputFocus = () => {
    if (!searchTerm.trim()) setFilteredSuggestions(searchableItems);
  };

  const handleInputBlur = () => setTimeout(() => setFilteredSuggestions([]), 150);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSuggestions([]);
      return;
    }
    setFilteredSuggestions(
      searchableItems.filter((item) =>
        labelMap[item].toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/${searchTerm.trim()}`);
      setSearchTerm("");
      setFilteredSuggestions([]);
    }
  };

  const handleSuggestionClick = (s) => {
    navigate(`/${s}`);
    setSearchTerm("");
    setFilteredSuggestions([]);
  };

  return (
    <header
      className="p-2 border-bottom bg-white shadow-sm"
      style={{ fontSize: "14px", zIndex: 20, position: "sticky", top: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center gap-3 position-relative">
        {/* Search */}
        <div style={{ position: "relative", width: "320px", minWidth: "280px" }}>
          <Form onSubmit={handleSearchSubmit} autoComplete="off">
            <InputGroup
              size="sm"
              style={{
                backgroundColor: "#F4F4F8",
                borderRadius: "8px",
                border: "1px solid #ced4da",
              }}
            >
              <InputGroup.Text style={{ backgroundColor: "#F4F4F8", border: "none" }}>
                <i className="bi bi-search" style={{ fontSize: "16px", opacity: 0.6 }}></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                style={{
                  border: "none",
                  backgroundColor: "#F4F4F8",
                  boxShadow: "none",
                }}
              />
            </InputGroup>
            {filteredSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  zIndex: 2000,
                  maxHeight: "280px",
                  overflowY: "auto",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  padding: "6px 0",
                }}
              >
                {filteredSuggestions.map((s) => (
                  <div
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    style={{
                      cursor: "pointer",
                      padding: "10px 20px",
                      margin: "0 12px 6px 12px",
                      borderRadius: "6px",
                    }}
                  >
                    {labelMap[s]}
                    <FiChevronRight size={20} style={{ float: "right", opacity: 0.7 }} />
                  </div>
                ))}
              </div>
            )}
          </Form>
        </div>

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
              style={{ zIndex: 2100, minWidth: "110px" }}
            >
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleLogout}
                style={{ fontSize: "13px", padding: "6px 10px" }}
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
