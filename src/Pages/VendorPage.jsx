import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
//import ActionButtons from "./components/ActionButtons";
import { API_BASE_URL } from "../api";
import ActionButton from "../components/ActionButton";
import BreadCrumb from "../components/BreadCrumb";

import Search from "../components/Search.jsx";
import Pagination from "../components/Pagination.jsx";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net";
import "bootstrap/dist/css/bootstrap.min.css";

const MySwal = withReactContent(Swal);

export default function VendorPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchVendors();
  }, []);

 const fetchVendors = async () => {
  setLoading(true);
  try {
    const res = await axios.get(`${API_BASE_URL}/vendorsget`); 
    if (Array.isArray(res.data)) {
      setVendors(res.data);
    } else if (Array.isArray(res.data.data)) {
      setVendors(res.data.data);
    } else {
      setVendors([]);
    }
  } catch {
    toast.error("Failed to fetch vendor data.");
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this vendor?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/vendors/${id}`);
      toast.success("Vendor deleted successfully!");
      fetchVendors();
      // setVendors(vendors.filter((v) => v.id !== id));
    } catch {
      toast.error("Failed to delete vendor.");
    }
  };

  const handleSort = (field) => {
    const direction =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  
// const handleView = (vendorId) => {
//   navigate(`/vendors/view/${vendorId}`);
// };

  const filteredData = vendors.filter((vendor) =>
    Object.values(vendor)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
      <BreadCrumb title="Vendor List" />

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
          <div className="col-md-6 text-md-end ">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2 mb-2"
              onClick={fetchVendors}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
            <Button
              size="sm"
                 className="me-2 mb-2"
              style={{
                backgroundColor: "#2FA64F",
                borderColor: "#2FA64F",
                color: "#fff",
                minWidth: "90px",
                height: "28px",
              }}
                onClick={() => navigate("/vendor/add")}
            >
              + Add Vendor
            </Button>
            {/* <Search search={search} setSearch={setSearch} /> */}
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
        cursor: "pointer",
        backgroundColor: "#2E3A59",
        color: "white",
      }}
    >
      S.No
    </th>
    {[
      { label: "Vendor", field: "vendor" },
      { label: "GST No", field: "gst_no" },
      { label: "Email", field: "email" },
      { label: "Mobile No", field: "mobile_no" },
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
        cursor: "pointer",
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
                paginatedData.map((vendor, index) => (
                  <tr key={vendor.id}>
                    <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                    <td>{vendor.vendor}</td>
                    <td>{vendor.gst_no}</td>
                    <td>{vendor.email}</td>
                    <td>{vendor.mobile_no}</td>
                    
                    {/* <td>{vendor.status}</td> */}
                           <td>
                      <span
                        className={`badge ${vendor.status === "Active" ? "bg-success" : "bg-danger"
                          }`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <ActionButton
                           onEdit={() => navigate(`/vendor/edit/${vendor.id}`)}
                        onDelete={() => handleDelete(vendor.id)}
             onView={() => navigate(`/vendors/view/${vendor.id}`)}  
                      />
                    </td>
{/* 
                    <td className="text-center">
  <ViewButton onClick={() => handleView(vendor.id)} />
</td> */}

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
