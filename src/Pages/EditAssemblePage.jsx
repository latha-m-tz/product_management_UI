import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Card,
  Row,
  Col,
  Container,
  Spinner,
} from "react-bootstrap";
import {
  IoArrowBack,
  IoTrashOutline,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaQrcode } from "react-icons/fa";
import QrScannerPage from "./QrScannerPage";
import { toast, ToastContainer } from "react-toastify";
import '../index.css';
import { API_BASE_URL } from "../api";
// import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import DatePicker from "../components/DatePicker";
export default function EditAssemblePage() {
  const { fromSerial: routeFromSerial, toSerial: routeToSerial } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    productType: "",
    product_id: "",
    firmwareVersion: "",
    testedBy: "",
    quantity: "",
    fromSerial: "",
    toSerial: "",
    testedDate: "",
  });

  const [productTypes, setProductTypes] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
// Search
const [searchTerm, setSearchTerm] = useState("");
const totalPages = Math.ceil(products.length / itemsPerPage);
const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;
const currentItems = products.slice(indexOfFirst, indexOfLast);

  const [showQrScanner, setShowQrScanner] = useState(false);
  const [errors, setErrors] = useState({});
const headerStyle = {
    headerBackground: "#f8f9fa",
    tableBorder: "1px solid #dee2e6",
    tableHeaderRow: {
        backgroundColor: "#2E3A59", // Using ProductPage's header color for consistency
        color: "white",
        fontSize: "0.82rem",
        height: "40px",
        verticalAlign: "middle",
    },
    actionIcon: {
        color: "#dc3545",
        cursor: "pointer",
        fontSize: "1rem",
    },
    contentArea: {
        padding: "20px",
    },
};
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, productsRes, rangeRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/product-types`),
          axios.get(`${API_BASE_URL}/product`),
          axios.get(
            `${API_BASE_URL}/inventory/serialrange/${routeFromSerial}/${routeToSerial}`
          ),
        ]);

        setProductTypes(typesRes.data);
        setAllProducts(productsRes.data);

        const data = rangeRes.data;

        setForm({
          productType: data.product_type?.id || "",
          product_id: data.product?.id || "",
          firmwareVersion: data.firmware_version || "",
          // Use the tested_by from the form's initial data structure, or fallback to the first item's tested_by
          testedBy: data.tested_by || data.items[0]?.tested_by || "",
          quantity: data.quantity || "",
          fromSerial: data.from_serial,
          toSerial: data.to_serial,
          testedDate: data.tested_date || data.items[0]?.tested_date || "",
        });

        const itemsWithRange = data.items.map((item) => ({
          ...item,
          from_serial: data.from_serial,
          to_serial: data.to_serial,
          quantity: 1,
          // Ensure tested_status is an array containing a single string status for checkbox logic
          tested_status: item.tested_status ? [item.tested_status] : ["PENDING"],
        }));

        setProducts(itemsWithRange);
      } catch (err) {
        console.error(err);
        // Replace alert with toast.error
        toast.error("Failed to load inventory range!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeFromSerial, routeToSerial]);

  const handleChange = (e) => {
    setErrors({ ...errors, [e.target.name]: "" });
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "testedBy") {
      // Update all items' tested_by when the main form field changes
      const updated = products.map((p) => ({ ...p, tested_by: value }));
      setProducts(updated);
    }
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...products];
    if (field === "tested_status") {
      // Toggle PASS/FAIL status, ensuring only one is selected by overriding the array with the new value
      if (value === "PASS") {
        updated[index][field] = ["PASS"];
      } else if (value === "FAIL") {
        updated[index][field] = ["FAIL"];
      } else {
        updated[index][field] = []; // Should not happen with current logic, but keeps it safe
      }
    } else {
      updated[index][field] = value;
    }
    setProducts(updated);

    // Update form serial range if serial_no was changed
    if (field === "serial_no") {
      const serials = updated.map((p) => p.serial_no).sort();
      setForm((prev) => ({
        ...prev,
        fromSerial: serials[0] || "",
        toSerial: serials[serials.length - 1] || "",
        quantity: updated.length,
      }));
    }
  };

  const handleDelete = (index) => {
    const updated = products.filter((_, i) => i !== index);

    if (updated.length > 0) {
      // Rebuild full range from first to last serial
      const serials = updated.map((p) => p.serial_no).sort();
      const firstSerial = serials[0];
      const lastSerial = serials[serials.length - 1];
      const prefix = firstSerial.match(/[^\d]+/)?.[0] || "";
      const startNum = parseInt(firstSerial.match(/\d+/)?.[0], 10);
      const endNum = parseInt(lastSerial.match(/\d+/)?.[0], 10);

      const fullRange = [];
      for (let i = startNum; i <= endNum; i++) {
        const serial = `${prefix}${i.toString().padStart(
          firstSerial.length - prefix.length,
          "0"
        )}`;
        // Keep existing product info if it exists, otherwise create a default/placeholder item
        const existing = updated.find((p) => p.serial_no === serial);
        fullRange.push(
          existing || {
            serial_no: serial,
            tested_by: form.testedBy,
            tested_status: ["PENDING"], // Default status for new items in range
            test_remarks: "",
            from_serial: firstSerial,
            to_serial: lastSerial,
            quantity: 1,
          }
        );
      }

      setProducts(fullRange);

      setForm((prev) => ({
        ...prev,
        fromSerial: firstSerial,
        toSerial: lastSerial,
        quantity: fullRange.length,
      }));
    } else {
      setProducts([]);
      setForm((prev) => ({ ...prev, fromSerial: "", toSerial: "", quantity: "" }));
    }
    toast.info("Item deleted from list and range recalculated.");
  };

  const validateSerialRange = (startSN, endSN) => {
    const prefixStart = startSN.match(/[^\d]+/)?.[0] || "";
    const prefixEnd = endSN.match(/[^\d]+/)?.[0] || "";
    const startNum = parseInt(startSN.match(/\d+/)?.[0], 10);
    const endNum = parseInt(endSN.match(/\d+/)?.[0], 10);

    if (prefixStart !== prefixEnd) return false;
    if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) return false;

    return true;
  };

  const handleAddProductRange = () => {
    const { fromSerial, toSerial, testedBy } = form;
    let newErrors = {};

    if (!fromSerial) newErrors.fromSerial = "From Serial is required.";
    if (!toSerial) newErrors.toSerial = "To Serial is required.";
    if (!testedBy) newErrors.testedBy = "Tested By is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Show toast for validation error
      toast.error("Please fill in all required serial and tester fields.");
      return;
    }

    if (!validateSerialRange(fromSerial, toSerial)) {
      setErrors({ fromSerial: "Invalid serial range", toSerial: "Invalid serial range" });
      // Show toast for invalid range
      toast.error("Invalid serial range. Check prefixes and numbers.");
      return;
    }

    const prefix = fromSerial.match(/[^\d]+/)?.[0] || "";
    const start = parseInt(fromSerial.match(/\d+/)?.[0], 10);
    const end = parseInt(toSerial.match(/\d+/)?.[0], 10);

    const newProducts = [];
    for (let i = start; i <= end; i++) {
      const serial = `${prefix}${i.toString().padStart(fromSerial.length - prefix.length, "0")}`;
      // Only add serial numbers that are NOT already in the products list
      if (!products.find((p) => p.serial_no === serial)) {
        newProducts.push({
          serial_no: serial,
          tested_by: testedBy,
          tested_status: ["PASS"],
          test_remarks: "",
          from_serial: fromSerial,
          to_serial: toSerial,
          quantity: 1,
        });
      }
    }

    if (newProducts.length === 0 && products.length > 0) {
      toast.info("All serial numbers in the range are already in the list.");
      return;
    } else if (newProducts.length === 0 && products.length === 0) {
      toast.error("The serial range is invalid or empty.");
      return;
    }

    // Combine existing products and new products, then sort
    const updatedProducts = [...products, ...newProducts].sort((a, b) =>
      a.serial_no.localeCompare(b.serial_no)
    );
    setProducts(updatedProducts);

    // Update form to reflect the newly calculated full range
    setForm((prev) => ({
      ...prev,
      fromSerial: updatedProducts[0].serial_no,
      toSerial: updatedProducts[updatedProducts.length - 1].serial_no,
      quantity: updatedProducts.length,
    }));
    setErrors({});
    toast.success(`${newProducts.length} new serial numbers added from range.`);
  };

  // 3. HANDLE SCAN FUNCTION
  const handleScan = (serialNumber) => {
    setShowQrScanner(false);
    if (!serialNumber) {
      toast.error("Failed to scan QR code.");
      return;
    }

    if (!form.testedBy) {
      setErrors({ ...errors, testedBy: "Tested By is required to add a serial." });
      toast.error("Please fill in the 'Tested By' field first.");
      return;
    }

    const existingProductIndex = products.findIndex(p => p.serial_no === serialNumber);

    if (existingProductIndex === -1) {
      // If it's a new serial not in the current list, treat it as a new serial to be added to the range
      const newProduct = {
        serial_no: serialNumber,
        tested_by: form.testedBy, // Use the current testedBy from form
        tested_status: ["PASS"], // Default status
        test_remarks: "",
        from_serial: form.fromSerial, // Will be updated globally below
        to_serial: form.toSerial, // Will be updated globally below
        quantity: 1,
      };

      const updatedProducts = [...products, newProduct].sort((a, b) =>
        a.serial_no.localeCompare(b.serial_no)
      );
      setProducts(updatedProducts);

      // Update form serial range to include the new product
      setForm(prev => ({
        ...prev,
        fromSerial: updatedProducts[0].serial_no,
        toSerial: updatedProducts[updatedProducts.length - 1].serial_no,
        quantity: updatedProducts.length,
      }));

      toast.success(`Serial number ${serialNumber} added to the list.`);
    } else {
      toast.info(`Serial number ${serialNumber} is already in the list.`);
    }
  };


  const handleSubmit = async () => {
    if (!form.productType || !form.product_id) {
      // Replace alert with toast.error
      toast.error("Please select both Product Type and Product.");
      return;
    }

    // Check if there are any products to save
    if (products.length === 0) {
      toast.error("The product list cannot be empty.");
      return;
    }

    // Simple check to ensure all products have a tested_by field
    const missingTestedBy = products.some(p => !p.tested_by);
    if (missingTestedBy) {
      toast.error("All serial numbers must have a 'Tested By' value.");
      return;
    }


    try {
      const payload = {
        product_id: parseInt(form.product_id, 10),
        product_type_id: parseInt(form.productType, 10),
        firmware_version: form.firmwareVersion,
        tested_date: form.testedDate || new Date().toISOString().split("T")[0],
        tested_by: form.testedBy, // Include main testedBy in payload
        items: products.map((p) => ({
          serial_no: p.serial_no,
          tested_by: p.tested_by || form.testedBy || "Unknown",
          tested_status:
            Array.isArray(p.tested_status) && p.tested_status.length > 0
              ? p.tested_status[0]
              : "PENDING", // string, required
          tested_date: p.tested_date || form.testedDate || new Date().toISOString().split("T")[0],
          from_serial: form.fromSerial,
          to_serial: form.toSerial,
          quantity: p.quantity || 1,
          test_remarks: p.test_remarks || "",
        })),
      };

      await axios.put(
        `${API_BASE_URL}/inventory/serialrange/${routeFromSerial}/${routeToSerial}`,
        payload
      );

      toast.success("Inventory updated successfully! 🎉");
      navigate("/assemble");
    } catch (err) {
      console.error(err.response?.data || err);
      const errorMessage = err.response?.data?.message || "Error updating inventory.";
      toast.error(errorMessage);
    }
  };


  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="main-container">
      {/* 5. ADD TOASTCONTAINER */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />



      <Row className="align-items-center mb-3">
        <Col>
          <h4>Edit Inventory Range</h4>
        </Col>
        <Col className="text-end">
                     <Button
        variant="outline-secondary"
        size="sm"
        className="me-2"
        onClick={() => navigate("/assemble")}
    >
        <i className="bi bi-arrow-left"></i> Back
    </Button>
        </Col>
      </Row>

      {/* Product Details Form */}
      <Card className="p-4 mb-3" style={{ position: "relative" }}>
        <h5 className="mb-4">Product Details</h5>

        {/* 6. QR SCANNER BUTTON */}
        <div className="qr-scanner-button" onClick={() => setShowQrScanner(true)}>
          <div className="qr-scanner-icon-container">
            <FaQrcode />
          </div>
          <span className="qr-scanner-text">QR code scanner</span>
        </div>

        <Row className="mb-3 g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Product Type</Form.Label>
              <Form.Select
                name="productType"
                value={form.productType}
                onChange={handleChange}
              >
                <option value="">Select</option>
                {productTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Product</Form.Label>
              <Form.Select
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
              >
                <option value="">Select</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Firmware Version</Form.Label>
              <Form.Control
                name="firmwareVersion"
                value={form.firmwareVersion}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3 g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Quantity</Form.Label>
              <Form.Control value={products.length} readOnly />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>From Serial</Form.Label>
              <Form.Control
                name="fromSerial"
                value={form.fromSerial}
                onChange={handleChange}
                isInvalid={!!errors.fromSerial}
              />
              <Form.Control.Feedback type="invalid">{errors.fromSerial}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>To Serial</Form.Label>
              <Form.Control
                name="toSerial"
                value={form.toSerial}
                onChange={handleChange}
                isInvalid={!!errors.toSerial}
              />
              <Form.Control.Feedback type="invalid">{errors.toSerial}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3 g-3 align-items-end">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Tested Date</Form.Label>
              <Form.Control
                type="date"
                name="testedDate"
                value={form.testedDate}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Tested By</Form.Label>
              <Form.Control
                name="testedBy"
                value={form.testedBy}
                onChange={handleChange}
                isInvalid={!!errors.testedBy}
              />
              <Form.Control.Feedback type="invalid">{errors.testedBy}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Button variant="success" onClick={handleAddProductRange} className="w-100">
              + Add Product
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      {products.length > 0 && (
        
        <Card className="p-4">
          <Table responsive bordered>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Serial No</th>
                <th>Tested By</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((row, i) => (
                <tr key={indexOfFirst + i}>
                  <td>{indexOfFirst + i + 1}</td>
                  <td>
                    <Form.Control
                      value={row.serial_no || ""}
                      onChange={(e) =>
                        handleRowChange(indexOfFirst + i, "serial_no", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <Form.Control
                      value={row.tested_by || ""}
                      onChange={(e) =>
                        handleRowChange(indexOfFirst + i, "tested_by", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    {/* Checkboxes for PASS/FAIL status */}
                    <div className="d-flex gap-2 custom-checkbox-color">
                      <Form.Check
                        inline
                        label="Pass"
                        type="checkbox"
                        checked={row.tested_status.includes("PASS")}
                        onChange={() =>
                          handleRowChange(indexOfFirst + i, "tested_status", "PASS")
                        }
                      />
                      <Form.Check
                        inline
                        label="Fail"
                        type="checkbox"
                        checked={row.tested_status.includes("FAIL")}
                        onChange={() =>
                          handleRowChange(indexOfFirst + i, "tested_status", "FAIL")
                        }
                      />
                    </div>

                  </td>
                  <td>
                    <Form.Control
                      value={row.test_remarks || ""}
                      onChange={(e) =>
                        handleRowChange(indexOfFirst + i, "test_remarks", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <Button variant="link" onClick={() => handleDelete(indexOfFirst + i)}>
                      <IoTrashOutline style={{ color: "red" }} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center">
            <Button variant="light" onClick={prevPage} disabled={currentPage === 1}>
              <IoChevronBack /> Prev
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="light"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Next <IoChevronForward />
            </Button>
          </div>

          <div className="d-flex justify-content-end mt-3 gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleSubmit}>
              Save
            </Button>
          </div>
        </Card>
      )}

      {/* 5. ADD QRSCANNERPAGE COMPONENT */}
      <QrScannerPage
        show={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScanSuccess={handleScan}
      />
    </Container>
  );
}