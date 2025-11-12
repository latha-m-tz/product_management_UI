import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";
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
  const [vendors, setVendors] = useState([]);
  const [serialNumbersByProduct, setSerialNumbersByProduct] = useState({});
  const [recipientFiles, setRecipientFiles] = useState([null]);
  const MySwal = withReactContent(Swal);

  const [formData, setFormData] = useState({
    vendor_id: "",
    challan_no: "",
    challan_date: "",
    tracking_no: "",
    items: [
      {
        product_id: "",
        vci_serial_no: "",
        status: "",
        remarks: "",
        upload_image: null,
      },
    ],
  });

  const validate = () => {
    const newErrors = {};
    if (!formData.vendor_id) newErrors.vendor_id = "Vendor is required";
    if (!formData.challan_no) newErrors.challan_no = "Challan No is required";
    if (!formData.challan_date) newErrors.challan_date = "Challan Date is required";

    formData.items.forEach((item, i) => {
      if (!item.product_id) newErrors[`product_id_${i}`] = "Product is required";
      if (!item.vci_serial_no) newErrors[`vci_serial_no_${i}`] = "Serial No is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, vendorRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/product`),
          axios.get(`${API_BASE_URL}/vendorsget`),
        ]);

        console.log("✅ Vendor Response:", vendorRes.data); 

        setProducts(productRes.data);
        setVendors(vendorRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch products or vendors!");
      }
    };
    fetchData();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

  };

  const handleItemChange = async (index, e) => {
    const { name, value, files } = e.target;
    const items = [...formData.items];
    items[index][name] = files ? files[0] : value;

    setFormData((prev) => ({ ...prev, items }));

    // clear the dynamic field error
    const errorKey = `${name}_${index}`;
    setErrors((prev) => ({ ...prev, [errorKey]: "" }));

    if (name === "product_id" && value) {
      try {
        const res = await axios.get(`${API_BASE_URL}/sales/serials/${value}`);
        setSerialNumbersByProduct((prev) => ({ ...prev, [value]: res.data || [] }));
      } catch {
        toast.error("Failed to fetch serial numbers!");
      }
    }
  };


  // ✅ Add / Remove receipt file inputs
  const addFileField = () => setRecipientFiles((prev) => [...prev, null]);
  const removeFileField = (index) =>
    setRecipientFiles((prev) => prev.filter((_, i) => i !== index));
  const handleFileChange = (index, file) => {
    setRecipientFiles((prev) => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });
  };

  // ✅ Add / Remove item rows
  const addRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: "", vci_serial_no: "", status: "", remarks: "", upload_image: null },
      ],
    }));
  };

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
    payload.append("vendor_id", formData.vendor_id);
    payload.append("challan_no", formData.challan_no);
    payload.append("challan_date", formData.challan_date);
    payload.append("tracking_no", formData.tracking_no);

    recipientFiles.forEach((file, i) => {
      if (file) payload.append(`receipt_files[${i}]`, file);
    });

    formData.items.forEach((item, index) => {
      Object.entries(item).forEach(([key, value]) => {
        if (key === "upload_image") {
          if (value instanceof File) {
            payload.append(`items[${index}][${key}]`, value);
          }
        } else {
          payload.append(`items[${index}][${key}]`, value ?? "");
        }
      });
    });


    try {
      await axios.post(`${API_BASE_URL}/service-vci`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Service added successfully!");
      navigate("/service-product");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add service!");
    }
  };

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


        {/* ✅ Challan Fields */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Challan No <span className="text-danger">*</span></Form.Label>
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
          <Col md={6}>
            <Form.Group>
              <Form.Label>Challan Date <span className="text-danger">*</span></Form.Label>
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
        </Row>
        <Row className="mb-3">

          <Col md={6}>
            <Form.Group>
              <Form.Label>
                Vendor <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                isInvalid={!!errors.vendor_id}
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.vendor_id}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
             <Col md={6}>
            <Form.Group>
              <Form.Label>Tracking No <span className="text-danger"></span></Form.Label>
              <Form.Control
                type="text"
                name="tracking_no"
                value={formData.tracking_no}
                onChange={handleChange}
                isInvalid={!!errors.tracking_no}
              />
              <Form.Control.Feedback type="invalid">{errors.tracking_no}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          </Row>

        <Row className="mb-3">
          {/* ✅ eipt Files */}
          <Col md={6}>
            <Form.Group>
              <Form.Label>
                Receipt Documents
                <Button
                  variant="link"
                  size="sm"
                  className="text-success ms-1 p-0"
                  onClick={addFileField}
                >
                  <i className="bi bi-plus-circle"></i> Add
                </Button>
              </Form.Label>
              {recipientFiles.map((file, idx) => (
                <div key={idx} className="d-flex align-items-center mb-1">
                  <Form.Control
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(idx, e.target.files[0])}
                  />
                  {recipientFiles.length > 1 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger ms-2 p-0"
                      onClick={() => removeFileField(idx)}
                    >
                      <i className="bi bi-x-circle"></i>
                    </Button>
                  )}
                </div>
              ))}
            </Form.Group>
          </Col>
        </Row>

        {/* ✅ Service Items Table */}
        <h5 className="mt-4">Service Items</h5>
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Product</th>
              <th>Serial No</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Upload Image</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, i) => (
              <tr key={i}>
                <td>
                  <Form.Select
                    name="product_id"
                    value={item.product_id}
                    onChange={(e) => handleItemChange(i, e)}
                    isInvalid={!!errors[`product_id_${i}`]}
                  >
                    <option value="">Select Product</option>
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
                    onChange={(e) => handleItemChange(i, e)}
                    isInvalid={!!errors[`vci_serial_no_${i}`]}
                  >
                    <option value="">Select Serial No</option>
                    {(serialNumbersByProduct[item.product_id] || []).map((s) => (
                      <option key={s.id || s.serial_no} value={s.serial_no}>
                        {s.serial_no}
                      </option>
                    ))}
                  </Form.Select>
                </td>

                <td>
                  <Form.Select
                    name="status"
                    value={item.status}
                    onChange={(e) => handleItemChange(i, e)}
                  >
                    <option value="">Select</option>
                    <option value="inward">Inward</option>
                    <option value="delivered">Delivered</option>
                    <option value="testing">Testing</option>
                  </Form.Select>
                </td>

                <td>
                  <Form.Control
                    type="text"
                    name="remarks"
                    value={item.remarks}
                    onChange={(e) => handleItemChange(i, e)}
                  />
                </td>

                <td>
                  <Form.Control
                    type="file"
                    name="upload_image"
                    onChange={(e) => handleItemChange(i, e)}
                  />
                </td>

                <td className="text-center">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeRow(i)}
                  >
                    <IoTrashOutline />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Button type="button" variant="success" onClick={addRow}>
          + Add Row
        </Button>

        <div className="mt-4 d-flex justify-content-end">
          <Button variant="secondary" className="me-2" onClick={() => navigate("/service-product")}>
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
