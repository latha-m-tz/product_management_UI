import React, { useState, useEffect } from "react";
import { Button, Spinner, Form, Card, Table, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

export default function AddProductPage({ onProductsSelected }) {
  const navigate = useNavigate(); 
  const [serialFrom, setSerialFrom] = useState("");
  const [serialTo, setSerialTo] = useState("");
  const [testFilter, setTestFilter] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [products, setProducts] = useState([]);
  const [testingData, setTestingData] = useState([]);
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [loading, setLoading] = useState(false);

  // Store serial numbers already added to sales
  const [alreadySoldSerials, setAlreadySoldSerials] = useState([]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/product`);
      if (res.data && Array.isArray(res.data)) {
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
      alert("Failed to load products. Please try again.");
      setProducts([]);
    }
  };

  const fetchTestingData = async () => {
    try {
      setLoading(true);

      // Fetch inventory items
      let url = `${API_BASE_URL}/inventory/serial-numbers?serial_from=${encodeURIComponent(serialFrom)}&serial_to=${encodeURIComponent(serialTo)}&tested_status=${encodeURIComponent(testFilter)}`;
      if (selectedProductId) url += `&product_id=${encodeURIComponent(selectedProductId)}`;

      const res = await axios.get(url);
      let records = Array.isArray(res.data) ? res.data : res.data.data ?? [];

      // Fetch already sold serials
      const soldRes = await axios.get(`${API_BASE_URL}/added-serials`);
      const soldSerials = Array.isArray(soldRes.data) ? soldRes.data.map((s) => s.trim()) : [];
      setAlreadySoldSerials(soldSerials);

      // Filter out already sold items so they won't appear
      const filteredRecords = records.filter(r => !soldSerials.includes(r.serial_no.trim()));

      setTestingData(filteredRecords);

      // Keep selected serials only if they are still available
      setSelectedSerials(prev => prev.filter(s => filteredRecords.some(r => r.id === s)));
    } catch (err) {
      console.error("Error fetching inventory data:", err);
      alert("Failed to load inventory. Please try again.");
      setTestingData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedSerials((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleUnselectAll = () => setSelectedSerials([]);
  const handleSelectAll = () => {
    const allSerials = testingData.map(item => item.id);
    setSelectedSerials(allSerials);
  };

  const handleSubmit = () => {
    if (!selectedSerials.length) {
      alert("Please select at least one product!");
      return;
    }

    const selectedProducts = testingData.filter((item) =>
      selectedSerials.includes(item.id)
    );

    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));

    if (onProductsSelected) onProductsSelected(selectedProducts);

    navigate(-1);
  };

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

  useEffect(() => {
    fetchProducts();
    fetchTestingData();
  }, []);

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
            <Col md={2}><Form.Control placeholder="From" value={serialFrom} onChange={(e) => setSerialFrom(e.target.value)} /></Col>
            <Col md={2}><Form.Control placeholder="To" value={serialTo} onChange={(e) => setSerialTo(e.target.value)} /></Col>
            <Col md={2}><Form.Control placeholder="Filter Test" value={testFilter} onChange={(e) => setTestFilter(e.target.value)} /></Col>
            <Col md={2}>
              <Form.Select disabled>
                <option>Available</option>
              </Form.Select>
            </Col>
            <Col md={1} className="text-end">
              <Button variant="dark" onClick={fetchTestingData}>Reset</Button>
            </Col>
          </Row>

          {/* Table */}
          {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : (
            <Table bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>
                    <Form.Check
                      type="checkbox"
                      checked={selectedSerials.length === testingData.length && testingData.length > 0}
                      onChange={(e) =>
                        e.target.checked ? handleSelectAll() : handleUnselectAll()
                      }
                    />
                  </th>
                  <th>Product</th>
                  <th>Serial No</th>
                  <th>Test</th>
                  <th>Sale Status</th>
                </tr>
              </thead>
              <tbody>
                {testingData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No records found</td>
                  </tr>
                ) : (
                  testingData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedSerials.includes(item.id)}
                          onChange={() => handleCheckboxChange(item.id)}
                        />
                      </td>
                      <td>{getProductName(item)}</td>
                      <td>{item.serial_no}</td>
                      <td>{item.tested_status}</td>
                      <td>Available</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}

          {/* Footer */}
          <div className="d-flex justify-content-between align-items-center">
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
