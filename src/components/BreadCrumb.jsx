import React from "react";
import { Link, useLocation } from "react-router-dom";

const BreadCrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav aria-label="breadcrumb">
      <ol
        style={{
          display: "flex",
          listStyle: "none",
          padding: 0,
          margin: 0,
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        {pathnames.map((name, idx) => {
          const routeTo = "/" + pathnames.slice(0, idx + 1).join("/");
          const isLast = idx === pathnames.length - 1;
          const displayName =
            decodeURIComponent(name).charAt(0).toUpperCase() +
            decodeURIComponent(name).slice(1);

          return (
            <li
              key={routeTo}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {idx !== 0 && <span style={{ color: "#999" }}>/</span>}
              {isLast ? (
                <span style={{ color: "#2E3A59", fontWeight: "500" }}>
                  {displayName}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  style={{ textDecoration: "none", color: "#007bff" }}
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadCrumb;
