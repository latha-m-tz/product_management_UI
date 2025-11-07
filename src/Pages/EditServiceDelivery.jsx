import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { IoTrashOutline } from "react-icons/io5";
import { API_BASE_URL } from "../api";

export default function EditServiceDelivery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [eligibleItems, setEligibleItems] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    delivery_no: "",
    delivery_date: "",
    courier_name: "",
    tracking_no: "",
    quantity: "",
    remarks: "",
    items: [],
    challan_files: [],
    receipt_files: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, eligibleRes, deliveryRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/product`),
          axios.get(`${API_BASE_URL}/service-deliveries/eligible`),
          axios.get(`${API_BASE_URL}/service-deliveries/${id}`),
        ]);

        setProducts(prodRes.data || []);
        setEligibleItems(eligibleRes.data || []);

        const d = deliveryRes.data;
        setFormData({
          delivery_no: d.delivery_challan_no || "",
          delivery_date: d.delivery_date || "",
          courier_name: d.courier_name || "",
          tracking_no: d.tracking_number || "",
          quantity: d.quantity || "",
          remarks: d.remarks || "",
          items: d.items?.map((item) => ({
            product_id: item.product_id,
            vci_serial_no: item.vci_serial_no,
            service_vci_id: item.service_vci_id,
            service_vci_item_id: item.id,
          })) || [],
          challan_files: d.challan_files || [],
          receipt_files: d.receipt_files || [],
        });
      } catch (err) {
        console.error("Error loading delivery:", err);
        toast.error("Failed to load data!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ---------- FILE HANDLERS ----------
  const addFileField = (type) => {
    setFormData((prev) => ({
      ...prev,
      [`${type}_files`]: [...prev[`${type}_files`], null],
    }));
  };

  const removeFileField = (type, index) => {
    MySwal.fire({
      title: "Remove this file?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, remove it!",
    }).then((res) => {
      if (res.isConfirmed) {
        setFormData((prev) => ({
          ...prev,
          [`${type}_files`]: prev[`${type}_files`].filter((_, i) => i !== index),
        }));
      }
    });
  };

  const handleFileChange = (type, index, file) => {
    const updatedFiles = [...formData[`${type}_files`]];
    updatedFiles[index] = file;
    setFormData((prev) => ({ ...prev, [`${type}_files`]: updatedFiles }));
  };

  // ---------- ITEM HANDLERS ----------
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.items];
    updated[index][name] = value;

    if (name === "vci_serial_no") {
      const selected = eligibleItems.find((el) => el.vci_serial_no === value);
      if (selected) {
        updated[index].service_vci_id = selected.service_vci_id;
        updated[index].service_vci_item_id = selected.id;
      }
    }

    setFormData((prev) => ({ ...prev, items: updated }));
  };

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
      title: "Remove this item?",
      icon: "warning",
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed) {
        setFormData((prev) => ({
          ...prev,
          items: prev.items.filter((_, i) => i !== index),
        }));
      }
    });
  };

  // ---------- GENERAL FORM ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.delivery_no) newErrors.delivery_no = "Required";
    if (!formData.delivery_date) newErrors.delivery_date = "Required";
    if (!formData.courier_name) newErrors.courier_name = "Required";
    if (!formData.tracking_no) newErrors.tracking_no = "Required";
    if (!formData.quantity) newErrors.quantity = "Required";

    formData.items.forEach((item, i) => {
      if (!item.product_id) newErrors[`product_id_${i}`] = "Required";
      if (!item.vci_serial_no) newErrors[`vci_serial_no_${i}`] = "Required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🟢 handleSubmit called ✅");

    if (!validate()) return;

    const data = new FormData();

    if (formData.items?.length > 0) {
      data.append("service_vci_id", formData.items[0].service_vci_id || "");
      formData.items.forEach((item) => {
        if (item.service_vci_item_id)
          data.append("service_vci_item_ids[]", item.service_vci_item_id);
      });
    }

    data.append("delivery_challan_no", formData.delivery_no);
    data.append("delivery_date", formData.delivery_date);
    data.append("courier_name", formData.courier_name);
    data.append("tracking_number", formData.tracking_no);
    data.append("quantity", formData.quantity);
    data.append("remarks", formData.remarks || "");

    formData.challan_files.forEach((f) => {
      if (f instanceof File) data.append("challan_files[]", f);
    });
    formData.receipt_files.forEach((f) => {
      if (f instanceof File) data.append("receipt_files[]", f);
    });

    console.log("📦 Payload being sent to API:");
    for (let [key, val] of data.entries()) console.log(key, val);

    try {
      setLoading(true);
      console.log("🔁 Sending update to:", `${API_BASE_URL}/service-deliveries/${id}`);

      const res = await axios.post(`${API_BASE_URL}/service-deliveries/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        params: { _method: "PUT" },
      });

      console.log("📡 Response status:", res.status);
      console.log("📡 Response data:", res.data);

      if (res.status === 200 || res.status === 201) {
        toast.success("Service Delivery Updated Successfully!");
        navigate("/service-delivery");
      } else {
        toast.error("Unexpected response from server");
      }
    } catch (err) {
      console.error("❌ Update failed:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to update service delivery.");
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  // ---------- JSX ----------
  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h4>Edit Service Delivery</h4>
        </Col>
        <Col className="text-end">
          <Button variant="outline-secondary" onClick={() => navigate("/service-delivery")}>
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          console.log("Form submitted"); // Debug
          handleSubmit(e);
        }}
      >
        {/* ===== Basic Fields ===== */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>Delivery No</Form.Label>
            <Form.Control name="delivery_no" value={formData.delivery_no} onChange={handleChange} />
          </Col>
          <Col md={4}>
            <Form.Label>Delivery Date</Form.Label>
            <Form.Control type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} />
          </Col>
          <Col md={4}>
            <Form.Label>Courier Name</Form.Label>
            <Form.Control name="courier_name" value={formData.courier_name} onChange={handleChange} />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Tracking Number</Form.Label>
            <Form.Control name="tracking_no" value={formData.tracking_no} onChange={handleChange} />
          </Col>
          <Col md={6}>
            <Form.Label>Quantity</Form.Label>
            <Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" />
          </Col>
        </Row>

        {/* ===== FILE UPLOADS ===== */}
        <Row className="mb-4">
          {/* RECEIPT FILES */}
          <Col md={6}>
            <Form.Group>
              <Form.Label>
                Receipt Documents{" "}
                <Button variant="link" size="sm" className="text-success p-0" onClick={() => addFileField("receipt")}>
                  <i className="bi bi-plus-circle"></i> Add
                </Button>
              </Form.Label>
              {formData.receipt_files.map((file, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                  <div className="file-input-wrapper flex-grow-1 d-flex align-items-center border rounded overflow-hidden">
                    <label className="custom-file-label mb-0">
                      <span className="btn btn-outline-secondary btn-sm">Choose File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange("receipt", idx, e.target.files[0])}
                        style={{ display: "none" }}
                      />
                    </label>
                    <div className="file-display px-2 text-truncate">
                      {typeof file === "string" ? (
                        <a
                          href={`${API_BASE_URL.replace("/api", "")}/storage/${file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-dark text-truncate"
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
                  <Button variant="link" size="sm" className="text-danger p-0" onClick={() => removeFileField("receipt", idx)}>
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </div>
              ))}
            </Form.Group>
          </Col>

          {/* CHALLAN FILES */}
          <Col md={6}>
            <Form.Group>
              <Form.Label>
                Challan Documents{" "}
                <Button variant="link" size="sm" className="text-success p-0" onClick={() => addFileField("challan")}>
                  <i className="bi bi-plus-circle"></i> Add
                </Button>
              </Form.Label>
              {formData.challan_files.map((file, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                  <div className="file-input-wrapper flex-grow-1 d-flex align-items-center border rounded overflow-hidden">
                    <label className="custom-file-label mb-0">
                      <span className="btn btn-outline-secondary btn-sm">Choose File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange("challan", idx, e.target.files[0])}
                        style={{ display: "none" }}
                      />
                    </label>
                    <div className="file-display px-2 text-truncate">
                      {typeof file === "string" ? (
                        <a
                          href={`${API_BASE_URL.replace("/api", "")}/storage/${file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-dark text-truncate"
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
                  <Button variant="link" size="sm" className="text-danger p-0" onClick={() => removeFileField("challan", idx)}>
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </div>
              ))}
            </Form.Group>
          </Col>
        </Row>

        {/* ===== DELIVERY ITEMS ===== */}
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
            {formData.items.map((item, i) => (
              <tr key={i}>
                <td>
                  <Form.Select name="product_id" value={item.product_id} onChange={(e) => handleItemChange(i, e)}>
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </td>
                <td>
                  <Form.Select name="vci_serial_no" value={item.vci_serial_no} onChange={(e) => handleItemChange(i, e)}>
                    <option value="">Select Serial</option>
                    {eligibleItems
                      .filter((el) => el.product_id === Number(item.product_id))
                      .map((el) => (
                        <option key={el.id} value={el.vci_serial_no}>{el.vci_serial_no}</option>
                      ))}
                  </Form.Select>
                </td>
                <td className="text-center">
                  <Button variant="outline-danger" size="sm" onClick={() => removeItem(i)}>
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
          <Button variant="secondary" className="me-2" onClick={() => navigate("/service-delivery")}>
            Cancel
          </Button>
          <Button type="submit" variant="success">
            Update
          </Button>
        </div>
      </Form>
    </Container>
  );
}
