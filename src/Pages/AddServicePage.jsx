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
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { API_BASE_URL } from "../api";

const AddServicePage = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [serialNumbersByProduct, setSerialNumbersByProduct] = useState({});
  const [alreadySoldSerials, setAlreadySoldSerials] = useState([]);
  const MySwal = withReactContent(Swal);
  // const [challanFiles, setChallanFiles] = useState([null]);
  const [recipientFiles, setRecipientFiles] = useState([null]);

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
    // challan_1: null,
    // challan_2: null,
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

  // ✅ Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.challan_no) newErrors.challan_no = "Challan No is required";
    if (!formData.challan_date) newErrors.challan_date = "Challan Date is required";
    if (!formData.from_place) newErrors.from_place = "From is required";
    if (!formData.to_place) newErrors.to_place = "To is required";
    if (!formData.sent_date) newErrors.sent_date = "Send Date is required";
    if (!formData.received_date) newErrors.received_date = "Received Date is required";
    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else if (isNaN(formData.quantity) || Number(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be positive";
    } else if (Number(formData.quantity) !== formData.items.length) {
      newErrors.quantity = `You must add exactly ${formData.quantity} service items (currently added ${formData.items.length})`;
    }

    formData.items.forEach((item, index) => {
      if (!item.product_id) newErrors[`product_id_${index}`] = "Product is required";
      if (!item.vci_serial_no) newErrors[`vci_serial_no_${index}`] = "Serial No is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Fetch products and serials
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/product`);
        setProducts(res.data);
      } catch {
        toast.error("Failed to fetch products!");
      }
    };
    const fetchAlreadyAddedSerials = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/get-serviceserials`);
        setAlreadySoldSerials(res.data || []);
      } catch {
        setAlreadySoldSerials([]);
      }
    };

    fetchProducts();
    fetchAlreadyAddedSerials();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleItemChange = async (index, e) => {
    const { name, value, type, checked, files } = e.target;
    const items = [...formData.items];
    items[index][name] = files ? files[0] : type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, items }));

    if (name === "product_id" && value) {
      try {
        const res = await axios.get(`${API_BASE_URL}/sales/serials/${value}`);
        const serials = res.data || [];

        const filteredSerials = serials.filter(
          (s) => !alreadySoldSerials.includes(s.serial_no)
        );

        setSerialNumbersByProduct((prev) => ({
          ...prev,
          [value]: filteredSerials,
        }));

        items[index].vci_serial_no = "";
        setFormData((prev) => ({ ...prev, items }));
      } catch (error) {
        console.error("Failed to fetch serials:", error);
        toast.error("Failed to fetch serial numbers!");
      }
    }
  };
  // Add new file input
  const addFileField = (type) => {
    if (type === "challan") {
      setChallanFiles((prev) => [...prev, null]);
    } else if (type === "recipient") {
      setRecipientFiles((prev) => [...prev, null]);
    }
  };

  // Remove file input
  const removeFileField = (type, index) => {
    // if (type === "challan") {
    //   setChallanFiles((prev) => prev.filter((_, i) => i !== index));
    // } else
     if (type === "recipient") {
      setRecipientFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Handle file change
  const handleFileChange = (type, index, file) => {
    // if (type === "challan") {
    //   setChallanFiles((prev) => {
    //     const updated = [...prev];
    //     updated[index] = file;
    //     return updated;
    //   });
    // } else 
    if (type === "recipient") {
      setRecipientFiles((prev) => {
        const updated = [...prev];
        updated[index] = file;
        return updated;
      });
    }
  };
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

  // ✅ Remove row
  const removeRow = (index) => {
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
        const items = [...formData.items];
        items.splice(index, 1);
        setFormData((prev) => ({ ...prev, items }));
        toast.success("Row deleted successfully!");
      }
    });
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = new FormData();

    // Append all basic form fields
    for (const key in formData) {
      if (key === "items") {
        formData.items.forEach((item, index) => {
          for (const field in item) {
            payload.append(`items[${index}][${field}]`, item[field]);
          }
        });
      } else {
        payload.append(key, formData[key]);
      }
    }

    // ✅ Append multiple receipt files
    recipientFiles.forEach((file, i) => {
      if (file) payload.append(`receipt_files[${i}]`, file);
    });

    // ✅ Append multiple challan files
    // challanFiles.forEach((file, i) => {
    //   if (file) payload.append(`challan_files[${i}]`, file);
    // });

    try {
      await axios.post(`${API_BASE_URL}/service-vci`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Service added successfully!");
      navigate("/service-product");
    } catch (error) {
      console.error("❌ Service submission error:", error);
      toast.error("Failed to add service!");
    }
  };

  const RequiredLabel = ({ children }) => (
    <Form.Label>
      {children}
      <span style={{ color: "red" }}> *</span>
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

      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Row 1 */}
        <Row className="mb-3">
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
              <Form.Control.Feedback type="invalid">
                {errors.challan_no}
              </Form.Control.Feedback>
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
              <Form.Control.Feedback type="invalid">
                {errors.challan_date}
              </Form.Control.Feedback>
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
            <RequiredLabel>From</RequiredLabel>
            <Form.Control
              type="text"
              name="from_place"
              value={formData.from_place}
              onChange={handleChange}
              isInvalid={!!errors.from_place}
            />
            <Form.Control.Feedback type="invalid">
              {errors.from_place}
            </Form.Control.Feedback>
          </Col>

          <Col md={4}>
            <RequiredLabel>To</RequiredLabel>
            <Form.Control
              type="text"
              name="to_place"
              value={formData.to_place}
              onChange={handleChange}
              isInvalid={!!errors.to_place}
            />
            <Form.Control.Feedback type="invalid">
              {errors.to_place}
            </Form.Control.Feedback>
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

        {/* Row 3 */}
        <Row className="mb-3">
          <Col md={4}>
            <RequiredLabel>Quantity</RequiredLabel>
            <Form.Group>
              <Form.Control
                type="number"
                name="quantity"
                value={formData.quantity}
                min="0" // 🔒 Prevents negative input
                onChange={(e) => {
                  const { name, value } = e.target;
                  if (value < 0) return;
                  setFormData({ ...formData, [name]: value });
                }}
              />
            </Form.Group>
            <Form.Control.Feedback type="invalid">
              {errors.quantity}
            </Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <RequiredLabel>Send Date</RequiredLabel>
            <Form.Control
              type="date"
              name="sent_date"
              value={formData.sent_date}
              onChange={handleChange}
            />
          </Col>
          <Col md={4}>
            <RequiredLabel>Received Date</RequiredLabel>
            <Form.Control
              type="date"
              name="received_date"
              value={formData.received_date}
              onChange={handleChange}
              isInvalid={!!errors.received_date}
            />
          </Col>
        </Row>

        <Row className="mb-3">
          {/* RECEIPT FILES */}
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>
                Receipt Documents
                <Button
                  variant="link"
                  size="sm"
                  className="text-success ms-1 p-0"
                  onClick={() => addFileField("recipient")}
                >
                  <i className="bi bi-plus-circle"></i> Add
                </Button>
              </Form.Label>
              {recipientFiles.map((file, idx) => (
                <div key={idx} className="d-flex align-items-center mb-1">
                  <Form.Control
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      handleFileChange("recipient", idx, e.target.files[0])
                    }
                  />
                  {recipientFiles.length > 1 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger ms-2 p-0"
                      onClick={() => removeFileField("recipient", idx)}
                    >
                      <i className="bi bi-x-circle"></i>
                    </Button>
                  )}
                </div>
              ))}
            </Form.Group>
          </Col>

          {/* CHALLAN FILES */}
          {/* <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>
                Challan Documents
                <Button
                  variant="link"
                  size="sm"
                  className="text-success ms-1 p-0"
                  onClick={() => addFileField("challan")}
                >
                  <i className="bi bi-plus-circle"></i> Add
                </Button>
              </Form.Label>
              {challanFiles.map((file, idx) => (
                <div key={idx} className="d-flex align-items-center mb-1">
                  <Form.Control
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      handleFileChange("challan", idx, e.target.files[0])
                    }
                  />
                  {challanFiles.length > 1 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger ms-2 p-0"
                      onClick={() => removeFileField("challan", idx)}
                    >
                      <i className="bi bi-x-circle"></i>
                    </Button>
                  )}
                </div>
              ))}
            </Form.Group>
          </Col> */}
        </Row>


        {/* Remarks */}
        <Row className="mb-3">
          <Col>
            <Form.Label>Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
            />
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
              <th>Upload Image</th>
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
                    name="product_id"
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, e)}
                    isInvalid={!!errors[`product_id_${index}`]}
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors[`product_id_${index}`]}
                  </Form.Control.Feedback>
                </td>
                <td>
                  <Form.Control
                    as="select"
                    name="vci_serial_no"
                    value={item.vci_serial_no || ""}
                    onChange={(e) => handleItemChange(index, e)}
                    isInvalid={!!errors[`vci_serial_no_${index}`]}
                  >
                    <option value="">Select Serial No</option>
                    {(serialNumbersByProduct[item.product_id] || []).map((s) => (
                      <option key={s.id || s.serial_no} value={s.serial_no}>
                        {s.serial_no}
                      </option>
                    ))}
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors[`vci_serial_no_${index}`]}
                  </Form.Control.Feedback>
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
                    <option value="inactive">Inactive</option>
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
                    type="file"
                    name="upload_image"
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
                    onClick={() => removeRow(index)}
                  >
                    <IoTrashOutline />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
<Button
  type="button"
  variant="success"
  onClick={addRow}
  disabled={formData.quantity <= formData.items.length}
>
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
