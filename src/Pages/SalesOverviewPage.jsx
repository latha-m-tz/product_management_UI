import React, { useEffect, useState } from "react";
import api, { setAuthToken } from "../api";
import {
  Card,
  Spinner,
  Button,
  Form,
  Badge,
  Row,
  Col
} from "react-bootstrap";
import { toast } from "react-toastify";
import {
  ArrowClockwise,
  FileEarmarkText
} from "react-bootstrap-icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import DataTable from "../components/DataTable";

const DetailRow = ({ label, value }) => (
  <div className="d-flex mb-2">
    <div style={{ width: "160px" }} className="text-muted">
      {label}
    </div>
    <div className="fw-semibold">
      {value || "-"}
    </div>
  </div>
);

export default function SalesOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  /* ---------------------- Back Navigation Logic ---------------------- */
  const handleBack = () => {
    if (location.state?.fromTracking) {
      // Explicitly send the state back so the tracking page knows to reload the timeline
      navigate("/tracking", { state: { fromTracking: true } });
    } else {
      // Standard back behavior for other entry points (like Sales List)
      navigate(-1);
    }
  };

  /* ---------------------- Effects ---------------------- */
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
    fetchSale();
    // eslint-disable-next-line
  }, [id]);

  const fetchSale = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sales/${id}`);
      setApiData(res.data);
    } catch (error) {
      console.error("Failed to fetch sale:", error);
      toast.error("Failed to fetch sale details!");
      setApiData(null);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- Loading State ---------------------- */
  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading sale details...</p>
      </div>
    );
  }

  /* ---------------------- Not Found State ---------------------- */
  if (!apiData || !apiData.sale) {
    return (
      <div className="text-center mt-5">
        <h4 className="text-muted">Sale not found!</h4>
        <Button
          size="sm"
          onClick={handleBack}
          style={{
            backgroundColor: "grey",
            borderColor: "grey",
            marginTop: "6px",
          }}
        >
          ← Back
        </Button>
      </div>
    );
  }

  /* ---------------------- Data Prep ---------------------- */
  const mainSale = apiData.sale;
  const productsArray = apiData.products || [];

  const allRows = productsArray.map((item, index) => ({
    sno: index + 1,
    product_name: item.product?.name || "N/A",
    serial_no: item.serial_no || "-",
    quantity: item.total_quantity || 1
  }));

  const columns = [
    // { header: "S.No", accessor: (row) => row.sno },
    {
      header: "Product",
      accessor: (row) => <strong>{row.product_name}</strong>
    },
    {
      header: "Serial Numbers",
      accessor: (row) =>
        row.serial_no !== "-" ? (
          <Badge bg="info" className="text-dark">
            {row.serial_no}
          </Badge>
        ) : (
          "-"
        )
    },
  ];

  const filteredRows = allRows.filter((row) => {
    const text = search.toLowerCase();
    return (
      row.product_name.toLowerCase().includes(text) ||
      row.serial_no.toLowerCase().includes(text)
    );
  });

  const paginatedRows = filteredRows.slice(
    (page - 1) * perPage,
    page * perPage
  );

  /* ---------------------- Render ---------------------- */
  return (
    <div className="px-4 pb-4" style={{ fontSize: "0.85rem" }}>
      <BreadCrumb title="Sale Overview" />

      {/* ================= SALE DETAILS ================= */}
      <Card className="border-0 shadow-sm rounded-3 p-4 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Sale Details</h5>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={fetchSale}
              title="Refresh"
            >
              <ArrowClockwise />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBack}
            >
              ← Back
            </Button>
          </div>
        </div>

        <Row className="gy-3">
          <Col md={6}>
            <DetailRow
              label="Customer"
              value={mainSale.customer?.customer}
            />
            <DetailRow
              label="Challan No"
              value={mainSale.challan_no}
            />
            <DetailRow
              label="Challan Date"
              value={mainSale.challan_date}
            />
          </Col>

          <Col md={6}>
            <DetailRow
              label="Shipment Name"
              value={mainSale.shipment_name}
            />
            <DetailRow
              label="Tracking No"
              value={mainSale.tracking_no}
            />
            <DetailRow
              label="Received Date"
              value={mainSale.received_date}
            />
          </Col>
        </Row>

        <hr className="my-4" />

        <h6 className="fw-bold mb-2">Receipt Documents</h6>
        {mainSale.receipt_files && mainSale.receipt_files.length > 0 ? (
          <div className="d-flex flex-wrap gap-2">
            {mainSale.receipt_files.map((file, idx) => (
              <Button
                key={idx}
                variant="light"
                size="sm"
                className="border px-3"
                href={file.url}
                target="_blank"
              >
                <FileEarmarkText className="me-2 text-danger" />
                Document {idx + 1}
              </Button>
            ))}
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </Card>

      {/* ================= PRODUCT TABLE ================= */}
      <Card
        className="border-0 shadow-sm rounded-3 p-4 bg-white"
        style={{ fontFamily: "sans-serif", fontSize: "0.90rem" }}
      >
        <div className="row mb-3 align-items-center">
          <div className="col-md-6">
            <h5 className="mb-0 fw-bold">Product details</h5>
          </div>

          <div className="col-md-6">
            <div className="d-flex justify-content-end align-items-center gap-3">
              <Form.Group className="d-flex align-items-center mb-0">
                <small className="me-2">Show</small>
                <Form.Select
                  size="sm"
                  style={{ width: "80px", fontSize: "0.90rem" }}
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
              </Form.Group>

              <Search search={search} setSearch={setSearch} />
            </div>
          </div>
        </div>

        <DataTable
          loading={loading}
          data={paginatedRows}
          columns={columns}
          headerStyle={{ backgroundColor: "#2E3A59", color: "#fff" }}
          emptyMessage="No products found for this sale"
        />

        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={filteredRows.length}
        />
      </Card>
    </div>
  );
}