import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";


export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation(); // <-- get current path

  const menu = {
    // home: [{ link: "overview", title: "Overview", icon: ["/Overviiew_G.png", "/squares.png"] }],
    purchase: [
      { link: "vendor", title: "Vendor", icon: ["/VendorG.png", "/Vendor.png"] },
      { link: "spare-parts", title: "Spare Parts", icon: ["/Purchase Order.png", "/Purchase Order 1.png"] },
      { link: "spare-partsPurchase", title: "Spare Parts Purchase", icon: ["/Purchase Order.png", "/Purchase Order 1.png"] },
      { link: "spare-parts-by-series", title: "Spare Parts Requirements Calculation", icon: ["/Purchase Order.png", "/Purchase Order 1.png"] }, // <-- New link
    ],

    inventory: [
      { link: "product", title: "Product", icon: ["/Product.png", "/Product.png"] },
      { link: "product-type", title: "Product Type", icon: ["/Product.png", "/Product.png"] },
      { link: "technician", title: "Technician", icon: ["/Product.png", "/Product.png"] },

      { link: "assemble", title: "Assemble", icon: ["/Product.png", "/Product.png"] },
    ],

    sales: [
      { link: "customer", title: "Customer", icon: ["/CustomerG.png", "/Customer.png"] },
      { link: "sales-order", title: "Sales", icon: ["/Sale 1.png", "/Sale 1.png"] },
    ],
   service: [
  { link: "service-product", title: "Service Product", icon: ["/Service VCI.png", "/Service VCI.png"] },
  { link: "service-items", title: "Service Items", icon: ["/Service VCI.png", "/Service VCI.png"] } // <-- new
],

    tracking: [{ link: "tracking", title: "Tracking", icon: ["/track.png", "/track.png"] }],
  };

  const handleLinkClick = (link) => navigate(`/${link}`);

  const isActive = (link) => {
    // Highlight if the current path includes the base link
    return location.pathname === `/${link}` || location.pathname.startsWith(`/${link}/`);
  };
  const linkStyle = {
    backgroundColor: "transparent",
    borderRadius: "8px",
    padding: "12px",
    textDecoration: "none",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
  };

  const linkSpanStyle = {
    color: "#fff",
    marginLeft: "10px",
    fontSize: "15px",
    fontWeight: 500,
    whiteSpace: "nowrap",
  };

  const iconStyle = {
    width: "18px",
    height: "18px",
    filter: "invert(94%) sepia(0%) saturate(0%) hue-rotate(200deg) brightness(100%) contrast(100%)"
  };



  const subLinkStyle = {
    color: "#fff",
    display: "block",
    paddingLeft: "24px",
    paddingTop: "4px",
    paddingBottom: "4px",
    textDecoration: "none",
  };

  return (
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
      {/* Logo */}
      <div className="d-flex justify-content-center pt-3 pb-4 flex-shrink-0">
        <img
          src={collapsed ? "/TZ_Logo.png" : "/logo.png"}
          alt="Logo"
          className="img-fluid"
          style={{ width: collapsed ? "40px" : "210px", transition: "width 0.3s" }}
        />
      </div>

      {/* Scrollable nav */}
      <nav
        className="small px-2 flex-grow-1"
        style={{
          height: "100%",
          overflowY: "auto",
          paddingBottom: "1rem",
          scrollbarWidth: "thin",        // for Firefox
          scrollbarColor: "#888 transparent", // Firefox colors
        }}
      >
        <style>
          {`
      /* Webkit-based browsers */
      nav::-webkit-scrollbar {
        width: 2px;
      }
      nav::-webkit-scrollbar-track {
        background: transparent;
      }
      .menu .submenu {
        padding-left: 30px;  /* Indent to look like a child */
        font-size: 14px;
        opacity: 0.85;
      }
      nav::-webkit-scrollbar-thumb {
        background-color: #888;
        border-radius: 2px;
        border: 1px solid transparent;
        background-clip: content-box;
      }
      nav::-webkit-scrollbar-thumb:hover {
        background-color: #555;
      }
        .active-link {
          background-color: #1abc9c; /* green highlight */
          border-radius: 8px;
      }
    `}
        </style>

        {/* Home
        <div className="mb-1 sidebar-link-titles">{!collapsed && "Home"}</div>
        {menu.home.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${location.pathname.startsWith(`/${item.link}`) ? "active-link" : ""
              }`}
          >
            <img src={item.icon ? item.icon[1] : ""} alt={item.title} style={iconStyle} />
            {!collapsed && <span>{item.title}</span>}
          </a>
        ))} */}

        {/* Purchase */}
        <div className="sidebar-link-titles">{!collapsed && "Purchase"}</div>
        {menu.purchase.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${location.pathname === `/${item.link}` ||
              location.pathname.startsWith(`/${item.link}/`)
              ? "active-link"
              : ""
              }`}>
            {item.icon && <img src={item.icon[1]} alt={item.title} style={iconStyle} />}
            {!collapsed && <span >{item.title}</span>}
          </a>
        ))}

        {/* Inventory */}
        <div className="sidebar-link-titles">{!collapsed && "Inventory"}</div>
        {menu.inventory.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${location.pathname === `/${item.link}` ||
              location.pathname.startsWith(`/${item.link}/`)
              ? "active-link"
              : ""
              }`}>
            {item.icon && <img src={item.icon[1]} alt={item.title} style={iconStyle} />}
            {!collapsed && <span >{item.title}</span>}
          </a>
        ))}

        {/* Sales */}
        <div className="sidebar-link-titles">{!collapsed && "Sales"}</div>
        {menu.sales.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${location.pathname === `/${item.link}` ||
              location.pathname.startsWith(`/${item.link}/`)
              ? "active-link"
              : ""
              }`}>
            {item.icon && <img src={item.icon[1]} alt={item.title} style={iconStyle} />}
            {!collapsed && <span >{item.title}</span>}
          </a>
        ))}

        {/* Service */}
        <div className="sidebar-link-titles">{!collapsed && "Service"}</div>
        {menu.service.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${location.pathname === `/${item.link}` ||
              location.pathname.startsWith(`/${item.link}/`)
              ? "active-link"
              : ""
              }`}>
            {item.icon && <img src={item.icon[1]} alt={item.title} style={iconStyle} />}
            {!collapsed && <span >{item.title}</span>}
          </a>
        ))}
        {menu.tracking.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${location.pathname === `/${item.link}` ||
              location.pathname.startsWith(`/${item.link}/`)
              ? "active-link"
              : ""
              }`}>
            {item.icon && <img src={item.icon[1]} alt={item.title} style={iconStyle} />}
            {!collapsed && <span>{item.title}</span>}
          </a>
        ))}
      </nav>


    </aside>
  );
}
