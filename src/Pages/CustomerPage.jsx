import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { API_BASE_URL } from "../api";
import BreadCrumb from "../components/BreadCrumb";
import Search from "../components/Search.jsx";
import Pagination from "../components/Pagination.jsx";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import ActionButton from "../components/ActionButton";

const MySwal = withReactContent(Swal);

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/customers/get`);
      setCustomers(res.data);
    } catch {
      toast.error("Failed to fetch customers.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this customer?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
      customClass: { popup: "custom-compact" },
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/customers/del/${id}`);
      toast.success("Customer deleted successfully!");
      setCustomers(customers.filter((c) => c.id !== id));
    } catch {
      toast.error("Failed to delete customer.");
    }
  };

  const handleSort = (field) => {
    const direction =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const filteredData = customers.filter((c) => {
    const values = Object.values(c).join(" ").toLowerCase();
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
      <BreadCrumb title="Customer List" />

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
          <div className="col-md-6 text-md-end">
            <div className="mt-2 d-inline-block mb-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={fetchCustomers}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/customer/add")}
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
           <thead>
  <tr>
    <th
      style={{
        width: "70px",
        textAlign: "center",
        backgroundColor: "#2E3A59",
        color: "white",
      }}
    >
      S.No
    </th>
    {[
      { label: "Name", field: "customer" },
      { label: "Email", field: "email" },
      { label: "Mobile", field: "mobile_no" },
      { label: "GST No", field: "gst_no" },
      { label: "City", field: "city" },
      { label: "Status", field: "status" },
    ].map(({ label, field }) => (
      <th
        key={field}
        onClick={() => handleSort(field)}
        style={{
          cursor: "pointer",
          backgroundColor: "#2E3A59",
          color: "white",
        }}
      >
        {label} {sortField === field && (sortDirection === "asc" ? "▲" : "▼")}
      </th>
    ))}
    <th
      style={{
        textAlign: "center",
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
                  <td colSpan="10" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No data"
                      style={{ width: "80px", height: "100px", opacity: 0.6 }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((c, index) => (
                  <tr key={c.id}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td>{c.customer}</td>
                    <td>{c.email}</td>
                    <td>{c.mobile_no}</td>
                    <td>{c.gst_no}</td>
                    <td>{c.city}</td>
                    <td>
                      <span
                        className={`badge ${c.status === "active" ? "bg-success" : "bg-danger"
                          }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    {/* <td className="text-center" style={{ width: "130px" }}>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                 onClick={() => navigate(`/customer/${c.id}/edit`)}


                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(c.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-info"
                        className="me-2"
                     onClick={() => navigate(`/customer/${c.id}`)}

                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                    </td> */}

                    <td className="text-center" style={{ width: "130px" }}>
  <ActionButton
    onEdit={() => navigate(`/customer/${c.id}/edit`)}
    onDelete={() => handleDelete(c.id)}
    onView={() => navigate(`/customer/${c.id}`)}
  />
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
