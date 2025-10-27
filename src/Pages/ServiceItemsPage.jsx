import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Form, Card, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import { API_BASE_URL } from "../api";

export default function ServiceItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // Filters
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [testingStatus, setTestingStatus] = useState("");

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
    } catch (err) {
      toast.error("Failed to fetch service items!");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceItems();
  }, []);

  const handleFilterApply = () => {
    setPage(1);
    fetchServiceItems();
  };

  const filteredItems = items.filter((item) =>
    item.vci_serial_no.toLowerCase().includes(search.toLowerCase())
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

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        {/* Filters */}
        <div className="row mb-3">
          <div className="col-md-3 mb-2">
            <Form.Control
              placeholder="From Place"
              value={fromPlace}
              onChange={(e) => setFromPlace(e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <Form.Control
              placeholder="To Place"
              value={toPlace}
              onChange={(e) => setToPlace(e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <Form.Control
              placeholder="Tracking Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <Form.Select
              value={testingStatus}
              onChange={(e) => setTestingStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
            </Form.Select>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-12 text-end">
            <Button variant="primary" size="sm" onClick={handleFilterApply}>
              Apply Filters
            </Button>
          </div>
        </div>

        <div className="table-responsive">
          <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
            <thead style={headerStyle}>
              <tr>
                <th style={{ width: "50px", textAlign: "center" }}>S.No</th>
                <th>VCI Serial No</th>
                <th>Product Name</th>
                <th>Vendor Name</th>
                <th>Testing Status</th>
                <th>Tracking Number</th>
                <th>From Place</th>
                <th>To Place</th>
                <th>Upload Image</th>
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
                    No service items found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                    <td>{item.vci_serial_no}</td>
                    <td>{item.product_name}</td>
                    <td>{item.vendor_name}</td>
                    <td>{item.testing_status}</td>
                    <td>{item.tracking_number}</td>
                    <td>{item.from_place}</td>
                    <td>{item.to_place}</td>
                    <td>
                      {item.upload_image_url ? (
                        <a href={item.upload_image_url} target="_blank" rel="noopener noreferrer">
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
