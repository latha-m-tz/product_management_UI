import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Form,
  Card,
  Table,
  Spinner
} from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";

import { API_BASE_URL } from "../api";
import Breadcrumb from "../components/Breadcrumb";
import { useNavigate, useParams } from "react-router-dom";

export default function EditSalesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [shipmentName, setShipmentName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);

  const MySwal = withReactContent(Swal);

  useEffect(() => {
    // fetch sale by id
    axios
      .get(`${API_BASE_URL}/sales/${id}`)
      .then((res) => {
        const sale = res.data;
        setCustomerId(sale.customer_id);
        setChallanNo(sale.challan_no);
        setChallanDate(sale.challan_date);
        setShipmentDate(sale.shipment_date);
        setShipmentName(sale.shipment_name || "");
        setNotes(sale.notes || "");
        setItems(
          sale.items.map((item) => ({
            id: item.id,
            serialNo: item.serial_no || "",
            quantity: item.quantity,
          }))
        );
      })
      .catch(() => toast.error("Failed to load sale data"));
  }, [id]);

  useEffect(() => {
    // load customers
    axios
      .get(`${API_BASE_URL}/customers/get`)
      .then((res) => setCustomers(res.data))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!customerId || parseInt(customerId) <= 0) {
      toast.warning("Please select a valid Customer!");
      return;
    }
    if (!challanNo.trim()) {
      toast.warning("Challan No is required!");
      return;
    }
    if (!challanDate) {
      toast.warning("Challan Date is required!");
      return;
    }
    if (!shipmentDate) {
      toast.warning("Shipment Date is required!");
      return;
    }
    if (new Date(shipmentDate) < new Date(challanDate)) {
      toast.warning("Shipment Date cannot be before Challan Date!");
      return;
    }
    if (!shipmentName.trim()) {
      toast.warning("Shipment Name is required!");
      return;
    }
    if (items.length === 0) {
      toast.warning("Please add at least one product!");
      return;
    }

    const serials = new Set();
    for (let item of items) {
      if (!item.serialNo.trim()) {
        toast.warning("Serial No cannot be empty!");
        return;
      }
      if (serials.has(item.serialNo)) {
        toast.warning(`Duplicate Serial No: ${item.serialNo}`);
        return;
      }
      serials.add(item.serialNo);
      if (!item.quantity || parseInt(item.quantity) <= 0) {
        toast.warning(`Quantity must be greater than 0 for ${item.serialNo}`);
        return;
      }
    }

    const payload = {
      customer_id: parseInt(customerId),
      challan_no: challanNo.trim(),
      challan_date: challanDate,
      shipment_date: shipmentDate,
      shipment_name: shipmentName.trim(),
      notes: notes.trim(),
      items: items.map((item) => ({
        id: item.id,
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

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="container-fluid px-4 py-4 bg-light min-vh-100">
      <Breadcrumb title="Edit Sale" />
      <Card className="border-0 shadow-sm rounded-3 bg-white">
        <Card.Body>
          <Form>
            <div className="row g-3">
              {/* Customer */}
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Customer</Form.Label>
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Form.Select
                      value={customerId || ""}
                      onChange={(e) => setCustomerId(e.target.value)}
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.customer} ({cust.email})
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </div>

              {/* Challan No */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Challan No</Form.Label>
                  <Form.Control
                    type="text"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    placeholder="Enter Challan No"
                  />
                </Form.Group>
              </div>

              {/* Dates */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Challan Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={challanDate}
                    onChange={(e) => setChallanDate(e.target.value)}
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
                  />
                </Form.Group>
              </div>

              {/* Shipment */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Shipment Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={shipmentName}
                    onChange={(e) => setShipmentName(e.target.value)}
                    placeholder="Enter Shipment Name"
                  />
                </Form.Group>
              </div>

              {/* Notes */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter Notes"
                  />
                </Form.Group>
              </div>
            </div>

            {/* Products */}
            <div className="mt-4">
              <Form.Label>Serial No</Form.Label>
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

              {items.length > 0 && (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Serial No</th>
                      <th>Quantity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.serialNo}</td>
                        <td>
                          <Form.Control
                            type="number"
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
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
