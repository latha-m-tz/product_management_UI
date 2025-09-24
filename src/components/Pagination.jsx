import React from "react";

const Pagination = ({ page, setPage, perPage, totalEntries }) => {
  const totalPages = Math.ceil(totalEntries / perPage);
  if (totalPages === 0) return null;

  const getPageNumbers = () => {
    const pages = new Set();
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.add(i);
    } else {
      pages.add(1);
      if (page > 4) pages.add("...");
      for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) pages.add(i);
      if (page < totalPages - 3) pages.add("...");
      pages.add(totalPages);
    }
    return [...pages];
  };

  const handleClick = (pg) => {
    if (pg !== "..." && pg !== page) setPage(pg);
  };

  return (
    <>
      <hr style={{ marginTop: 0 }} />
      <div className="d-flex justify-content-between align-items-center px-2 pb-1" style={{ fontSize: "0.8rem", lineHeight: 1 }}>
        <div>
          Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalEntries)} of {totalEntries} Entries
        </div>
        <ul className="pagination mb-0" style={{ margin: 0, fontSize: "0.8rem" }}>
          <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
            <button
              className="page-link text-dark"
              style={{ padding: "0.25rem 0.5rem", lineHeight: 1 }}
              onClick={() => page > 1 && setPage(page - 1)}
            >
              &laquo;
            </button>
          </li>

          {getPageNumbers().map((pg, index) =>
            pg === "..." ? (
              <li key={`ellipsis-${index}`} className="page-item disabled">
                <span className="page-link text-secondary bg-light border-0" style={{ padding: "0.25rem 0.5rem", lineHeight: 1 }}>
                  ...
                </span>
              </li>
            ) : (
              <li key={pg} className={`page-item ${pg === page ? "active" : ""}`}>
                <button
                  className={`page-link ${pg === page ? "text-white" : "text-dark"}`}
                  style={
                    pg === page
                      ? { backgroundColor: "#2E3A59", borderColor: "#2E3A59", padding: "0.25rem 0.5rem", lineHeight: 1 }
                      : { padding: "0.25rem 0.5rem", lineHeight: 1 }
                  }
                  onClick={() => handleClick(pg)}
                >
                  {pg}
                </button>
              </li>
            )
          )}

          <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
            <button
              className="page-link text-dark"
              style={{ padding: "0.25rem 0.5rem", lineHeight: 1 }}
              onClick={() => page < totalPages && setPage(page + 1)}
            >
              &raquo;
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Pagination;
