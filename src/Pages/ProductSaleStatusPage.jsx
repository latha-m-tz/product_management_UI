import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api";
import { Card, Button, Table, Spinner, Badge, Form } from "react-bootstrap";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";

export default function ProductSaleStatusPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");
  const [combinedList, setCombinedList] = useState([]);

  // DataTable Controls
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // NEW → Filter: All / Sold / Unsold
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);

    loadProductStatus();
  }, []);

  const loadProductStatus = async () => {
    try {
      const res = await api.get(`/sales/product-status/${productId}`);

      const sold = res.data.sold || [];
      const unsold = res.data.not_sold || [];

      setProductName(
        sold[0]?.product?.name ||
          unsold[0]?.product_name ||
          "Product"
      );

      const combined = [
        ...sold.map((s) => ({
          serial_no: s.serial_no,
          status: "Sold",
        })),
        ...unsold.map((s) => ({
          serial_no: s.serial_no,
          status: "Unsold",
        })),
      ];

      combined.sort((a, b) => a.status.localeCompare(b.status));

      setCombinedList(combined);
    } catch (error) {
      console.error("Failed to load product status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner animation="border" />
      </div>
    );
  }

  // Apply Filters
  const filteredData = combinedList
    .filter((item) =>
      item.serial_no.toLowerCase().includes(search.toLowerCase())
    )
    .filter((item) => {
      if (statusFilter === "All") return true;
      return item.status === statusFilter;
    });

  const paginatedData = filteredData.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
    fontSize: "0.82rem",
    height: "40px",
    verticalAlign: "middle",
  };

  return (
    <div className="px-4" style={{ fontSize: "0.80rem" }}>
      <BreadCrumb title="Product Sale Status" />

      <Card className="border-0 shadow-sm rounded-3 p-3 mt-3 bg-white">

        {/* TOP HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 className="m-0">{productName} – Serial Summary</h4>

          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        {/* DataTable Controls */}
        <div className="row mb-2">

          {/* Records Per Page */}
          <div className="col-md-3 d-flex align-items-center">
            <label className="me-2 fw-semibold mb-0">Records:</label>
            <Form.Select
              size="sm"
              style={{ width: "100px" }}
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Form.Select>
          </div>

          {/* NEW → Status Filter */}
          <div className="col-md-3 d-flex align-items-center">
            <label className="me-2 fw-semibold mb-0">Status:</label>
            <Form.Select
              size="sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All</option>
              <option value="Sold">Sold</option>
              <option value="Unsold">Unsold</option>
            </Form.Select>
          </div>

          {/* Search */}
          <div className="col-md-6 text-md-end">
            <Search
              search={search}
              setSearch={setSearch}
              perPage={perPage}
              setPerPage={setPerPage}
              setPage={setPage}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive">
          <Table className="table-sm align-middle mb-0" bordered>
            <thead style={headerStyle}>
              <tr>
                <th style={{ width: "60px", textAlign: "center" ,backgroundColor:"#2E3A59",color:"white"}}>S.No</th>
                <th style={{ backgroundColor:"#2E3A59",color:"white" }}>Serial Number</th>
                <th style={{ width: "120px",backgroundColor:"#2E3A59",color:"white" }}>Status</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-3 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No Data"
                      style={{ width: "70px", opacity: 0.5 }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={index}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>

                    <td style={{ fontSize: "0.90rem" }}>
                      {item.serial_no}
                    </td>

                    <td>
                      {item.status === "Sold" ? (
                        <Badge bg="danger">Sold</Badge>
                      ) : (
                        <Badge bg="success">Unsold</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* PAGINATION */}
        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={filteredData.length}
        />
      </Card>
    </div>
  );
}
