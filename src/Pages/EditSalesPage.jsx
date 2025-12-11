import React, { useState, useEffect } from "react";
import api, { setAuthToken } from "../api";
import { Button, Form, Card, Table, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useParams } from "react-router-dom";
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
  const [items, setItems] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [loadedSale, setLoadedSale] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const MySwal = withReactContent(Swal);

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  // Load token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
  }, []);

  // Load customers
  useEffect(() => {
    api
      .get(`/customers/get`)
      .then((res) => setCustomers(res.data))
      .catch(() => toast.error("Failed to load customers"));
  }, []);

  // Group items coming from sale API
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
          serials: [],
          quantity: 0,
        };
      }

      grouped[pid].serials.push(item.serial_no);
      grouped[pid].quantity += 1;
    });

    return Object.values(grouped);
  };
  useEffect(() => {
    const draft = localStorage.getItem("draftSale");
    if (!draft) return;

    const data = JSON.parse(draft);

    setCustomerId(data.customer_id || "");
    setChallanNo(data.challan_no || "");
    setChallanDate(data.challan_date || "");
    setShipmentDate(data.shipment_date || "");
    setShipmentName(data.shipment_name || "");
    setNotes(data.notes || "");
    setItems(data.items || []);

    setLoadedSale(true); // prevents API overwrite
  }, []);
  useEffect(() => {
    if (loadedSale) return;   // <-- now prevents overwrite

    const hasSelected = localStorage.getItem("selectedProducts");

    api.get(`/sales/${id}`).then((res) => {
      const sale = res.data;

      setCustomerId(sale.customer?.id || "");
      setChallanNo(sale.challan_no);
      setChallanDate(sale.challan_date);
      setShipmentDate(sale.shipment_date);
      setShipmentName(sale.shipment_name || "");
      setNotes(sale.notes || "");

      if (!hasSelected) {
        setItems(groupProducts(sale.items || []));
      }

      setLoadedSale(true);
    });
  }, [id, loadedSale]);

  useEffect(() => {
    if (!loadedSale) return;

    const stored = localStorage.getItem("selectedProducts");
    if (stored) {
      loadSelectedProducts();
      localStorage.removeItem("selectedProducts");
    }
  }, [loadedSale]);

  const loadSelectedProducts = () => {
    const stored = localStorage.getItem("selectedProducts");
    if (!stored) return;

    const selected = JSON.parse(stored);
    if (!Array.isArray(selected)) return;

    setItems(prevItems => {
      const map = {};

      // Unique key using BOTH product_id + product_name
      const makeKey = (p) => `${p.product_id}_${p.product_name || p.name}`;

      // Add previous items
      prevItems.forEach(item => {
        const key = makeKey(item);
        map[key] = { ...item };
      });

      // Add selected items
      selected.forEach(p => {
        const pid = Number(p.product_id);
        const name = p.product_name || p.name || "Unknown Product";
        const incomingQty = Number(p.quantity || 1);

        const key = `${pid}_${name}`;

        if (!map[key]) {
          // New product (unique combination)
          map[key] = {
            product_id: pid,
            name: name,
            serials: p.serial_no ? [String(p.serial_no)] : [],
            quantity: incomingQty,
          };
        } else {
          // Same product & same name — update this row only
          map[key].quantity += incomingQty;

          if (p.serial_no) {
            const s = String(p.serial_no);
            if (!map[key].serials.includes(s)) {
              map[key].serials.push(s);
            }
          }
        }
      });

      return Object.values(map);
    });
  };



  const validateForm = () => {
    const errors = {};

    const toDate = (d) => new Date(new Date(d).toDateString());
    const today = toDate(new Date());
    const challan = challanDate ? toDate(challanDate) : null;
    const shipment = shipmentDate ? toDate(shipmentDate) : null;

    if (!customerId) errors.customerId = "Customer is required";
    if (!challanNo.trim()) errors.challanNo = "Challan No is required";

    if (!challanDate) {
      errors.challanDate = "Challan Date is required";
    } else if (challan > today) {
      errors.challanDate = "Challan Date cannot be in the future";
    }

    if (!shipmentDate) {
      errors.shipmentDate = "Shipment Date is required";
    } else if (shipment > today) {
      errors.shipmentDate = "Shipment Date cannot be in the future";
    } else if (shipment < challan) {
      errors.shipmentDate = "Shipment Date cannot be before Challan Date";
    }

    if (!shipmentName.trim()) errors.shipmentName = "Shipment Name is required";

    if (items.length === 0) {
      errors.items = "Please add at least one product";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------------------------------------------------------
  // SAVE UPDATED SALE
  // ---------------------------------------------------------
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
      await api.put(`/sales/${id}`, payload);
      toast.success("Sale updated successfully!");
      navigate("/sales-order");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update sale!");
    }
  };

  // Delete item
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
            {/* Customer Section */}
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

            {/* Products */}
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
                          <Form.Control type="number" min="1" value={item.quantity} readOnly />
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

            {/* Pagination */}
            {items.length > itemsPerPage && (
              <div className="d-flex justify-content-between mt-3">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Prev
                </Button>

                <span>Page {currentPage}</span>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={endIndex >= items.length}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Footer */}
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
