import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spinner, Form, Card, Table, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import { API_BASE_URL } from "../api";

export default function ServiceItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filters
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [testingStatus, setTestingStatus] = useState("");
  const [vciSerialNo, setVciSerialNo] = useState(""); // local search filter

  // Fetch data
  const fetchServiceItems = async () => {
    setLoading(true);
    try {
      const params = {
        from_place: fromPlace || undefined,
        to_place: toPlace || undefined,
        tracking_number: trackingNumber || undefined,
        testing_status: testingStatus || undefined,
      };
      const res = await axios.get(`${API_BASE_URL}/serviceitems`, { params });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to fetch service items!");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceItems();
  }, []);

  // Auto-fetch when filter changes
  useEffect(() => {
    fetchServiceItems();
  }, [fromPlace, toPlace, trackingNumber, testingStatus]);

  // Local client-side filter for VCI Serial No
  const filteredItems = items.filter((item) =>
    item.vci_serial_no?.toLowerCase().includes(vciSerialNo.toLowerCase())
  );

  const paginatedItems = filteredItems.slice(
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
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="Service Items" />

      <Card className="border-0 shadow-sm rounded-3 p-3 px-4 mt-2 bg-white">
        {/* Top Controls */}
        <div className="row mb-3">
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

          <div className="col-md-6 text-md-end d-flex justify-content-md-end">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={fetchServiceItems}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-3">
          <div className="col-md-3 mb-2">
            <Form.Control
              size="sm"
              placeholder="From Place"
              value={fromPlace}
              onChange={(e) => setFromPlace(e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <Form.Control
              size="sm"
              placeholder="To Place"
              value={toPlace}
              onChange={(e) => setToPlace(e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <Form.Control
              size="sm"
              placeholder="Tracking Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <Form.Select
              size="sm"
              value={testingStatus}
              onChange={(e) => setTestingStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
            </Form.Select>
          </div>
        </div>

        {/* Local Search */}
        <div className="row mb-3">
          <div className="col-md-3 mb-2">
            <Form.Control
              size="sm"
              placeholder="Search by VCI Serial No"
              value={vciSerialNo}
              onChange={(e) => setVciSerialNo(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <Table
            className="table-sm align-middle mb-0"
            style={{ fontSize: "0.85rem" }}
          >
         <thead>
      <tr
        style={{
          backgroundColor: "#2E3A59",
          color: "#fff",
          fontSize: "0.82rem",
          height: "40px",
          verticalAlign: "middle",
        }}
      >
        <th style={{ backgroundColor: "#2E3A59", color: "#fff", textAlign: "center", width: "60px" }}>S.No</th>
        <th style={{ backgroundColor: "#2E3A59", color: "#fff" }}>VCI Serial No</th>
        <th style={{ backgroundColor: "#2E3A59", color: "#fff" }}>Product Name</th>
        <th style={{ backgroundColor: "#2E3A59", color: "#fff" }}>Vendor Name</th>
        <th style={{ backgroundColor: "#2E3A59", color: "#fff" }}>Testing Status</th>
        <th style={{ backgroundColor: "#2E3A59", color: "#fff" }}>Tracking Number</th>
        <th style={{ backgroundColor: "#2E3A59", color: "#fff" }}>From Place</th>
        <th style={{ backgroundColor: "#2E3A59", color: "#fff" }}>To Place</th>
        <th style={{ backgroundColor: "#2E3A59", color: "#fff" }}>Image</th>
      </tr>
    </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No data"
                      style={{ width: "80px", opacity: 0.6 }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td>{item.vci_serial_no || "-"}</td>
                    <td>{item.product_name || "-"}</td>
                    <td>{item.vendor_name || "-"}</td>
                    <td>{item.testing_status || "-"}</td>
                    <td>{item.tracking_number || "-"}</td>
                    <td>{item.from_place || "-"}</td>
                    <td>{item.to_place || "-"}</td>
                    <td>
                      {item.upload_image_url ? (
                        <a
                          href={item.upload_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "N/A"
                      )}
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
          totalEntries={filteredItems.length}
        />
      </Card>
    </div>
  );
}
