import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Card, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";


import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
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

  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/sales`, {
        headers: { "Cache-Control": "no-cache" },
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

  const handleDelete = async (sale) => {
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
        await axios.delete(`${API_BASE_URL}/sales/${sale.id}`);
        toast.success("Sale deleted!");
        fetchSales();
      }
    } catch {
      toast.error("Failed to delete sale!");
    }
  };

  const filteredSales = sales.filter((sale) => {
    const searchTerm = search.toLowerCase();
    const challan = (sale.challan_no || "").toLowerCase();
    const customer = (sale.customer?.customer || "").toLowerCase();
    return challan.includes(searchTerm) || customer.includes(searchTerm);
  });

  const paginatedSales = filteredSales.slice((page - 1) * perPage, page * perPage);

const headerStyle = {
  backgroundColor: "#2E3A59",
  color: "white",
  padding: "2px 6px", // reduce vertical space
  height: "28px", // total header height
  lineHeight: "1.2", // compact spacing
};
const rowStyle = {
  fontSize: "0.85rem",  // smaller text
  padding: "4px 6px",   // tighter cell spacing
  lineHeight: "1.2rem", // compact vertical spacing
};


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

  return (
    <div className="px-4" style={{ fontSize: "0.95rem" ,fontFamily:"productsans-serif"}}>
      <BreadCrumb title="Sales List" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2">
          {/* Left Controls */}
          <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
            <Form.Select
              size="sm"
              style={{ width: "50px" }}
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

          {/* Right Controls */}
          <div className="col-md-6 text-md-end" style={{ fontSize: "0.8rem" }}>
            <div className="mt-2 d-inline-block mb-2">
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
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem",
                  minWidth: "90px",
                  height: "28px",
                }}
              >
                + Add Sale
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
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

        {/* ✅ Reusable DataTable */}
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
