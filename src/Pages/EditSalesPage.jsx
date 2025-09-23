import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Spinner, Form, Card, Table, Modal, InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";

import { API_BASE_URL } from "../api";
import Breadcrumb from "../Components/Breadcrumb";
import { useParams, useNavigate } from "react-router-dom";

export default function EditSalesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [customerId, setCustomerId] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [shipmentName, setShipmentName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);

  const [showProductsModal, setShowProductsModal] = useState(false);
  const [testingData, setTestingData] = useState([]);
  const [selectedTestingIds, setSelectedTestingIds] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [serialFrom, setSerialFrom] = useState("");
  const [serialTo, setSerialTo] = useState("");

  useEffect(() => {
    fetchSale();
  }, []);

  const fetchSale = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sales/${id}`);
      const sale = res.data;
      setCustomerId(sale.customer_id || "");
      setChallanNo(sale.challan_no || "");
      setChallanDate(sale.challan_date || "");
      setShipmentDate(sale.shipment_date || "");
      setShipmentName(sale.shipment_name || "");
      setNotes(sale.notes || "");
      setItems(
        sale.items.length > 0
          ? sale.items.map((item) => ({
              id: item.testing ? item.testing.id : null,
              quantity: item.quantity,
              serialNo: item.testing ? item.testing.serial_no : "",
            }))
          : []
      );
    } catch (error) {
      console.error("Failed to fetch sale:", error);
      toast.error("Failed to fetch sale!");
    }
  };

  const fetchTestingData = async () => {
    setModalLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/testings`);
      setTestingData(res.data);
    } catch (error) {
      console.error("Failed to fetch testing data:", error);
      toast.error("Failed to fetch testing data!");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSave = async () => {
    if (!customerId || !challanNo.trim() || !challanDate || !shipmentDate) {
      toast.warning("Please fill all required fields!");
      return;
    }
    if (items.length === 0) {
      toast.warning("Please add at least one product!");
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
        id: item.id,
        quantity: parseInt(item.quantity),
        serial_no: item.serialNo.trim(),
      })),
    };

    try {
      await axios.put(`${API_BASE_URL}/sales/${id}`, payload);
      toast.success("Sale updated successfully!");
      navigate("/SalesOrder");
    } catch (err) {
      console.error("Failed to save sale:", err);
      toast.error("Failed to save sale!");
    }
  };

  const handleShowProductsModal = () => {
    fetchTestingData(); // ensure fresh data
    setSelectedTestingIds([]);
    setSerialFrom("");
    setSerialTo("");
    setShowProductsModal(true);
  };

  const handleCloseProductsModal = () => {
    setShowProductsModal(false);
    setSelectedTestingIds([]);
    setSerialFrom("");
    setSerialTo("");
  };

  const handleCheckboxChange = (id) => {
    setSelectedTestingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredTesting = testingData.filter((item) => {
    const from = serialFrom.trim();
    const to = serialTo.trim();
    const serial = item.serial_no.trim();
    return (from === "" || serial >= from) && (to === "" || serial <= to);
  });

  const handleSelectAll = () => {
    const ids = filteredTesting.map((item) => item.id);
    setSelectedTestingIds(ids);
  };

  const handleUnselectAll = () => {
    setSelectedTestingIds([]);
  };

  const handleAddSelectedProducts = () => {
  const selected = testingData.filter((item) =>
    selectedTestingIds.includes(item.id)
  );

  if (!Array.isArray(selected) || selected.length === 0) {
    toast.warning("Please select at least one product!");
    return;
  }

  const failedItem = selected.find((item) => item.status.toUpperCase() !== "PASS");
  if (failedItem) {
    toast.error(`Test with serial ${failedItem.serial_no} has failed and cannot be added!`);
    return;
  }

  const newProducts = selected.map((item) => ({
    id: null, // very important, so backend knows it's new
    quantity: 1,
    serial_no: item.serial_no,
  }));

  setItems((prevItems) => {
    const existingSerials = prevItems.map((p) => p.serial_no);
    const filtered = newProducts.filter((np) => !existingSerials.includes(np.serial_no));
    return [...prevItems, ...filtered];
  });

  handleCloseProductsModal();
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
            {/* Customer + Challan Fields */}
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Customer ID</Form.Label>
                  <Form.Control
                    type="number"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Challan No</Form.Label>
                  <Form.Control
                    type="text"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
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
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Shipment Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={shipmentName}
                    onChange={(e) => setShipmentName(e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Form.Group>
              </div>
            </div>

            {/* Product Section */}
            <div className="mt-4">
              <Form.Label>Products</Form.Label>
              <Button
                variant="success"
                size="sm"
                className="mb-2 ms-2"
                onClick={handleShowProductsModal}
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

            {/* Save/Cancel */}
            <div className="mt-4 d-flex justify-content-end gap-2">
              <Button variant="danger" onClick={() => navigate("/sales-order")}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleSave}>
                Update
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Products Modal */}
      <Modal show={showProductsModal} onHide={handleCloseProductsModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Products</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Serial From"
              value={serialFrom}
              onChange={(e) => setSerialFrom(e.target.value)}
            />
            <Form.Control
              placeholder="Serial To"
              value={serialTo}
              onChange={(e) => setSerialTo(e.target.value)}
            />
          </InputGroup>

          <div className="mb-2 d-flex gap-2">
            <Button variant="outline-primary" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleUnselectAll}
            >
              Unselect All
            </Button>
          </div>

          {modalLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Serial No</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTesting.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedTestingIds.includes(item.id)}
                        onChange={() => handleCheckboxChange(item.id)}
                      />
                    </td>
                    <td>{item.serial_no}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseProductsModal}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAddSelectedProducts}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
