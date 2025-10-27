import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import BreadCrumb from "../components/BreadCrumb";
import { API_BASE_URL } from "../api";

export default function PurchaseViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // items per page

  const totalItems = purchase?.items ? purchase.items.length : 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedItems = purchase?.items
    ? purchase.items.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];



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
          style={{ backgroundColor: "grey", borderColor: "grey" }}
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
            <InfoRow label="Received Date" value={purchase.received_date || "-"} />
            <InfoRow label="Total Quantity" value={purchase.total_quantity} />

            <InfoRow
              label="Receipt Document"
              value={
                purchase.document_recipient ? (
                  <a
                    href={`${API_BASE_URL.replace('/api', '')}/${purchase.document_recipient}`}
                    download
                  >
                    Download
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <InfoRow
              label="Challan 1"
              value={
                purchase.document_challan_1 ? (
                  <a
                    href={`${API_BASE_URL.replace('/api', '')}/${purchase.document_challan_1}`}
                    download
                  >
                    Download
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <InfoRow
              label="Challan 2"
              value={
                purchase.document_challan_2 ? (
                  <a
                    href={`${API_BASE_URL.replace('/api', '')}/${purchase.document_challan_2}`}
                    download
                  >
                    Download
                  </a>
                ) : (
                  "-"
                )
              }
            />
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
              {paginatedItems && paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td>{item.sparepart}</td>
                    <td>{item.product}</td>
                    <td>{item.serial_numbers?.join(", ")}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>

          </table>


        </div>
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-2">
            <Button
              size="sm"
              variant="outline-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

      </SectionCard>

    </div>
  );
}
