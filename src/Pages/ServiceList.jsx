import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Table, Form, Modal } from "react-bootstrap";
import api, { setAuthToken } from "../api";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";

import { useNavigate } from "react-router-dom";
import Breadcrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";

export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logData, setLogData] = useState([]);
  const [selectedSerial, setSelectedSerial] = useState("");

  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

useEffect(() => {
  const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
  fetchServices();
  fetchVendors();
}, []);


  const fetchVendors = async () => {
    try {
      const res = await api.get(`/vendorsget`);
      setVendors(res.data);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    }
  };

  const getVendorName = (id) => {
    const vendor = vendors.find((v) => v.id === id);
    return vendor ? vendor.vendor : "N/A";
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/service-vci`);
      setServices(Array.isArray(res.data) ? res.data.reverse() : []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to fetch services!");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogsBySerial = async (serial) => {
    try {
      const res = await api.get(`/service-vci`);
      // Filter only records that have the same serial
      const matchedLogs = res.data
        .flatMap((service) =>
          (service.items || [])
            .filter((item) => item.vci_serial_no === serial)
            .map((item) => ({
              challan_no: service.challan_no,
              vendor_id: service.vendor_id,
              vci_serial_no: item.vci_serial_no,
              status: item.status,
              created_at: item.created_at,
            }))
        );

      setLogData(matchedLogs.reverse());
      setSelectedSerial(serial);
      setShowLogModal(true);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error("Failed to fetch log history!");
    }
  };
  const getVendorStatusCounts = () => {
    const vendorMap = {};

    services.forEach(service => {
      const vendorName = getVendorName(service.vendor_id);

      if (!vendorMap[vendorName]) {
        vendorMap[vendorName] = {};
      }

      (service.items || []).forEach(item => {
        const status = item.status || "Unknown";

        if (!vendorMap[vendorName][status]) {
          vendorMap[vendorName][status] = 0;
        }

        vendorMap[vendorName][status] += 1;
      });
    });

    return vendorMap;
  };

  const handleDelete = async (id) => {
    try {
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: "Do you want to delete this service?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#2FA64F",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        await api.delete(`/service-vci/${id}`);
        toast.success("Service deleted!");
        fetchServices();
      }
    } catch {
      toast.error("Failed to delete service!");
    }
  };

  const filteredServices = services.filter((service) =>
    (service.vendor_id || "").toString().toLowerCase().includes(search.toLowerCase()) ||
    (service.challan_date || "").toLowerCase().includes(search.toLowerCase()) ||
    (service.items || []).some(item =>
      (item.vci_serial_no || "").toLowerCase().includes(search.toLowerCase()) ||

      (item.status || "").toLowerCase().includes(search.toLowerCase())
    ) ||
    (service.challan_no || "").toLowerCase().includes(search.toLowerCase())
  );

  const paginatedServices = filteredServices.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
  };

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <Breadcrumb title="Service List" />
      <Card className="shadow-sm p-3 mb-3"
        style={{ fontSize: "0.98rem", fontFamily: "'Product Sans', sans-serif" }}
      >
        <h6 className="fw-bold mb-3" style={{ fontSize: "1rem" }}>
          Service Status Summary
        </h6>

        {Object.entries(getVendorStatusCounts()).map(([vendor, statuses]) => (
          <div key={vendor} className="mb-2">
            <strong>{vendor}</strong> →
            {Object.entries(statuses).map(([status, count]) => {

              // Clean Capitalization: Make only first letter uppercase
              const formattedStatus =
                status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

              // Colors
              let bgColor = "#6c757d";
              if (status.toLowerCase() === "inward") bgColor = "#2FA64F";
              if (status.toLowerCase() === "delivered") bgColor = "#0d6efd";
              if (status.toLowerCase() === "testing") bgColor = "#fd7e14";

              return (
                <span
                  key={status}
                  className="ms-2 badge"
                  style={{
                    backgroundColor: bgColor,
                    fontSize: "0.85rem",
                    fontFamily: "'Product Sans', sans-serif",
                  }}
                >
                  {formattedStatus}: {count}
                </span>
              );
            })}
          </div>
        ))}
      </Card>

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        {/* Top Controls */}
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
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={fetchServices}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/service-product/add")}
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
                + Add Service
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

        {/* Service Table */}
        <div className="table-responsive">
          <Table
            className="table-sm align-middle mb-0"
            style={{ fontSize: "0.85rem" }}
          >
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
                <th
                  style={{
                    ...headerStyle,
                    width: "60px",
                    textAlign: "center",
                  }}
                >
                  S.No
                </th>
                <th style={headerStyle}>Vendor Name</th>
                <th style={headerStyle}>Challan No</th>
                <th style={headerStyle}>Challan Date</th>
                <th style={headerStyle}>VCI Serial No</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Created Time</th>
                <th
                  style={{
                    ...headerStyle,
                    width: "160px",
                    textAlign: "center",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No services found"
                      style={{ width: "80px", opacity: 0.6 }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedServices.flatMap((service, index) =>
                  service.items.length > 0
                    ? service.items.map((item) => (
                      <tr key={item.id}>
                        <td className="text-center">
                          {(page - 1) * perPage + index + 1}
                        </td>
                        <td style={{ fontSize: "0.90rem" }}>
                          {getVendorName(service.vendor_id)}
                        </td>
                        <td style={{ fontSize: "0.90rem" }}>{service.challan_no}</td>
                        <td style={{ fontSize: "0.90rem" }}>{service.challan_date}</td>
                        <td style={{ fontSize: "0.90rem" }}>{item.vci_serial_no}</td>
                        <td style={{ fontSize: "0.90rem" }}>
                          {item.status
                            ? item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)
                            : "-"}
                        </td>
                        <td style={{ fontSize: "0.90rem" }}>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString()
                            : "-"}
                        </td>
                        <td className="text-center">
                          <Button
                            variant=""
                            size="sm"
                            className="me-1"
                            onClick={() =>
                              navigate(`/service/${service.id}/edit`)
                            }
                            style={{
                              borderColor: "#2E3A59",
                              color: "#2E3A59",
                            }}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
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
                            onClick={() =>
                              fetchLogsBySerial(item.vci_serial_no)
                            }
                            style={{
                              borderColor: "#2E3A59",
                              color: "#2E3A59",
                              backgroundColor: "transparent",
                              marginLeft: "4px",
                            }}
                          >
                            <i className="bi bi-clock-history"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                    : [
                      <tr key={service.id}>
                        <td className="text-center">
                          {(page - 1) * perPage + index + 1}
                        </td>
                        <td style={{ fontSize: "0.90rem" }}>
                          {getVendorName(service.vendor_id)}
                        </td>
                        <td>{service.challan_no}</td>
                        <td>{service.challan_date}</td>
                        <td>-</td>
                        <td>
                          {service.status
                            ? service.status.charAt(0).toUpperCase() +
                            service.status.slice(1)
                            : "-"}
                        </td>
                        <td>
                          {service.created_at
                            ? new Date(service.created_at).toLocaleString()
                            : "-"}
                        </td>
                        <td className="text-center">
                          <Button
                            variant=""
                            size="sm"
                            className="me-1"
                            onClick={() =>
                              navigate(`/service/${service.id}/edit`)
                            }
                            style={{
                              borderColor: "#2E3A59",
                              color: "#2E3A59",
                            }}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                            style={{
                              borderColor: "#2E3A59",
                              color: "#2E3A59",
                              backgroundColor: "transparent",
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>,
                    ]
                )
              )}
            </tbody>
          </Table>
        </div>

        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={filteredServices.length}
        />
      </Card>

      {/* Log Modal */}
      <Modal
        show={showLogModal}
        onHide={() => setShowLogModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Log History for Serial No: <strong>{selectedSerial}</strong>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {logData.length === 0 ? (
            <div className="text-center text-muted py-4">
              No history found for this serial.
            </div>
          ) : (
            <Table bordered hover size="sm" className="mb-0">
              <thead className="table-secondary">
                <tr>
                  <th>Vendor Name</th>
                  <th>Challan No</th>
                  <th>Serial No</th>
                  <th>Status</th>
                  <th>Created Time</th>
                </tr>
              </thead>
              <tbody>
                {logData.map((log, idx) => (
                  <tr key={idx}>
                    <td>{getVendorName(log.vendor_id)}</td>
                    <td>{log.challan_no}</td>
                    <td>{log.vci_serial_no}</td>
                    <td>{log.status}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowLogModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
