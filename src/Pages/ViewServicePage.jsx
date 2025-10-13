// src/pages/ViewServicePage.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
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
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

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
            items: res.data.items?.map((item) => ({
              id: item.id,
              product: item.product_name || item.product || "",
              vci_serial_no: item.vci_serial_no || "",
              warranty_status: item.warranty_status || "",
              testing_assigned_to: item.testing_assigned_to || "",
              tested_date: item.tested_date || "",
              testing_status: item.testing_status || "",
              issue_found: item.issue_found || "",
              action_taken: item.action_taken || "",
              urgent: item.urgent || false,
            })) || [],
          };
          setFormData(serviceData);
        }
      } catch (error) {
        toast.error("Failed to fetch service data!");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

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
      header: "Urgent",
      accessor: (row) => (
        <Form.Check type="checkbox" checked={row.urgent} readOnly />
      ),
    },
  ];

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
  };

  return (
    <Container fluid>
   <Row className="align-items-center mb-3 fixed-header">
        <Col>
          <h4>view service</h4>
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
      {/* Row 1 */}
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

      {/* Row 2 */}
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
        {/* <Col md={4}>
          <Form.Group>
            <Form.Label>Tester Name</Form.Label>
            <Form.Control type="text" value={formData.tester_name} readOnly />
          </Form.Group>
        </Col> */}
      </Row>

      {/* Row 3 */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Quantity</Form.Label>
            <Form.Control type="number" value={formData.quantity} readOnly />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Send Date</Form.Label>
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
      <Row className="mb-3">
        <Col md={12}>
          <Form.Group>
            <Form.Label>Remarks</Form.Label>
            <Form.Control as="textarea" rows={3} value={formData.remarks} readOnly />
          </Form.Group>
        </Col>
      </Row>

      {/* Service Items Table */}
      <h5 className="mt-4">Service Items</h5>
      <DataTable
        loading={loading}
        data={formData.items}
        columns={columns}
        page={page}
        perPage={perPage}
        headerStyle={headerStyle}
      />

      <div className="mt-4 d-flex justify-content-end">
        {/* <Button variant="secondary" onClick={() => navigate("/service-product")}>
          Back
        </Button> */}
      </div>
    </Container>
  );
};

export default ViewServicePage;
