import React, { useEffect, useState } from "react";
import api, { setAuthToken ,API_BASE_URL  } from "../api";
import {
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Table,
  Form,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";

export default function PurchaseViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const getFileName = (url) => {
    if (!url) return "";
    return url.split("/").pop(); // gets last part of URL (filename)
  };
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
    fetchPurchase();
  }, [id]);

  const fetchPurchase = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sparepart-purchases/view/${id}`);
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

  // Filter items based on search
  const filteredItems =
    purchase?.items?.filter((item) => {
      const query = searchTerm.toLowerCase();
      return (
        item.sparepart?.toLowerCase().includes(query) ||
        item.product?.toLowerCase().includes(query) ||
        item.serial_numbers?.join(", ").toLowerCase().includes(query)
      );
    }) || [];

  // Pagination calculations
  const totalEntries = filteredItems.length;
  const paginatedItems = filteredItems.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const headerStyle = {
    backgroundColor: "#2E3A59",
    // color: "white",
    fontSize: "0.82rem",
    height: "40px",
    verticalAlign: "middle",
  };

  return (
    <div
      className="px-4"
      style={{ fontSize: "0.8rem", fontFamily: "Product Sans, sans-serif" }}
    >
      <BreadCrumb title="View Purchase" />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Purchase Overview</h5>
        <Button
          size="sm"
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: "grey",
            borderColor: "grey",
            marginTop: "6px", // adds small gap from top
          }}
        >
          ← Back
        </Button>
      </div>
      {/* Purchase Details Section */}
      <SectionCard title="Purchase Details">
        <Row>
          <Col md={6}>
            <InfoRow label="Vendor" value={purchase.vendor || "-"} />
            <InfoRow label="Challan No" value={purchase.challan_no} />
            <InfoRow label="Challan Date" value={purchase.challan_date} />
            <InfoRow label="Received Date" value={purchase.received_date || "-"} />
            <InfoRow label="Courier Name" value={purchase.courier_name || "-"} />
            <InfoRow label="Tracking No" value={purchase.tracking_number || "-"} />
            <InfoRow
              label="Receipt Documents"
              value={
                purchase.document_recipient && purchase.document_recipient.length > 0 ? (
                  purchase.document_recipient.map((file, idx) => {
                    const fileUrl = file.startsWith("http")
                      ? file
                      : `${API_BASE_URL}/${file.replace(/^\/+/, "")}`;

                    return (
                      <div key={idx}>
                     <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "grey", textDecoration: "underline" }}
          >
            {getFileName(fileUrl)}
          </a>
                      </div>
                    );
                  })
                ) : (
                  "-"
                )
              }
            />

          </Col>
        </Row>
      </SectionCard>

      {/* Purchased Items Table */}
      <Card className="border-0 shadow-sm rounded-3 p-3 bg-white">
        <div className="row mb-3 align-items-center">
          <div className="col-md-4 mb-2 mb-md-0 d-flex align-items-center">
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

          {/* Search Bar aligned to the right */}
          <div className="col-md-8 text-md-end">
            <Form.Control
              type="text"
              size="sm"
              placeholder="Search sparepart, product, or serial..."
              style={{ width: "250px", display: "inline-block" }}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <Table
            className="table-sm align-middle mb-0"
            style={{ fontSize: "0.85rem" }}
          >
            <thead>
              <tr>
                <th style={{ backgroundColor: "#2E3A59", width: "60px", textAlign: "center", color: "white" }}>S.No</th>
                <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Sparepart</th>
                <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Product</th>
                <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Serial Numbers</th>
                <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No items found"
                      style={{ width: "80px", opacity: 0.6 }}
                    />
                    <div>No matching records found</div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td style={{ fontSize: "0.9rem" }}>{item.sparepart || "-"}</td>
                    <td>{item.product || "-"}</td>
                    <td>
                      {item.serial_numbers?.length
                        ? item.serial_numbers.join(", ")
                        : "-"}
                    </td>
                    <td>{item.quantity}</td>
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
          totalEntries={totalEntries}
        />
      </Card>
    </div>
  );
}
