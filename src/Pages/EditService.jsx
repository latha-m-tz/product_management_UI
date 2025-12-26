import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";
import api, { setAuthToken, API_BASE_URL } from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { IoTrashOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useLoader } from "../LoaderContext";

const EditServicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { loading: globalLoading, setLoading: setGlobalLoading } = useLoader();

  const MySwal = withReactContent(Swal);

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [spareparts, setSpareparts] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  const [existingReceipts, setExistingReceipts] = useState([]);
  const [deletedReceipts, setDeletedReceipts] = useState([]); // ✅ ADD
  // string paths
  const [newReceipts, setNewReceipts] = useState([]);           // File objects

  const onlySixDigits = (value) => {
    return value.replace(/\D/g, "").slice(0, 6);
  };

  const getFileName = (path) => {
    if (!path) return "";
    return path.split("/").pop();
  };

  const getAllowedStatuses = (item) => {
    if (item.type === "sparepart") {
      const allowed = ["Inward", "Return"];

      // ✅ include existing status so it displays
      if (item.status && !allowed.includes(item.status)) {
        allowed.unshift(item.status);
      }

      return allowed;
    }

    if (item.type === "product") {
      return ["Inward", "Testing", "Delivered"];
    }

    return [];
  };


  const [formData, setFormData] = useState({
    vendor_id: "",
    challan_no: "",
    challan_date: "",
    tracking_no: "",
    items: [],
    receipt_files: [],

  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);

    const loadServiceData = async () => {
      try {
        const [prodRes, spRes, venRes, serviceRes] = await Promise.all([
          api.get("/product"),
          api.get("/spareparts/get"),
          api.get("/vendorsget"),
          api.get(`/service-vci/${id}`),
        ]);

        /* ================= PRODUCTS ================= */
        setProducts(
          Array.isArray(prodRes.data)
            ? prodRes.data
            : prodRes.data.products || []
        );

        /* ================= SPAREPARTS & VENDORS ================= */
        const sparepartsList = spRes.data?.spareparts || [];
        setSpareparts(sparepartsList);
        setVendors(venRes.data || []);

        const service = serviceRes.data;

        setExistingReceipts(service.receipt_files || []);
        setDeletedReceipts([]);
        setNewReceipts([]);

        const formattedItems = service.items.map((it) => {

          /* ===== PRODUCT ===== */
          if (it.product_id) {
            return {
              id: it.id,
              type: "product",
              product_id: it.product_id,
              serial_from: it.serial_from || "",
              serial_to: it.serial_to || "",
              status: it.status || "",
              remarks: it.remarks || "",
              upload_image: it.upload_image || null,
            };
          }

          /* ===== SPAREPART ===== */
          const spare = sparepartsList.find(
            (p) => p.id === it.sparepart_id
          );

          const isPCB =
            spare?.name?.toUpperCase().includes("PCB") ||
            spare?.name?.toUpperCase().includes("BARCODE");

          return {
            id: it.id,
            type: "sparepart",
            sparepart_id: it.sparepart_id,
            isPCB,
            vci_serial_no: it.vci_serial_no || "",
            quantity: it.quantity || "",
            status: it.status || "",
            remarks: it.remarks || "",
            upload_image: it.upload_image || null,
          };
        });

        /* ================= FORM DATA ================= */
        setFormData({
          vendor_id: service.vendor_id || "",
          challan_no: service.challan_no || "",
          challan_date: service.challan_date || "",
          tracking_no: service.tracking_no || "",
          items: formattedItems,
          receipt_files: service.receipt_files?.length
            ? service.receipt_files
            : [null],
        });

        setLoading(false);

      } catch (error) {
        console.error(error);
        toast.error("Failed to load data!");
        setLoading(false);
      }
    };

    loadServiceData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleItemChange = (index, e) => {
    const { name, value, files } = e.target;
    const items = [...formData.items];
    const row = items[index];

    if (name === "product_id") {
      row.product_id = Number(value);
      row.sparepart_id = "";
      row.serial_from = "";
      row.serial_to = "";
      row.isPCB = false;
    }

    if (name === "sparepart_id") {
      const spare = spareparts.find(sp => sp.id === Number(value));

      row.sparepart_id = Number(value);
      row.product_id = "";

      row.isPCB =
        spare?.name?.toUpperCase().includes("PCB") ||
        spare?.name?.toUpperCase().includes("BARCODE");

      row.vci_serial_no = "";
      row.quantity = "";
    }

    if (["serial_from", "serial_to", "vci_serial_no", "quantity"].includes(name)) {
      row[name] = value.replace(/\D/g, "");
    }

    // OTHER FIELDS
    if (["status", "remarks"].includes(name)) {
      row[name] = value;
    }

    // FILE
    if (files) {
      row.upload_image = files[0];
    }

    setFormData(prev => ({ ...prev, items }));
  };
  const validateLastRow = () => {
    const lastIndex = formData.items.length - 1;
    const row = formData.items[lastIndex];

    if (!row.sparepart_id) {
      toast.error("Please select a product before adding another row.");
      return false;
    }

    if (row.isPCB) {
      if (!row.vci_serial_no.trim()) {
        toast.error("Please enter Serial Number before adding another row.");
        return false;
      }
    } else {
      if (!row.quantity || row.quantity <= 0) {
        toast.error("Please enter a valid Quantity before adding another row.");
        return false;
      }
    }

    if (!row.status) {
      toast.error("Please select a Status before adding another row.");
      return false;
    }

    return true;
  };

  const addRow = () => {
    if (!validateLastRow()) return; // <-- prevent adding new row

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

    toast.success("New row added!");
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
        const updated = [...formData.items];
        updated.splice(index, 1);
        setFormData((prev) => ({ ...prev, items: updated }));
        toast.success("Row deleted");
      }
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.vendor_id) newErrors.vendor_id = "Vendor is required";
    if (!formData.challan_no) newErrors.challan_no = "Challan No is required";
    if (formData.challan_date > today) {
      newErrors.challan_date = "Future date is not allowed";
    }

    formData.items.forEach((item, i) => {

      if (item.type === "product") {
        if (!item.product_id)
          newErrors[`product_id_${i}`] = "Product is required";

        if (!item.serial_from || !item.serial_to)
          newErrors[`serial_${i}`] = "Serial From and To required";

        if (Number(item.serial_to) < Number(item.serial_from))
          newErrors[`serial_${i}`] = "Serial To must be ≥ Serial From";
      }

      if (item.type === "sparepart") {
        if (!item.sparepart_id)
          newErrors[`sparepart_id_${i}`] = "Sparepart required";

        if (item.isPCB) {
          if (!item.vci_serial_no)
            newErrors[`vci_serial_no_${i}`] = "VCI Serial required";
        } else {
          if (!item.quantity || item.quantity <= 0)
            newErrors[`quantity_${i}`] = "Quantity required";
        }
      }

      if (!item.status)
        newErrors[`status_${i}`] = "Status required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isItemRowComplete = (item) => {
    if (!item.sparepart_id) return false;

    if (item.isPCB) {
      return item.vci_serial_no && item.vci_serial_no.trim() !== "";
    }

    return item.quantity && Number(item.quantity) > 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🚫 Prevent double submit
    if (globalLoading) return;

    if (!validate()) {
      toast.error("Please fill the required fields.");
      return;
    }

    const fd = new FormData();

    // Laravel PUT override
    fd.append("_method", "PUT");

    // =========================
    // SERVICE HEADER FIELDS
    // =========================
    fd.append("vendor_id", formData.vendor_id);
    fd.append("challan_no", formData.challan_no);
    fd.append("challan_date", formData.challan_date);
    fd.append("tracking_no", formData.tracking_no || "");
    existingReceipts.forEach((file) => {
      fd.append("existing_receipt_files[]", file);
    });

    newReceipts.forEach((file) => {
      fd.append("receipt_files[]", file);
    });
    deletedReceipts.forEach((file) => {
      fd.append("deleted_receipt_files[]", file);
    });

    formData.items.forEach((item, i) => {
      if (item.id) {
        fd.append(`items[${i}][id]`, item.id);
      }

      fd.append(`items[${i}][type]`, item.type);

      fd.append(`items[${i}][status]`, item.status || "");
      fd.append(`items[${i}][remarks]`, item.remarks || "");


      // PRODUCT
      if (item.type === "product") {
        fd.append(`items[${i}][product_id]`, item.product_id || "");
        fd.append(`items[${i}][serial_from]`, item.serial_from || "");
        fd.append(`items[${i}][serial_to]`, item.serial_to || "");
      }

      // SPAREPART
      if (item.type === "sparepart") {
        fd.append(`items[${i}][sparepart_id]`, item.sparepart_id || "");

        if (item.isPCB) {
          fd.append(`items[${i}][vci_serial_no]`, item.vci_serial_no || "");
        } else {
          fd.append(`items[${i}][quantity]`, item.quantity || "");
        }
      }

      // KEEP EXISTING IMAGE
      if (typeof item.upload_image === "string") {
        fd.append(`items[${i}][existing_image]`, item.upload_image);
      }

      // NEW IMAGE
      if (item.upload_image instanceof File) {
        fd.append(`items[${i}][upload_image]`, item.upload_image);
      }
    });

    try {
      setGlobalLoading(true); // 🌐 GLOBAL LOADER ON

      await api.post(`/service-vci/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Service updated successfully!");
      navigate("/service-product");

    } catch (error) {
      console.error("Update Error:", error);

      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const formattedErrors = {};
        let firstErrorMessage = null;

        Object.keys(backendErrors).forEach((key) => {
          const message = backendErrors[key][0];

          if (!firstErrorMessage) firstErrorMessage = message;

          if (key.startsWith("items.")) {
            const rowIndex = key.split(".")[1];

            if (key.includes("vci_serial_no")) {
              formattedErrors[`vci_serial_no_${rowIndex}`] = message;
            } else if (key.includes("quantity")) {
              formattedErrors[`quantity_${rowIndex}`] = message;
            } else if (key.includes("status")) {
              formattedErrors[`status_${rowIndex}`] = message;
            }
          } else {
            formattedErrors[key] = message;
          }
        });

        setErrors(formattedErrors);
        toast.error(firstErrorMessage);
      } else {
        toast.error("Failed to update service!");
      }
    } finally {
      setGlobalLoading(false); // 🌐 GLOBAL LOADER OFF (ALWAYS)
    }
  };




  if (loading) return <div className="p-5 text-center">Loading...</div>;

  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col><h4>Edit Service</h4></Col>
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

      <Form onSubmit={handleSubmit}>
        {/* TOP SECTION */}
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
                max={today}
                onChange={handleChange}
                isInvalid={!!errors.challan_date}
              />

              <Form.Control.Feedback type="invalid">
                {errors.challan_date}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        {/* VENDOR + TRACKING */}
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
          {/* RECEIPT DOCUMENTS */}
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
                      const receipts = formData.receipt_files || [];

                      const last = receipts[receipts.length - 1];

                      if (!last || (!(last instanceof File) && typeof last !== "string")) {
                        toast.error("Please upload a file before adding another receipt.");
                        return;
                      }

                      setFormData((prev) => ({
                        ...prev,
                        receipt_files: [...prev.receipt_files, null],
                      }));
                    }}
                  >
                    + Add
                  </Button>
                </Form.Label>

                {(formData.receipt_files || []).map((file, i) => {
                  const isExisting = typeof file === "string";
                  const displayName = file
                    ? isExisting
                      ? getFileName(file)
                      : file.name
                    : "No file chosen";

                  return (
                    <div key={i} className="d-flex align-items-center mb-2">
                      {/* FAKE FILE INPUT */}
                      <div className="input-group flex-grow-1">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() =>
                            document.getElementById(`receipt-input-${i}`).click()
                          }
                        >
                          Choose File
                        </button>

                        <input
                          type="text"
                          className="form-control"
                          value={displayName}
                          readOnly
                        />
                      </div>

                      {/* REAL FILE INPUT (HIDDEN) */}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="d-none"
                        id={`receipt-input-${i}`}
                        onChange={(e) => {
                          const updated = [...formData.receipt_files];
                          updated[i] = e.target.files[0];
                          setFormData((prev) => ({
                            ...prev,
                            receipt_files: updated,
                          }));
                        }}
                      />

                      {/* ❌ REMOVE */}
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger ms-2 p-0"
                        disabled={formData.receipt_files.length === 1}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            receipt_files: prev.receipt_files.filter((_, idx) => idx !== i).filter(Boolean),
                          }))
                        }
                      >
                        <i className="bi bi-x-circle"></i>
                      </Button>
                    </div>
                  );
                })}

              </Form.Group>
            </Col>
          </Row>


        </Row>

        {/* ITEMS TABLE */}
        <h5>Service Items</h5>
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Product</th>
              <th>Serial / Quantity</th>
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
                  ) : (
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
                      {spareparts.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </td>


                {/* SERIAL FROM / TO  OR  QTY / PCB SERIAL */}
                <td>
                  {item.type === "product" ? (
                    <>
                      <Row>
                        <Col>
                          <Form.Control
                            placeholder="Serial From"
                            inputMode="numeric"
                            maxLength={6}
                            value={item.serial_from || ""}
                            isInvalid={!!errors[`serial_${i}`]}
                            onChange={(e) =>
                              handleItemChange(i, {
                                target: {
                                  name: "serial_from",
                                  value: onlySixDigits(e.target.value),
                                },
                              })
                            }
                          />
                        </Col>
                        <Col>
                          <Form.Control
                            placeholder="Serial To"
                            inputMode="numeric"
                            maxLength={6}
                            value={item.serial_to || ""}
                            isInvalid={!!errors[`serial_${i}`]}
                            onChange={(e) =>
                              handleItemChange(i, {
                                target: {
                                  name: "serial_to",
                                  value: onlySixDigits(e.target.value),
                                },
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
                  ) : item.isPCB ? (
                    <>
                      <Form.Control
                        placeholder="VCI Serial"
                        inputMode="numeric"
                        maxLength={6}
                        value={item.vci_serial_no || ""}
                        isInvalid={!!errors[`vci_serial_no_${i}`]}
                        onChange={(e) =>
                          handleItemChange(i, {
                            target: {
                              name: "vci_serial_no",
                              value: onlySixDigits(e.target.value),
                            },
                          })
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors[`vci_serial_no_${i}`]}
                      </Form.Control.Feedback>
                    </>
                  ) : (
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
                </td>

                {/* STATUS */}
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

                {/* REMARKS */}
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

                {/* IMAGE */}
                <td>
                  <div className="d-flex align-items-center border rounded px-2 py-1">
                    {/* Choose File Button */}
                    <label
                      htmlFor={`item-file-${i}`}
                      className="btn btn-secondary btn-sm me-2"
                    >
                      Choose File
                    </label>

                    {/* File Name */}
                    <div
                      className="text-truncate"
                      style={{ maxWidth: "140px", lineHeight: "1.2" }}
                    >                      {item.upload_image ? (
                      typeof item.upload_image === "string" ? (
                        <a
                          href={`${API_BASE_URL.replace("/api", "")}/storage/${item.upload_image}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dark text-decoration-none"
                        >
                          {getFileName(item.upload_image)}
                        </a>
                      ) : (
                        <span className="text-dark">
                          {item.upload_image.name}
                        </span>
                      )
                    ) : (
                      <span className="text-muted">No file chosen</span>
                    )}
                    </div>

                    {/* Hidden File Input */}
                    <Form.Control
                      type="file"
                      accept="image/*,application/pdf"
                      className="d-none"
                      id={`item-file-${i}`}
                      onChange={(e) =>
                        handleItemChange(i, {
                          target: { name: "upload_image", files: e.target.files },
                        })
                      }
                    />
                  </div>
                </td>


                {/* ACTION */}
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
              setFormData(prev => ({
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
                    upload_image: null,
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
              setFormData(prev => ({
                ...prev,
                items: [
                  ...prev.items,
                  {
                    type: "sparepart",
                    sparepart_id: "",
                    isPCB: false,
                    vci_serial_no: "",
                    quantity: "",
                    status: "",
                    remarks: "",
                    upload_image: null,

                    addedAsSparepart: true,
                  },
                ],
              }))
            }
          >
            + Service Sparepart
          </Button>

        </div>
        {/* SUBMIT BUTTONS */}
        <div className="mt-4 d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate("/service-product")}
          >
            Cancel
          </Button>

          <Button type="submit" variant="success" disabled={globalLoading}>
            {globalLoading ? "Updating..." : "Update Service"}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EditServicePage;
