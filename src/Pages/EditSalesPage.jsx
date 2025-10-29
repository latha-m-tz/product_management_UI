import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Form, Card, Table, Spinner, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";

import { API_BASE_URL } from "../api";
import Breadcrumb from "../components/BreadCrumb";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { IoTrashOutline } from "react-icons/io5";

export default function EditSalesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [shipmentName, setShipmentName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const MySwal = withReactContent(Swal);

  // ✅ Load customers
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/customers/get`)
      .then((res) => setCustomers(res.data))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

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
      setItems(data.items || []);
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
          setItems((prevItems) => {
            const updated = [
              ...prevItems,
              ...sale.items
                .filter(
                  (item) =>
                    !prevItems.some((prev) => prev.serialNo === (item.serial_no || ""))
                )
                .map((item) => ({
                  id: item.id,
                  serialNo: item.serial_no || "",
                  quantity: item.quantity,
                })),
            ];

            console.log("✅ Updated items list 2:", updated);
            return updated;
          });
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
        const existingSerials = prevItems.map((i) => i.serialNo);
        const merged = [
          ...prevItems,
          ...selected
            .filter((p) => !existingSerials.includes(p.serial_no))
            .map((p) => ({
              quantity: 1,
              serialNo: p.serial_no,
            })),
        ];
        console.log("✅ Updated product list:", merged);
        return merged;
      });

      // ✅ Clear after merging to prevent repeat adds
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
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!customerId || parseInt(customerId) <= 0)
      errors.customerId = "Customer is required";
    if (!challanNo.trim()) errors.challanNo = "Challan No is required";
    if (!challanDate) errors.challanDate = "Challan Date is required";
    if (!shipmentDate) errors.shipmentDate = "Shipment Date is required";
    else if (new Date(shipmentDate) < new Date(challanDate))
      errors.shipmentDate = "Shipment Date cannot be before Challan Date";
    if (!shipmentName.trim())
      errors.shipmentName = "Shipment Name is required";
    if (items.length === 0) errors.items = "Please add at least one product";
    else {
      const serials = new Set();
      items.forEach((item, index) => {
        if (!item.serialNo.trim())
          errors[`serialNo_${index}`] = "Serial No is required";
        if (serials.has(item.serialNo))
          errors[`serialNo_${index}`] = `Duplicate Serial No: ${item.serialNo}`;
        serials.add(item.serialNo);
        if (!item.quantity || parseInt(item.quantity) <= 0)
          errors[`quantity_${index}`] = "Quantity must be greater than 0";
      });
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.warning("Please fix the highlighted errors!");
      return;
    }

    const payload = {
      customer_id: parseInt(customerId),
      challan_no: challanNo.trim(),
      challan_date: challanDate,
      shipment_date: shipmentDate,
      shipment_name: shipmentName.trim(),
      notes: notes.trim(),
      items: items.map((item) => ({
        ...(item.id ? { id: item.id } : {}),
        quantity: parseInt(item.quantity),
        serial_no: item.serialNo.trim(),
      })),
    };

    try {
      await axios.put(`${API_BASE_URL}/sales/${id}`, payload);
      toast.success("Sale updated successfully!");
      navigate("/sales-order");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update sale!");
    }
  };

  // ✅ Field change handlers
  const handleChange = (field, value) => {
    switch (field) {
      case "customerId":
        setCustomerId(value);
        setFormErrors((prev) => ({ ...prev, customerId: undefined }));
        break;
      case "challanNo":
        setChallanNo(value);
        setFormErrors((prev) => ({ ...prev, challanNo: undefined }));
        break;
      case "challanDate":
        setChallanDate(value);
        setFormErrors((prev) => ({ ...prev, challanDate: undefined }));
        break;
      case "shipmentDate":
        setShipmentDate(value);
        setFormErrors((prev) => ({ ...prev, shipmentDate: undefined }));
        break;
      case "shipmentName":
        setShipmentName(value);
        setFormErrors((prev) => ({ ...prev, shipmentName: undefined }));
        break;
      case "notes":
        setNotes(value);
        break;
      default:
        break;
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);

    setFormErrors((prev) => {
      const updated = { ...prev };
      if (field === "serialNo") delete updated[`serialNo_${index}`];
      if (field === "quantity") delete updated[`quantity_${index}`];
      return updated;
    });
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
        const deletedItem = items[index];
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        toast.success(`Product ${deletedItem.serialNo} removed successfully!`);
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
            {/* Customer / Challan / Shipment Details */}
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Customer</Form.Label>
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Form.Select
                      value={customerId || ""}
                      onChange={(e) => handleChange("customerId", e.target.value)}
                      isInvalid={!!formErrors.customerId}
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.customer} ({cust.email})
                        </option>
                      ))}
                    </Form.Select>
                  )}
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
                    onChange={(e) => handleChange("challanNo", e.target.value)}
                    placeholder="Enter Challan No"
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
                    onChange={(e) => handleChange("challanDate", e.target.value)}
                    isInvalid={!!formErrors.challanDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.challanDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Shipment Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => handleChange("shipmentDate", e.target.value)}
                    isInvalid={!!formErrors.shipmentDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.shipmentDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Shipment Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={shipmentName}
                    onChange={(e) => handleChange("shipmentName", e.target.value)}
                    placeholder="Enter Shipment Name"
                    isInvalid={!!formErrors.shipmentName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.shipmentName}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                  />
                </Form.Group>
              </div>
            </div>

            {/* Products Table */}
            <div className="mt-4">
              <Form.Label>Products</Form.Label>
              <Button
                variant="success"
                size="sm"
                className="mb-2 ms-2"
                onClick={() => {
                  const draftSale = {
                    customer_id: customerId,
                    challan_no: challanNo,
                    challan_date: challanDate,
                    shipment_date: shipmentDate,
                    shipment_name: shipmentName,
                    notes: notes,
                    items: items,
                  };
                  localStorage.setItem("draftSale", JSON.stringify(draftSale));
                  navigate("/add-product");
                }}
              >
                + Add Product
              </Button>

              {formErrors.items && <div className="text-danger mb-2">{formErrors.items}</div>}
              {items.length === 0 && <div className="text-muted">No products added</div>}

              {items.length > 0 && (
                <>
                  {/* <div>{JSON.stringify(items, null, 2)}</div> */}
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Serial No</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((item, index) => (
                        <tr key={startIndex + index}>
                          <td>
                            <Form.Control
                              type="text"
                              value={item.serialNo}
                              isInvalid={!!formErrors[`serialNo_${startIndex + index}`]}
                              onChange={(e) =>
                                handleItemChange(startIndex + index, "serialNo", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {formErrors[`serialNo_${startIndex + index}`]}
                            </Form.Control.Feedback>
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

                  {/* Pagination */}
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                      &laquo; Previous
                    </Button>

                    <span>
                      Page {currentPage} of {Math.ceil(items.length / itemsPerPage)}
                    </span>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={currentPage === Math.ceil(items.length / itemsPerPage)}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                      Next &raquo;
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
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
