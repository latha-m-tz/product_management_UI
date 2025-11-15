import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import api, { setAuthToken } from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataTable from "../components/DataTable";

const ViewServicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vendor_name: "",
    challan_no: "",
    challan_date: "",
    received_date: "",
    courier_name: "-",
    tracking_no: "-",
    receipt_files_urls: [],
    items: [],
  });

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthToken(token);
    const fetchService = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/service-vci/${id}`);
        if (res.data) {
          setFormData({
            vendor_name: res.data.vendor_name || "-",
            challan_no: res.data.challan_no || "-",
            challan_date: res.data.challan_date || "-",
            received_date: res.data.received_date || "-",
            courier_name: res.data.courier_name || "-",
            tracking_no: res.data.tracking_no || "-",
            receipt_files_urls: res.data.receipt_files_urls || [],
            items:
              res.data.items?.map((item) => ({
                id: item.id,
                product: item.product?.name || "N/A",
                vci_serial_no: item.vci_serial_no || "",
                status: item.status || "Active",
                issue_found: item.issue_found || "",
                vci_serial_no: item.vci_serial_no || "",
                upload_image: item.upload_image || null,
              })) || [],
          });
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

  const getFileName = (url) => (url ? url.split("/").pop() : "");

  const columns = [
    { header: "Product", accessor: "product" },
    { header: "Serial No", accessor: "vci_serial_no" },
    {header:"status",accessor:"status"},
    {
  header: "Image",
  accessor: (row) =>
    row.upload_image ? (
      <a
        href={row.upload_image}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#0f1010ff", textDecoration: "underline" }}
      >
        {row.upload_image.split("/").pop()}  
      </a>
    ) : (
      "—"
    ),
}

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
            onClick={() => navigate("/service-product")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      {/* --- Purchase / Service Details --- */}
      <Card className="mb-4 p-3 shadow-sm">
        <h5 className="fw-bold mb-3">Service Details</h5>
        <Row>
          <Col md={4}>
            <p><strong>Vendor:</strong> {formData.vendor_name}</p>
          </Col>
          <Col md={4}>
            <p><strong>Challan No:</strong> {formData.challan_no}</p>
          </Col>
          <Col md={4}>
            <p><strong>Challan Date:</strong> {formData.challan_date}</p>
          </Col>
        </Row>
       
        <Row>
          <Col md={12}>
            <p>
              <strong>Receipt Documents:</strong>{" "}
              {formData.receipt_files_urls.length > 0
                ? formData.receipt_files_urls.map((file, i) => (
                    <span key={i}>
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "underline", color: "GrayText" }}
                      >
                        Receipt {i + 1}
                      </a>
                      {i !== formData.receipt_files_urls.length - 1 && ", "}
                    </span>
                  ))
                : "-"}
            </p>
          </Col>
        </Row>
      </Card>

      {/* --- Service Items Table --- */}
      <h5 className="mb-3">Service Items</h5>
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
