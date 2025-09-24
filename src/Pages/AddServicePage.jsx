import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { API_BASE_URL } from "../api";
const AddServicePage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [formData, setFormData] = useState({
    challan_no: "",
    challan_date: "",
    courier_name: "",
    from_place: "",
    to_place: "",
    tester_name: "",
    quantity: "",
    sent_date: "",
    received_date: "",
    remarks: "",
    items: [
      {
        product: "",
        vci_serial_no: "",
        warranty_status: "",
        testing_assigned_to: "",
        tested_date: "",
        testing_status: "",
        issue_found: "",
        action_taken: "", // Add this field
        urgent: false,     // Add this field
      },
    ],
  });

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/product`);
        setProducts(res.data);
      } catch (error) {
        toast.error("Failed to fetch products!");
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
  const fetchSerialNumbers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/inventory/serial-numbers`);
      setSerialNumbers(res.data); // keep full objects with id + serial_no
    } catch (error) {
      console.error("Failed to fetch serial numbers:", error);
    }
  };
  fetchSerialNumbers();
}, []);


  // handle form field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // handle dynamic row change
  const handleItemChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const items = [...formData.items];
    items[index][name] = type === "checkbox" ? checked : value; // Handle checkbox value
    setFormData((prev) => ({ ...prev, items }));
  };

  // add new row
  const addRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: "",
          vci_serial_no: "",
          warranty_status: "",
          testing_assigned_to: "",
          tested_date: "",
          testing_status: "",
          issue_found: "",
          action_taken: "", // Add new fields to new rows
          urgent: false,     // Add new fields to new rows
        },
      ],
    }));
  };

  // remove row
  const removeRow = (index) => {
    const items = [...formData.items];
    items.splice(index, 1);
    setFormData((prev) => ({ ...prev, items }));
  };

  // submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/service-vci`, formData);
      toast.success("Service added successfully!");
      navigate("/service-Product");
    } catch (error) {
      toast.error("Failed to add service!");
    }
  };

  return (
    <Container fluid>
      <h3 className="mb-3">Add Service</h3>
      <Form onSubmit={handleSubmit}>
        {/* Row 1 */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Challan No</Form.Label>
              <Form.Control
                type="text"
                name="challan_no"
                value={formData.challan_no}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Challan Date</Form.Label>
              <Form.Control
                type="date"
                name="challan_date"
                value={formData.challan_date}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Courier Name</Form.Label>
              <Form.Control
                type="text"
                name="courier_name"
                value={formData.courier_name}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Row 2 */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>From Place</Form.Label>
              <Form.Control
                type="text"
                name="from_place"
                value={formData.from_place}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>To Place</Form.Label>
              <Form.Control
                type="text"
                name="to_place"
                value={formData.to_place}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Tester Name</Form.Label>
              <Form.Control
                as="select"
                name="tester_name"
                value={formData.tester_name}
                onChange={handleChange}
              >
                <option value="">Select Tester</option>
                <option value="tester1">Tester 1</option>
                <option value="tester2">Tester 2</option>
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        {/* Row 3 */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Send Date</Form.Label>
              <Form.Control
                type="date"
                name="sent_date"
                value={formData.sent_date}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Received Date</Form.Label>
              <Form.Control
                type="date"
                name="received_date"
                value={formData.received_date}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Remarks */}
        <Row className="mb-3">
          <Col md={12}>
            <Form.Group>
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Service Items */}
        <h5 className="mt-4">Service Items</h5>
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Product</th>
              <th>Serial No</th>
              <th>Warranty Status</th>
              <th>Assigned To</th>
              <th>Tested Date</th>
              <th>Test Status</th>
              <th>Issue Found</th>
              <th>Action Taken</th>
              <th>Urgent</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={index}>
                <td>
                  <Form.Control
                    as="select"
                    name="product"
                    value={item.product}
                    onChange={(e) => handleItemChange(index, e)}
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Form.Control>
                </td>
                <td>
                <Form.Control
                    as="select"
                    name="vci_serial_no"
                    value={item.vci_serial_no}
                    onChange={(e) => handleItemChange(index, e)}
                    >
                    <option value="">Select Serial No</option>
                    {serialNumbers.map((s) => (
                        <option key={s.id} value={s.serial_no}>
                        {s.serial_no}
                        </option>
                    ))}
                    </Form.Control>

                </td>

                <td>
                  <Form.Control
                    as="select"
                    name="warranty_status"
                    value={item.warranty_status}
                    onChange={(e) => handleItemChange(index, e)}
                  >
                    <option value="">Select</option>
                    <option value="active">Active</option>
                    <option value="in_active">In Active</option>
                  </Form.Control>
                </td>
                <td>
                  <Form.Control
                    type="text"
                    name="testing_assigned_to"
                    value={item.testing_assigned_to}
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="date"
                    name="tested_date"
                    value={item.tested_date}
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td>
                  <Form.Control
                    as="select"
                    name="testing_status"
                    value={item.testing_status}
                    onChange={(e) => handleItemChange(index, e)}
                  >
                    <option value="">Select</option>
                    <option value="pending">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </Form.Control>
                </td>
                <td>
                  <Form.Control
                    type="text"
                    name="issue_found"
                    value={item.issue_found}
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    name="action_taken"
                    value={item.action_taken}
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    name="urgent"
                    checked={item.urgent}
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeRow(index)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Button variant="success" onClick={addRow}>
          + Add Row
        </Button>

        <div className="mt-4 d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate("/service-product")}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default AddServicePage;