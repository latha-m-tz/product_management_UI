import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();

  const menu = {
    home: [{ link: "overview", title: "Overview", icon: ["/Overviiew_G.png", "/squares.png"] }],
    purchase: [
      { link: "vendor", title: "Vendor", icon: ["/VendorG.png", "/Vendor.png"] },
      { link: "spare-parts", title: "Spare Parts", icon: ["/Purchase Order.png", "/Purchase Order 1.png"] },
      // { link: "assemble", title: "Assemble", icon: ["/AssembleG.png", "/Assemble.png"] },
    ],
    // testing: [
    //   { link: "testing/a", title: "Testing A" },
    //   { link: "testing/b", title: "Testing B" },
    // ],
    product: [
      { link: "product/list", title: "Product List" },
      { link: "product/add", title: "Add Product" },
    ],
    sales: [
      { link: "customer", title: "Customer", icon: ["/CustomerG.png", "/Customer.png"] },
      { link: "sales-order", title: "Sales", icon: ["/Sale 1.png", "/Sale 1.png"] },
    ],
    service: [{ link: "service-product", title: "Service Product", icon: ["/Service VCI.png", "/Service VCI.png"] }],
  };

  const [testingOpen, setTestingOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  const handleLinkClick = (link) => navigate(`/${link}`);

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
        className="small px-4 flex-grow-1"
        style={{
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Home */}
        <div className="mb-1 sidebar-link-titles">{!collapsed && "Home"}</div>
        {menu.home.map((item) => (
          <a key={item.link} href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(item.link); }} style={linkStyle}>
            <img src={item.icon ? item.icon[1] : ""} alt={item.title} style={iconStyle} />
            {!collapsed && <span style={linkSpanStyle}>{item.title}</span>}
          </a>
        ))}

        {/* Purchase */}
        <div className="sidebar-link-titles">{!collapsed && "Purchase"}</div>
        {menu.purchase.map((item) => (
          <a key={item.link} href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(item.link); }} style={linkStyle}>
            {item.icon && <img src={item.icon[1]} alt={item.title} style={iconStyle} />}
            {!collapsed && <span style={linkSpanStyle}>{item.title}</span>}
          </a>
        ))}

        {/* Testing Dropdown */}
        {/* <div className="sidebar-link-titles">{!collapsed && "Testing"}</div>
        <button onClick={() => setTestingOpen(!testingOpen)} className="bg-transparent border-0 w-100 text-start p-0 mb-1">
          <div style={linkStyle}>
            <img src="/Testing.png" alt="Testing" style={iconStyle} />
            {!collapsed && (
              <>
                <span style={linkSpanStyle}>Testing</span>
                <span className="ms-auto">{testingOpen ? "▾" : "▸"}</span>
              </>
            )}
          </div>
        </button>
        {testingOpen && !collapsed && menu.testing.map((item) => (
          <a key={item.link} href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(item.link); }} style={subLinkStyle}>
            - {item.title}
          </a>
        ))} */}

        {/* Product Dropdown */}
        <div className="sidebar-link-titles">{!collapsed && "Inventory"}</div>
        <button onClick={() => setProductOpen(!productOpen)} className="bg-transparent border-0 w-100 text-start p-0 mb-1">
          <div style={linkStyle}>
            <img src="/Product.png" alt="Product" style={iconStyle} />
            {!collapsed && (
              <>
                <span style={linkSpanStyle}>Assemble</span>
                <span className="ms-auto">{productOpen ? "▾" : "▸"}</span>
              </>
            )}
          </div>
        </button>
        {productOpen && !collapsed && menu.product.map((item) => (
          <a key={item.link} href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(item.link); }} style={subLinkStyle}>
            - {item.title}
          </a>
        ))}

        {/* Sales */}
        <div className="sidebar-link-titles">{!collapsed && "Sales"}</div>
        {menu.sales.map((item) => (
          <a key={item.link} href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(item.link); }} style={linkStyle}>
            {item.icon && <img src={item.icon[1]} alt={item.title} style={iconStyle} />}
            {!collapsed && <span style={linkSpanStyle}>{item.title}</span>}
          </a>
        ))}

        {/* Service */}
        <div className="sidebar-link-titles">{!collapsed && "Service"}</div>
        {menu.service.map((item) => (
          <a key={item.link} href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(item.link); }} style={linkStyle}>
            {item.icon && <img src={item.icon[1]} alt={item.title} style={iconStyle} />}
            {!collapsed && <span style={linkSpanStyle}>{item.title}</span>}
          </a>
        ))}
      </nav>
    </aside>
  );
}
