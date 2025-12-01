import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form } from "react-bootstrap";
import api, { setAuthToken } from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ActionButton from "../components/ActionButton";
import BreadCrumb from "../components/BreadCrumb";
import Search from "../components/Search.jsx";
import Pagination from "../components/Pagination.jsx";

const MySwal = withReactContent(Swal);

export default function PurchaseListPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [purchaseData, setPurchaseData] = useState([]);
  const [overallStock, setOverallStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setAuthToken(token);
    fetchPurchases();
    fetchOverallStock();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sparepart-purchases`);
      setPurchaseData(res.data);
    } catch {
      toast.error("Failed to fetch purchase data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallStock = async () => {
    try {
      const res = await api.get(`/sparepart-purchases/overall`);
      setOverallStock(res.data);
    } catch {
      toast.error("Failed to fetch stock summary.");
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this purchase?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
      customClass: { popup: "custom-compact" },
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/sparepart-purchase-items/${id}`);
      toast.success("Purchase deleted successfully!");
      const newData = purchaseData.filter((item) => item.purchase_id !== id);
      setPurchaseData(newData);
      if ((page - 1) * perPage >= newData.length && page > 1) setPage(page - 1);
    } catch {
      toast.error("Failed to delete purchase.");
    }
  };

  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const filteredData = purchaseData.filter((item) => {
    const vendorName = item.vendor?.name?.toLowerCase() || "";
    const challanNo = item.challan_no?.toLowerCase() || "";
    return (
      vendorName.includes(search.toLowerCase()) ||
      challanNo.includes(search.toLowerCase())
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField]?.toString().toLowerCase() || "";
    const valB = b[sortField]?.toString().toLowerCase() || "";
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = sortedData.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="Purchase List" />

      {/* STOCK OVERALL SUMMARY */}
      <Card className="p-3 mb-3 shadow-sm" style={{ background: "#F8F9FA" ,fontSize: "0.90rem" ,fontFamily:"product-sans,sans-serif"}}>
        <h6 className="fw-bold mb-3">Current Stock Overall Summary</h6>

        <div className="list-group">
          {overallStock.map((item) => (
            <div
              key={item.sparepart_id}
              className="d-flex align-items-center justify-content-between py-2 px-2 mb-1 rounded"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e5e9",
                fontSize: "0.80rem",
              }}
            >
              {/* Sparepart Name */}
              <span
                className="fw-semibold"
                style={{ width: "50%", fontSize: "0.80rem" }}
              >
                {item.sparepart_name}
              </span>

              {/* Available Quantity */}
              <span
                className="fw-bold text-primary text-center"
                style={{ width: "20%", fontSize: "0.80rem" }}
              >
                {item.available_quantity}
              </span>

              {/* View Button */}
              <div style={{ width: "30%", textAlign: "right" }}>
                <Button
                  size="sm"
                  style={{
                    backgroundColor: "#2E3A59",
                    borderColor: "#2E3A59",
                    fontSize: "0.72rem",
                    height: "25px",
                    padding: "0px 10px",
                  }}
                  onClick={() =>
                    navigate("/purchase/overall", {
                      state: { sparepart_name: item.sparepart_name },
                    })
                  }
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Table Section */}
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
            <div
              className="mt-2 d-inline-block mb-2"
              style={{ fontSize: "0.8rem" }}
            >
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={fetchPurchases}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>

              <Button
                size="sm"
                onClick={() => navigate("/spare-partsPurchase/add")}
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
                + Add New
              </Button>
            </div>

            <Search
              search={search}
              setSearch={setSearch}
              perPage={perPage}
              setPerPage={setPerPage}
              setPage={setPage}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table custom-table align-middle mb-0">
            <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
              <tr>
                <th
                  style={{
                    width: "70px",
                    textAlign: "start",
                    cursor: "pointer",
                    backgroundColor: "#2E3A59",
                    color: "white"
                  }}
                >
                  S.No
                </th>
                {[
                  { label: "Vendor", field: "vendor.name" },
                  { label: "Challan No", field: "challan_no" },
                  { label: "Challan Date", field: "challan_date" },
                ].map(({ label, field }) => (
                  <th
                    key={field}
                    style={{
                      backgroundColor: "#2E3A59",
                      color: "white",
                      padding: "8px",
                      fontSize: "0.85rem",
                      textAlign: "start",
                    }}
                  >
                    {label}
                  </th>
                ))}
                <th
                  style={{
                  paddingLeft: "30px",
                  backgroundColor: "#2E3A59",
                  color: "white",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No data"
                      style={{
                        width: "80px",
                        height: "100px",
                        opacity: 0.6,
                      }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.purchase_id}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td style={{ fontSize: "0.90rem" }}>
                      {item.vendor.name}
                    </td>
                    <td style={{ fontSize: "0.90rem" }}>{item.challan_no}</td>
                    <td style={{ fontSize: "0.90rem" }}>
                      {item.challan_date}
                    </td>

                    <td className="text-center" style={{ width: "130px" }}>
                      <div className="d-flex justify-content-center">
                        <ActionButton
                          onEdit={() =>
                            navigate(
                              `/spare-partsPurchase/${item.purchase_id}`
                            )
                          }
                          onDelete={() =>
                            handleDelete(item.purchase_id)
                          }
                          onView={() =>
                            navigate(
                              `/spare-partsPurchase/view/${item.purchase_id}`
                            )
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={sortedData.length}
        />
      </Card>
    </div>
  );
}
