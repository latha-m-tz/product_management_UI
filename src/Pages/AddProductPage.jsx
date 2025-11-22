import React, { useState, useEffect } from "react";
import {
  Button,
  Spinner,
  Form,
  Card,
  Table,
  Row,
  Col,
} from "react-bootstrap";
import api, { setAuthToken } from "../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [alreadySoldSerials, setAlreadySoldSerials] = useState([]);
  const [inSaleProducts, setInSaleProducts] = useState([]);

  useEffect(() => {
    const loadInSaleProducts = () => {
      const stored = JSON.parse(localStorage.getItem("inSaleProducts") || "[]");
      setInSaleProducts(stored);
    };

    loadInSaleProducts();

    const handleUpdate = () => {
      loadInSaleProducts();
      fetchTestingData();
    };

    window.addEventListener("inSaleProductsUpdated", handleUpdate);
    return () => window.removeEventListener("inSaleProductsUpdated", handleUpdate);
  }, []);

  // 📦 Fetch all products
  const fetchProducts = async () => {
    try {
      const res = await api.get("/product");
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

  // 🚫 Fetch already sold serials
  const fetchSoldSerials = async () => {
    try {
      const res = await api.get("/added-serials");
      const soldSerials = Array.isArray(res.data)
        ? res.data.map((s) => String(s).trim())
        : [];
      setAlreadySoldSerials(soldSerials);
    } catch (err) {
      setAlreadySoldSerials([]);
      toast.error("Failed to fetch sold serials");
    }
  };

  // 🔍 Fetch serial/testing data
const fetchTestingData = async () => {
  try {
    setLoading(true);
    let records = [];

    if (selectedProductId) {
      const res = await api.get(`/products/${selectedProductId}/serials`);
      
      console.log("API RAW DATA (BY PRODUCT):", res.data);

      records = Array.isArray(res.data) ? res.data : [];
    } else {
      const params = {};
      if (serialFrom) params.serial_from = serialFrom;
      if (serialTo) params.serial_to = serialTo;

      const res = await api.get("/inventory/serial-numbers", { params });

      console.log("API RAW DATA (ALL SERIALS):", res.data);

      records = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? [];
    }

    // 🔍 Log BEFORE mapping
    console.log("BEFORE NORMALIZATION:", records);

    // Normalize
records = records.map((r) => ({
  ...r,

  // ✅ FIX: Ensure every record has a valid id
  id:
    r.id ??
    r.serial_id ??
    r.sid ??
    r._id ??
    r.item_id ??
    r.testing_id ??
    null,

  product_id:
    r.product_id ??
    r.productId ??
    r.productID ??
    selectedProductId ??
    null,

  serial_no:
    r.serial_no ??
    r.serial ??
    r.serialNumber ??
    r.serialNo ??
    null,

  tested_status:
    r.tested_status ??
    r.testStatus ??
    r.testedStatus ??
    r.status ??
    null,
}));

    // 🔍 Log After Normalization
    console.log("AFTER NORMALIZATION:", records);

    // Remove sold serials
    records = records.filter(
      (r) =>
        r.serial_no &&
        !alreadySoldSerials.includes(String(r.serial_no).trim())
    );

    // 🔍 Log After Sold Filter
    console.log("AFTER SOLD FILTER:", records);

    const from = serialFrom ? Number(serialFrom) : null;
    const to = serialTo ? Number(serialTo) : null;
    if (from !== null)
      records = records.filter(
        (r) => !isNaN(r.serial_no) && Number(r.serial_no) >= from
      );
    if (to !== null)
      records = records.filter(
        (r) => !isNaN(r.serial_no) && Number(r.serial_no) <= to
      );

    if (testFilter) {
      records = records.filter(
        (r) =>
          String(r.tested_status).toUpperCase() ===
          testFilter.toUpperCase()
      );
    }

    const storedInSale = (
      JSON.parse(localStorage.getItem("inSaleProducts") || "[]") || []
    ).map(String);

   const filtered = records;  

    // 🔍 FINAL DATA FOR TABLE
    console.log("FINAL TABLE DATA:", filtered);

    setTestingData(filtered);

    setSelectedSerials((prev) =>
      prev.filter((s) => filtered.some((r) => r.id === s))
    );

  } catch (err) {
    console.error("Error fetching testing data:", err);
    setTestingData([]);
    toast.error("Failed to fetch product serials");
  } finally {
    setLoading(false);
  }
};


  // ✅ Checkbox logic
  const handleCheckboxChange = (id) => {
    setSelectedSerials((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const handleUnselectAll = () => setSelectedSerials([]);
  const handleSelectAll = () =>
    setSelectedSerials(testingData.map((item) => item.id));

  const handleSubmit = () => {
    if (!selectedSerials.length) {
      toast.warning("Please select at least one product!");
      return;
    }

    const selectedProducts = testingData
      .filter((item) => selectedSerials.includes(item.id))
      .map((item) => ({
        serial_no: item.serial_no,
        product_id: String(item.product_id),
        product_name: getProductName(item),
      }));

    const stored = JSON.parse(localStorage.getItem("inSaleProducts") || "[]");
    const newIds = selectedProducts.map((p) => String(p.product_id));

    const duplicates = newIds.filter((id) => stored.includes(id));
    if (duplicates.length) {
      toast.info("Some selected products are already added!");
    }

    const updated = Array.from(new Set([...stored, ...newIds]));
    const stringified = updated.map(String);
    localStorage.setItem("inSaleProducts", JSON.stringify(stringified));

    window.dispatchEvent(new Event("inSaleProductsUpdated"));

    localStorage.setItem(
      "selectedProducts",
      JSON.stringify(selectedProducts)
    );

    if (onProductsSelected) onProductsSelected(selectedProducts);

    toast.success(`${selectedProducts.length} product(s) added successfully!`);
    navigate(-1);
  };

const getProductName = (item) => {
  if (!item) return "N/A";

  // If product is already a string (your case)
  if (typeof item.product === "string") return item.product;

  // If product is an object with name
  if (item.product?.name) return item.product.name;

  if (item.product_name) return item.product_name;

  const found = products.find(
    (p) => String(p.id) === String(item.product_id)
  );
  return found ? found.name : "N/A";
};


  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
    fetchProducts();
    fetchSoldSerials();
  }, []);

  useEffect(() => {
    fetchTestingData();
  }, [selectedProductId, testFilter, serialFrom, serialTo, inSaleProducts]);

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold">Add Product</h5>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          {/* Product Filter */}
          <Row className="mb-3 g-2">
            <Col md={3}>
              <Form.Select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">All Products</option>
                {products.length ? (
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No products found</option>
                )}
              </Form.Select>
            </Col>
          </Row>

          {/* Buttons */}
          <div className="d-flex justify-content-end align-items-center mb-3">
            <Button
              variant="outline-secondary"
              className="me-2"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleSubmit}>
              Add
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <>
              <Table bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th>
                      <Form.Check
                        type="checkbox"
                        checked={
                          selectedSerials.length === testingData.length &&
                          testingData.length > 0
                        }
                        onChange={(e) =>
                          e.target.checked
                            ? handleSelectAll()
                            : handleUnselectAll()
                        }
                      />
                    </th>
                    <th>Product</th>
                    <th>Serial No</th>
                    <th>Test Status</th>
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
                            checked={selectedSerials.includes(item.id)}
                            onChange={() => handleCheckboxChange(item.id)}
                          />
                        </td>
                        <td>{getProductName(item)}</td>
                        <td>{item.serial_no ?? "N/A"}</td>
                        <td>{item.tested_status ?? "N/A"}</td>
                        <td>Available</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </>
          )}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <p className="mb-0">Total: {testingData.length}</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
