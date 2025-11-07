import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../api";
import DataTable from "../components/DataTable";

const ViewServicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    challan_no: "",
    challan_date: "",
    courier_name: "",
    from_place: "",
    to_place: "",
    tester_name: "",
    quantity: "",
    sent_date: "",
    received_date: "",
    remarks: "",
    items: [],
    challan_files_urls: [],
    receipt_files_urls: [],
  });

  const [loading, setLoading] = useState(false);
  // const [page, setPage] = useState(1);
  // const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/service-vci/${id}`);
        if (res.data) {
          const serviceData = {
            challan_no: res.data.challan_no || "",
            challan_date: res.data.challan_date || "",
            courier_name: res.data.courier_name || "",
            from_place: res.data.from_place || "",
            to_place: res.data.to_place || "",
            tester_name: res.data.tester_name || "",
            quantity: res.data.quantity || "",
            sent_date: res.data.sent_date || "",
            received_date: res.data.received_date || "",
            remarks: res.data.remarks || "",
            challan_files_urls: res.data.challan_files_urls || [],
            receipt_files_urls: res.data.receipt_files_urls || [],
            items:
              res.data.items?.map((item) => ({
                id: item.id,
                product: item.product?.name || "N/A",
                vci_serial_no: item.vci_serial_no || "",
                warranty_status: item.warranty_status || "",
                testing_assigned_to: item.testing_assigned_to || "",
                tested_date: item.tested_date || "",
                testing_status: item.testing_status || "",
                issue_found: item.issue_found || "",
                action_taken: item.action_taken || "",
                urgent: item.urgent || false,
                upload_image: item.upload_image || null,
              })) || [],
          };
          setFormData(serviceData);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to fetch service data!");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  // Helper: Extract filename from URL
  const getFileName = (url) => {
    if (!url) return "";
    return url.split("/").pop(); // gets last part of URL (filename)
  };

  const columns = [
    { header: "Product", accessor: "product" },
    { header: "Serial No", accessor: "vci_serial_no" },
    { header: "Warranty Status", accessor: "warranty_status" },
    { header: "Assigned To", accessor: "testing_assigned_to" },
    { header: "Tested Date", accessor: "tested_date" },
    { header: "Testing Status", accessor: "testing_status" },
    { header: "Issue Found", accessor: "issue_found" },
    { header: "Action Taken", accessor: "action_taken" },
    {
      header: "Upload Image",
      accessor: (row) =>
        row.upload_image ? (
          <a
            href={row.upload_image}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            {getFileName(row.upload_image)}
          </a>
        ) : (
          "—"
        ),
    },
    {
      header: "Urgent",
      accessor: (row) => (
        <Form.Check type="checkbox" checked={!!row.urgent} readOnly />
      ),
    },
  ];

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
  };

  return (
    <Container fluid className="pb-4">
      <Row className="align-items-center mb-3 fixed-header">
        <Col>
          <h4>View Service</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => navigate("/service-product")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      {/* --- Basic Info --- */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Challan No</Form.Label>
            <Form.Control type="text" value={formData.challan_no} readOnly />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Challan Date</Form.Label>
            <Form.Control type="date" value={formData.challan_date} readOnly />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Courier Name</Form.Label>
            <Form.Control type="text" value={formData.courier_name} readOnly />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>From Place</Form.Label>
            <Form.Control type="text" value={formData.from_place} readOnly />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>To Place</Form.Label>
            <Form.Control type="text" value={formData.to_place} readOnly />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Quantity</Form.Label>
            <Form.Control type="number" value={formData.quantity} readOnly />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Sent Date</Form.Label>
            <Form.Control type="date" value={formData.sent_date} readOnly />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Received Date</Form.Label>
            <Form.Control type="date" value={formData.received_date} readOnly />
          </Form.Group>
        </Col>
      </Row>

      {/* Remarks */}
      <Row className="mb-4">
        <Col md={12}>
          <Form.Group>
            <Form.Label>Remarks</Form.Label>
            <Form.Control as="textarea" rows={3} value={formData.remarks} readOnly />
          </Form.Group>
        </Col>
      </Row>

      {/* --- File Links Section --- */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold mb-2">Challan Files</h6>
            <ul className="mb-0">
              {formData.challan_files_urls?.length > 0 ? (
                formData.challan_files_urls.map((file, i) => (
                  <li key={i}>
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "GrayText", textDecoration: "underline" }}
                    >
                      Challan {i + 1}
                    </a>
                  </li>
                ))
              ) : (
                <p className="text-muted small">No challan files uploaded.</p>
              )}
            </ul>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold mb-2">Receipt Files</h6>
            <ul className="mb-0">
              {formData.receipt_files_urls?.length > 0 ? (
                formData.receipt_files_urls.map((file, i) => (
                  <li key={i}>
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "GrayText", textDecoration: "underline" }}
                    >
                      Receipt {i + 1}
                    </a>
                  </li>
                ))
              ) : (
                <p className="text-muted small">No receipt files uploaded.</p>
              )}
            </ul>
          </Card>
        </Col>
      </Row>


      {/* --- Service Items Table --- */}
      <h5 className="mt-4 mb-2">Service Items</h5>
      <DataTable
        loading={loading}
        data={formData.items}
        columns={columns}
        page={page}
        perPage={perPage}
        headerStyle={headerStyle}
      />
    </Container>
  );
};

export default ViewServicePage;
