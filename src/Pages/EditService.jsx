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
  const [removedFiles, setRemovedFiles] = useState({
    challan: [],
    receipt: [],
  });

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
    challan_files: [],
    receipt_files: [],
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
  // --- File Field Handlers ---
  const addFileField = (type) => {
    setFormData((prev) => ({
      ...prev,
      [`${type}_files`]: [...(prev[`${type}_files`] || []), null],
    }));
  };

  const removeFileField = (type, index) => {
    const key = `${type}_files`;
    const updated = [...formData[key]];
    const removedFile = updated[index];

    // Track removed file names if it's a string (already stored file)
    if (typeof removedFile === "string") {
      setRemovedFiles((prev) => ({
        ...prev,
        [type]: [...prev[type], removedFile],
      }));
    }

    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, [key]: updated }));
  };


  const handleFileChange = (type, index, file) => {
    setFormData((prev) => {
      const key = `${type}_files`;
      const currentFiles = [...(prev[key] || [])];

      currentFiles[index] = file instanceof File ? file : null;

      return {
        ...prev,
        [key]: currentFiles,
      };
    });
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔹 Fetch all products
        const productRes = await axios.get(`${API_BASE_URL}/product`);
        setProducts(productRes.data || []);

        // 🔹 Fetch already sold serial numbers
        const serialRes = await axios.get(`${API_BASE_URL}/get-serviceserials`);
        const soldSerialNumbers = (serialRes.data || []).map((s) => s.serial_no);
        setAlreadySoldSerials(soldSerialNumbers);

        // 🔹 Fetch existing service details
        const serviceRes = await axios.get(`${API_BASE_URL}/service-vci/${id}`);
        const serviceData = serviceRes.data;

        if (serviceData) {
          // ✅ Prefill main form fields (with all fields included)
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
            hsn_code: serviceData.hsn_code || "",
            status: serviceData.status || "",
            challan_1: serviceData.challan_1 || null,
            challan_2: serviceData.challan_2 || null,
            receipt_upload: serviceData.receipt_upload || null,
            challan_files: serviceData.challan_files || [], // ✅ new field (JSON array)
            receipt_files: serviceData.receipt_files || [], // ✅ new field (JSON array)
          };

          // ✅ Prefill items array
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
            upload_image: item.upload_image || null, // ✅ keep existing image if present
          }));

          // ✅ Update formData state
          setFormData((prev) => ({ ...prev, ...topData, items }));

          // 🔹 Fetch serial numbers for each product
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
        console.error("❌ Failed to fetch service data:", error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();

      // Laravel expects this for PUT/PATCH via FormData
      payload.append("_method", "PUT");

      // 🔹 Append top-level text fields
      payload.append("challan_no", formData.challan_no || "");
      payload.append("challan_date", formData.challan_date || "");
      payload.append("courier_name", formData.courier_name || "");
      payload.append("quantity", formData.quantity || 0);
      payload.append("status", formData.status || "");
      payload.append("sent_date", formData.sent_date || "");
      payload.append("received_date", formData.received_date || "");
      payload.append("from_place", formData.from_place || "");
      payload.append("to_place", formData.to_place || "");
      payload.append("tracking_number", formData.tracking_number || "");
      payload.append("remarks", formData.remarks || "");

      // 🔹 Append multiple files for challan_files and receipt_files
      ["challan_files", "receipt_files"].forEach((key) => {
        if (Array.isArray(formData[key]) && formData[key].length > 0) {
          formData[key].forEach((file, index) => {
            if (file instanceof File) {
              payload.append(`${key}[${index}]`, file);
            }
          });
        }
      });

      // 🔹 Append items array
      if (Array.isArray(formData.items) && formData.items.length > 0) {
        formData.items.forEach((item, index) => {
          for (const field in item) {
            payload.append(`items[${index}][${field}]`, item[field] ?? "");
          }
        });
      } else {
        payload.append("items", "");
      }

      // 🆕 ✅ Append removed files info
      payload.append("removed_challan_files", JSON.stringify(removedFiles.challan));
      payload.append("removed_receipt_files", JSON.stringify(removedFiles.receipt));

      // 🔹 Debug (optional)
      console.log("🧾 Sending FormData:");
      for (let [k, v] of payload.entries()) console.log(k, v);

      // 🔹 Send request
      await axios.post(`${API_BASE_URL}/service-vci/${id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Service updated successfully!");
      navigate("/service-product");
    } catch (error) {
      console.error("❌ Error updating service:", error);

      if (error.response?.status === 422 && error.response.data.errors) {
        const errors = error.response.data.errors;
        Object.values(errors).flat().forEach((msg) => toast.error(msg));
      } else {
        toast.error("Failed to update service!");
      }
    }
  };




  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
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
                min="0" // 🔒 Prevents negative input
                onChange={(e) => {
                  const { name, value } = e.target;
                  if (value < 0) return;
                  setFormData({ ...formData, [name]: value });
                }}
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
                  onClick={() => addFileField("receipt")}
                >
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
                        onChange={(e) =>
                          handleFileChange("receipt", idx, e.target.files[0])
                        }
                        style={{ display: "none" }}
                      />
                    </label>

                    <div className="file-display px-2 text-truncate">
                      {typeof file === "string" ? (
                        <a
                          href={`${API_BASE_URL.replace("/api", "")}/storage/${file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dark text-truncate"
                          style={{ maxWidth: "100%", textDecoration: "none" }}
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

                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => removeFileField("receipt", idx)}
                  >
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </div>
              ))}
            </Form.Group>
          </Col>

          {/* CHALLAN FILES */}
          <Col md={6}>
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

              {formData.challan_files.map((file, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                  <div className="file-input-wrapper flex-grow-1 d-flex align-items-center border rounded overflow-hidden">
                    <label className="custom-file-label mb-0">
                      <span className="btn btn-outline-secondary btn-sm">Choose File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) =>
                          handleFileChange("challan", idx, e.target.files[0])
                        }
                        style={{ display: "none" }}
                      />
                    </label>

                    <div className="file-display px-2 text-truncate">
                      {typeof file === "string" ? (
                        <a
                          href={`${API_BASE_URL.replace("/api", "")}/storage/${file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dark text-truncate"
                          style={{ maxWidth: "100%", textDecoration: "none" }}
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

                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => removeFileField("challan", idx)}
                  >
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </div>
              ))}
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
                  <div className="d-flex align-items-center gap-1">
                    <div className="file-input-wrapper flex-grow-1 d-flex align-items-center border rounded overflow-hidden" style={{ height: "32px" }}>
                      <label className="custom-file-label mb-0" style={{ fontSize: "12px" }}>
                        <span
                          className="btn btn-outline-secondary btn-sm py-0 px-2"
                          style={{ fontSize: "12px", lineHeight: "20px" }}
                        >
                          Choose
                        </span>
                        <input
                          type="file"
                          name="upload_image"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleItemChange(index, e)}
                          style={{ display: "none" }}
                        />
                      </label>

                      <div
                        className="file-display px-2 text-truncate"
                        style={{ fontSize: "12px", maxWidth: "120px" }}
                      >
                        {typeof item.upload_image === "string" && item.upload_image ? (
                          <a
                            href={`${API_BASE_URL.replace("/api", "")}/storage/${item.upload_image}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-dark text-truncate"
                            style={{ textDecoration: "none" }}
                          >
                            {item.upload_image.split("/").pop()}
                          </a>
                        ) : item.upload_image instanceof File ? (
                          item.upload_image.name
                        ) : (
                          "No file"
                        )}
                      </div>
                    </div>
                  </div>
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
