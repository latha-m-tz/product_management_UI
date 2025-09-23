import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Card, Table, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";

import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import Breadcrumb from "../Components/Breadcrumb";
import Pagination from "../Components/Pagination";
import Search from "../Components/Search";

export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/service-vci`);
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to fetch services!");
      setServices([]);
    } finally {
      setLoading(false);
    }
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
        await axios.delete(`${API_BASE_URL}/service-vci/${id}`);
        toast.success("Service deleted!");
        fetchServices();
      }
    } catch {
      toast.error("Failed to delete service!");
    }
  };

  const filteredServices = services.filter((service) =>
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
                onClick={() => navigate("/service/add")}
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
                <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
                <th style={headerStyle}>Challan No</th>
                <th style={headerStyle}>Challan Date</th>
                <th style={headerStyle}>Send Date</th>
                <th style={headerStyle}>Received Date</th>
                <th style={headerStyle}>Quantity</th>
                <th style={headerStyle}>Status</th>
                <th style={{ ...headerStyle, width: "130px", textAlign: "center" }}>
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
                paginatedServices.map((service, index) => (
                  <tr key={service.id}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td>{service.challan_no}</td>
                    <td>{service.challan_date}</td>
                    <td>{service.sent_date}</td>
                    <td>{service.received_date}</td>
                    <td>{service.quantity}</td>
                    <td>{service.status || "Active"}</td>
                    <td className="text-center">
                      <Button
                        variant=""
                        size="sm"
                        className="me-1"
                        onClick={() => navigate(`/service/${service.id}/edit`)}
                        style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
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
          totalEntries={filteredServices.length}
        />
      </Card>
    </div>
  );
}
