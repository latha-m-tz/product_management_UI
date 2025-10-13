import React, { useState, useEffect } from "react";
import { Button, Spinner, Form, Card, Table, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import Pagination from "../components/Pagination";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // make sure you import this

export default function AddProductPage({ onProductsSelected }) {
  const navigate = useNavigate();

  // Filters
  const [serialFrom, setSerialFrom] = useState("");
  const [serialTo, setSerialTo] = useState("");
  const [testFilter, setTestFilter] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  // Data
  const [products, setProducts] = useState([]);
  const [testingData, setTestingData] = useState([]);
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [loading, setLoading] = useState(false);

  // Already sold serials
  const [alreadySoldSerials, setAlreadySoldSerials] = useState([]);

  // Serial numbers for selected product
  const [serials, setSerials] = useState([]);

  // Unselect range inputs
  const [unselectFrom, setUnselectFrom] = useState("");
  const [unselectTo, setUnselectTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/product`);
      if (Array.isArray(res.data)) {
        const normalized = res.data
          .map((p) => ({
            id: p.id ?? p.product_id ?? null,
            name: p.name ?? p.product_name ?? p.title ?? "N/A",
          }))
          .filter((p) => p.id != null && p.name);
        setProducts(normalized);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
      toast.error("Failed to fetch products");
    }
  };

  // Fetch already sold serials
  const fetchSoldSerials = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/added-serials`);
      const soldSerials = Array.isArray(res.data)
        ? res.data.map((s) => String(s).trim())
        : [];
      setAlreadySoldSerials(soldSerials);
    } catch (err) {
      setAlreadySoldSerials([]);
      toast.error("Failed to fetch sold serials");
    }
  };

  // Fetch testing data (filtered)
  const fetchTestingData = async () => {
    try {
      setLoading(true);
      let records = [];

      if (selectedProductId) {
        const res = await axios.get(`${API_BASE_URL}/products/${selectedProductId}/serials`);
        records = Array.isArray(res.data) ? res.data : [];
      } else {
        const params = {};
        if (serialFrom) params.serial_from = serialFrom;
        if (serialTo) params.serial_to = serialTo;
        const res = await axios.get(`${API_BASE_URL}/inventory/serial-numbers`, { params });
        records = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      }

      // Normalize product_id
      records = records.map((r) => ({
        ...r,
        product_id: r.product_id ?? r.productId ?? r.productID ?? selectedProductId ?? null,
      }));

      // Exclude already sold serials
      records = records.filter(
        (r) => r.serial_no && !alreadySoldSerials.includes(String(r.serial_no).trim())
      );

      // Apply serial range
      const from = serialFrom ? Number(serialFrom) : null;
      const to = serialTo ? Number(serialTo) : null;
      if (from !== null)
        records = records.filter((r) => !isNaN(r.serial_no) && Number(r.serial_no) >= from);
      if (to !== null)
        records = records.filter((r) => !isNaN(r.serial_no) && Number(r.serial_no) <= to);

      // Apply test filter
      if (testFilter) {
        records = records.filter(
          (r) => String(r.tested_status).toUpperCase() === testFilter.toUpperCase()
        );
      }

      setTestingData(records);
      setSelectedSerials((prev) => prev.filter((s) => records.some((r) => r.id === s)));
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching testing data:", err);
      setTestingData([]);
      toast.error("Failed to fetch product serials");
    } finally {
      setLoading(false);
    }
  };

  // Checkbox handlers
  const handleCheckboxChange = (id) =>
    setSelectedSerials((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleUnselectAll = () => setSelectedSerials([]);
  const handleSelectAll = () => setSelectedSerials(testingData.map((item) => item.id));

  const handleUnselectRange = () => {
    if (!unselectFrom || !unselectTo) return;
    const from = Number(unselectFrom);
    const to = Number(unselectTo);
    setSelectedSerials((prev) =>
      prev.filter((id) => {
        const item = testingData.find((r) => r.id === id);
        if (!item || isNaN(item.serial_no)) return true;
        const num = Number(item.serial_no);
        return !(num >= from && num <= to);
      })
    );
    toast.info(`Unselected serials from ${from} to ${to}`);
    setUnselectFrom("");
    setUnselectTo("");
  };

  // Submit
  const handleSubmit = () => {
    if (!selectedSerials.length) {
      toast.warning("Please select at least one product!");
      return;
    }
    const selectedProducts = testingData.filter((item) => selectedSerials.includes(item.id));
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
    if (onProductsSelected) onProductsSelected(selectedProducts);
    toast.success(`${selectedProducts.length} product(s) added successfully!`);
    navigate(-1);
  };

  // Product name helper
  const getProductName = (item) => {
    if (!item) return "N/A";
    if (item.product && typeof item.product === "object" && item.product.name) return item.product.name;
    if (item.product && typeof item.product === "string") return item.product;
    if (item.product_name) return item.product_name;
    if (item.product_id) {
      const found = products.find((p) => String(p.id) === String(item.product_id));
      if (found) return found.name;
    }
    return "N/A";
  };

  const handleReset = () => {
    setSerialFrom("");
    setSerialTo("");
    setTestFilter("");
    setSelectedProductId("");
    setSerials([]);
    toast.info("Filters reset");
  };

  // Effects
  useEffect(() => {
    fetchProducts();
    fetchSoldSerials();
  }, []);

  useEffect(() => {
    fetchTestingData();
  }, [serialFrom, serialTo, testFilter, selectedProductId, alreadySoldSerials]);

  // Pagination
  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentRecords = testingData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold">Add Product</h5>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>← Back</Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          {/* Filters */}
          <Row className="mb-3 g-2">
            <Col md={3}>
              <Form.Select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">All Products</option>
                {products.length
                  ? products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                  : <option disabled>No products found</option>}
              </Form.Select>
            </Col>
            <Col md={2}><Form.Control placeholder="From" type="text" value={serialFrom} onChange={(e) => setSerialFrom(e.target.value)} /></Col>
            <Col md={2}><Form.Control placeholder="To" type="text" value={serialTo} onChange={(e) => setSerialTo(e.target.value)} /></Col>
            <Col md={2}>
              <Form.Select value={testFilter} onChange={(e) => setTestFilter(e.target.value)}>
                <option value="">All Tests</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="PENDING">PENDING</option>
              </Form.Select>
            </Col>
            <Col md={2}><Form.Select disabled><option>Available</option></Form.Select></Col>
            <Col md={1} className="text-end"><Button variant="dark" onClick={handleReset}>Reset</Button></Col>
          </Row>

          {/* Unselect range */}
          <Row className="mb-3 g-2">
            <Col md={2}><Form.Control placeholder="Unselect From" type="text" value={unselectFrom} onChange={(e) => setUnselectFrom(e.target.value)} /></Col>
            <Col md={2}><Form.Control placeholder="Unselect To" type="text" value={unselectTo} onChange={(e) => setUnselectTo(e.target.value)} /></Col>
            <Col md={2}><Button variant="primary" className="w-60" onClick={handleUnselectRange}>Unselect Range</Button></Col>
          </Row>

          {/* Table */}
          {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : (
            <>
              <Table bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th><Form.Check type="checkbox" checked={selectedSerials.length === testingData.length && testingData.length > 0} onChange={(e) => e.target.checked ? handleSelectAll() : handleUnselectAll()} /></th>
                    <th>Product</th>
                    <th>Serial No</th>
                    <th>Test</th>
                    <th>Sale Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted">No records found</td></tr>
                  ) : currentRecords.map((item) => (
                    <tr key={item.id}>
                      <td><Form.Check type="checkbox" checked={selectedSerials.includes(item.id)} onChange={() => handleCheckboxChange(item.id)} /></td>
                      <td>{getProductName(item)}</td>
                      <td>{item.serial_no ?? "N/A"}</td>
                      <td>{item.tested_status ?? "N/A"}</td>
                      <td>Available</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Pagination page={currentPage} setPage={setCurrentPage} perPage={perPage} totalEntries={testingData.length} />
            </>
          )}

          {/* Footer */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <p className="mb-0">Total: {testingData.length}</p>
            <div>
              <Button variant="outline-secondary" className="me-2" onClick={() => navigate(-1)}>Cancel</Button>
              <Button variant="success" onClick={handleSubmit}>Add</Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
