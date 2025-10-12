import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ActionButton from "../components/ActionButton";
import { API_BASE_URL } from "../api";
import BreadCrumb from "../components/BreadCrumb";
import Search from "../components/Search.jsx";
import Pagination from "../components/Pagination.jsx";


const MySwal = withReactContent(Swal);

export default function PurchaseListPage() {
  const navigate = useNavigate();
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState(null); 
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/sparepart-purchases`);
      setPurchaseData(res.data);
    } catch {
      toast.error("Failed to fetch purchase data.");
    } finally {
      setLoading(false);
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
      await axios.delete(`${API_BASE_URL}/sparepart-purchase-items/${id}`);
      toast.success("Purchase deleted successfully!");
      const newData = purchaseData.filter((item) => item.purchase_id !== id);
      setPurchaseData(newData);
      if ((page - 1) * perPage >= newData.length && page > 1) setPage(page - 1);
    } catch {
      toast.error("Failed to delete purchase.");
    }
  };

  const handleSort = (field) => {
    const direction =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const filteredData = purchaseData.filter((item) => {
    const values = Object.values(item).join(" ").toLowerCase();
    return values.includes(search.toLowerCase());
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
            <div className="mt-2 d-inline-block mb-2" style={{ fontSize: "0.8rem" }}>
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
            <Search search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} setPage={setPage} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table custom-table align-middle mb-0">
            <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
              <tr>
                <th style={{ width: "70px", textAlign: "center", cursor: "pointer", backgroundColor: "#2E3A59", color: "white"  }}>S.No</th>
                {[
                  { label: "Vendor", field: "vendor.name" },
                  { label: "Challan No", field: "challan_no" },
                  { label: "Challan Date", field: "challan_date" },
                  { label: "Total Qty", field: "total_quantity" },
                ].map(({ label, field }) => (
                  <th key={field} onClick={() => handleSort(field)} style={{ cursor: "pointer", backgroundColor: "#2E3A59", color: "white" }}>
                    {label} {sortField === field && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                ))}
                <th style={{ cursor: "pointer", backgroundColor: "#2E3A59", color: "white", paddingLeft: "30px" }}>Action</th>
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
                    <img src="/empty-box.png" alt="No data" style={{ width: "80px", height: "100px", opacity: 0.6 }} />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.purchase_id}>
                    <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                    <td>{item.vendor.name}</td>
                    <td>{item.challan_no}</td>
                    <td>{item.challan_date}</td>
                    <td>{item.total_quantity}</td>
                    <td className="text-center" style={{ width: "130px" }}>
                      <div className="d-flex justify-content-center">
                        <ActionButton
                        onEdit={() => navigate(`/spare-partsPurchase/${item.purchase_id}`)}
                          onDelete={() => handleDelete(item.purchase_id)}
                              onView={() => navigate(`/spare-partsPurchase/view/${item.purchase_id}`)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} setPage={setPage} perPage={perPage} totalEntries={sortedData.length} />
      </Card>
    </div>
  );
}
