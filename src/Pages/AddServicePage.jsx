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
import { IoTrashOutline } from "react-icons/io5";

import { API_BASE_URL } from "../api";
const AddServicePage = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const [products, setProducts] = useState([]);
  const [serialNumbersByProduct, setSerialNumbersByProduct] = useState({});
  const [alreadySoldSerials, setAlreadySoldSerials] = useState([]);

  // const [serialNumbers, setSerialNumbers] = useState([]);
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
  const validate = () => {
    const newErrors = {};

    // General fields
    if (!formData.challan_no) newErrors.challan_no = "Challan No is required";
    if (!formData.challan_date) newErrors.challan_date = "Challan Date is required";
    if (!formData.from_place) newErrors.from_place = "From Place is required";
    if (!formData.to_place) newErrors.to_place = "To Place is required";
    if (!formData.sent_date) newErrors.sent_date = "Send Date is required";
    if (!formData.received_date) newErrors.received_date = "Received Date is required";

    // Items validation
    formData.items.forEach((item, index) => {
      if (!item.product) newErrors[`product_${index}`] = "Product is required";
      if (!item.vci_serial_no) newErrors[`vci_serial_no_${index}`] = "Serial No is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch products from API
  useEffect(() => {
    // Fetch products
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/product`);
        setProducts(res.data);
      } catch (error) {
        toast.error("Failed to fetch products!");
      }
    };

    // Fetch already added serials
    const fetchAlreadyAddedSerials = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/get-serviceserials`);
        setAlreadySoldSerials(res.data || []);
      } catch (error) {
        setAlreadySoldSerials([]);
      }
    };

    fetchProducts();
    fetchAlreadyAddedSerials();
  }, []);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = async (index, e) => {
    const { name, value, type, checked } = e.target;
    const items = [...formData.items];

    items[index][name] = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, items }));

    if (name === "product" && value) {
      try {
        const res = await axios.get(`${API_BASE_URL}/sales/serials/${value}`);
        const serials = res.data || [];

        // Filter out serials that are already added in services
        const filteredSerials = serials.filter(
          (s) => !alreadySoldSerials.includes(s.serial_no)
        );

        setSerialNumbersByProduct((prev) => ({
          ...prev,
          [value]: filteredSerials,
        }));

        // Reset selected serial for this row
        items[index].vci_serial_no = "";
        setFormData((prev) => ({ ...prev, items }));
      } catch (error) {
        console.error("Failed to fetch serials:", error);
        toast.error("Failed to fetch serial numbers!");
      }
    }
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
          action_taken: "",
          urgent: false,
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
    if (!validate()) return; // stop submission if validation fails

    try {
      await axios.post(`${API_BASE_URL}/service-vci`, formData);
      toast.success("Service added successfully!");
      navigate("/service-Product");
    } catch (error) {
      toast.error("Failed to add service!");
    }
  };
  const RequiredLabel = ({ children }) => (
    <Form.Label>
      {children}<span style={{ color: "red" }}> *</span>
    </Form.Label>
  );

  return (
    <Container fluid>
 <Row className="align-items-center mb-3 fixed-header">
             <Col>
               <h4>Add Service</h4>
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
        <Row className="mb-3 ">
          <Col md={4}>
            <Form.Group>
              <RequiredLabel>Challan No</RequiredLabel>
              <Form.Control
                type="text"
                name="challan_no"
                value={formData.challan_no}
                onChange={handleChange}
                isInvalid={!!errors.challan_no}
              />
              <Form.Control.Feedback type="invalid">{errors.challan_no}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <RequiredLabel>Challan Date</RequiredLabel>
              <Form.Control
                type="date"
                name="challan_date"
                value={formData.challan_date}
                onChange={handleChange}
                isInvalid={!!errors.challan_date}
              />
              <Form.Control.Feedback type="invalid">{errors.challan_date}</Form.Control.Feedback>
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
              <RequiredLabel>From Place</RequiredLabel>
              <Form.Control
                type="text"
                name="from_place"
                value={formData.from_place}
                onChange={handleChange}
                isInvalid={!!errors.from_place}
              />
              <Form.Control.Feedback type="invalid">{errors.from_place}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <RequiredLabel>To Place</RequiredLabel>
              <Form.Control
                type="text"
                name="to_place"
                value={formData.to_place}
                onChange={handleChange}
                isInvalid={!!errors.to_place}
              />
              <Form.Control.Feedback type="invalid">{errors.to_place}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          {/* <Col md={4}>
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
          </Col> */}
        </Row>

        {/* Row 3 */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <RequiredLabel>Send Date</RequiredLabel>
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
              <RequiredLabel>Received Date</RequiredLabel>
              <Form.Control
                type="date"
                name="received_date"
                value={formData.received_date}
                onChange={handleChange}
                isInvalid={!!errors.received_date}
              />
              <Form.Control.Feedback type="invalid">{errors.received_date}</Form.Control.Feedback>
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
                    isInvalid={!!errors[`product_${index}`]} 
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors[`product_${index}`]} {/* show error message */}
                  </Form.Control.Feedback>
                </td>
                <td>
                  <Form.Control
                    as="select"
                    name="vci_serial_no"
                    value={item.vci_serial_no || ""}
                    onChange={(e) => handleItemChange(index, e)}
                    isInvalid={!!errors[`vci_serial_no_${index}`]} // ✅ must be a prop
                  >
                    <option value="">Select Serial No</option>
                    {(serialNumbersByProduct[item.product] || []).map((s) => (
                      <option key={s.id || s.serial_no} value={s.serial_no}>
                        {s.serial_no}
                      </option>
                    ))}
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors[`vci_serial_no_${index}`]} {/* show error message */}
                  </Form.Control.Feedback>

                </td>
                <td>
                  <Form.Control
                    as="select"
                    name="warranty_status"
                    value={item.warranty_status || item.status}
                    onChange={(e) => handleItemChange(index, e)}
                    isInvalid={!!errors[`warranty_status_${index}`]} // ✅ must be a prop
                  >
                    <option value="">Select</option>
                    <option value="active">Active</option>
                    <option value="in_active">In Active</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">  
                    {errors[`warranty_status_${index}`]} {/* show error message */}
                  </Form.Control.Feedback>
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
                                           variant="outline-danger"
                                           size="sm"
                                           onClick={() => removeItem(startIndex + index)}
                                         >
                                           <IoTrashOutline />
                                         </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Button variant="success" onClick={addRow} disabled={formData.quantity <= formData.items.length}>
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
          <Button type="submit" variant="success">
            Save
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default AddServicePage;