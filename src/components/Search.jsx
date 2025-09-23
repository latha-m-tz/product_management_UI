import React from "react";

export default function Search({ search, setSearch, setPage }) {
  const handleChange = (e) => {
    const value = e.target.value;
    setSearch(value); 
    setPage(1);       
  };

  return (
    <input
      type="text"
      placeholder="Search by any detail..."
      value={search}
      onChange={handleChange}
      className="form-control form-control-sm"
      style={{ width: "250px", padding: "6px", fontSize: "0.85rem" }}
    />
  );
}
