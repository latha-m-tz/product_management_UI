import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Card, Table, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import Breadcrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";

export default function ServiceDeliveryList() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // ✅ Fetch all deliveries
  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/service-deliveries`);
      if (Array.isArray(res.data)) {
        setDeliveries(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setDeliveries(res.data.data);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch deliveries!");
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete record with confirmation
  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "This delivery record will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/service-deliveries/${id}`);
        toast.success("Deleted successfully!");
        fetchDeliveries();
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete!");
      }
    }
  };

  // ✅ Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ✅ Filter by search
  const filtered = deliveries.filter((item) =>
    (item.delivery_challan_no || "").toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Paginate data
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const headerStyle = { backgroundColor: "#2E3A59", color: "#fff" };

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <Breadcrumb title="Service Deliveries" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2">
          {/* Records per page */}
          <div className="col-md-6 d-flex align-items-center">
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

          {/* Actions */}
          <div className="col-md-6 text-md-end">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={fetchDeliveries}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/service-delivery/add")}
              style={{
                backgroundColor: "#2FA64F",
                borderColor: "#2FA64F",
                color: "#fff",
                padding: "0.25rem 0.5rem",
                fontSize: "0.8rem",
                minWidth: "90px",
              }}
            >
              + Add Delivery
            </Button>
            <Search
              search={search}
              setSearch={setSearch}
              perPage={perPage}
              setPerPage={setPerPage}
              setPage={setPage}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <Table className="table-sm align-middle mb-0">
            <thead style={{ ...headerStyle, fontSize: "0.82rem" }}>
              <tr>
                <th className="text-center" style={headerStyle}>S.No</th>
                <th style={headerStyle}>Delivery No</th>
                <th style={headerStyle}>Delivery Date</th>
                <th style={headerStyle}>Courier</th>
                <th style={headerStyle}>Tracking No</th>
                <th style={headerStyle}>Status</th>
                <th className="text-center" style={headerStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    <img
                      src="/empty-box.png"
                      alt="No data"
                      style={{ width: "80px", opacity: 0.6 }}
                    />
                    <div className="mt-2">No records found</div>
                  </td>
                </tr>
              ) : (
                paginated.map((item, i) => (
                  <tr key={item.id}>
                    <td className="text-center">{(page - 1) * perPage + i + 1}</td>
                    <td>{item.delivery_challan_no || "-"}</td>
                    <td>{formatDate(item.delivery_date)}</td>
                    <td>{item.courier_name || "-"}</td>
                    <td>{item.tracking_number || "-"}</td>
                    <td>{item.status || "Pending"}</td>
                    <td className="text-center">
                      <Button
                        variant=""
                        size="sm"
                        className="me-1"
                        onClick={() => navigate(`/service-delivery/${item.id}/edit`)}
                        style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>

                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        style={{
                          borderColor: "#2E3A59",
                          color: "#2E3A59",
                          backgroundColor: "transparent",
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>

                      <Button
                        variant=""
                        size="sm"
                        onClick={() => navigate(`/service-delivery/${item.id}/view`)}
                        style={{
                          borderColor: "#2E3A59",
                          color: "#2E3A59",
                          backgroundColor: "transparent",
                          marginLeft: "4px",
                        }}
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={filtered.length}
        />
      </Card>
    </div>
  );
}
