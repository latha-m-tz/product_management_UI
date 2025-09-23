// src/pages/AddProductPage.js
import React, { useState, useEffect, use } from "react";
import { Button, Spinner, Form, Card, Table, Row, Col } from "react-bootstrap";
import axios from "axios";
import { API_BASE_URL } from "../api";

export default function AddProductPage({ onProductsSelected }) {
  const [serialFrom, setSerialFrom] = useState("");
  const [serialTo, setSerialTo] = useState("");
  const [testFilter, setTestFilter] = useState("");
  const [saleStatus, setSaleStatus] = useState("All");

  // products state (used for dropdown)
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const [loading, setLoading] = useState(false);
  const [testingData, setTestingData] = useState([]);
  const [selectedTestingIds, setSelectedTestingIds] = useState([]);

  // load products from API and normalize to { id, name }
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/product`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const normalized = res.data
          .map((p) => {
            return {
              id: p.id ?? p.product_id ?? p._id ?? null,
              name: p.name ?? p.product_name ?? p.title ?? p.label ?? null,
            };
          })
          .filter((p) => p.id != null && p.name);
        setProducts(normalized);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching products", err);
      setProducts([]);
    }
  };

  const fetchTestingData = async () => {
  try {
    setLoading(true);

    let url =
      `${API_BASE_URL}/inventory?serial_from=${encodeURIComponent(serialFrom)}` +
      `&serial_to=${encodeURIComponent(serialTo)}` +
      `&tested_status=${encodeURIComponent(testFilter)}` +
      `&sale_status=${encodeURIComponent(saleStatus)}`;

    if (selectedProductId) {
      url += `&product_id=${encodeURIComponent(selectedProductId)}`;
    }

    const response = await axios.get(url);

    let records = [];
    if (response.data) {
      if (Array.isArray(response.data)) {
        // Direct array response
        records = response.data;
      } else if (Array.isArray(response.data.data)) {
        // Paginated response (Laravel resource)
        records = response.data.data;
      }
    }

    setTestingData(records);
  } catch (error) {
    console.error("Error fetching testing data", error);
    setTestingData([]);
  } finally {
    setLoading(false);
  }
};


  const handleCheckboxChange = (id) => {
    if (selectedTestingIds.includes(id)) {
      setSelectedTestingIds(selectedTestingIds.filter((i) => i !== id));
    } else {
      setSelectedTestingIds([...selectedTestingIds, id]);
    }
  };

  const handleUnselectAll = () => {
    setSelectedTestingIds([]);
  };

  const handleSubmit = () => {
  if (selectedTestingIds.length === 0) {
    alert("Please select at least one product!");
    return;
  }

  // Get selected product details
  const selectedProducts = testingData.filter((item) =>
    selectedTestingIds.includes(item.id)
  );

  // Store in localStorage
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));

  if (onProductsSelected) {
    onProductsSelected(selectedProducts);
  }

  window.history.back();
};


  useEffect(() => {
    fetchProducts();
    fetchTestingData();
  }, []);

  const getProductName = (item) => {
    if (item?.product?.name) return item.product.name;
    if (item?.product_name) return item.product_name;
    if (item?.product_id) {
      const found = products.find((p) => String(p.id) === String(item.product_id));
      if (found) return found.name;
    }
    if (item?.product?.title) return item.product.title;
    return "N/A";
  };

  const salesStatusOptions = ["All", "Available", "Sold"];
  
  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold">Add Product</h5>
        <Button variant="outline-secondary" onClick={() => window.history.back()}>
          ← Back
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          {/* Filters */}
          <Row className="mb-3 g-2">
            <Col md={3}>
              <Form.Select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">All Products</option>
                {products.length === 0 ? (
                  <option value="" disabled>
                    No products found
                  </option>
                ) : (
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Control
                placeholder="From"
                value={serialFrom}
                onChange={(e) => setSerialFrom(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Form.Control
                placeholder="To"
                value={serialTo}
                onChange={(e) => setSerialTo(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Form.Control
                placeholder="Filter Test"
                value={testFilter}
                onChange={(e) => setTestFilter(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Form.Select value={saleStatus} onChange={(e) => setSaleStatus(e.target.value)}>
                <option value="All">All</option>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
              </Form.Select>
            </Col>

            <Col md={1} className="text-end">
              <Button variant="dark" onClick={fetchTestingData}>
                Reset
              </Button>
            </Col>
          </Row>

          {/* Table */}
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>
                    <Form.Check
                      type="checkbox"
                      checked={selectedTestingIds.length === testingData.length && testingData.length > 0}
                      onChange={(e) =>
                        e.target.checked
                          ? setSelectedTestingIds(testingData.map((item) => item.id))
                          : handleUnselectAll()
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
                    <td colSpan="5" className="text-center text-muted">
                      No records found
                    </td>
                  </tr>
                ) : (
                  testingData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedTestingIds.includes(item.id)}
                          onChange={() => handleCheckboxChange(item.id)}
                        />
                      </td>
                      <td>{getProductName(item)}</td>
                      <td>{item?.serial_no ?? "N/A"}</td>
                      <td>{item?.tested_status ?? "N/A"}</td>
                      <td>{item?.sale_status ?? "N/A"}</td>
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
              <Button variant="outline-secondary" className="me-2" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleSubmit}>
                Add
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
