import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { IoTrashOutline } from "react-icons/io5";

const EditService = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [products, setProducts] = useState([]);
  const [serialNumbersByProduct, setSerialNumbersByProduct] = useState({});
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
      },
    ],
  });

  // Fetch products and service sequentially
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productRes = await axios.get(`${API_BASE_URL}/product`);
        const productList = productRes.data?.data || productRes.data || [];
        setProducts(productList);

        // Fetch service
        const serviceRes = await axios.get(`${API_BASE_URL}/service-vci/${id}`);
        if (serviceRes.data) {
          const serviceData = serviceRes.data;
          const items = serviceData.items?.map(item => ({
            id: item.id,
            vci_serial_no: item.vci_serial_no || "",
            testing_assigned_to: item.testing_assigned_to || "",
            tested_date: item.tested_date || "",
            testing_status: item.testing_status || "",
            issue_found: item.issue_found || "",
            warranty_status: "",
          })) || [];

          setFormData({
            challan_no: serviceData.challan_no || "",
            challan_date: serviceData.challan_date || "",
            courier_name: serviceData.courier_name || "",
            from_place: serviceData.from_place || "",
            to_place: serviceData.to_place || "",
            tester_name: serviceData.tester_name || "",
            quantity: serviceData.quantity || "",
            sent_date: serviceData.sent_date || "",
            received_date: serviceData.received_date || "",
            remarks: serviceData.remarks || "",
            items,
          });

          // Fetch serials for each item
          for (const item of items) {
            if (item.product) {
              const serialRes = await axios.get(`${API_BASE_URL}/sales/serials/${item.product}`);
              const serials = serialRes.data?.data || serialRes.data || [];
              setSerialNumbersByProduct(prev => ({
                ...prev,
                [item.product]: serials,
              }));
            }
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch data!");
      }
    };
    fetchData();
  }, [id]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = async (index, e) => {
    const { name, value } = e.target;
    const items = [...formData.items];
    items[index][name] = value;
    setFormData(prev => ({ ...prev, items }));

    if (name === "product" && value) {
      try {
        const res = await axios.get(`${API_BASE_URL}/sales/serials/${value}`);
        const serials = res.data?.data || res.data || [];
        setSerialNumbersByProduct(prev => ({
          ...prev,
          [value]: serials,
        }));
        items[index].vci_serial_no = "";
        setFormData(prev => ({ ...prev, items }));
      } catch (error) {
        toast.error("Failed to fetch serial numbers!");
      }
    }
  };

  // Add new item row
  const addRow = () => {
    setFormData(prev => ({
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
        },
      ],
    }));
  };

  // Remove item row
  const removeRow = (index) => {
    const items = [...formData.items];
    items.splice(index, 1);
    setFormData(prev => ({ ...prev, items }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/service-vci/${id}`, formData);
      toast.success("Service updated successfully!");
      navigate("/service-product");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update service!");
    }
  };

  return (
    <Container fluid>
      <Row className="align-items-center mb-3 fixed-header">
        <Col>
          <h4>Edit Service</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => navigate("/service-product")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

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

        {/* Service Items Table */}
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
                    value={item.product?.toString() || ""}
                    onChange={(e) => handleItemChange(index, e)}
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id.toString()}>{p.name}</option>
                    ))}
                  </Form.Control>

                </td>
                <td>
                  <Form.Control
                    type="text"
                    name="vci_serial_no"
                    value={item.vci_serial_no || ""}
                    readOnly
                  />
                </td>

                <td>
                  <Form.Control
                    as="select"
                    name="warranty_status"
                    value={item.warranty_status || ""}
                    onChange={(e) => handleItemChange(index, e)}
                  >
                    <option value="">Select</option>
                    <option value="in_warranty">In Warranty</option>
                    <option value="out_warranty">Out of Warranty</option>
                  </Form.Control>
                </td>
                <td>
                  <Form.Control
                    type="text"
                    name="testing_assigned_to"
                    value={item.testing_assigned_to || ""}
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="date"
                    name="tested_date"
                    value={item.tested_date || ""}
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td>
                  <Form.Control
                    as="select"
                    name="testing_status"
                    value={item.testing_status || ""}
                    onChange={(e) => handleItemChange(index, e)}
                  >
                    <option value="">Select</option>
                    <option value="pending">Pending</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                  </Form.Control>
                </td>
                <td>
                  <Form.Control
                    type="text"
                    name="issue_found"
                    value={item.issue_found || ""}
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeRow(index)}
                  >
                    <IoTrashOutline />
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
          <Button variant="secondary" className="me-2" onClick={() => navigate("/service-product")}>
            Cancel
          </Button>
          <Button type="submit" variant="success">
            Update
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EditService;
