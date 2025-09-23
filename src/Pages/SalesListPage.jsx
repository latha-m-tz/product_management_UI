import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Card, Table, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import Breadcrumb from "../Components/Breadcrumb";
import Pagination from "../Components/Pagination";
import Search from "../Components/Search";

export default function SalesListPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
  setLoading(true);
  try {
    const res = await axios.get(`${API_BASE_URL}/sales`, {
      headers: { 'Cache-Control': 'no-cache' }, 
      params: { _: new Date().getTime() }, 
    });
    setSales(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    toast.error("Failed to fetch sales!");
    setSales([]);
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id) => {
    try {
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: "Do you want to delete this sale?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#2FA64F",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        await axios.delete(`${API_BASE_URL}/sales/${id}`);
        toast.success("Sale deleted!");
        fetchSales();
      }
    } catch {
      toast.error("Failed to delete sale!");
    }
  };

  const filteredSales = sales.filter((sale) =>
    (sale.challan_no || "").toLowerCase().includes(search.toLowerCase())
  );

  const paginatedSales = filteredSales.slice((page - 1) * perPage, page * perPage);

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
  };

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <Breadcrumb title="Sales List" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2">
          <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
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

          <div className="col-md-6 text-md-end" style={{ fontSize: "0.8rem" }}>
            <div className="mt-2 d-inline-block mb-2">
              <Button variant="outline-secondary" size="sm" className="me-2" onClick={fetchSales}>
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/sales/add")}
                style={{
                  backgroundColor: "#2FA64F",
                  borderColor: "#2FA64F",
                  color: "#fff",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem",
                  minWidth: "90px",
                  height: "28px",
                }}
              >
                + Add Sale
              </Button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <Search
                search={search}
                setSearch={setSearch}
                perPage={perPage}
                setPerPage={setPerPage}
                setPage={setPage}
                style={{ fontSize: "0.8rem" }}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
            <thead
              style={{
                backgroundColor: "#2E3A59",
                color: "white",
                fontSize: "0.82rem",
                height: "40px",
                verticalAlign: "middle",
              }}
            >
              <tr>
                <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
                <th style={headerStyle}>Challan No</th>
                <th style={headerStyle}>Customer</th>
                <th style={headerStyle}>Serial No</th>
                <th style={{ ...headerStyle, width: "130px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    <img src="/empty-box.png" alt="No sales found" style={{ width: "80px", opacity: 0.6 }} />
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale, index) => (
                  <tr key={sale.id}>
                    <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                    <td>{sale.challan_no}</td>
                    <td>{sale.customer?.customer}</td>
                    <td style={{ color: "#2FA64F" }}>
                      {sale.items.map((i) => i.testing?.serial_no || "").join(", ")}
                    </td>
                    <td className="text-center">
                      <Button
                        variant=""
                        size="sm"
                        className="me-1"
                        onClick={() => navigate(`/sales/edit/${sale.id}`)}
                        style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleDelete(sale.id)}
                        style={{ borderColor: "#2E3A59", color: "#2E3A59", backgroundColor: "transparent" }}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

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
