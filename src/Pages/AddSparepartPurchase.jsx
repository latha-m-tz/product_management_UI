import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col, Card } from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
// import { useNavigate } from "react-router-dom";

export default function AddSparepartPurchase() {
  const [vendorId, setVendorId] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [existingSerials, setExistingSerials] = useState([]);
  const [serialErrors, setSerialErrors] = useState({});
  const [receivedDate, setReceivedDate] = useState("");
  const [recipientFile, setRecipientFile] = useState(null);
  const [challan1File, setChallan1File] = useState(null);
  const [challan2File, setChallan2File] = useState(null);
  const [serialErrorShown, setSerialErrorShown] = useState(false);
  const [recipientFiles, setRecipientFiles] = useState([null]);
  const [challanFiles, setChallanFiles] = useState([null]);
  const [trackingNumber, setTrackingNumber] = useState("");

  const MySwal = withReactContent(Swal);

  const [spareparts, setSpareparts] = useState([
    {
      sparepart_id: "",
      qty: "",
      warranty_status: "Active",
      product_id: "",
      from_serial: "",
      to_serial: "",
    },
  ]);
  const [availableSpareparts, setAvailableSpareparts] = useState([]);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const handleFileChange = (type, index, file) => {
    if (type === "recipient") {
      const updated = [...recipientFiles];
      updated[index] = file;
      setRecipientFiles(updated);
    } else if (type === "challan") {
      const updated = [...challanFiles];
      updated[index] = file;
      setChallanFiles(updated);
    }
  };

  const addFileField = (type) => {
    if (type === "recipient") setRecipientFiles((prev) => [...prev, null]);
    if (type === "challan") setChallanFiles((prev) => [...prev, null]);
  };

  const removeFileField = (type, index) => {
    if (type === "recipient") {
      const updated = [...recipientFiles];
      updated.splice(index, 1);
      setRecipientFiles(updated);
    } else if (type === "challan") {
      const updated = [...challanFiles];
      updated.splice(index, 1);
      setChallanFiles(updated);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/get-spareparts`);
        setAvailableSpareparts(res.data.spareparts || []);
        setAvailableVendors(res.data.vendors || []);
        setAvailableCategories(res.data.categories || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);


  const sparepartTypeOf = (id) => {
    if (!id) return "";
    const s = availableSpareparts.find((x) => String(x.id) === String(id));
    const raw = s?.sparepart_type || s?.part_type || "";
    return raw.toString().toLowerCase();
  };
  const handleSparepartChange = (index, value) => {
    if (!vendorId) {
      toast.error("Please choose vendor first");
      return;
    }

    const updated = [...spareparts];
    updated[index].sparepart_id = value;
    updated[index].qty = "";
    updated[index].warranty_status = "Active";
    updated[index].product_id = "";
    updated[index].from_serial = "";
    updated[index].to_serial = "";
    setSpareparts(updated);

    clearError("sparepart_id", index);
  };



  const handleInputChange = (index, field, value) => {
    const type = sparepartTypeOf(spareparts[index].sparepart_id);
    const updated = [...spareparts];

    // Serial type fields
    if (type.includes("serial") && (field === "from_serial" || field === "to_serial")) {
      const productId = updated[index].product_id;

      if (!productId) {
        toast.error("Please choose product first");
        updated[index][field] = "";
        setSpareparts(updated);
        return;
      }

      // Keep only digits & max 6
      value = value.replace(/\D/g, "").slice(0, 6);
      updated[index][field] = value;

      const product = availableCategories.find(p => String(p.id) === String(productId));
      const productPrefix = product?.name.match(/^(\d+)/)?.[1] || null;

      // Check prefix match
      if (productPrefix && value && !value.startsWith(productPrefix)) {
        if (!serialErrorShown[index]?.prefixMismatch) {
          toast.error(`Serial must start with product prefix (${productPrefix})`);
          setSerialErrorShown(prev => ({
            ...prev,
            [index]: { ...prev[index], prefixMismatch: true }
          }));
        }
        updated[index][field] = "";
        setSpareparts(updated);
        return;
      } else {
        // Reset prefixMismatch flag if correct
        setSerialErrorShown(prev => ({
          ...prev,
          [index]: { ...prev[index], prefixMismatch: false }
        }));
      }

      // Range check
      const fromNum = parseInt(updated[index].from_serial, 10);
      const toNum = parseInt(updated[index].to_serial, 10);

      if (!isNaN(fromNum) && !isNaN(toNum)) {
        if (fromNum > toNum) {
          if (!serialErrorShown[index]?.rangeError) {
            // Don't toast repeatedly
            setSerialErrorShown(prev => ({
              ...prev,
              [index]: { ...prev[index], rangeError: true }
            }));
          }
          updated[index].qty = ""; // reset qty if invalid
        } else {
          // Valid range → auto calculate quantity
          updated[index].qty = toNum - fromNum + 1;
          setSerialErrorShown(prev => ({
            ...prev,
            [index]: { ...prev[index], rangeError: false }
          }));
        }
      }

      setSpareparts(updated);
      return;
    }

    // Other fields
    updated[index][field] = value;

    if (field === "qty") {
      let qty = Number(value);
      if (qty < 1) qty = 1;
      updated[index][field] = qty;
    }

    setSpareparts(updated);
    clearError(field, index);
  };



  const handleDeleteSparepart = (index) => {
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
        removeSparepart(index); // Use your existing removeSparepart function
        toast.success("Spare part deleted successfully!");
      }
    });
  };



  const clearError = (field, index = null) => {
    setErrors((prev) => {
      const newErrors = { ...prev };

      if (index !== null) {
        if (newErrors.items?.[index]?.[field]) {
          delete newErrors.items[index][field];
          if (Object.keys(newErrors.items[index]).length === 0) {
            delete newErrors.items[index];
          }
        }
      } else {
        if (newErrors[field]) {
          delete newErrors[field];
        }
      }

      return newErrors;
    });
  };


  const addSparepart = () => {
    setSpareparts((prev) => [
      ...prev,
      {
        sparepart_id: "",
        qty: 1,
        warranty_status: "Active",
        product_id: "",
        from_serial: "",
        to_serial: "",
      },
    ]);
  };

  const removeSparepart = (index) => {
    if (index === 0) {
      const updated = [...spareparts];
      updated[0] = {
        sparepart_id: "",
        qty: 1,
        warranty_status: "Active",
        product_id: "",
        from_serial: "",
        to_serial: "",
      };
      setSpareparts(updated);

      return;
    }
    const updated = [...spareparts];
    updated.splice(index, 1);
    setSpareparts(updated);

    setErrors((prev) => {
      if (prev.items?.[index]) {
        const newItems = { ...prev.items };
        delete newItems[index];
        return { ...prev, items: newItems };
      }
      return prev;
    });
  };

  const validateForm = () => {
    const errs = {};

    if (!vendorId) {
      errs.vendor_id = "Vendor is required";
      // toast.error("Vendor is required");
    }

    if (!challanNo) {
      errs.challan_no = "Challan No is required";
      // toast.error("Challan No is required");
    }

    if (!challanDate) {
      errs.challan_date = "Challan Date is required";
      // toast.error("Challan Date is required");
    }

    const itemErrors = {};
    spareparts.forEach((sp, idx) => {
      const type = sparepartTypeOf(sp.sparepart_id);
      const itemErr = {};

      if (!sp.sparepart_id) {
        itemErr.sparepart_id = "Select sparepart";
        // toast.error(`Sparepart is required for item ${idx + 1}`);
      }

      // Prefix mismatch
      if (sp.from_serial && sp.to_serial) {
        const prefixFrom = sp.from_serial.replace(/[0-9]+$/, "");
        const prefixTo = sp.to_serial.replace(/[0-9]+$/, "");
        if (prefixFrom !== prefixTo) {
          itemErr.from_serial = "Prefix mismatch";
          itemErr.to_serial = "Prefix mismatch";
          toast.error(`Prefix mismatch for item ${idx + 1}`);
        }
      }

      if (type.includes("serial") && sp.from_serial && sp.to_serial) {
        const fromNum = parseInt(sp.from_serial, 10);
        const toNum = parseInt(sp.to_serial, 10);

        if (!isNaN(fromNum) && !isNaN(toNum) && fromNum > toNum) {
          itemErr.from_serial = "From Serial must be less than or equal to To Serial";
          itemErr.to_serial = "From Serial must be less than or equal to To Serial";
        }
      }
      if (!sp.qty || sp.qty < 1) {
        itemErr.qty = "Quantity must be at least 1";
        // toast.error(`Quantity must be at least 1 for item ${idx + 1}`);
      }

      if (type.includes("warranty") && !sp.warranty_status) {
        itemErr.warranty_status = "Select warranty status";
        toast.error(`Select warranty status for item ${idx + 1}`);
      }

      if (Object.keys(itemErr).length) itemErrors[idx] = itemErr;
    });

    if (Object.keys(itemErrors).length) errs.items = itemErrors;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };


  const handleSubmit = async () => {
    if (!validateForm()) return;

    const formData = new FormData();

    formData.append("vendor_id", vendorId || "");
    formData.append("challan_no", challanNo || "");
    formData.append("tracking_number", trackingNumber || "");

    // Format date to dd-mm-yyyy
    let formattedDate = challanDate;
    if (challanDate) {
      const [year, month, day] = challanDate.split("-");
      formattedDate = `${day}-${month}-${year}`;
    }
    formData.append("challan_date", formattedDate);

    if (receivedDate) {
      const [year, month, day] = receivedDate.split("-");
      formData.append("received_date", `${day}-${month}-${year}`);
    }

    // Append all recipient files
    recipientFiles.forEach((file) => {
      if (file) formData.append("image_recipient[]", file);
    });

    // Append all challan files
    challanFiles.forEach((file) => {
      if (file) formData.append("image_challan[]", file);
    });

    // ✅ Append items as proper array fields
    spareparts.forEach((sp, index) => {
      if (!sp.sparepart_id) return;

      formData.append(`items[${index}][sparepart_id]`, sp.sparepart_id);
      if (sp.product_id) formData.append(`items[${index}][product_id]`, sp.product_id);
      if (sp.from_serial) formData.append(`items[${index}][from_serial]`, sp.from_serial);
      if (sp.to_serial) formData.append(`items[${index}][to_serial]`, sp.to_serial);
      if (sp.warranty_status) formData.append(`items[${index}][warranty_status]`, sp.warranty_status);
      formData.append(`items[${index}][quantity]`, sp.qty || 1);
    });

    try {
      const res = await axios.post(`${API_BASE_URL}/sparepartNew-purchases`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Purchase saved successfully!");
      navigate("/spare-partsPurchase");
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        setErrors(backendErrors);
        Object.values(backendErrors).forEach((fieldErrors) => {
          if (Array.isArray(fieldErrors)) fieldErrors.forEach((msg) => toast.error(msg));
          else if (typeof fieldErrors === "string") toast.error(fieldErrors);
        });
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Something went wrong!");
      }
    }
  };



  const feedbackStyle = { color: "red", fontSize: "0.85rem", marginTop: "4px" };

  return (
    <div className="container-fluid " style={{ background: "F4F4F8", minHeight: "100vh", position: "relative" }}>
      <Row className="align-items-center mb-3">
        <Col>
          <h4>Add purchase Details</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => navigate("/spare-partsPurchase")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      {/* Vendor Form */}

      {/* Purchase Details */}
      <Card className="mb-3" style={{ background: "#F4F4F8", borderRadius: 6 }}>
        <Card.Body>
          <h6 className="mb-3">Purchase Details</h6>

    <Row className="mb-2">
  <Col md={4}>
    <Form.Group className="mb-2 form-field">
      <Form.Label>
        Vendor<span style={{ color: "red" }}> *</span>
      </Form.Label>

      <Form.Select
        value={vendorId}
        onChange={(e) => {
          setVendorId(e.target.value);
          clearError("vendor_id");
        }}
      >
        <option value="">Select Vendor</option>
        {availableVendors.map((v) => {
          if (v.contact_persons?.length > 0) {
            return v.contact_persons.map((c) => (
              <option key={`${v.id}-${c.id}`} value={v.id}>
                {v.vendor} – {c.name}
                {c.is_main ? " (Main person)" : ""}
              </option>
            ));
          } else {
            return (
              <option key={v.id} value={v.id}>
                {v.vendor}
              </option>
            );
          }
        })}
      </Form.Select>
      {errors.vendor_id && <div style={feedbackStyle}>{errors.vendor_id}</div>}
    </Form.Group>
  </Col>

  <Col md={4}>
    <Form.Group className="mb-2 form-field">
      <Form.Label>
        Challan No<span style={{ color: "red" }}> *</span>
      </Form.Label>
      <Form.Control
        type="text"
        value={challanNo}
        onChange={(e) => {
          setChallanNo(e.target.value);
          clearError("challan_no");
        }}
        placeholder="Enter Challan No"
      />
      {errors.challan_no && <div style={feedbackStyle}>{errors.challan_no}</div>}
    </Form.Group>
  </Col>

  <Col md={4}>
    <Form.Group className="mb-2 form-field">
      <Form.Label>
        Challan Date<span style={{ color: "red" }}> *</span>
      </Form.Label>
      <Form.Control
        type="date"
        value={challanDate}
        onChange={(e) => {
          const val = e.target.value;
          setChallanDate(val);
          clearError("challan_date");
        }}
      />
      {errors.challan_date && <div style={feedbackStyle}>{errors.challan_date}</div>}
    </Form.Group>
  </Col>

  {/* Received Date and Tracking Number side by side */}
  <Col md={4}>
    <Form.Group className="mb-2 form-field">
      <Form.Label>Received Date</Form.Label>
      <Form.Control
        type="date"
        value={receivedDate}
        onChange={(e) => setReceivedDate(e.target.value)}
      />
    </Form.Group>
  </Col>

  <Col md={4}>
    <Form.Group className="mb-2 form-field">
      <Form.Label>Tracking Number</Form.Label>
      <Form.Control
        type="text"
        placeholder="Enter Tracking Number"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
      />
    </Form.Group>
  </Col>

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
            accept="image/*"
            onChange={(e) => handleFileChange("recipient", idx, e.target.files[0])}
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
      {challanFiles.map((file, idx) => (
        <div key={idx} className="d-flex align-items-center mb-1">
          <Form.Control
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange("challan", idx, e.target.files[0])}
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
  </Col>
</Row>


          {/* First sparepart dropdown + conditional fields */}
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group className="mb-2 form-field">
                <Form.Label>
                  Spare parts<span style={{ color: "red" }}> *</span>
                </Form.Label>

                <Form.Select
                  value={spareparts[0].sparepart_id}
                  onChange={(e) =>
                    handleSparepartChange(0, e.target.value)
                  }
                >
                  <option value="">Select Spare parts</option>
                  {availableSpareparts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Form.Select>
                {errors.items?.[0]?.sparepart_id && (
                  <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>{errors.items[0].sparepart_id}</div>
                )}
              </Form.Group>
            </Col>

            {spareparts[0].sparepart_id &&
              (() => {
                const type0 = sparepartTypeOf(spareparts[0].sparepart_id);

                if (type0.includes("serial")) {
                  return (
                    <>
                      {/* Row 1 */}
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-2 form-field">
                            <Form.Label>
                              Product<span style={{ color: "red" }}> *</span>
                            </Form.Label>

                            <Form.Select
                              value={spareparts[0].product_id}
                              onChange={(e) =>
                                handleInputChange(0, "product_id", e.target.value)
                              }
                            >
                              <option value="">Select Product</option>
                              {availableCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        <Col md={4}>
                          <Form.Group className="mb-2 form-field">
                            <Form.Label>
                              From Serial<span style={{ color: "red" }}> *</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={spareparts[0].from_serial}
                              maxLength={6}
                              onChange={(e) => handleInputChange(0, "from_serial", e.target.value)}
                            />
                            {errors.items?.[0]?.from_serial && (
                              <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                                {errors.items[0].from_serial}
                              </div>
                            )}


                          </Form.Group>
                        </Col>

                        <Col md={4}>
                          <Form.Group className="mb-2 form-field">
                            <Form.Label>
                              To Serial<span style={{ color: "red" }}> *</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={spareparts[0].to_serial}
                              maxLength={6}
                              onChange={(e) => handleInputChange(0, "to_serial", e.target.value)}
                            />
                            {errors.items?.[0]?.to_serial && (
                              <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                                {errors.items[0].to_serial}
                              </div>
                            )}


                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Row 2 */}
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-2 form-field">
                            <Form.Label>Quantity</Form.Label>
                            <Form.Control
                              type="number"
                              value={spareparts[0].qty}
                              onChange={(e) =>
                                handleInputChange(0, "qty", e.target.value)
                              }
                            />
                            {errors.items?.[0]?.qty && (
                              <div style={{ color: "red", fontSize: "0.85rem" }}>{errors.items[0].qty}</div>
                            )}
                          </Form.Group>
                        </Col>

                        <Col md={4}>
                          <Form.Group className="mb-2 form-field">
                            <Form.Label>Warranty Status</Form.Label>
                            <Form.Select
                              value={spareparts[0].warranty_status}
                              onChange={(e) =>
                                handleInputChange(0, "warranty_status", e.target.value)
                              }
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </Form.Select>
                            {errors.items?.[0]?.warranty_status && (
                              <div style={{ color: "red", fontSize: "0.85rem" }}>{errors.items[0].warranty_status}</div>
                            )}
                          </Form.Group>
                        </Col>

                      </Row>
                    </>
                  );
                } else if (type0.includes("warranty")) {
                  return (
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-2 form-field">
                          <Form.Label>Warranty Status</Form.Label>
                          <Form.Select
                            value={spareparts[0].warranty_status}
                            onChange={(e) =>
                              handleInputChange(0, "warranty_status", e.target.value)
                            }
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-2 form-field">
                          <Form.Label>Quantity</Form.Label>
                          <Form.Control
                            type="number"
                            value={spareparts[0].qty}
                            onChange={(e) =>
                              handleInputChange(0, "qty", e.target.value)
                            }
                          />
                        </Form.Group>
                      </Col>

                    </Row>
                  );

                } else {
                  return (
                    <Col md={4}>
                      <Form.Group className="mb-2 form-field">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          value={spareparts[0].qty}
                          onChange={(e) =>
                            handleInputChange(0, "qty", e.target.value)
                          }
                        />
                      </Form.Group>
                    </Col>
                  );
                }
              })()}
          </Row>
        </Card.Body>
      </Card>

      {/* Additional spareparts cards */}
      {spareparts.slice(1).map((sp, idx) => {
        const realIndex = idx + 1;
        const type = sparepartTypeOf(sp.sparepart_id);

        return (
          <Card
            key={realIndex}
            className="mb-3"
            style={{ background: "#F4F4F8", borderRadius: 6 }}
          >
            <Card.Body>
              <Row className="mb-2 align-items-center">
                <Col>
                  <h6 className="mb-0">Spare Parts Details</h6>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteSparepart(realIndex)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>


                </Col>
              </Row>

              <Row className="align-items-end mb-2" key={realIndex}>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Spare parts</Form.Label>
                    <Form.Select
                      value={sp.sparepart_id}
                      onChange={(e) => handleSparepartChange(realIndex, e.target.value)}
                    >
                      <option value="">Select Sparepart</option>
                      {availableSpareparts.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {sp.sparepart_id && type.includes("serial") && (
                  <>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Product</Form.Label>
                        <Form.Select
                          value={sp.product_id}
                          onChange={(e) => handleInputChange(realIndex, "product_id", e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {availableCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>From Serial</Form.Label>
                        <Form.Control
                          type="text"
                          value={sp.from_serial}
                          onChange={(e) => handleInputChange(realIndex, "from_serial", e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4} className="d-flex align-items-end">
                      <div className="flex-grow-1">
                        <Form.Group className="mb-2">
                          <Form.Label>To Serial</Form.Label>
                          <Form.Control
                            type="text"
                            value={sp.to_serial}
                            onChange={(e) => handleInputChange(realIndex, "to_serial", e.target.value)}
                          />
                        </Form.Group>
                      </div>
                      {/* <Button
                        variant="info"
                        size="sm"
                        className="ms-2 mb-2"
                        onClick={() =>
                          navigate("/pcb-serials", {
                            state: {
                              sparepart: {
                                ...sp,
                                product_name: availableCategories.find(
                                  (c) => c.id === sp.product_id
                                )?.name || ""
                              },
                            },
                          })
                        }
                      >
                        View
                      </Button> */}
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          value={sp.qty}
                          onChange={(e) => handleInputChange(realIndex, "qty", e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Warranty Status</Form.Label>
                        <Form.Select
                          value={sp.warranty_status}
                          onChange={(e) => handleInputChange(realIndex, "warranty_status", e.target.value)}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </>
                )}

                {sp.sparepart_id && type.includes("warranty") && (
                  <>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Warranty Status</Form.Label>
                        <Form.Select
                          value={sp.warranty_status}
                          onChange={(e) => handleInputChange(realIndex, "warranty_status", e.target.value)}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          value={sp.qty}
                          onChange={(e) => handleInputChange(realIndex, "qty", e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}

                {sp.sparepart_id && type.includes("quantity") && (
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        value={sp.qty}
                        onChange={(e) => handleInputChange(realIndex, "qty", e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        );
      })}

      <div className="d-flex justify-content-between mt-3">
        <Button variant="success" onClick={addSparepart}>
          <i className="bi bi-plus-lg me-1" /> Add Spare parts
        </Button>

        <div>
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate(-1)}  // go back to previous page
          >
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
