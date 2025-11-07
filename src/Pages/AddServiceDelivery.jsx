import React, { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { IoTrashOutline } from "react-icons/io5";
import { API_BASE_URL } from "../api";

export default function AddServiceDelivery() {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [errors, setErrors] = useState({});
  const [eligibleItems, setEligibleItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [challanFiles, setChallanFiles] = useState([null]);
  const [receiptFiles, setReceiptFiles] = useState([null]);

  const [formData, setFormData] = useState({
    delivery_no: "",
    delivery_date: "",
    courier_name: "",
    tracking_no: "",
    quantity: "",
    remarks: "",
    items: [
      {
        product_id: "",
        vci_serial_no: "",
        service_vci_id: "",
        service_vci_item_id: "",
      },
    ],
  });

  // ✅ Fetch products & eligible service items (must include service_vci_id & id)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, eligibleRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/product`),
          axios.get(`${API_BASE_URL}/service-deliveries/eligible`),
        ]);
        setProducts(prodRes.data || []);
        setEligibleItems(eligibleRes.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch data!");
      }
    };
    fetchData();
  }, []);

  // ✅ Add/Remove file fields
  const addFileField = (type) => {
    if (type === "challan") setChallanFiles((prev) => [...prev, null]);
    else setReceiptFiles((prev) => [...prev, null]);
  };

  const removeFileField = (type, index) => {
    if (type === "challan")
      setChallanFiles((prev) => prev.filter((_, i) => i !== index));
    else setReceiptFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (type, index, file) => {
    if (type === "challan") {
      setChallanFiles((prev) => {
        const updated = [...prev];
        updated[index] = file;
        return updated;
      });
    } else {
      setReceiptFiles((prev) => {
        const updated = [...prev];
        updated[index] = file;
        return updated;
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ Add/Remove items
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: "", vci_serial_no: "", service_vci_id: "", service_vci_item_id: "" },
      ],
    }));
  };

  const removeItem = (index) => {
    MySwal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed) {
        const updated = [...formData.items];
        updated.splice(index, 1);
        setFormData((prev) => ({ ...prev, items: updated }));
      }
    });
  };

  // ✅ Handle item field change
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.items];
    updated[index][name] = value;

    // When a serial is selected, store related IDs
    if (name === "vci_serial_no") {
      const selected = eligibleItems.find((el) => el.vci_serial_no === value);
      if (selected) {
        updated[index].service_vci_item_id = selected.id;
        updated[index].service_vci_id = selected.service_vci_id;
      }
    }

    setFormData((prev) => ({ ...prev, items: updated }));
  };

  // ✅ Form validation
  const validate = () => {
    const newErrors = {};
    if (!formData.delivery_no) newErrors.delivery_no = "Delivery No required";
    if (!formData.delivery_date) newErrors.delivery_date = "Delivery Date required";
    if (!formData.courier_name) newErrors.courier_name = "Courier Name required";
    if (!formData.tracking_no) newErrors.tracking_no = "Tracking No required";
    if (!formData.quantity) newErrors.quantity = "Quantity required";
    if (formData.items.length === 0) newErrors.items = "Add at least one item";

    formData.items.forEach((item, i) => {
      if (!item.product_id) newErrors[`product_id_${i}`] = "Product required";
      if (!item.vci_serial_no) newErrors[`vci_serial_no_${i}`] = "Serial required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formDataToSend = new FormData();

    // Take service_vci_id from first selected item
    const firstItem = formData.items.find((item) => item.service_vci_id);
    if (!firstItem) {
      toast.error("Missing Service VCI ID from items!");
      return;
    }

    formDataToSend.append("service_vci_id", firstItem.service_vci_id);
    formDataToSend.append("delivery_challan_no", formData.delivery_no);
    formDataToSend.append("delivery_date", formData.delivery_date);
    formDataToSend.append("courier_name", formData.courier_name || "");
    formDataToSend.append("tracking_number", formData.tracking_no || "");
    formDataToSend.append("delivered_to", formData.delivered_to || "");

    // Add service_vci_item_ids
    formData.items.forEach((item) => {
      if (item.service_vci_item_id)
        formDataToSend.append("service_vci_item_ids[]", item.service_vci_item_id);
    });

    // Add multiple files
    challanFiles.forEach((file) => {
      if (file) formDataToSend.append("challan_files[]", file);
    });
    receiptFiles.forEach((file) => {
      if (file) formDataToSend.append("receipt_files[]", file);
    });

    try {
      await axios.post(`${API_BASE_URL}/service-deliveries`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Delivery added successfully!");
      navigate("/service-delivery");
    } catch (error) {
      console.error(error);
      if (error.response?.data?.errors) {
        console.error("Validation Errors:", error.response.data.errors);
      }
      toast.error("Failed to add delivery!");
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
      <Row className="align-items-center mb-3">
        <Col>
          <h4>Add Service Delivery</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate("/service-delivery")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={4}>
            <RequiredLabel>Delivery No</RequiredLabel>
            <Form.Control
              type="text"
              name="delivery_no"
              value={formData.delivery_no}
              onChange={handleChange}
              isInvalid={!!errors.delivery_no}
            />
            <Form.Control.Feedback type="invalid">
              {errors.delivery_no}
            </Form.Control.Feedback>
          </Col>

          <Col md={4}>
            <RequiredLabel>Delivery Date</RequiredLabel>
            <Form.Control
              type="date"
              name="delivery_date"
              value={formData.delivery_date}
              onChange={handleChange}
              isInvalid={!!errors.delivery_date}
            />
          </Col>

          <Col md={4}>
            <RequiredLabel>Courier Name</RequiredLabel>
            <Form.Control
              type="text"
              name="courier_name"
              value={formData.courier_name}
              onChange={handleChange}
              isInvalid={!!errors.courier_name}
            />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <RequiredLabel>Tracking Number</RequiredLabel>
            <Form.Control
              type="text"
              name="tracking_no"
              value={formData.tracking_no}
              onChange={handleChange}
              isInvalid={!!errors.tracking_no}
            />
          </Col>
          <Col md={6}>
            <RequiredLabel>Quantity</RequiredLabel>
            <Form.Control
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              isInvalid={!!errors.quantity}
            />
          </Col>
        </Row>

        {/* FILE UPLOADS */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>
                Receipt Documents
                <Button
                  variant="link"
                  size="sm"
                  className="text-success ms-1 p-0"
                  onClick={() => addFileField("receipt")}
                >
                  <i className="bi bi-plus-circle"></i> Add
                </Button>
              </Form.Label>
              {receiptFiles.map((file, i) => (
                <div key={i} className="d-flex align-items-center mb-1">
                  <Form.Control
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      handleFileChange("receipt", i, e.target.files[0])
                    }
                  />
                  {receiptFiles.length > 1 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger ms-2 p-0"
                      onClick={() => removeFileField("receipt", i)}
                    >
                      <i className="bi bi-x-circle"></i>
                    </Button>
                  )}
                </div>
              ))}
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
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
              {challanFiles.map((file, i) => (
                <div key={i} className="d-flex align-items-center mb-1">
                  <Form.Control
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      handleFileChange("challan", i, e.target.files[0])
                    }
                  />
                  {challanFiles.length > 1 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger ms-2 p-0"
                      onClick={() => removeFileField("challan", i)}
                    >
                      <i className="bi bi-x-circle"></i>
                    </Button>
                  )}
                </div>
              ))}
            </Form.Group>
          </Col>
        </Row>

        {/* Delivery Items */}
        <h5 className="mt-4">Delivery Items</h5>
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Product</th>
              <th>Serial Number</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={index}>
                <td>
                  <Form.Select
                    name="product_id"
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, e)}
                    isInvalid={!!errors[`product_id_${index}`]}
                  >
                    <option value="">Select</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Form.Select>
                </td>
                <td>
                  <Form.Select
                    name="vci_serial_no"
                    value={item.vci_serial_no}
                    onChange={(e) => handleItemChange(index, e)}
                    isInvalid={!!errors[`vci_serial_no_${index}`]}
                  >
                    <option value="">Select</option>
                    {eligibleItems
                      .filter((el) => el.product_id === Number(item.product_id))
                      .map((el) => (
                        <option key={el.id} value={el.vci_serial_no}>
                          {el.vci_serial_no}
                        </option>
                      ))}
                  </Form.Select>
                </td>
                <td className="text-center">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <IoTrashOutline />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Button variant="success" onClick={addItem}>
          + Add Item
        </Button>

        <div className="mt-4 d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate("/service-delivery")}
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
}
