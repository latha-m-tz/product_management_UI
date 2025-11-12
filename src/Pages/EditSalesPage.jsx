import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Card, Table, Spinner, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";
import { API_BASE_URL } from "../api";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { IoTrashOutline } from "react-icons/io5";

export default function EditSalesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [shipmentName, setShipmentName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]); // ✅ grouped items: [{product_id, name, quantity}]
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const MySwal = withReactContent(Swal);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  // ✅ Fetch customers
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/customers/get`)
      .then((res) => setCustomers(res.data))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

const groupProducts = (serialItems) => {
  const grouped = {};
  serialItems.forEach((item) => {
    const pid = item.product_id;

    if (!grouped[pid]) {
      grouped[pid] = {
        product_id: pid,
        name:
          (typeof item.product === "string"
            ? item.product
            : item.product?.name) ||
          item.name ||
          "Unknown Product",
        serials: [], // ✅ store hidden serial numbers
        quantity: 0,
      };
    }

    grouped[pid].serials.push(item.serial_no); // ✅ keep serials internally
    grouped[pid].quantity += 1;
  });

  // ✅ Each product will have serial numbers internally
  return Object.values(grouped);
};




  // ✅ Load sale for edit or draft
  useEffect(() => {
    const draft = localStorage.getItem("draftSale");
    if (draft) {
      const data = JSON.parse(draft);
      setCustomerId(data.customer_id || "");
      setChallanNo(data.challan_no || "");
      setChallanDate(data.challan_date || "");
      setShipmentDate(data.shipment_date || "");
      setShipmentName(data.shipment_name || "");
      setNotes(data.notes || "");
      setItems(groupProducts(data.items || []));
      localStorage.removeItem("draftSale");
    } else if (id) {
      axios
        .get(`${API_BASE_URL}/sales/${id}`)
        .then((res) => {
          const sale = res.data;
          setCustomerId(sale.customer?.id || "");
          setChallanNo(sale.challan_no);
          setChallanDate(sale.challan_date);
          setShipmentDate(sale.shipment_date);
          setShipmentName(sale.shipment_name || "");
          setNotes(sale.notes || "");
          setItems(groupProducts(sale.items || []));
        })
        .catch(() => toast.error("Failed to load sale data"));
    }
  }, [id]);

const loadSelectedProducts = () => {
  const stored = localStorage.getItem("selectedProducts");
  if (!stored) return;

  try {
    const selected = JSON.parse(stored);
    if (!Array.isArray(selected)) return;

    setItems((prevItems) => {
      const updated = [...prevItems];
      selected.forEach((p) => {
        // Prevent duplicates (by serial_no)
        const exists = updated.some((i) => i.serial_no === p.serial_no);
        if (!exists) {
          updated.push({
            product_id: p.product_id,
            name: p.name || "Unknown Product",
            serial_no: p.serial_no, // ✅ Hidden but stored
            quantity: 1,
          });
        }
      });
      return updated;
    });

    localStorage.removeItem("selectedProducts");
  } catch (err) {
    console.error("Error parsing selectedProducts:", err);
  }
};


  useEffect(() => {
    loadSelectedProducts();
    const handleFocus = () => loadSelectedProducts();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") loadSelectedProducts();
    });
    return () => window.removeEventListener("focus", handleFocus);
  }, []);
const validateForm = () => {
  const errors = {};

  console.log("🧩 Starting validation...");
  console.log("Customer ID:", customerId);
  console.log("Challan No:", challanNo);
  console.log("Challan Date:", challanDate);
  console.log("Shipment Date:", shipmentDate);
  console.log("Shipment Name:", shipmentName);
  console.log("Items:", items);

  // --- Header fields validation ---
  if (!customerId) {
    errors.customerId = "Customer is required";
    console.log("❌ Missing Customer ID");
  }

  if (!challanNo.trim()) {
    errors.challanNo = "Challan No is required";
    console.log("❌ Missing Challan No");
  }

  if (!challanDate) {
    errors.challanDate = "Challan Date is required";
    console.log("❌ Missing Challan Date");
  }

  if (!shipmentDate) {
    errors.shipmentDate = "Shipment Date is required";
    console.log("❌ Missing Shipment Date");
  } else if (new Date(shipmentDate) < new Date(challanDate)) {
    errors.shipmentDate = "Shipment Date cannot be before Challan Date";
    console.log("❌ Shipment date before challan date");
  }

  if (!shipmentName.trim()) {
    errors.shipmentName = "Shipment Name is required";
    console.log("❌ Missing Shipment Name");
  }

  // --- Items validation ---
  if (items.length === 0) {
    errors.items = "Please add at least one product";
    console.log("❌ No items added");
  } else {
    items.forEach((item, index) => {
      console.log(`🧾 Checking item ${index + 1}:`, item);

      if (!item.product_id) {
        errors[`item_${index}_product`] = `Product missing at row ${index + 1}`;
        console.log(`❌ Item ${index + 1} missing product_id`);
      }

      if (!item.serials || item.serials.length === 0) {
        errors[`item_${index}_serials`] = `No serial numbers for product ${item.name || "Unknown"}`;
        console.log(`❌ Item ${index + 1} missing serials`);
      }

      if (!item.quantity || item.quantity <= 0) {
        errors[`item_${index}_quantity`] = `Invalid quantity for ${item.name || "Unknown"}`;
        console.log(`❌ Item ${index + 1} invalid quantity`);
      }
    });
  }

  setFormErrors(errors);

  const isValid = Object.keys(errors).length === 0;
  console.log("✅ Validation result:", isValid ? "PASS" : "FAIL", errors);
  return isValid;
};



const handleSave = async () => {
  if (!validateForm()) {
    toast.warning("Please fix the highlighted errors!");
    return;
  }

  const expandedItems = items.flatMap((item) =>
    item.serials?.map((serial) => ({
      product_id: item.product_id,
      serial_no: serial,
      quantity: 1,
    })) || []
  );

  const payload = {
    customer_id: parseInt(customerId),
    challan_no: challanNo.trim(),
    challan_date: challanDate,
    shipment_date: shipmentDate,
    shipment_name: shipmentName.trim(),
    notes: notes.trim(),
    items: expandedItems,
  };

  try {
    await axios.put(`${API_BASE_URL}/sales/${id}`, payload);
    toast.success("Sale updated successfully!");
    navigate("/sales-order");
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to update sale!");
  }
};


  const handleDeleteItem = (index) => {
    MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const deleted = items[index];
        setItems(items.filter((_, i) => i !== index));
        toast.success(`${deleted.name} removed successfully!`);
      }
    });
  };

  return (
    <div className="container-fluid px-4 py-4 bg-light min-vh-100">
      <Row className="align-items-center mb-3">
        <Col>
          <h4>Edit Sale</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => navigate("/sales-order")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-3" style={{ backgroundColor: "#f4f4f8" }}>
        <Card.Body>
          <Form>
            {/* Customer Details */}
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Customer</Form.Label>
                  <Form.Select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    isInvalid={!!formErrors.customerId}
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.customer} ({cust.city})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.customerId}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Challan No</Form.Label>
                  <Form.Control
                    type="text"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    isInvalid={!!formErrors.challanNo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.challanNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Challan Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={challanDate}
                    onChange={(e) => setChallanDate(e.target.value)}
                    isInvalid={!!formErrors.challanDate}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Shipment Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => setShipmentDate(e.target.value)}
                    isInvalid={!!formErrors.shipmentDate}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Shipment Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={shipmentName}
                    onChange={(e) => setShipmentName(e.target.value)}
                    isInvalid={!!formErrors.shipmentName}
                  />
                </Form.Group>
              </div>
            </div>

            {/* Products Table */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label>Products</Form.Label>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    const draftSale = {
                      customer_id: customerId,
                      challan_no: challanNo,
                      challan_date: challanDate,
                      shipment_date: shipmentDate,
                      shipment_name: shipmentName,
                      notes: notes,
                      items,
                    };
                    localStorage.setItem("draftSale", JSON.stringify(draftSale));
                    navigate("/add-product");
                  }}
                >
                  + Add Product
                </Button>
              </div>

              {formErrors.items && (
                <div className="text-danger mb-2">{formErrors.items}</div>
              )}

              {items.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, index) => (
                      <tr key={startIndex + index}>
                        <td>{item.name}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min="1"
                            value={item.quantity}
                            readOnly
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[startIndex + index].quantity = parseInt(
                                e.target.value || 1
                              );
                              setItems(newItems);
                            }}
                          />
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteItem(startIndex + index)}
                          >
                            <IoTrashOutline />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-muted">No products added</div>
              )}
            </div>

            <div className="mt-4 d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => navigate("/sales-order")}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleSave}>
                Update
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
