import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";
import api, { setAuthToken } from "../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoTrashOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const AddServicePage = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [recipientFiles, setRecipientFiles] = useState([null]);
  const MySwal = withReactContent(Swal);
  const [allowedStatus, setAllowedStatus] = useState({});

  const [formData, setFormData] = useState({
    vendor_id: "",
    challan_no: "",
    challan_date: "",
    tracking_no: "",
    items: [
      {
        sparepart_id: "",
        isPCB: false,
        vci_serial_no: "",
        quantity: "",
        status: "",
        remarks: "",
        upload_image: null,
      },
    ],
  });
  const selected = new Date(formData.challan_date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selected.getTime() > today.getTime()) {
    newErrors.challan_date = "Future dates not allowed";
  }

  const validate = () => {
    const newErrors = {};

    if (!String(formData.vendor_id || "").trim()) newErrors.vendor_id = "Vendor is required";
    if (!String(formData.challan_no || "").trim()) newErrors.challan_no = "Challan No is required";

    if (!formData.challan_date) {
      newErrors.challan_date = "Challan Date is required";
    } else {
      const selected = new Date(formData.challan_date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selected.getTime() > today.getTime()) {
        newErrors.challan_date = "Future dates not allowed";
      }
    }


    // Items: require at least one non-empty item
    if (!Array.isArray(formData.items) || formData.items.length === 0) {
      newErrors.items = "At least one service item is required";
    } else {
      let anyValidItem = false;
      formData.items.forEach((item, i) => {
        // consider a row "empty" if sparepart_id is falsy
        if (!item || !item.sparepart_id) {
          newErrors[`sparepart_id_${i}`] = "Product is required";
          return;
        }

        anyValidItem = true;

        // PCB rows require serial (non-empty after trim)
        if (item.isPCB) {
          if (!String(item.vci_serial_no || "").trim()) {
            newErrors[`vci_serial_no_${i}`] = "Serial Number required for PCB";
          }
        } else {
          // non-PCB requires quantity > 0
          const qty = Number(item.quantity);
          if (!item.quantity || Number.isNaN(qty) || qty <= 0) {
            newErrors[`quantity_${i}`] = "Quantity required and must be > 0";
          }
        }
      });

      if (!anyValidItem) {
        newErrors.items = "At least one properly filled item is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const checkSerialStatus = async (index, sparepart_id, serial, vendor_id) => {
    if (!serial || !sparepart_id || !vendor_id) return;

    try {
      const res = await api.get("/service/check-status", {
        params: {
          vendor_id,
          sparepart_id,
          serial_no: serial,
        },
      });

      let status = res.data.current_status;

      // Normalize status
      status = status ? String(status).trim() : "";

      let allowed = [];

      // NEW SERIAL → ALWAYS START WITH INWARD
      if (!status || !["Inward", "Testing", "Delivered", "Return"].includes(status)) {
        allowed = ["Inward"];
      }
      else if (status === "Inward") {
        allowed = ["Testing", "Delivered"];
      }
      else if (status === "Testing") {
        allowed = ["Delivered", "Return"];
      }
      else if (status === "Delivered") {
        allowed = ["Return"];
      }
      else if (status === "Return") {
        allowed = [];
      }

      setAllowedStatus((prev) => ({
        ...prev,
        [index]: allowed,
      }));

    } catch (err) {
      console.log("Error checking serial:", err);
    }
  };



  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);

    const fetchData = async () => {
      try {
        const [productRes, vendorRes] = await Promise.all([
          api.get("/spareparts/get"),
          api.get("/vendorsget"),
        ]);

        setProducts(productRes.data.spareparts || []);
        setVendors(vendorRes.data);
      } catch (err) {
        toast.error("Failed to fetch products/vendors!");
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleItemChange = (index, e) => {
    const { name, value, files } = e.target;
    const items = [...formData.items];

    // When product changes
    if (name === "sparepart_id") {
      const selected = products.find((p) => p.id === Number(value));

      items[index].sparepart_id = Number(value);

      // Detect PCB product
      const isPCB = !!(
        selected &&
        String(selected.name || "").toLowerCase().includes("pcb")
      );
      items[index].isPCB = isPCB;

      // Reset serial / quantity
      items[index].vci_serial_no = "";
      items[index].quantity = "";

      // Clear field errors
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`vci_serial_no_${index}`];
        delete copy[`quantity_${index}`];
        delete copy[`sparepart_id_${index}`];
        return copy;
      });

      // If PCB and vendor + serial already exist
      if (isPCB && items[index].vci_serial_no) {
        checkSerialStatus(
          index,
          Number(value),
          items[index].vci_serial_no,
          formData.vendor_id
        );
      }
    }

    // When serial number changes
    else if (name === "vci_serial_no") {
      items[index].vci_serial_no = value;

      // Trigger check ONLY if PCB
      if (items[index].isPCB) {
        checkSerialStatus(
          index,
          items[index].sparepart_id,
          value,
          formData.vendor_id
        );
      }

      setErrors((prev) => ({ ...prev, [`vci_serial_no_${index}`]: "" }));
    }

    // Other fields (quantity, remarks, status, upload_image)
    else {
      items[index][name] = files ? files[0] : value;
      setErrors((prev) => ({ ...prev, [`${name}_${index}`]: "" }));
    }

    setFormData((prev) => ({ ...prev, items }));
  };


  const addRow = () => {
    const last = formData.items[formData.items.length - 1];

    // Required: Product must be selected
    if (!last.sparepart_id) {
      toast.error("Please select a product before adding another row.");
      return;
    }

    // PCB validation
    if (last.isPCB) {
      if (!last.vci_serial_no.trim()) {
        toast.error("Please enter serial number before adding another row.");
        return;
      }

      if (!last.status) {
        toast.error("Please select status before adding another row.");
        return;
      }
    }

    // Non-PCB validation
    if (!last.isPCB) {
      if (!last.quantity || Number(last.quantity) <= 0) {
        toast.error("Please enter quantity before adding another row.");
        return;
      }

      if (!last.status) {
        toast.error("Please select status before adding another row.");
        return;
      }
    }

    // If all validations pass → add row
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sparepart_id: "",
          isPCB: false,
          vci_serial_no: "",
          quantity: "",
          status: "",
          remarks: "",
          upload_image: null,
        },
      ],
    }));
  };


  const removeRow = (index) => {
    MySwal.fire({
      title: "Are you sure?",
      text: "You cannot undo this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete!",
    }).then((result) => {
      if (result.isConfirmed) {
        const items = [...formData.items];
        items.splice(index, 1);
        setFormData((prev) => ({ ...prev, items }));
        toast.success("Row deleted");
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fill the required fields.");
      return;
    }

    const payload = new FormData();
    payload.append("vendor_id", String(formData.vendor_id).trim());
    payload.append("challan_no", String(formData.challan_no).trim());
    payload.append("challan_date", String(formData.challan_date).trim());
    payload.append("tracking_no", String(formData.tracking_no || "").trim());

    recipientFiles.forEach((file, i) => {
      if (file instanceof File) {
        payload.append(`receipt_files[${i}]`, file);
      }
    });

    formData.items.forEach((item, index) => {
      if (!item || !item.sparepart_id) return;

      payload.append(`items[${index}][sparepart_id]`, String(item.sparepart_id));

      if (item.isPCB) {
        payload.append(
          `items[${index}][vci_serial_no]`,
          String((item.vci_serial_no || "").trim())
        );
      } else {
        payload.append(`items[${index}][quantity]`, String(item.quantity));
      }

      payload.append(`items[${index}][status]`, String(item.status || "").trim());
      payload.append(`items[${index}][remarks]`, String(item.remarks || "").trim());

      if (item.upload_image instanceof File) {
        payload.append(`items[${index}][upload_image]`, item.upload_image);
      }
    });

    try {
      await api.post("/service-vci", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Service added successfully!");
      navigate("/service-product");
    } catch (err) {
      console.error("Submit Error →", err);

      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const newErrors = {};

        Object.keys(backendErrors).forEach((key) => {
          if (key.startsWith("items.")) {
            const parts = key.split("."); // items.0.quantity
            const index = parts[1];       // "0"
            const msg = backendErrors[key][0] || "";

            const lower = msg.toLowerCase();

            // Quantity related messages (includes "Only 0 qty available")
            if (
              lower.includes("quantity") ||
              lower.includes("qty") ||
              lower.includes("available")
            ) {
              newErrors[`quantity_${index}`] = msg;
            }
            // Serial related
            else if (lower.includes("serial")) {
              newErrors[`vci_serial_no_${index}`] = msg;
            }
            // Default item-level errors → map to product
            else {
              newErrors[`sparepart_id_${index}`] = msg;
            }
          } else {
            // Top-level form errors (vendor_id, challan_no, etc.)
            newErrors[key] = backendErrors[key][0];
          }
        });

        setErrors(newErrors);
        toast.error("Validation failed!");
      } else {
        toast.error("Failed to submit. Check console for details.");
      }
    }
  };



  return (
    <Container fluid>
      <Row className="align-items-center mb-3 fixed-header">
        <Col><h4>Add Service</h4></Col>

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
        {/* TOP FORM */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>
                Challan No <span className="text-danger">*</span>
              </Form.Label>
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
              <Form.Control.Feedback type="invalid">
                {errors.challan_date}
              </Form.Control.Feedback>
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
              <Form.Control.Feedback type="invalid">
                {errors.vendor_id}
              </Form.Control.Feedback>
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
              />
            </Form.Group>
          </Col>
        </Row>

        {/* RECEIPTS */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>
                Receipt Documents
                <Button
                  variant="link"
                  size="sm"
                  className="text-success ms-1 p-0"
                  onClick={() => {
                    const lastFile = recipientFiles[recipientFiles.length - 1];
                    if (!lastFile || !(lastFile instanceof File)) {
                      toast.error("Please upload a file before adding another receipt.");
                      return;
                    }

                    setRecipientFiles((prev) => [...prev, null]);
                  }}
                >
                  + Add
                </Button>
              </Form.Label>

              {recipientFiles.map((file, i) => (
                <div key={i} className="d-flex align-items-center mb-1">
                  <Form.Control
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const updated = [...recipientFiles];
                      updated[i] = e.target.files[0];
                      setRecipientFiles(updated);
                    }}
                  />

                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger ms-2 p-0"
                    disabled={recipientFiles.length === 1}
                    onClick={() =>
                      setRecipientFiles((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    ❌
                  </Button>
                </div>
              ))}
            </Form.Group>
          </Col>
        </Row>

        {/* ITEMS TABLE */}
        <h5>Service Items</h5>
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Product</th>
              <th>Serial No / Qty</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Image</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {formData.items.map((item, i) => (
              <tr key={i}>
                <td>
                  <Form.Select
                    name="sparepart_id"
                    value={item.sparepart_id}
                    onChange={(e) => handleItemChange(i, e)}
                    isInvalid={!!errors[`sparepart_id_${i}`]}
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
                  {item.isPCB ? (
                    <Form.Control
                      type="text"
                      name="vci_serial_no"
                      placeholder="Enter Serial Number"
                      value={item.vci_serial_no}
                      onChange={(e) => handleItemChange(i, e)}
                      isInvalid={!!errors[`vci_serial_no_${i}`]}
                    />
                  ) : (
                    <Form.Control
                      type="number"
                      name="quantity"
                      placeholder="Enter Quantity"
                      value={item.quantity}
                      min="1"
                      onChange={(e) => {
                        const val = e.target.value;

                        if (val === "") {
                          handleItemChange(i, e);
                          return;
                        }

                        if (/^\d+$/.test(val)) {
                          const num = Number(val);
                          if (num > 0) {
                            handleItemChange(i, e);
                          }
                        } else {
                          toast.error("Quantity must be a positive number.");
                        }
                      }}
                      isInvalid={!!errors[`quantity_${i}`]}
                    />
                  )}

                  <Form.Control.Feedback type="invalid">
                    {errors[`vci_serial_no_${i}`] || errors[`quantity_${i}`]}
                  </Form.Control.Feedback>
                </td>

                <td>
                  <Form.Select
                    name="status"
                    value={item.status}
                    onChange={(e) => {
                      const selected = e.target.value;
                      const allowed = allowedStatus[i];

                      // Allow all statuses when allowed list does NOT exist yet
                      if (allowed && allowed.length > 0 && !allowed.includes(selected)) {
                        toast.error(
                          `Status "${selected}" is NOT allowed. Allowed: ${allowed.join(", ")}`
                        );
                        return;
                      }

                      handleItemChange(i, e);
                    }}
                  >
                    <option value="">Select</option>

                    <option
                      value="Inward"
                      disabled={allowedStatus[i] ? !allowedStatus[i].includes("Inward") : false}
                    >
                      Inward
                    </option>

                    <option
                      value="Testing"
                      disabled={allowedStatus[i] ? !allowedStatus[i].includes("Testing") : false}
                    >
                      Testing
                    </option>

                    <option
                      value="Delivered"
                      disabled={allowedStatus[i] ? !allowedStatus[i].includes("Delivered") : false}
                    >
                      Delivered
                    </option>

                    <option
                      value="Return"
                      disabled={allowedStatus[i] ? !allowedStatus[i].includes("Return") : false}
                    >
                      Return
                    </option>
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

          <Button type="submit" variant="success">
            Save
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default AddServicePage;
