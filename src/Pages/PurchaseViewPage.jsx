import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import BreadCrumb from "../components/BreadCrumb";
import { API_BASE_URL } from "../api";

export default function PurchaseViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchase();
  }, [id]);

  const fetchPurchase = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/sparepart-purchases/view/${id}`);
      setPurchase(res.data);
    } catch {
      toast.error("Failed to fetch purchase data.");
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ label, value }) => (
    <Row className="mb-2">
      <Col xs={5} md={4} style={{ color: "#6c757d", fontSize: "0.9rem" }}>
        {label}
      </Col>
      <Col xs={7} md={8} style={{ color: "#222", fontSize: "0.95rem" }}>
        {value || "-"}
      </Col>
    </Row>
  );

  const SectionCard = ({ title, children }) => (
    <Card className="mb-3 border-0 shadow-sm">
      <Card.Body style={{ background: "#f6f7f9", borderRadius: "6px" }}>
        <h6 style={{ fontWeight: 600, marginBottom: "12px", color: "#222" }}>
          {title}
        </h6>
        {children}
      </Card.Body>
    </Card>
  );

  if (loading || !purchase) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="View Purchase" />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Purchase Overview</h5>
        <Button
          size="sm"
          onClick={() => navigate(-1)}
          style={{ backgroundColor: "#2FA64F", borderColor: "#2FA64F" }}
        >
          ← Back
        </Button>
      </div>

      {/* Purchase Details */}
      <SectionCard title="Purchase Details">
        <Row>
          <Col md={6}>
            <InfoRow label="Vendor" value={purchase.vendor} />
            <InfoRow label="Challan No" value={purchase.challan_no} />
            <InfoRow label="Challan Date" value={purchase.challan_date} />
                <InfoRow label="Total Quantity" value={purchase.total_quantity} />
          </Col>

        </Row>
      </SectionCard>

      {/* Purchase Items */}
      <SectionCard title="Purchased Items">
        <div className="table-responsive">
          <table className="table custom-table align-middle mb-0">
            <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
              <tr>
                <th style={{ width: "50px", textAlign: "center" }}>S.No</th>
                  <th>Sparepart</th>
                <th>Product</th>
                <th>Serial No</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items && purchase.items.length > 0 ? (
                purchase.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">{index + 1}</td>
                          <td>{item.sparepart}</td>
                    <td>{item.product}</td>
                    <td>{item.serial_numbers?.join(", ")}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <ToastContainer />
    </div>
  );
}
