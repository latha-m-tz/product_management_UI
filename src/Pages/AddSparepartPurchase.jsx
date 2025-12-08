import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col, Card } from "react-bootstrap";
import api, { setAuthToken } from "../api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
// import { useNavigate } from "react-router-dom";

export default function AddSparepartPurchase() {
  const [vendorId, setVendorId] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [receivedDate, setReceivedDate] = useState("");
  const [serialErrorShown, setSerialErrorShown] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [recipientFiles, setRecipientFiles] = useState([{ id: Date.now(), file: null }]);
  const [courierName, setCourierName] = useState("");
  const [fromSerial, setFromSerial] = useState("");
  const [toSerial, setToSerial] = useState("");
  const handleFromSerialChange = (e) => {
    const value = e.target.value;
    setFromSerial(value);

    // Auto-fill To Serial with the same value
    setToSerial(value);
  };


  const MySwal = withReactContent(Swal);

  const [spareparts, setSpareparts] = useState([
    {
      sparepart_id: "",
      qty: "",
      warranty_status: "Active",
      // product_id: "",
      from_serial: "",
      to_serial: "",
    },
  ]);
  const [availableSpareparts, setAvailableSpareparts] = useState([]);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const removeFileField = (type, id) => {
    if (type === "recipient") {
      setRecipientFiles(prev => {
        // At least 1 row must remain
        if (prev.length === 1) return prev;

        return prev.filter(f => f.id !== id);
      });
    }
  };

  const handleFileChange = (type, id, file) => {
    if (type === "recipient") {
      setRecipientFiles(prev => {
        const updated = prev.map(f =>
          f.id === id ? { ...f, file } : f
        );

        const last = updated[updated.length - 1];

        if (last.id === id && file) {
          updated.push({ id: Date.now(), file: null });
        }

        return updated;
      });
    }
  };





  const addFileField = (type) => {
    if (type === "recipient") {
      setRecipientFiles(prev => {
        const last = prev[prev.length - 1];

        // Prevent double toast firing
        if (!last.file) {
          if (!toast.isActive("upload-warning")) {
            toast.error("Please upload a file before adding another document", {
              toastId: "upload-warning"
            });
          }
          return prev;
        }

        return [...prev, { id: Date.now(), file: null }];
      });
    }
  };



  // Helper (place in your component)
  const calcQtyFromSerials = (fromSerial, toSerial) => {
    const from = parseInt(fromSerial, 10);
    const to = parseInt(toSerial, 10);

    if (Number.isInteger(from) && Number.isInteger(to) && to >= from) {
      return to - from + 1; // valid range
    }
    // when either serial is empty/invalid, return empty string so input shows blank
    return "";
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);

    const fetchData = async () => {
      try {
        const res = await api.get("/get-spareparts");
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

    // Validation: Prevent selecting next row unless previous row is complete
    if (index > 0) {
      const prev = updated[index - 1];
      const prevType = sparepartTypeOf(prev.sparepart_id);

      const prevValid =
        prev.sparepart_id &&
        ((!prevType.includes("serial") && Number(prev.qty) > 0) ||
          (prevType.includes("serial") &&
            prev.from_serial &&
            prev.to_serial &&
            Number(prev.qty) > 0));

      if (!prevValid) {
        toast.error("Please complete the previous spare part before adding another.");
        return;
      }
    }

    // Update current row
    updated[index].sparepart_id = value;
    updated[index].qty = "";
    updated[index].from_serial = "";
    updated[index].to_serial = "";
    setSpareparts(updated);

    clearError("sparepart_id", index);
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...spareparts];
    const type = sparepartTypeOf(updated[index].sparepart_id);

    const isSerialItem = type.includes("serial");
    const isSerialField = field === "from_serial" || field === "to_serial";

    clearError("from_serial", index);
    clearError("to_serial", index);
    clearError("qty", index);

    // SERIAL ITEMS
    if (isSerialItem && isSerialField) {
      let cleaned = value.replace(/\D/g, "").slice(0, 6);
      updated[index][field] = cleaned;

      const from = Number(updated[index].from_serial);
      const to = Number(updated[index].to_serial);

      if (updated[index].from_serial && updated[index].to_serial && to >= from) {
        updated[index].qty = to - from + 1;
      } else {
        updated[index].qty = "";
      }
    }

    // NON-SERIAL ITEMS (manual qty)
    if (!isSerialItem && field === "qty") {
      updated[index].qty = value.replace(/\D/g, "");
    }

    // Always update
    updated[index][field] = value;

    // Row becomes valid?
    const isValid = () => {
      const sp = updated[index];
      if (!sp.sparepart_id) return false;

      if (type.includes("serial")) {
        return sp.from_serial && sp.to_serial && Number(sp.qty) > 0;
      }
      return Number(sp.qty) > 0;
    };

    // Auto-create next row once valid
    if (index === spareparts.length - 1 && isValid()) {
      updated.push({
        sparepart_id: "",
        qty: "",
        warranty_status: "Active",
        from_serial: "",
        to_serial: "",
      });
    }

    setSpareparts(updated);
  };
const isLastRowValid = () => {
  const last = spareparts[spareparts.length - 1];
  const type = sparepartTypeOf(last.sparepart_id);

  if (!last.sparepart_id) return false;

  if (type.includes("serial")) {
    return (
      last.from_serial &&
      last.to_serial &&
      Number(last.qty) > 0
    );
  }

  return Number(last.qty) > 0;
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
        qty: "",
        warranty_status: "Active",
        // product_id: "",
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
        qty: "",
        warranty_status: "Active",
        // product_id: "",
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

  if (!vendorId) errs.vendor_id = "Vendor is required";
  if (!challanNo) errs.challan_no = "Challan No is required";
  if (!challanDate) errs.challan_date = "Challan Date is required";
  if (!receivedDate) errs.received_date = "Received Date is required";

  if (challanDate && receivedDate) {
    const challan = new Date(challanDate);
    const received = new Date(receivedDate);

    if (received < challan) {
      errs.received_date = "Received Date cannot be before Challan Date";
    }
  }

  const itemErrors = {};

  spareparts.forEach((sp, idx) => {
    const type = sparepartTypeOf(sp.sparepart_id);
    const itemErr = {};

    // Sparepart required
    if (!sp.sparepart_id) {
      itemErr.sparepart_id = "Sparepart is required";
    }

    // Serial-based validation
    if (type.includes("serial")) {
      if (!sp.from_serial || !sp.from_serial.trim()) {
        itemErr.from_serial = "From Serial is required";
      }

      if (!sp.to_serial || !sp.to_serial.trim()) {
        itemErr.to_serial = "To Serial is required";
      }

      if (sp.from_serial && sp.to_serial) {
        const fromNum = Number(sp.from_serial);
        const toNum = Number(sp.to_serial);

        if (fromNum > toNum) {
          itemErr.from_serial = "From Serial must be <= To Serial";
          itemErr.to_serial = "From Serial must be <= To Serial";
        }

        // Exactly 6 digits
        if (!/^\d{6}$/.test(sp.from_serial)) {
          itemErr.from_serial = "From Serial must be exactly 6 digits";
        }
        if (!/^\d{6}$/.test(sp.to_serial)) {
          itemErr.to_serial = "To Serial must be exactly 6 digits";
        }
      }
    }

    // Quantity required
    if (!sp.qty || Number(sp.qty) < 1) {
      itemErr.qty = "Quantity is required";
    }

    // Collect row errors
    if (Object.keys(itemErr).length > 0) {
      itemErrors[idx] = itemErr;
    }
  });

  // Attach item-level errors to main error object
  if (Object.keys(itemErrors).length > 0) {
    errs.items = itemErrors;
  }

  // SET STATE
  setErrors(errs);

  // VALID IF NO MAIN ERRORS
  return Object.keys(errs).length === 0;
};



  const handleSubmit = async () => {
    if (!validateForm()) return;

    const formData = new FormData();
    let vendor_id = "";
    let contact_person_id = "";

    if (vendorId) {
      const parts = vendorId.split("-");
      vendor_id = parts[0]; 
      contact_person_id = parts[1] && parts[1] !== "0" ? parts[1] : null; // null if main vendor
    } else {
      vendor_id = "";
      contact_person_id = null;
    }
    formData.append("vendor_id", vendor_id);
    if (contact_person_id) formData.append("contact_person_id", contact_person_id);

   

    // formData.append("contact_person_id", contactPersonId || "")
    formData.append("challan_no", challanNo || "");
    formData.append("tracking_number", trackingNumber || "");
    formData.append("courier_name", courierName || "");

    // Convert yyyy-mm-dd → mm-dd-yyyy
    const formatDateMDY = (dateStr) => {
      if (!dateStr) return "";
      const [year, month, day] = dateStr.split("-");
      return `${month}-${day}-${year}`;
    };

    // In handleSubmit
    formData.append("challan_date", formatDateMDY(challanDate));
    formData.append("received_date", formatDateMDY(receivedDate));


    recipientFiles.forEach((f) => {
      if (f.file) formData.append("document_recipient[]", f.file);
    });

    // Append sparepart items
    spareparts.forEach((sp, index) => {
      if (!sp.sparepart_id) return;

      formData.append(`items[${index}][sparepart_id]`, sp.sparepart_id);
      // if (sp.product_id) formData.append(`items[${index}][product_id]`, sp.product_id);
      if (sp.from_serial) formData.append(`items[${index}][from_serial]`, sp.from_serial);
      if (sp.to_serial) formData.append(`items[${index}][to_serial]`, sp.to_serial);
      if (sp.warranty_status) formData.append(`items[${index}][warranty_status]`, sp.warranty_status);
      formData.append(`items[${index}][quantity]`, sp.qty ? sp.qty : "");
    });

    try {
      const res = await api.post("/sparepartNew-purchases", formData, {
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
    <div
      className="container-fluid"
      style={{ background: "#F4F4F8", minHeight: "100vh", position: "relative" }}
    >
      <Row className="align-items-center mb-3">
        <Col>
          <h4>Add Purchase Details</h4>
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
                  style={{ height: "34px", fontSize: "13px" }}
                >
                  <option value="">Select Vendor</option>
                  {availableVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendor}
                    </option>
                  ))}
                </Form.Select>

                {errors.vendor_id && (
                  <div style={{ color: "red", fontSize: "0.85rem" }}>
                    {errors.vendor_id}
                  </div>
                )}
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
                {errors.challan_no && (
                  <div style={feedbackStyle}>{errors.challan_no}</div>
                )}

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
                    setChallanDate(e.target.value);
                    clearError("challan_date");
                  }}
                />
                {errors.challan_date && (
                  <div style={feedbackStyle}>{errors.challan_date}</div>
                )}
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-2 form-field">
                <Form.Label>
                  Received Date<span style={{ color: "red" }}> *</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  value={receivedDate}
                  onChange={(e) => {
                    setReceivedDate(e.target.value);
                    clearError("received_date");
                  }}
                />
                {errors.received_date && (
                  <div style={{ color: "red", fontSize: "0.85rem" }}>
                    {errors.received_date}
                  </div>
                )}
              </Form.Group>
            </Col>
     <Col md={4}>
              <Form.Group className="mb-2 form-field">
                <Form.Label>Courier Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Courier Name"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
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
       

            {/* Receipt Files */}
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>
                  Receipt Documents
                  <Button
                    variant="link"
                    size="sm"
                    className="text-success ms-1 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      addFileField("recipient");
                    }}
                  >
                    <i className="bi bi-plus-circle"></i> Add
                  </Button>
                </Form.Label>

                {recipientFiles.map((f, idx) => (
                  <div
                    key={f.id}
                    className="d-flex align-items-center mb-1"
                    style={{ gap: "8px" }}
                  >
                    {/* File Input */
                    }
                    <div style={{ flexGrow: 1 }}>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange("recipient", f.id, e.target.files[0])
                        }
                      />
                    </div>

                    {/* SHOW DELETE BUTTON FOR ALL ROWS BUT NOT WHEN THERE IS ONLY 1 ROW */}
                    {recipientFiles.length > 1 && f.file && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-0"
                        style={{ width: "26px" }}
                        onClick={() => removeFileField("recipient", f.id)}
                      >
                        <i className="bi bi-x-circle"></i>
                      </Button>
                    )}
                  </div>
                ))}
              </Form.Group>
            </Col>
            {/* Challan Files */}
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
              {challanFiles.map((f) => (
                <div key={f.id} className="d-flex align-items-center mb-1">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange("challan", f.id, e.target.files[0])
                    }
                  />
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger ms-2 p-0"
                    onClick={() => removeFileField("challan", f.id)}
                  >
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </div>
              ))}
            </Form.Group>
          </Col> */}
          </Row>
        </Card.Body>
      </Card>

      {/* Spare Parts Section */}
      {spareparts.length > 0 && (
        <Card className="mb-3" style={{ background: "#F4F4F8", borderRadius: 6 }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Spare Parts Details</h6>
            </div>

            {spareparts.map((sp, index) => {
              const type = sparepartTypeOf(sp.sparepart_id);

              return (
                <div
                  key={index}
                  className="p-3 mb-3 position-relative"
                  style={{
                    border: "1px solid #dee2e6",
                    borderRadius: "6px",
                    backgroundColor: "#fff",
                  }}
                >
                  {/* Delete button on the top-right */}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteSparepart(index)}
                    className="position-absolute"
                    style={{ top: "50px", right: "8px" }}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>

                  <Row className="align-items-end mt-3">
                    <Col md={3}>
                      <Form.Group className="mb-2 form-field">
                        <Form.Label>
                          Spare Parts<span style={{ color: "red" }}> *</span>
                        </Form.Label>
                        <Form.Select
                          value={sp.sparepart_id}
                          onChange={(e) => handleSparepartChange(index, e.target.value)}
                        >
                          <option value="">Select Spare parts</option>
                          {availableSpareparts.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </Form.Select>

                        {errors.items?.[index]?.sparepart_id && (
                          <div style={feedbackStyle}>{errors.items[index].sparepart_id}</div>
                        )}

                      </Form.Group>
                    </Col>

                    {/* Conditional Fields */}
                    {sp.sparepart_id && (() => {
                      if (type.includes("serial")) {
                        return (
                          <>
                            {/* <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>Product</Form.Label>
                                <Form.Select
                                  value={sp.product_id}
                                  onChange={(e) =>
                                    handleInputChange(index, "product_id", e.target.value)
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
                            </Col> */}

                            <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>From Serial</Form.Label>
                                <Form.Control
                                  type="text"
                                  maxLength={6}
                                  value={sp.from_serial}
                                  onChange={(e) => {
                                    const value = e.target.value;

                                    // Update FROM SERIAL
                                    handleInputChange(index, "from_serial", value);

                                    // Auto-fill TO SERIAL with same value
                                    handleInputChange(index, "to_serial", value);
                                  }}
                                />
                                {errors.items?.[index]?.from_serial && (
                                  <div style={feedbackStyle}>{errors.items[index].from_serial}</div>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>To Serial</Form.Label>
                                <Form.Control
                                  type="text"
                                  maxLength={6}
                                  value={sp.to_serial}
                                  onChange={(e) =>
                                    handleInputChange(index, "to_serial", e.target.value)
                                  }
                                />
                                {errors.items?.[index]?.to_serial && (
                                  <div style={feedbackStyle}>{errors.items[index].to_serial}</div>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>Quantity</Form.Label>
                                <Form.Control
                                  type="number"
                                  value={sp.qty}
                                  readOnly
                                  style={{
                                    backgroundColor: "white",
                                    pointerEvents: "none",
                                  }}
                                  disabled
                                />
                                {errors.items?.[index]?.qty && (
                                  <div style={feedbackStyle}>{errors.items[index].qty}</div>
                                )}
                              </Form.Group>
                            </Col>
                          </>
                        );
                      } else {
                        return (
                          <Col md={3}>
                            <Form.Group className="mb-2">
                              <Form.Label>Quantity <span style={{ color: "red" }}>*</span></Form.Label>
                              <Form.Control
                                type="number"
                                min="1"
                                value={sp.qty}
                                onChange={(e) => handleInputChange(index, "qty", e.target.value)}
                              />
                              {errors.items?.[index]?.qty && (
                                <div style={feedbackStyle}>{errors.items[index].qty}</div>
                              )}
                            </Form.Group>
                          </Col>
                        );
                      }
                    })()}
                  </Row>
                </div>
              );
            })}
          </Card.Body>
        </Card>
      )}





      <div className="d-flex justify-content-between mt-3">
        <Button
          variant="success"
          onClick={addSparepart}
          disabled={!isLastRowValid()}
        >
          <i className="bi bi-plus-lg me-1" /> Add Spare Parts
        </Button>


        <div>
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate(-1)}
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

