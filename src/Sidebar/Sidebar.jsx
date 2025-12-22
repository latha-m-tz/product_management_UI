import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = {
    purchase: [
      { link: "vendor", title: "Vendor", icon: ["/VendorG.png", "/Vendor.png"] },
      {
        link: "spare-parts",
        title: "Components",
        icon: ["/Spare-parts.png", "/Spare-parts.png"],
      },
      {
        link: "spare-partsPurchase",
        title: "Spare Parts Purchase",
        icon: ["/Purchase Order.png", "/Purchase Order 1.png"],
      },
      { link: "product", title: "Product", icon: ["/Product.png", "/Product.png"] },
      {
        link: "spare-parts-by-series",
        title: "Spare Parts Requirements Calculation",
        icon: ["/calculation.png", "/calculation.png"],
      },
    ],

    inventory: [
      { link: "assemble", title: "Assemble", icon: ["/puzzle.png", "/puzzle.png"] },
    ],

    sales: [
      { link: "customer", title: "Customer", icon: ["/CustomerG.png", "/Customer.png"] },
      { link: "sales-order", title: "Sales", icon: ["/Sale 1.png", "/Sale 1.png"] },
    ],

    service: [
      {
        link: "service-product",
        title: "Service Product",
        icon: ["/Service VCI.png", "/Service VCI.png"],
      },
    ],

    tracking: [{ link: "tracking", title: "Tracking", icon: ["/track.png", "/track.png"] }],
  };

  const handleLinkClick = (link) => navigate(`/${link}`);

  const isActive = (link) =>
    location.pathname === `/${link}` || location.pathname.startsWith(`/${link}/`);

  const iconStyle = {
    width: "22px",
    height: "22px",
    objectFit: "contain",
    filter: "brightness(0) invert(1)",
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

      {/* Scrollable menu */}
      <nav
        className="small px-2 flex-grow-1"
        style={{
          height: "100%",
          overflowY: "auto",
          paddingBottom: "1rem",
          scrollbarWidth: "thin",
          scrollbarColor: "#888 transparent",
        }}
      >
        <style>
          {`
            nav::-webkit-scrollbar { width: 2px; }
            nav::-webkit-scrollbar-track { background: transparent; }
             .menu .submenu {
              padding-left: 30px;
              font-size: 14px;
              opacity: 0.85;
            nav::-webkit-scrollbar-thumb {
              background-color: #888;
              border-radius: 2px;
                            border: 1px solid transparent;
              background-clip: content-box;

            }
            nav::-webkit-scrollbar-thumb:hover { background-color: #555; }

            .active-link {
              background-color: #1abc9c;
              border-radius: 8px;
            }
          `}
        </style>

        {/* HOME / OVERVIEW */}
        {!collapsed && (
          <div
            style={{
              marginTop: "6px",
              marginBottom: "10px",
              color: "#AEB7C4",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Home
          </div>
        )}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick("overview");
          }}
          className={`sidebar-link ${isActive("overview") ? "active-link" : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px",
            marginBottom: "6px",
            borderRadius: "8px",
            textDecoration: "none",
            backgroundColor: isActive("overview") ? "#278C582E" : "transparent",
          }}
        >
          <img
            src="/squares.png"     // Always use same icon
            alt="Overview"
            style={{
              width: "22px",
              height: "22px",
              filter: "brightness(0) invert(1)",  // Always WHITE
            }}
          />

          {!collapsed && (
            <span style={{ marginLeft: "12px", color: "white", fontWeight: 500 }}>
              Overview
            </span>
          )}
        </a>


        {/* PURCHASE */}
        {!collapsed && (
          <div
            style={{
              marginTop: "20px",
              marginBottom: "10px",
              color: "#AEB7C4",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Purchase
          </div>
        )}

        {menu.purchase.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${isActive(item.link) ? "active-link" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              marginBottom: "6px",
              borderRadius: "8px",
              backgroundColor: isActive(item.link) ? "#278C582E" : "transparent",
              textDecoration: "none",
            }}
          >
            <img src={item.icon[1]} alt={item.title} style={iconStyle} />

            {!collapsed && (
              <span style={{ marginLeft: "12px", color: "white", fontWeight: 500 }}>
                {item.title}
              </span>
            )}
          </a>
        ))}

        {/* INVENTORY */}
        {!collapsed && (
          <div
            style={{
              marginTop: "20px",
              marginBottom: "10px",
              color: "#AEB7C4",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Inventory
          </div>
        )}

        {menu.inventory.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${isActive(item.link) ? "active-link" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              marginBottom: "6px",
              borderRadius: "8px",
              backgroundColor: isActive(item.link) ? "#278C582E" : "transparent",
              textDecoration: "none",
            }}
          >
            <img src={item.icon[1]} alt={item.title} style={iconStyle} />

            {!collapsed && (
              <span style={{ marginLeft: "12px", color: "white", fontWeight: 500 }}>
                {item.title}
              </span>
            )}
          </a>
        ))}

        {/* SALES */}
        {!collapsed && (
          <div
            style={{
              marginTop: "20px",
              marginBottom: "10px",
              color: "#AEB7C4",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Sales
          </div>
        )}

        {menu.sales.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${isActive(item.link) ? "active-link" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              marginBottom: "6px",
              borderRadius: "8px",
              backgroundColor: isActive(item.link) ? "#278C582E" : "transparent",
              textDecoration: "none",
            }}
          >
            <img src={item.icon[1]} alt={item.title} style={iconStyle} />

            {!collapsed && (
              <span style={{ marginLeft: "12px", color: "white", fontWeight: 500 }}>
                {item.title}
              </span>
            )}
          </a>
        ))}

        {/* SERVICE */}
        {!collapsed && (
          <div
            style={{
              marginTop: "20px",
              marginBottom: "10px",
              color: "#AEB7C4",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Service
          </div>
        )}

        {menu.service.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${isActive(item.link) ? "active-link" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              marginBottom: "6px",
              borderRadius: "8px",
              backgroundColor: isActive(item.link) ? "#278C582E" : "transparent",
              textDecoration: "none",
            }}
          >
            <img src={item.icon[1]} alt={item.title} style={iconStyle} />

            {!collapsed && (
              <span style={{ marginLeft: "12px", color: "white", fontWeight: 500 }}>
                {item.title}
              </span>
            )}
          </a>
        ))}

        {/* TRACKING */}
        {!collapsed && (
          <div
            style={{
              marginTop: "20px",
              marginBottom: "10px",
              color: "#AEB7C4",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Tracking
          </div>
        )}

        {menu.tracking.map((item) => (
          <a
            key={item.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.link);
            }}
            className={`sidebar-link ${isActive(item.link) ? "active-link" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              marginBottom: "6px",
              borderRadius: "8px",
              backgroundColor: isActive(item.link) ? "#278C582E" : "transparent",
              textDecoration: "none",
            }}
          >
            <img src={item.icon[1]} alt={item.title} style={iconStyle} />

            {!collapsed && (
              <span style={{ marginLeft: "12px", color: "white", fontWeight: 500 }}>
                {item.title}
              </span>
            )}
          </a>
        ))}
      </nav>
    </aside>
  );
}
