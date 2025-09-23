// src/Layout/DashboardLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

export default function DashboardLayout({ children, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logoutRef = useRef(null);

  // Sidebar state
  const [collapsed, setCollapsed] = useState(false);
  const [testingOpen, setTestingOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  // Header state
  const [showLogout, setShowLogout] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  // Menu definition (same as your Sidebar)
  const menu = {
    home: [{ link: "overview", title: "Overview", icon: ["/Overviiew_G.png", "/squares.png"] }],
    purchase: [
      { link: "vendor", title: "Vendor", icon: ["/VendorG.png", "/Vendor.png"] },
      { link: "spare-parts", title: "Spare Parts", icon: ["/SpareG.png", "/Spare.png"] },
      { link: "assemble", title: "Assemble", icon: ["/AssembleG.png", "/Assemble.png"] },
    ],
    testing: [
      { link: "testing/a", title: "Testing A" },
      { link: "testing/b", title: "Testing B" },
    ],
    product: [
      { link: "product/list", title: "Product List" },
      { link: "product/add", title: "Add Product" },
    ],
    sales: [
      { link: "customer", title: "Customer", icon: ["/CustomerG.png", "/Customer.png"] },
      { link: "sales-order", title: "Sales Order", icon: ["/SalesOrderG.png", "/SalesOrder.png"] },
    ],
    service: [{ link: "service-product", title: "Service Product", icon: ["/ServiceProductG.png", "/ServiceProduct.png"] }],
  };

  const activeColor = "#28a745";

  const isActive = (link) =>
    location.pathname.includes(link) ||
    Object.values(menu).flat().some((item) => item.link === link && location.pathname.includes(link));

  const handleLinkClick = (link) => navigate(`/${link}`);

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
    onLogout();
  };

  // Hide logout dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target)) setShowLogout(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search suggestions
  const labelMap = {
    overview: "Overview",
    vendor: "Vendor",
    "spare-parts": "Spare Parts",
    assemble: "Assemble",
    "testing/a": "Testing A",
    "testing/b": "Testing B",
    "product/list": "Product List",
    "product/add": "Add Product",
    customer: "Customer",
    "sales-order": "Sales Order",
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
      searchableItems.filter((item) => labelMap[item].toLowerCase().includes(searchTerm.toLowerCase()))
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
    <div className="d-flex">
      {/* Sidebar */}
      <aside
        className="d-flex flex-column"
        style={{
          width: collapsed ? "80px" : "260px",
          height: "100vh",
          backgroundColor: "#2E3A59",
          fontFamily: "Product Sans, sans-serif",
          transition: "width 0.3s",
          fontSize: "15px",
        }}
      >
        {/* Logo + Toggle */}
        <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-4">
          <img
            src={collapsed ? "/TZ_Logo.png" : "/logo.png"}
            alt="Logo"
            style={{ width: collapsed ? "40px" : "200px", transition: "width 0.3s" }}
          />
          <button className="btn btn-sm btn-outline-light border-0" onClick={() => setCollapsed(!collapsed)}>
            <i className="bi bi-list" style={{ fontSize: "1.5rem" }}></i>
          </button>
        </div>

        {/* Scrollable Menu */}
        <nav className="small px-3 flex-grow-1" style={{ overflowY: "auto" }}>
          {Object.keys(menu).map((section) => (
            <div key={section} className="mb-2">
              {!collapsed && <div className="sidebar-link-titles text-white mb-1">{section.charAt(0).toUpperCase() + section.slice(1)}</div>}

              {section === "testing" ? (
                <>
                  <button
                    onClick={() => setTestingOpen(!testingOpen)}
                    className="bg-transparent border-0 w-100 text-start p-0 mb-1"
                  >
                    <div
                      className="d-flex align-items-center"
                      style={{ padding: "10px", borderRadius: "8px", backgroundColor: isActive("testing") ? "#278C582E" : "transparent" }}
                    >
                      <img src="/Testing.png" alt="Testing" style={{ width: "18px" }} />
                      {!collapsed && (
                        <>
                          <span className="ms-2" style={{ color: isActive("testing") ? activeColor : "#fff" }}>
                            Testing
                          </span>
                          <span className="ms-auto">{testingOpen ? "▾" : "▸"}</span>
                        </>
                      )}
                    </div>
                  </button>
                  {testingOpen &&
                    !collapsed &&
                    menu.testing.map((item) => (
                      <a
                        key={item.link}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick(item.link);
                        }}
                        className="d-block ms-4 mb-1 text-decoration-none"
                        style={{ color: isActive(item.link) ? activeColor : "#fff" }}
                      >
                        - {item.title}
                      </a>
                    ))}
                </>
              ) : section === "product" ? (
                <>
                  <button
                    onClick={() => setProductOpen(!productOpen)}
                    className="bg-transparent border-0 w-100 text-start p-0 mb-1"
                  >
                    <div
                      className="d-flex align-items-center"
                      style={{ padding: "10px", borderRadius: "8px", backgroundColor: isActive("product") ? "#278C582E" : "transparent" }}
                    >
                      <img src="/Product.png" alt="Product" style={{ width: "18px" }} />
                      {!collapsed && (
                        <>
                          <span className="ms-2" style={{ color: isActive("product") ? activeColor : "#fff" }}>
                            Product
                          </span>
                          <span className="ms-auto">{productOpen ? "▾" : "▸"}</span>
                        </>
                      )}
                    </div>
                  </button>
                  {productOpen &&
                    !collapsed &&
                    menu.product.map((item) => (
                      <a
                        key={item.link}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick(item.link);
                        }}
                        className="d-block ms-4 mb-1 text-decoration-none"
                        style={{ color: isActive(item.link) ? activeColor : "#fff" }}
                      >
                        - {item.title}
                      </a>
                    ))}
                </>
              ) : (
                menu[section].map((item) => (
                  <a
                    key={item.link}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(item.link);
                    }}
                    className="d-flex align-items-center mb-2 text-decoration-none"
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: isActive(item.link) ? "#278C582E" : "transparent",
                      color: isActive(item.link) ? activeColor : "#fff",
                    }}
                  >
                    {item.icon && <img src={item.icon[1]} alt={item.title} style={{ width: "18px" }} />}
                    {!collapsed && <span className="ms-2">{item.title}</span>}
                  </a>
                ))
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: "100vh" }}>
        {/* Header */}
        <header className="p-2 border-bottom" style={{ backgroundColor: "#2E3A590A", fontSize: "14px" }}>
          <div className="d-flex justify-content-between align-items-center gap-3 position-relative">
            {/* Search */}
            <div style={{ position: "relative", width: "320px", minWidth: "280px" }}>
              <Form onSubmit={handleSearchSubmit} autoComplete="off">
                <InputGroup size="sm" style={{ backgroundColor: "#F4F4F8", borderRadius: "8px", border: "1px solid #ced4da" }}>
                  <InputGroup.Text style={{ backgroundColor: "#F4F4F8", border: "none" }}>
                    <img src="/image.png" alt="search" style={{ width: "18px", height: "18px", opacity: 0.7 }} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    style={{ border: "none", backgroundColor: "#F4F4F8", boxShadow: "none" }}
                  />
                </InputGroup>
                {filteredSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      right: 0,
                      zIndex: 1100,
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
                        style={{ cursor: "pointer", padding: "10px 20px", margin: "0 12px 6px 12px", borderRadius: "6px" }}
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
                <div style={{ fontWeight: 400, color: "#5f6368", fontSize: "12px" }}>{userEmail}</div>
              </div>

              <div
                className="rounded-circle d-flex justify-content-center align-items-center"
                style={{ width: "36px", height: "36px", cursor: "pointer", backgroundColor: "#2E3A59", color: "#4ade80", fontWeight: "bold", fontSize: "18px" }}
                onClick={() => setShowLogout((prev) => !prev)}
              >
                {getInitial()}
              </div>

              {showLogout && (
                <div className="position-absolute top-100 end-0 mt-2 bg-white border shadow-sm p-2 rounded" style={{ zIndex: 10, minWidth: "110px" }}>
                  <Button variant="outline-danger" size="sm" onClick={handleLogout} style={{ fontSize: "13px", padding: "6px 10px" }}>
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow-1 p-3" style={{ backgroundColor: "#f8f9fa" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
