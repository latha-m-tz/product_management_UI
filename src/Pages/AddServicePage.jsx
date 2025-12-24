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
  const [allSpareparts, setAllSpareparts] = useState([]);
  const getAllowedStatuses = (item) => {
    if (item.type === "sparepart") {
      // Sparepart → ONLY Return
      return ["Return"];
    }

    if (item.type === "product") {
      // Product → ONLY these three
      return ["Inward", "Testing", "Delivered"];
    }

    return [];
  };

  const [formData, setFormData] = useState({
    vendor_id: "",
    challan_no: "",
    challan_date: "",
    tracking_no: "",
    items: [
      {
        type: "product",
        product_id: "",
        serial_from: "",
        serial_to: "",
        status: "",
        remarks: "",
        upload_image: null,
      },
      {
        type: "sparepart",
        sparepart_id: "",
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
    navigate.challan_date = "Future dates not allowed";
  }

  const validate = () => {
    const newErrors = {};

    if (!String(formData.vendor_id || "").trim()) {
      newErrors.vendor_id = "Vendor is required";
    }

    if (!String(formData.challan_no || "").trim()) {
      newErrors.challan_no = "Challan No is required";
    }

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

    if (!Array.isArray(formData.items) || formData.items.length === 0) {
      newErrors.items = "At least one service item is required";
    } else {
      let anyValidItem = false;

      formData.items.forEach((item, i) => {
        if (!item || !item.type) {
          newErrors[`row_${i}`] = "Invalid row";
          return;
        }

        anyValidItem = true;

        if (item.type === "product") {
          if (!item.product_id) {
            newErrors[`product_id_${i}`] = "Product is required";
          }

          if (!item.serial_from || !item.serial_to) {
            newErrors[`serial_${i}`] = "Serial From and To are required";
          } else if (Number(item.serial_to) < Number(item.serial_from)) {
            newErrors[`serial_${i}`] = "Serial To must be ≥ Serial From";
          }

          if (!item.status) {
            newErrors[`status_${i}`] = "Status is required";
          }
        }


        if (item.type === "sparepart") {
          if (!item.sparepart_id) {
            newErrors[`sparepart_id_${i}`] = "Sparepart is required";
          }

          if (item.isPCB) {
            if (!item.vci_serial_no) {
              newErrors[`vci_serial_no_${i}`] = "Serial No is required";
            }
          } else {
            const qty = Number(item.quantity);
            if (!item.quantity || Number.isNaN(qty) || qty <= 0) {
              newErrors[`quantity_${i}`] = "Quantity must be greater than 0";
            }
          }

          if (!item.status) {
            newErrors[`status_${i}`] = "Status is required";
          }



          if (item.isPCB) {
            const allowed = allowedStatus[i];

            if (
              allowed &&
              allowed.length > 0 &&
              item.status &&
              !allowed.includes(item.status)
            ) {
              newErrors[`status_${i}`] =
                `Invalid status. Allowed: ${allowed.join(", ")}`;
            }
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
      status = status ? String(status).trim() : "";

      let allowed = [];

      // 🔒 STATUS FLOW ENFORCEMENT
      if (!status) {
        // FIRST TIME ENTRY
        allowed = ["Inward"];
      } else if (status === "Inward") {
        allowed = ["Delivered"];
      } else if (status === "Delivered") {
        allowed = ["Inward"];
      } else {
        allowed = [];
      }

      setAllowedStatus((prev) => ({
        ...prev,
        [index]: allowed,
      }));
    } catch (err) {
      console.error("Error checking serial status:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);

    const fetchData = async () => {
      try {
        const [productRes, sparepartRes, vendorRes] = await Promise.all([
          api.get("/product"),
          api.get("/spareparts/get"),
          api.get("/vendorsget"),
        ]);
        console.log("PRODUCTS API RESPONSE:", productRes.data);
        console.log("SPAREPARTS API RESPONSE:", sparepartRes.data);

        setProducts(
          Array.isArray(productRes.data)
            ? productRes.data
            : productRes.data.products || productRes.data.data || []
        );
        setAllSpareparts(sparepartRes.data.spareparts || []);
        setVendors(vendorRes.data);
      } catch (err) {
        toast.error("Failed to fetch data!");
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

    if (name === "product_sparepart") {
      if (!value) {
        items[index] = {
          ...items[index],
          product_id: "",
          sparepart_id: "",
          isPCB: false,
          vci_serial_no: "",
          quantity: "",
          status: "",
          serial_from: "",
          serial_to: "",
        };

        setFormData((prev) => ({ ...prev, items }));
        return;
      }

      const [productId, sparepartId] = value.split("|").map(Number);

      const selectedSparepart = allSpareparts.find(
        (sp) => sp.id === sparepartId
      );

      items[index].product_id = productId;
      items[index].sparepart_id = sparepartId;
      items[index].isPCB = selectedSparepart?.product_type_name === "vci";

      items[index].vci_serial_no = "";
      items[index].quantity = "";
      items[index].status = "";
      items[index].serial_from = "";
      items[index].serial_to = "";

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`sparepart_id_${index}`];
        delete copy[`vci_serial_no_${index}`];
        delete copy[`quantity_${index}`];
        return copy;
      });

      setFormData((prev) => ({ ...prev, items }));
      return;
    }

    if (name === "product_id") {
      items[index].product_id = Number(value);

      items[index].sparepart_id = "";
      items[index].isPCB = false;
      items[index].vci_serial_no = "";
      items[index].quantity = "";
      items[index].status = "";
      items[index].serial_from = "";
      items[index].serial_to = "";

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`product_id_${index}`];
        delete copy[`sparepart_id_${index}`];
        delete copy[`vci_serial_no_${index}`];
        delete copy[`quantity_${index}`];
        return copy;
      });

      setFormData((prev) => ({ ...prev, items }));
      return;
    }

    if (name === "sparepart_id") {
      const selectedSparepart = allSpareparts.find(
        (sp) => sp.id === Number(value)
      );

      items[index].sparepart_id = Number(value);
      items[index].isPCB = selectedSparepart?.product_type_name === "vci";

      items[index].vci_serial_no = "";
      items[index].quantity = "";
      items[index].status = "";
      items[index].serial_from = "";
      items[index].serial_to = "";

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`sparepart_id_${index}`];
        delete copy[`vci_serial_no_${index}`];
        delete copy[`quantity_${index}`];
        return copy;
      });

      setFormData((prev) => ({ ...prev, items }));
      return;
    }

    if (name === "serial_from" || name === "serial_to") {
      // only numbers, max 6 digits
      const cleaned = value.replace(/\D/g, "").slice(0, 6);

      items[index][name] = cleaned;

      // auto-fill Serial To when typing Serial From
      if (name === "serial_from") {
        items[index].serial_to = cleaned;
      }

      setFormData((prev) => ({ ...prev, items }));
      return;
    }
    if (name === "vci_serial_no") {
      // only numbers, max 6 digits
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      items[index].vci_serial_no = cleaned;

      if (
        items[index].isPCB &&
        items[index].sparepart_id &&
        formData.vendor_id
      ) {
        checkSerialStatus(
          index,
          items[index].sparepart_id,
          cleaned,
          formData.vendor_id
        );
      }

      setErrors((prev) => ({
        ...prev,
        [`vci_serial_no_${index}`]: "",
      }));

      setFormData((prev) => ({ ...prev, items }));
      return;
    }

    items[index][name] = files ? files[0] : value;

    setErrors((prev) => ({
      ...prev,
      [`${name}_${index}`]: "",
    }));

    setFormData((prev) => ({ ...prev, items }));
  };



  const addRow = () => {
    const last = formData.items[formData.items.length - 1];

    if (!last.sparepart_id) {
      toast.error("Please select a sparepart before adding another row.");
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
      title: "Delete this item?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete",
    }).then((result) => {
      if (!result.isConfirmed) return;

      setFormData((prev) => {
        const items = [...prev.items];
        items.splice(index, 1);

        return {
          ...prev,
          items, // can be empty — allowed
        };
      });

      toast.success("Item deleted");
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
      if (!item || !item.type) return;
      payload.append(`items[${index}][type]`, item.type);

      payload.append(`items[${index}][status]`, String(item.status || "").trim());
      payload.append(`items[${index}][remarks]`, String(item.remarks || "").trim());

      if (item.type === "product") {
        payload.append(`items[${index}][product_id]`, String(item.product_id));
        payload.append(`items[${index}][serial_from]`, String(item.serial_from));
        payload.append(`items[${index}][serial_to]`, String(item.serial_to));
      }

      if (item.type === "sparepart") {
        payload.append(`items[${index}][sparepart_id]`, item.sparepart_id);
        payload.append(`items[${index}][status]`, String(item.status || "").trim());

        if (item.isPCB) {
          payload.append(
            `items[${index}][vci_serial_no]`,
            item.vci_serial_no
          );
        } else {
          payload.append(`items[${index}][quantity]`, item.quantity);
        }
      }


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
            const index = key.split(".")[1];
            const msg = backendErrors[key][0] || "";

            if (msg.toLowerCase().includes("qty available")) {
              newErrors[`quantity_${index}`] = msg;
              return;
            }

            newErrors[`row_${index}`] = msg;
          } else {
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
      <Row className="align-items-center mb-3">
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
                    <i className="bi bi-x-circle"></i>
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
                {/* PRODUCT / SPAREPART SELECT */}
                <td>
                  {item.type === "product" ? (
                    <>
                      <Form.Select
                        value={item.product_id || ""}
                        isInvalid={!!errors[`product_id_${i}`]}
                        onChange={(e) =>
                          handleItemChange(i, {
                            target: { name: "product_id", value: e.target.value },
                          })
                        }
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors[`product_id_${i}`]}
                      </Form.Control.Feedback>
                    </>
                  ) : (
                    <>
                      <Form.Select
                        value={item.sparepart_id || ""}
                        isInvalid={!!errors[`sparepart_id_${i}`]}
                        onChange={(e) =>
                          handleItemChange(i, {
                            target: { name: "sparepart_id", value: e.target.value },
                          })
                        }
                      >
                        <option value="">Select Sparepart</option>
                        {allSpareparts.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors[`sparepart_id_${i}`]}
                      </Form.Control.Feedback>
                    </>
                  )}
                </td>

                {/* =========================
          */}
                <td>
                  {/* ================= PRODUCT ================= */}
                  {item.type === "product" && (
                    <>
                      <Row>
                        <Col>
                          <Form.Control
                            placeholder="Serial From"
                            value={item.serial_from || ""}
                            isInvalid={!!errors[`serial_${i}`]}
                            maxLength={6}
                            onChange={(e) =>
                              handleItemChange(i, {
                                target: { name: "serial_from", value: e.target.value },
                              })
                            }
                          />
                        </Col>

                        <Col>
                          <Form.Control
                            placeholder="Serial To"
                            value={item.serial_to || ""}
                            isInvalid={!!errors[`serial_${i}`]}
                            maxLength={6}
                            onChange={(e) =>
                              handleItemChange(i, {
                                target: { name: "serial_to", value: e.target.value },
                              })
                            }
                          />
                        </Col>
                      </Row>

                      {errors[`serial_${i}`] && (
                        <div className="invalid-feedback d-block">
                          {errors[`serial_${i}`]}
                        </div>
                      )}
                    </>
                  )}

                  {/* ================= SPAREPART ================= */}
                  {item.type === "sparepart" && (
                    <>
                      {/* PCB / BARCODE → SERIAL NO */}
                      {item.isPCB ? (
                        <>
                          <Form.Control
                            placeholder="Serial No"
                            value={item.vci_serial_no || ""}
                            isInvalid={!!errors[`vci_serial_no_${i}`]}
                            maxLength={6}
                            onChange={(e) =>
                              handleItemChange(i, {
                                target: { name: "vci_serial_no", value: e.target.value },
                              })
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors[`vci_serial_no_${i}`]}
                          </Form.Control.Feedback>
                        </>
                      ) : (
                        /* NORMAL SPAREPART → QUANTITY */
                        <>
                          <Form.Control
                            type="number"
                            min="1"
                            placeholder="Quantity"
                            value={item.quantity || ""}
                            isInvalid={!!errors[`quantity_${i}`]}
                            onChange={(e) =>
                              handleItemChange(i, {
                                target: { name: "quantity", value: e.target.value },
                              })
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors[`quantity_${i}`]}
                          </Form.Control.Feedback>
                        </>
                      )}
                    </>
                  )}
                </td>


                {/* =========================
          STATUS
         ========================= */}
                <td>
                  <Form.Select
                    value={item.status || ""}
                    isInvalid={!!errors[`status_${i}`]}
                    onChange={(e) =>
                      handleItemChange(i, {
                        target: { name: "status", value: e.target.value },
                      })
                    }
                  >
                    <option value="">Select</option>
                    {getAllowedStatuses(item).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors[`status_${i}`]}
                  </Form.Control.Feedback>
                </td>

                {/* =========================
          REMARKS
         ========================= */}
                <td>
                  <Form.Control
                    value={item.remarks || ""}
                    onChange={(e) =>
                      handleItemChange(i, {
                        target: { name: "remarks", value: e.target.value },
                      })
                    }
                  />
                </td>

                {/* =========================
          IMAGE UPLOAD
         ========================= */}
                <td>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleItemChange(i, {
                        target: { name: "upload_image", files: e.target.files },
                      })
                    }
                  />
                </td>

                {/* =========================
          ACTION
         ========================= */}
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

        <div className="mb-3">
          <Button
            variant="success"
            className="me-2"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                items: [
                  ...prev.items,
                  {
                    type: "product",
                    product_id: "",
                    serial_from: "",
                    serial_to: "",
                    status: "",
                    remarks: "",
                  },
                ],
              }))
            }
          >
            + Service Product
          </Button>

          <Button
            variant="success"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                items: [
                  ...prev.items,
                  {
                    type: "sparepart",
                    sparepart_id: "",
                    quantity: "",
                    status: "",
                    remarks: "",
                  },
                ],
              }))
            }
          >
            + Service Sparepart
          </Button>
        </div>
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
