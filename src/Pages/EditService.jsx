import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";
import api, { setAuthToken, API_BASE_URL } from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { IoTrashOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const EditServicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const MySwal = withReactContent(Swal);

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [serialNumbersByProduct, setSerialNumbersByProduct] = useState({});
  const [errors, setErrors] = useState({});
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
    receipt_files: [null],
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
    const fetchData = async () => {
      try {
        const [productRes, vendorRes, serviceRes] = await Promise.all([
          api.get(`/product`),
          api.get(`/vendorsget`),
          api.get(`/service-vci/${id}`),
        ]);

        setProducts(productRes.data || []);
        setVendors(vendorRes.data || []);

        const serviceData = serviceRes.data;
        if (serviceData) {
          setFormData({
            vendor_id: serviceData.vendor_id || "",
            challan_no: serviceData.challan_no || "",
            challan_date: serviceData.challan_date || "",
            tracking_no: serviceData.tracking_no || "",
            receipt_files: serviceData.receipt_files || [null],
            items:
              serviceData.items?.map((item) => ({
                product_id: item.product_id || "",
                vci_serial_no: item.vci_serial_no || "",
status: item.status ?? "",
                remarks: item.remarks || "",
                upload_image: item.upload_image || null,
              })) || [
                {
                  product_id: "",
                  vci_serial_no: "",
                  status: "",
                  remarks: "",
                  upload_image: null,
                },
              ],
          });

          const serialsObj = {};
          for (const item of serviceData.items || []) {
            if (item.product_id) {
              const res = await api.get(`/sales/serials/${item.product_id}`);
              serialsObj[item.product_id] = res.data || [];
            }
          }
          setSerialNumbersByProduct(serialsObj);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch service data!");
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleItemChange = async (index, e) => {
    const { name, value, files } = e.target;
    const items = [...formData.items];
    items[index][name] = files ? files[0] : value;
    setFormData((prev) => ({ ...prev, items }));

    // Fetch serials if product changes
if (name === "product_id" && value) {
  try {
    const res = await api.get(`/sales/serials/${value}`);

    setSerialNumbersByProduct((prev) => ({
      ...prev,
      [value]: res.data || []
    }));

    // Only clear serial if product changes (check previous)
    if (formData.items[index].product_id !== value) {
      const updatedItems = [...items];
      updatedItems[index].vci_serial_no = "";
      setFormData((prev) => ({ ...prev, items: updatedItems }));
    }
  } catch {
    toast.error("Failed to fetch serial numbers!");
  }
}


    setErrors((prev) => ({ ...prev, [`${name}_${index}`]: "" }));
  };

  const addRow = () =>
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: "", vci_serial_no: "", status: "", remarks: "", upload_image: null },
      ],
    }));

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

  const addFileField = () =>
    setFormData((prev) => ({ ...prev, receipt_files: [...prev.receipt_files, null] }));

  const removeFileField = (index) => {
    const updated = [...formData.receipt_files];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, receipt_files: updated }));
  };

  const handleFileChange = (index, file) => {
    const updated = [...formData.receipt_files];
    updated[index] = file;
    setFormData((prev) => ({ ...prev, receipt_files: updated }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = new FormData();
    payload.append("_method", "PUT");
    payload.append("vendor_id", formData.vendor_id);
    payload.append("challan_no", formData.challan_no);
    payload.append("challan_date", formData.challan_date);
    payload.append("tracking_no", formData.tracking_no)

    formData.receipt_files.forEach((file, i) => {
      if (file instanceof File) payload.append(`receipt_files[${i}]`, file);
    });

    formData.items.forEach((item, index) => {
      Object.entries(item).forEach(([key, value]) => {
        if (key === "upload_image" && value instanceof File) {
          payload.append(`items[${index}][${key}]`, value);
        } else {
          payload.append(`items[${index}][${key}]`, value ?? "");
        }
      });
    });

    try {
      await api.post(`/service-vci/${id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Service updated successfully!");
      navigate("/service-product");
    } catch (err) {
      console.error(err);
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
              <Form.Label>Vendor <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                isInvalid={!!errors.vendor_id}
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.vendor}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.vendor_id}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Tracking No</Form.Label>
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
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>
                Receipt Documents
                <Button
                  variant="link"
                  size="sm"
                  className="text-success ms-1 p-0"
                  onClick={() => addFileField()}
                >
                  <i className="bi bi-plus-circle"></i> Add
                </Button>
              </Form.Label>

              {formData.receipt_files.map((file, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                  <div className="file-input-wrapper flex-grow-1 d-flex align-items-center border rounded overflow-hidden">
                    <label className="custom-file-label mb-0 d-flex align-items-center m-0">
                      <span className="btn btn-outline-secondary btn-sm">Choose File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(idx, e.target.files[0])}
                        style={{ display: "none" }}
                      />
                    </label>

                    <div className="file-display px-2 text-truncate">
                      {typeof file === "string" ? (
                        <a
                          href={`${API_BASE_URL.replace("/api", "")}/${file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-truncate"
                          style={{ maxWidth: "100%" }}
                        >
                          {file.split("/").pop()}
                        </a>
                      ) : file ? (
                        file.name
                      ) : (
                        "No file chosen"
                      )}
                    </div>
                  </div>

                  {/* Always show ❌ — but disable when only 1 row */}
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => removeFileField(idx)}
                    disabled={formData.receipt_files.length === 1}
                  >
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </div>
              ))}

            </Form.Group>
          </Col>
        </Row>

        <h5 className="mt-4">Service Items</h5>
<Table bordered responsive className="service-table">
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
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors[`product_id_${i}`]}</Form.Control.Feedback>
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
                      <option key={s.id || s.serial_no} value={s.serial_no}>{s.serial_no}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors[`vci_serial_no_${i}`]}</Form.Control.Feedback>
                </td>

                <td>
                  <Form.Select
                    name="status"
                    value={item.status}
                    onChange={(e) => handleItemChange(i, e)}
                  >
                    <option value="">Select</option>
                    <option value="Inward">Inward</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Testing">Testing</option>
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
                  <div className="file-input-wrapper d-flex align-items-center gap-2">
                    <label className="custom-file-label mb-0 d-flex align-items-center m-0">
                      <span className="btn btn-outline-secondary btn-sm">Choose File</span>
                      <input
                        type="file"
                        name="upload_image"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleItemChange(i, e)}
                        style={{ display: "none" }}
                      />
                    </label>

                    <div className="file-display text-truncate">
                      {typeof item.upload_image === "string" ? (
                        <a
                          href={`${API_BASE_URL.replace("/api", "")}/storage/${item.upload_image}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-truncate"
                          style={{ maxWidth: "100px" }}
                        >
                          {item.upload_image.split("/").pop()}
                        </a>
                      ) : item.upload_image instanceof File ? (
                        item.upload_image.name
                      ) : (
                        "No file chosen"
                      )}
                    </div>
                  </div>
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
            Update Service
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EditServicePage;
