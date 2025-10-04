import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import BreadCrumb from "../components/BreadCrumb";
import { API_BASE_URL } from "../api";

export default function ViewCustomerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
    try {
  const res = await axios.get(`${API_BASE_URL}/customers/${id}`);
  if (res.data && res.data.status === "success") {
    setCustomer(res.data.customer); // <-- only the customer object
  } else {
    toast.error("Customer not found");
    navigate("/customers");
  }
} catch (err) {
  console.error(err);
  toast.error("Error fetching customer");
  navigate("/customers");
} finally {
  setLoading(false);
}

    };

    fetchCustomer();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="px-4" style={{ fontSize: "0.85rem" }}>
      <BreadCrumb title="View Customer" />

      <Card className="border-0 shadow-sm rounded-3 p-4 mt-2 bg-white">
        <h5 className="mb-4">Customer Details</h5>

        <Row className="mb-3">
          <Col md={4}><strong>Name:</strong> {customer.customer}</Col>
          <Col md={4}><strong>GST No:</strong> {customer.gst_no}</Col>
          <Col md={4}><strong>Email:</strong> {customer.email}</Col>
        </Row>

        <Row className="mb-3">
          <Col md={4}><strong>Mobile:</strong> {customer.mobile_no}</Col>
          <Col md={4}><strong>Pincode:</strong> {customer.pincode}</Col>
          <Col md={4}><strong>City:</strong> {customer.city}</Col>
        </Row>

        <Row className="mb-3">
          <Col md={4}><strong>District:</strong> {customer.district}</Col>
          <Col md={4}><strong>State:</strong> {customer.state}</Col>
          <Col md={4}>
            <strong>Status:</strong>{" "}
            <span className={`badge ${customer.status === "active" ? "bg-success" : "bg-danger"}`}>
              {customer.status}
            </span>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <strong>Address:</strong>
            <p>{customer.address}</p>
          </Col>
        </Row>

        <div className="d-flex justify-content-end">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
}
