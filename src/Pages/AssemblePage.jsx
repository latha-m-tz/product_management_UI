import { useState } from "react";
import { Button, Spinner, Card, Form, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap-icons/font/bootstrap-icons.css";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import { API_BASE_URL } from "../api";

export default function AssemblePage() {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serialNo, setSerialNo] = useState(""); // user input for search

  // Pagination (even if one record, keeps table structure consistent)
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
    fontSize: "0.82rem",
    height: "40px",
    verticalAlign: "middle",
  };

  // 🔍 Fetch Serial Details
  const fetchInventoryBySerial = async () => {
    if (!serialNo.trim()) {
      toast.warning("Please enter a Serial Number");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/inventory/serial/${serialNo.trim()}`);
      const data = res.data?.data ? [res.data.data] : [];
      setInventories(data);
      toast.success("Serial details loaded successfully");
    } catch (err) {
      console.error(err);
      setInventories([]);
      toast.error(err.response?.data?.message || "Serial not found");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSerial = async (item) => {
    const serial = item.serial_no;

    MySwal.fire({
      title: "Are you sure?",
      text: `You want to delete serial number ${serial}? This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE_URL}/inventory/${serial}`);
          toast.success(`Serial ${serial} deleted successfully`);
          setInventories((prev) => prev.filter((inv) => inv.serial_no !== serial));
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.message || "Failed to delete serial");
        }
      }
    });
  };

  // Table Data
  const paginatedData = inventories.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="Inventory Serial Details" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        {/* 🔍 Search Section */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <Form.Control
              type="text"
              placeholder="Enter Serial Number"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchInventoryBySerial()}
              style={{ width: "250px", marginRight: "10px" }}
            />
            <Button
              size="sm"
              style={{
                backgroundColor: "#2FA64F",
                borderColor: "#2FA64F",
                color: "#fff",
                fontSize: "0.8rem",
              }}
              onClick={fetchInventoryBySerial}
            >
              Search
            </Button>
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/assemble/add")}
            style={{
              backgroundColor: "#2FA64F",
              borderColor: "#2FA64F",
              color: "#fff",
              fontSize: "0.8rem",
              height: "28px",
            }}
          >
            + Add Assemble
          </Button>
        </div>

        {/* 🧾 Table */}
        <div className="table-responsive">
          <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
            <thead style={headerStyle}>
              <tr>
                <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
                <th style={{ ...headerStyle }}>Product Name</th>
                <th style={{ ...headerStyle }}>Serial No</th>
                <th style={{ ...headerStyle }}>Tested Status</th>
                <th style={{ ...headerStyle }}>Tested By</th>
                <th style={{ ...headerStyle }}>Created At</th>
                <th style={{ ...headerStyle, textAlign: "center" }}>Action</th>
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
                      style={{ width: "80px", opacity: 0.6 }}
                    />
                    <div>No records found</div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                    <td>{item.product_name}</td>
                    <td>{item.serial_no}</td>
                    <td>{item.tested_status}</td>
                    <td>{item.tested_by}</td>
                    <td>{item.created_at}</td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/inventory/view/${item.serial_no}`)}
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteSerial(item)}
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

        {/* 📄 Pagination */}
        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={inventories.length}
        />
      </Card>
    </div>
  );
}
