import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form } from "react-bootstrap";
import api, { setAuthToken } from "../api";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";

import { useNavigate } from "react-router-dom";
import BreadCrumb from "../components/BreadCrumb";
import ActionButtons from "../components/ActionButton";
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import DataTable from "../components/DataTable";

export default function SalesListPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [productSummary, setProductSummary] = useState([]);

  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

  const pageFontStyle = {
    fontFamily: `"Product Sans", sans-serif`,
    fontSize: "0.92rem",
    color: "#333",
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
    fetchSales();
    fetchProductSummary();
  }, []);

  const fetchProductSummary = async () => {
    try {
      const res = await api.get(`/sales/product-summary`);
      setProductSummary(res.data);
    } catch {
      toast.error("Failed to load product summary!");
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sales`, {
        headers: { "Cache-Control": "no-cache" },
        params: { _: Date.now() },
      });
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to fetch sales!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sale) => {
    try {
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: "Do you want to delete this sale?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#2FA64F",
        confirmButtonText: "Yes, delete!",
      });

      if (result.isConfirmed) {
        await api.delete(`/sales/${sale.id}`);
        toast.success("Sale deleted!");
        fetchSales();
      }
    } catch {
      toast.error("Failed to delete sale!");
    }
  };

  const filteredSales = sales.filter((sale) => {
    const term = search.toLowerCase();
    return (
      (sale.challan_no || "").toLowerCase().includes(term) ||
      (sale.customer?.customer || "").toLowerCase().includes(term)
    );
  });

  const paginatedSales = filteredSales.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const columns = [
    { header: "Customer", accessor: (row) => row.customer?.customer },
    { header: "Challan No", accessor: "challan_no" },
    { header: "Challan Date", accessor: (row) => row.challan_date },
    { header: "Shipment Date", accessor: (row) => row.shipment_date },
    {
      header: "Actions",
      accessor: (row) => (
        <ActionButtons
          onEdit={() => navigate(`/sales/edit/${row.id}`)}
          onDelete={() => handleDelete(row)}
          onView={() => navigate(`/sales-order-overview/${row.id}`)}
        />
      ),
    },
  ];

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
    padding: "6px",
    height: "32px",
    lineHeight: "1.2",
    fontFamily: `"Product Sans", sans-serif`,
    fontSize: "0.82rem",
  };

  return (
    <div className="px-4" style={pageFontStyle}>

      {/* Load Google Sans ONLY for this page */}
      {/* <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&display=swap");
      `}</style> */}

      <BreadCrumb title="Sales List" />

      {/* PRODUCT SUMMARY CARD */}
      <Card className="border-0 shadow-sm rounded-3 p-3 mb-3 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0 fw-semibold">Product Summary</h5>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead style={headerStyle}>
              <tr>
                <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Product</th>
                <th style={{ backgroundColor: "#2E3A59", color: "white" }} className="text-center">Assembled</th>
                <th style={{ backgroundColor: "#2E3A59", color: "white" }} className="text-center">Sold</th>
                <th style={{ backgroundColor: "#2E3A59", color: "white" }} className="text-center">Available</th>
                <th style={{ backgroundColor: "#2E3A59", color: "white" }} className="text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {productSummary.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-3 text-muted">
                    <img
                      src="/empty-box.png"
                      style={{ width: "80px", opacity: 0.6 }}
                    />
                  </td>
                </tr>
              ) : (
                productSummary.map((p, i) => (
                  <tr key={i}>
                    <td>{p.product_name}</td>
                    <td className="text-center">{p.assembled_qty}</td>
                    <td className="text-center">{p.sold_qty}</td>
                    <td className="text-center fw-bold text-success">
                      {p.available_qty}
                    </td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/product-sale-status/${p.product_id}`)
                        }
                        style={{
                          backgroundColor: "#2E3A59",
                          borderColor: "#2E3A59",
                          fontFamily: `"Product Sans", sans-serif`,
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SALES TABLE */}
      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2">
          <div className="col-md-6 d-flex align-items-center">
            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
            <Form.Select
              size="sm"
              style={{ width: "60px" }}
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

          <div className="col-md-6 text-md-end">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={fetchSales}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </Button>

            <Button
              size="sm"
              onClick={() => navigate("/sales-order/add")}
              style={{
                backgroundColor: "#2FA64F",
                borderColor: "#2FA64F",
                color: "#fff",
                minWidth: "90px",
                fontFamily: `"Google Sans", sans-serif`,
              }}
            >
              + Add Sale
            </Button>

            <Search search={search} setSearch={setSearch} />
          </div>
        </div>

        <DataTable
          loading={loading}
          data={paginatedSales}
          columns={columns}
          page={page}
          perPage={perPage}
          headerStyle={headerStyle}
        />

        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={filteredSales.length}
        />
      </Card>
    </div>
  );
}
