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
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaQrcode } from "react-icons/fa";
import "../index.css";
import { API_BASE_URL } from "../api";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import DatePicker from "../components/DatePicker";
import QrScannerPage from "./QrScannerPage";


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
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteFrom, setDeleteFrom] = useState("");
  const [deleteTo, setDeleteTo] = useState("");
  const filteredProducts = products.filter((p) => {
    const serialNum = parseInt(String(p.serial_no || "").match(/\d+/)?.[0] ?? 0, 10);

    const fromNum = deleteFrom ? parseInt(deleteFrom.match(/\d+/)?.[0], 10) : null;
    const toNum = deleteTo ? parseInt(deleteTo.match(/\d+/)?.[0], 10) : null;

    const matchesSerialRange =
      (fromNum === null || serialNum >= fromNum) &&
      (toNum === null || serialNum <= toNum);

    const matchesSearchTerm = searchTerm
      ? String(p.serial_no || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(p.tested_by || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      : true;

    return matchesSerialRange && matchesSearchTerm;
  });



  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirst, indexOfLast);
  const [selectedSerials, setSelectedSerials] = useState({});

  // Delete range


  const [showQrScanner, setShowQrScanner] = useState(false);
  const [errors, setErrors] = useState({});
  const headerStyle = {
    headerBackground: "#f8f9fa",
    tableBorder: "1px solid #dee2e6",
    tableHeaderRow: {
      backgroundColor: "#2E3A59",
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
  const handleDeleteBySerial = (serial_no) => {
    const updated = products.filter((p) => p.serial_no !== serial_no);

    // Recalculate range
    if (updated.length > 0) {
      const serials = updated.map((p) => p.serial_no).sort();
      setForm((prev) => ({
        ...prev,
        fromSerial: serials[0],
        toSerial: serials[serials.length - 1],
        quantity: updated.length,
      }));
    } else {
      setForm((prev) => ({ ...prev, fromSerial: "", toSerial: "", quantity: 0 }));
    }

    setProducts(updated);
    toast.info(`Deleted serial ${serial_no} from list.`);
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

        const formattedDate =
          data.tested_date
            ? new Date(data.tested_date).toISOString().split("T")[0]
            : data.items[0]?.tested_date
              ? new Date(data.items[0].tested_date).toISOString().split("T")[0]
              : "";

        setForm({
          productType: data.product_type?.id || "",
          product_id: data.product?.id || "",
          firmwareVersion: data.firmware_version || "",
          testedBy: data.tested_by || data.items[0]?.tested_by || "",
          quantity: data.quantity || "",
          fromSerial: data.from_serial,
          toSerial: data.to_serial,
          testedDate: formattedDate, // ✅ formatted for the date input
        });

 const itemsWithRange = data.items.map((item) => ({
  ...item,
  from_serial: data.from_serial,
  to_serial: data.to_serial,
  quantity: 1,
  tested_status: item.tested_status || "PENDING",
}));


        setProducts(itemsWithRange);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load inventory range!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeFromSerial, routeToSerial]);

  useEffect(() => {
    setSelectedSerials((prev) => {
      let changed = false;
      const updated = { ...prev };
      filteredProducts.forEach(p => {
        if (updated[p.serial_no] === undefined) {
          updated[p.serial_no] = true;   // 👈 this forces selection
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [filteredProducts]);


  const handleChange = (e) => {
    setErrors({ ...errors, [e.target.name]: "" });
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "testedBy") {
      const updated = products.map((p) => ({ ...p, tested_by: value }));
      setProducts(updated);
    }
  };
  const handleRowChange = (serial_no, field, value) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.serial_no === serial_no ? { ...p, [field]: value } : p
      )
    );
  };


  const handleDelete = (index) => {
    const updated = products.filter((_, i) => i !== index);

    if (updated.length > 0) {
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
        const existing = updated.find((p) => p.serial_no === serial);
        fullRange.push(
          existing || {
            serial_no: serial,
            tested_by: form.testedBy,
            tested_status: ["PENDING"],
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



  const handleDeleteRange = () => {
    if (!deleteFrom || !deleteTo) {
      toast.error("Please provide both From and To serials for deletion.");
      return;
    }

    const prefixStart = deleteFrom.match(/[^\d]+/)?.[0] || "";
    const prefixEnd = deleteTo.match(/[^\d]+/)?.[0] || "";
    const startNum = parseInt(deleteFrom.match(/\d+/)?.[0], 10);
    const endNum = parseInt(deleteTo.match(/\d+/)?.[0], 10);

    if (prefixStart !== prefixEnd || isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
      toast.error("Invalid serial range for deletion.");
      return;
    }

    // Only consider currently filtered products
    const filteredSerialsToDelete = filteredProducts.filter((p) => {
      const num = parseInt(p.serial_no.match(/\d+/)?.[0], 10);
      return p.serial_no.startsWith(prefixStart) && num >= startNum && num <= endNum;
    }).map(p => p.serial_no);

    if (filteredSerialsToDelete.length === 0) {
      toast.info("No matching serials in the current filtered list.");
      return;
    }

    const updated = products.filter((p) => !filteredSerialsToDelete.includes(p.serial_no));

    setProducts(updated);
    toast.success(`Deleted serial numbers from ${deleteFrom} to ${deleteTo} (filtered list).`);
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
  const handleDeleteSelected = () => {
    // Get all serials currently visible in the filtered table that are checked
    const serialsToDelete = currentItems
      .filter(p => selectedSerials[p.serial_no])
      .map(p => p.serial_no);

    if (serialsToDelete.length === 0) {
      toast.info("No serials selected for deletion.");
      return;
    }

    const updatedProducts = products.filter(p => !serialsToDelete.includes(p.serial_no));

    setProducts(updatedProducts);

    // Reset selection for only deleted items
    const newSelected = { ...selectedSerials };
    serialsToDelete.forEach(sn => delete newSelected[sn]);
    setSelectedSerials(newSelected);

    toast.success(`Deleted ${serialsToDelete.length} product(s).`);
  };




  const handleAddProductRange = () => {
    const { fromSerial, toSerial } = form; // remove testedBy
    let newErrors = {};

    if (!fromSerial) newErrors.fromSerial = "From Serial is required.";
    if (!toSerial) newErrors.toSerial = "To Serial is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required serial fields.");
      return;
    }

    if (!validateSerialRange(fromSerial, toSerial)) {
      setErrors({ fromSerial: "Invalid serial range", toSerial: "Invalid serial range" });
      toast.error("Invalid serial range. Check prefixes and numbers.");
      return;
    }

    const prefix = fromSerial.match(/[^\d]+/)?.[0] || "";
    const start = parseInt(fromSerial.match(/\d+/)?.[0], 10);
    const end = parseInt(toSerial.match(/\d+/)?.[0], 10);

    const newProducts = [];
    for (let i = start; i <= end; i++) {
      const serial = `${prefix}${i
        .toString()
        .padStart(fromSerial.length - prefix.length, "0")}`;
      if (!products.find((p) => p.serial_no === serial)) {
        newProducts.push({
          serial_no: String(i),
          tested_by: form.testedBy || "",        // allow empty
          tested_status: ["PENDING"],            // default PENDING if empty
          test_remarks: "",
          from_serial: fromSerial,
          to_serial: toSerial,
          quantity: 1,
        });
      }
    }

    const updatedProducts = [...products, ...newProducts].sort((a, b) =>
      a.serial_no.localeCompare(b.serial_no)
    );
    setProducts(updatedProducts);

    setForm((prev) => ({
      ...prev,
      fromSerial: updatedProducts[0].serial_no,
      toSerial: updatedProducts[updatedProducts.length - 1].serial_no,
      quantity: updatedProducts.length,
    }));
    setErrors({});
    toast.success(`${newProducts.length} new serial numbers added from range.`);
  };


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

    const existingProductIndex = products.findIndex((p) => p.serial_no === serialNumber);

    if (existingProductIndex === -1) {
      const newProduct = {
        serial_no: serialNumber,
        tested_by: form.testedBy,
        tested_status: ["PASS"],
        test_remarks: "",
        from_serial: form.fromSerial,
        to_serial: form.toSerial,
        quantity: 1,
      };

      const updatedProducts = [...products, newProduct].sort((a, b) =>
        a.serial_no.localeCompare(b.serial_no)
      );
      setProducts(updatedProducts);

      setForm((prev) => ({
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
      toast.error("Please select both Product Type and Product.");
      return;
    }

    if (products.length === 0) {
      toast.error("The product list cannot be empty.");
      return;
    }

    try {
      const payload = {
        product_id: parseInt(form.product_id, 10),
        product_type_id: parseInt(form.productType, 10),
        firmware_version: form.firmwareVersion || "",
        tested_date: form.testedDate || new Date().toISOString().split("T")[0],
        tested_by: form.testedBy || "",
        items: products.map((p) => ({
          serial_no: String(p.serial_no || ""), // ✅ Force string
          tested_by: p.tested_by || "",
          tested_status: p.tested_status || "PENDING",

          tested_date:
            p.tested_date || form.testedDate || new Date().toISOString().split("T")[0],
          from_serial: String(form.fromSerial || ""), // ✅ Also ensure strings
          to_serial: String(form.toSerial || ""),
          quantity: p.quantity || 1,
          test_remarks: p.test_remarks || "",
        })),
      };


      const response = await axios.put(
        `${API_BASE_URL}/inventory/serialrange/${routeFromSerial}/${routeToSerial}`,
        payload
      );

      if (response.status === 200) {
        toast.success("Inventory updated successfully!");
        setTimeout(() => {
          navigate("/assemble");
        }, 1000);
      } else {
        toast.error("Failed to update inventory.");
      }

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


      <Row className="align-items-center mb-3">
        <Col>
          <h4>Edit Assemble</h4>
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

      <Card className="p-4 mb-3" style={{ position: "relative" }}>
        <h5 className="mb-4">Product Details</h5>

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
              <Form.Select name="productType" value={form.productType} onChange={handleChange}>
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
              <Form.Select name="product_id" value={form.product_id} onChange={handleChange}>
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
              <Form.Control name="firmwareVersion" value={form.firmwareVersion} onChange={handleChange} />
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

        <Row className="mb-3 g-3">
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
          <Col md={2} className="d-flex align-items-end">
            <Button variant="success" onClick={handleAddProductRange} className="w-100">
              Add product
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Search & Delete Range Controls */}
      <Row className="mb-3">
        <Col md={4}>
          <div className="search-input-wrapper">
            <Col>
              <div className="search-input-wrapper">
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="Search serials..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {/* {searchTerm && (
               <i
                 className="bi bi-x search-clear-icon"
                 onClick={() => {
                   setSearchTerm("");
                   setCurrentPage(1);
                 }}
               />
             )} */}
              </div>
            </Col>
            {searchTerm && (
              <span
                className="search-clear-icon"
                onClick={() => setSearchTerm('')}
              >
                &times;
              </span>
            )}
          </div>
        </Col>
        <Col md={3}>
          <div className="search-input-wrapper">
            <Form.Control
              placeholder="Delete From Serial"
              value={deleteFrom}
              onChange={(e) => setDeleteFrom(e.target.value)}
            />
            {deleteFrom && (
              <i
                className="bi bi-x search-clear-icon"
                onClick={() => setDeleteFrom("")}
              />
            )}
          </div>
        </Col>

        <Col md={3}>
          <div className="search-input-wrapper">
            <Form.Control
              placeholder="Delete To Serial"
              value={deleteTo}
              onChange={(e) => setDeleteTo(e.target.value)}
            />
            {deleteTo && (
              <i
                className="bi bi-x search-clear-icon"
                onClick={() => setDeleteTo("")}
              />
            )}
          </div>
        </Col>

        <Col md={2}>
          <Button
            variant="danger"
            onClick={handleDeleteSelected}
            className="d-flex justify-content-center align-items-center"
          >
            <IoTrashOutline />
          </Button>

        </Col>
      </Row>


      <Card>
        <Card.Body style={headerStyle.contentArea}>
          <h5 className="mb-3">Product List</h5>
          <Table bordered hover responsive size="sm">
            <thead style={headerStyle.tableHeaderRow}>
              <tr>
                <th>Select</th>

                <th>Serial No</th>
                <th>Tested By</th>
                <th>Test Status</th>
                <th>Test Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((product) => (
                  <tr key={product.serial_no}>
                    {/* Checkbox for selecting row */}
                    <td className="text-center">
                      {(searchTerm || deleteFrom || deleteTo) ? (
                        <Form.Check
                          type="checkbox"
                          checked={!!selectedSerials[product.serial_no]}
                          onChange={(e) =>
                            setSelectedSerials((prev) => ({
                              ...prev,
                              [product.serial_no]: e.target.checked,
                            }))
                          }
                        />
                      ) : null}
                    </td>

                    {/* Serial Number */}
                    <td>
                      <Form.Control
                        type="text"
                        value={product.serial_no || ""}
                        readOnly
                      />
                    </td>

                    {/* Tested By */}
                    <td>
                      <Form.Control
                        type="text"
                        value={product.tested_by ?? ""}
                        placeholder="Enter name"
                        onChange={(e) =>
                          handleRowChange(product.serial_no, "tested_by", e.target.value)
                        }
                      />
                    </td>

                    {/* Test Status */}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Check
                          inline
                          label="PASS"
                          type="radio"
                          name={`status-${product.serial_no}`}
                          checked={product.tested_status === "PASS"}
                          onChange={() =>
                            handleRowChange(product.serial_no, "tested_status", "PASS")
                          }
                        />
                        <Form.Check
                          inline
                          label="FAIL"
                          type="radio"
                          name={`status-${product.serial_no}`}
                          checked={product.tested_status === "FAIL"}
                          onChange={() =>
                            handleRowChange(product.serial_no, "tested_status", "FAIL")
                          }
                        />
                      </div>
                    </td>

                    {/* Test Remarks */}
                    <td>
                      <Form.Control
                        type="text"
                        value={product.test_remarks ?? ""}
                        placeholder="Add remarks"
                        onChange={(e) =>
                          handleRowChange(product.serial_no, "test_remarks", e.target.value)
                        }
                      />
                    </td>

                    {/* Action: Delete single row */}
                    <td className="text-center">
                      <IoTrashOutline
                        style={headerStyle.actionIcon}
                        onClick={() => handleDeleteBySerial(product.serial_no)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No products added yet.
                  </td>
                </tr>
              )}
            </tbody>

          </Table>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <Button variant="outline-black" size="sm" onClick={prevPage} disabled={currentPage === 1}>
              <IoChevronBack /> Prev
            </Button>
            <span>
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline-black"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Next <IoChevronForward />
            </Button>
          </div>
        </Card.Body>
      </Card>

      <div className="text-end mt-3">
        <Button variant="success" onClick={handleSubmit}>
          update
        </Button>
      </div>

      <QrScannerPage
        show={showQrScanner}                // passes the visibility state
        onScanSuccess={handleScan}          // passes your scan handler
        onClose={() => setShowQrScanner(false)} // closes the modal
      />
    </Container>
  );
}
