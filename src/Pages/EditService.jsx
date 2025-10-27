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
  const [alreadySoldSerials, setAlreadySoldSerials] = useState([]);

  const [formData, setFormData] = useState({
    challan_no: "",
    challan_date: "",
    courier_name: "",
    from_place: "",
    to_place: "",
    tracking_number: "",
    quantity: "",
    sent_date: "",
    received_date: "",
    remarks: "",
    challan_1: null,
    challan_2: null,
    receipt_upload: null,
    items: [
      {
        product_id: "",
        vci_serial_no: "",
        warranty_status: "",
        testing_assigned_to: "",
        tested_date: "",
        testing_status: "",
        issue_found: "",
        action_taken: "",
        urgent: false,
        upload_image: null,
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all products
        const productRes = await axios.get(`${API_BASE_URL}/product`);
        setProducts(productRes.data || []);

        // Fetch already sold serial numbers
        const serialRes = await axios.get(`${API_BASE_URL}/get-serviceserials`);
        const soldSerialNumbers = (serialRes.data || []).map((s) => s.serial_no);
        setAlreadySoldSerials(soldSerialNumbers);

        // Fetch existing service details
        const serviceRes = await axios.get(`${API_BASE_URL}/service-vci/${id}`);
        const serviceData = serviceRes.data;

        if (serviceData) {
          // Prefill main form fields (preserve document URLs)
          const topData = {
            challan_no: serviceData.challan_no || "",
            challan_date: serviceData.challan_date || "",
            courier_name: serviceData.courier_name || "",
            from_place: serviceData.from_place || "",
            to_place: serviceData.to_place || "",
            tracking_number: serviceData.tracking_number || "",
            quantity: serviceData.quantity || "",
            sent_date: serviceData.sent_date || "",
            received_date: serviceData.received_date || "",
            remarks: serviceData.remarks || "",
            challan_1: serviceData.challan_1 || null,
            challan_2: serviceData.challan_2 || null,
            receipt_upload: serviceData.receipt_upload || null,
          };

          // Prefill items
          const items = (serviceData.items || []).map((item) => ({
            id: item.id,
            product_id: item.product_id || "",
            vci_serial_no: item.vci_serial_no || "",
            warranty_status: item.warranty_status || "",
            testing_assigned_to: item.testing_assigned_to || "",
            tested_date: item.tested_date || "",
            testing_status: item.testing_status || "",
            issue_found: item.issue_found || "",
            action_taken: item.action_taken || "",
            urgent: item.urgent || false,
            upload_image: null,
          }));

          setFormData((prev) => ({ ...prev, ...topData, items }));

          // Fetch serial numbers per product
          const serialsObj = {};
          for (const item of items) {
            if (item.product_id) {
              const serialsRes = await axios.get(
                `${API_BASE_URL}/sales/serials/${item.product_id}`
              );
              const serials = (serialsRes.data || []).filter(
                (s) => !soldSerialNumbers.includes(s.serial_no)
              );
              serialsObj[item.product_id] = serials;
            }
          }
          setSerialNumbersByProduct(serialsObj);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch service data!");
      }
    };

    fetchData();
  }, [id]);

  // Handle top-level form fields
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle item changes
  const handleItemChange = async (index, e) => {
    const { name, value, type, checked, files } = e.target;
    const items = [...formData.items];
    items[index][name] = files ? files[0] : type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, items }));

    if (name === "product_id" && value) {
      try {
        const res = await axios.get(`${API_BASE_URL}/sales/serials/${value}`);
        const serials = (res.data || []).filter(
          (s) => !alreadySoldSerials.includes(s.serial_no)
        );
        setSerialNumbersByProduct((prev) => ({ ...prev, [value]: serials }));

        items[index].vci_serial_no = "";
        setFormData((prev) => ({ ...prev, items }));
      } catch (error) {
        toast.error("Failed to fetch serial numbers!");
      }
    }
  };

  // Add new item row
  const addRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: "",
          vci_serial_no: "",
          warranty_status: "",
          testing_assigned_to: "",
          tested_date: "",
          testing_status: "",
          issue_found: "",
          action_taken: "",
          urgent: false,
          upload_image: null,
        },
      ],
    }));
  };

  // Remove item row
  const removeRow = (index) => {
    const items = [...formData.items];
    items.splice(index, 1);
    setFormData((prev) => ({ ...prev, items }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();

      // Top-level fields
      for (const key in formData) {
        if (key === "items") {
          formData.items.forEach((item, index) => {
            for (const field in item) {
              if (item[field] instanceof File) {
                payload.append(`items[${index}][${field}]`, item[field]);
              } else if (item[field] !== null && item[field] !== undefined) {
                payload.append(`items[${index}][${field}]`, item[field]);
              }
            }
          });
        } else if (formData[key] instanceof File) {
          payload.append(key, formData[key]);
        } else if (formData[key] !== null && formData[key] !== undefined) {
          payload.append(key, formData[key]);
        }
      }

      await axios.put(`${API_BASE_URL}/service-vci/${id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
            onClick={() => navigate("/service-product")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Top-level fields */}
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
              <Form.Label>Tracking Number</Form.Label>
              <Form.Control
                type="text"
                name="tracking_number"
                value={formData.tracking_number}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

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

        {/* File Uploads */}
        <Row className="mb-3">
          {/* Challan 1 */}
          <Col md={4}>
            <Form.Group controlId="challan_1">
              <Form.Label>Challan 1</Form.Label>
              <div className="input-group flex-row-reverse">
                <Form.Control
                  type="text"
                  readOnly
                  className="bg-white"
                  value={
                    formData.challan_1
                      ? typeof formData.challan_1 === "string"
                        ? formData.challan_1.split("/").pop()
                        : formData.challan_1.name
                      : "No file chosen"
                  }
                />
                <div className="input-group-prepend">
                  <label className="btn btn-outline-dark mb-0">
                    Choose
                    <Form.Control
                      type="file"
                      name="challan_1"
                      onChange={handleChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            </Form.Group>
          </Col>

          {/* Challan 2 */}
          <Col md={4}>
            <Form.Group controlId="challan_2">
              <Form.Label>Challan 2</Form.Label>
              <div className="input-group flex-row-reverse">
                <Form.Control
                  type="text"
                  readOnly
                  className="bg-white"
                  value={
                    formData.challan_2
                      ? typeof formData.challan_2 === "string"
                        ? formData.challan_2.split("/").pop()
                        : formData.challan_2.name
                      : "No file chosen"
                  }
                />
                <div className="input-group-prepend">
                  <label className="btn btn-outline-dark mb-0">
                    Choose
                    <Form.Control
                      type="file"
                      name="challan_2"
                      onChange={handleChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            </Form.Group>
          </Col>

          {/* Receipt Upload */}
          <Col md={4}>
            <Form.Group controlId="receipt_upload">
              <Form.Label>Receipt Upload</Form.Label>
              <div className="input-group flex-row-reverse">
                <Form.Control
                  type="text"
                  readOnly
                  className="bg-white"
                  value={
                    formData.receipt_upload
                      ? typeof formData.receipt_upload === "string"
                        ? formData.receipt_upload.split("/").pop()
                        : formData.receipt_upload.name
                      : "No file chosen"
                  }
                />
                <div className="input-group-prepend">
                  <label className="btn btn-outline-dark mb-0">
                    Choose
                    <Form.Control
                      type="file"
                      name="receipt_upload"
                      onChange={handleChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            </Form.Group>
          </Col>
        </Row>
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

        {/* Items Table */}
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
              <th>Urgent</th>
              <th>Upload Image</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={index}>
                <td>
                  <Form.Control
                    as="select"
                    name="product_id"
                    value={item.product_id || ""}
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
                    value={item.vci_serial_no || ""}
                    onChange={(e) => handleItemChange(index, e)}
                  >
                    <option value="">Select Serial No</option>
                    {(serialNumbersByProduct[item.product_id] || []).map((s) => (
                      <option key={s.serial_no || s} value={s.serial_no || s}>
                        {s.serial_no || s}
                      </option>
                    ))}
                  </Form.Control>
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
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
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
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    name="urgent"
                    checked={item.urgent || false}
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="file"
                    name="upload_image"
                    onChange={(e) => handleItemChange(index, e)}
                  />
                </td>
                <td className="text-center">
                  <Button
                    variant="danger"
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
          Add Item
        </Button>

        <Row className="mt-4">
          <Col className="text-end">
            <Button type="submit" variant="success">
              Update Service
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default EditService;
