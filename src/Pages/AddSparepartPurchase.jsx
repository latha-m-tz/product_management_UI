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
import Select, { components } from "react-select";

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
  // const [fromSerial, setFromSerial] = useState("");
  // const [toSerial, setToSerial] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [availableSpareparts, setAvailableSpareparts] = useState([]);

  const sparepartOptions = availableSpareparts.map(s => ({
    value: s.id,
    label: s.name,
  }));

  const handleMultiSelect = (selectedOptions = []) => {
    setSpareparts(prev => {
      let updated = [...prev];

      const selectedIds = selectedOptions.map(o => o.value);

      const removedIds = [...new Set(prev.map(p => p.sparepart_id))]
        .filter(id => id && !selectedIds.includes(id));

      removedIds.forEach(id => {
        const indexToRemove = updated.findIndex(
          sp => sp.sparepart_id === id
        );
        if (indexToRemove !== -1) {
          updated.splice(indexToRemove, 1); 
        }
      });

      selectedIds.forEach(id => {
        const exists = updated.some(sp => sp.sparepart_id === id);
        if (!exists) {
          updated.push({
            row_id: Date.now() + Math.random(),
            sparepart_id: id,
            qty: "",
            warranty_status: "Active",
            from_serial: "",
            to_serial: "",
          });
        }
      });

      return updated;
    });
  };




  // const handleFromSerialChange = (e) => {
  //   const value = e.target.value;
  //   setFromSerial(value);

  //   // Auto-fill To Serial with the same value
  //   setToSerial(value);
  // };

  const duplicateSparepart = (index) => {
    const current = spareparts[index];

    const newRow = {
      ...current,
      row_id: Date.now() + Math.random(), 
      qty: "",
      from_serial: "",
      to_serial: "",
    };

    const updated = [...spareparts];
    updated.splice(index + 1, 0, newRow);
    setSpareparts(updated);
  };



  const MySwal = withReactContent(Swal);

  const [spareparts, setSpareparts] = useState([]);

  const [availableVendors, setAvailableVendors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const removeFileField = (type, id) => {
    if (type === "recipient") {
      setRecipientFiles(prev => {
        if (prev.length === 1) return prev;
        return prev.filter(f => f.id !== id);
      });
    }
  };
  const selectValue = spareparts
    .filter(sp => sp.sparepart_id)
    .map((sp, index) => ({
      value: `${sp.sparepart_id}-${index}`, 
      sparepart_id: sp.sparepart_id,
      label:
        availableSpareparts.find(a => a.id === sp.sparepart_id)?.name || "",
    }));

  const selectStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: "white",
      color: "black",
      cursor: "pointer",
      ":active": {
        backgroundColor: "white",
      },
    }),

    control: (provided) => ({
      ...provided,
      borderColor: "#ced4da",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#86b7fe",
      },
    }),

    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#e9ecef",
    }),

    multiValueLabel: (provided) => ({
      ...provided,
      color: "#212529",
      fontWeight: 500,
    }),

    multiValueRemove: (provided) => ({
      ...provided,
      color: "#6c757d",
      ":hover": {
        backgroundColor: "#dee2e6",
        color: "#000",
      },
    }),
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



  // const calcQtyFromSerials = (fromSerial, toSerial) => {
  //   const from = parseInt(fromSerial, 10);
  //   const to = parseInt(toSerial, 10);

  //   if (Number.isInteger(from) && Number.isInteger(to) && to >= from) {
  //     return to - from + 1; // valid range
  //   }
  //   // when either serial is empty/invalid, return empty string so input shows blank
  //   return "";
  // };

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

  const handleSparepartSelectOpen = () => {
    if (!vendorId) {
      toast.error("Please choose Vendor first");
      return false;
    }
    return true;
  };

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

    if (isSerialItem && (field === "from_serial" || field === "to_serial")) {
      const cleaned = value.replace(/\D/g, "").slice(0, 6);

      updated[index][field] = cleaned;

      const from = Number(updated[index].from_serial);
      const to = Number(updated[index].to_serial);

      updated[index].qty =
        from && to && to >= from ? to - from + 1 : "";
    }
    else if (!isSerialItem && field === "qty") {
      updated[index].qty = value.replace(/\D/g, "");
    }
    else {
      updated[index][field] = value;
    }

    setSpareparts(updated);
  };



  // const isRowComplete = (row) => {
  //   const type = sparepartTypeOf(row.sparepart_id);

  //   if (!row.sparepart_id) return false;

  //   if (type.includes("serial")) {
  //     return row.from_serial && row.to_serial && Number(row.qty) > 0;
  //   }

  //   return Number(row.qty) > 0;
  // };

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
    if (index === 0) {
      toast.error("At least one spare part is required.");
      return;
    }

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
        removeSparepart(index);
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
    const last = spareparts[spareparts.length - 1];
    const type = sparepartTypeOf(last.sparepart_id);

    // Check whether last row is complete
    const isComplete =
      last.sparepart_id &&
      (
        (!type.includes("serial") && Number(last.qty) > 0) ||
        (type.includes("serial") &&
          last.from_serial &&
          last.to_serial &&
          Number(last.qty) > 0)
      );

    if (!isComplete) {
      toast.error("Please fill all required fields before adding another spare part.");
      return;
    }

    if (
      last.sparepart_id === "" &&
      last.qty === "" &&
      last.from_serial === "" &&
      last.to_serial === ""
    ) {
      return; // Ignore 2nd click
    }

    setSpareparts(prev => [
      ...prev,
      {
        sparepart_id: "",
        qty: "",
        warranty_status: "Active",
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
    const seenSerials = new Set();

    for (let i = 0; i < spareparts.length; i++) {
      const sp = spareparts[i];
      const type = sparepartTypeOf(sp.sparepart_id);

      if (!type.includes("serial")) continue;

      const from = Number(sp.from_serial);
      const to = Number(sp.to_serial);

      if (!from || !to) continue;

      for (let s = from; s <= to; s++) {
        const key = `${sp.sparepart_id}-${s}`;
        if (seenSerials.has(key)) {
          toast.error(`Duplicate serial number detected: ${s}`);
          return false;
        }
        seenSerials.add(key);
      }
    }

    const itemErrors = {};

    spareparts.forEach((sp, idx) => {
      const type = sparepartTypeOf(sp.sparepart_id);
      const itemErr = {};

      if (!sp.sparepart_id) {
        itemErr.sparepart_id = "Sparepart is required";
      }

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

          if (!/^\d{6}$/.test(sp.from_serial)) {
            itemErr.from_serial = "From Serial must be exactly 6 digits";
          }
          if (!/^\d{6}$/.test(sp.to_serial)) {
            itemErr.to_serial = "To Serial must be exactly 6 digits";
          }
        }
      }

      if (!sp.qty || Number(sp.qty) < 1) {
        itemErr.qty = "Quantity is required";
      }

      if (Object.keys(itemErr).length > 0) {
        itemErrors[idx] = itemErr;
      }
    });

    if (Object.keys(itemErrors).length > 0) {
      errs.items = itemErrors;
    }

    setErrors(errs);

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

    formData.append("challan_date", challanDate);
    formData.append("received_date", receivedDate);



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

  const CheckboxOption = (props) => {
    return (
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
          style={{ marginRight: 8 }}
        />
        <label>{props.label}</label>
      </components.Option>
    );
  };

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
                    {!(recipientFiles.length === 1 && !f.file) && (
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
      <Card className="mb-3" style={{ background: "#F4F4F8", borderRadius: 6 }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Spare Parts Details</h6>
          </div>

          {/* ✅ SELECT ALWAYS VISIBLE */}
          <Form.Group className="mb-3">
            <Form.Label>
              Select Spare Parts <span style={{ color: "red" }}>*</span>
            </Form.Label>

            <Select
              isMulti
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              options={sparepartOptions}
              components={{ Option: CheckboxOption }}
              styles={selectStyles}
              value={[
                ...new Map(
                  spareparts
                    .filter(sp => sp.sparepart_id)
                    .map(sp => [
                      sp.sparepart_id,
                      {
                        value: sp.sparepart_id,
                        label:
                          availableSpareparts.find(a => a.id === sp.sparepart_id)?.name || "",
                      },
                    ])
                ).values(),
              ]}
              onMenuOpen={() => {
                if (!vendorId) {
                  toast.error("Please choose Vendor first");
                  return false; 
                }
              }}

              onChange={(selected) => {
                if (!vendorId) {
                  toast.error("Please choose Vendor first");
                  return;
                }
                handleMultiSelect(selected);
              }}
            />
          </Form.Group>

          {/* ✅ SHOW HELPER TEXT WHEN EMPTY */}
          {spareparts.length === 0 && (
            <div style={{ color: "#6c757d", fontSize: "13px" }}>
              No spare parts selected
            </div>
          )}

          {/* ✅ ROWS ONLY AFTER SELECTION */}
          {spareparts.map((sp, index) => {
            const type = sparepartTypeOf(sp.sparepart_id);
            const isSerial = type.includes("serial");

            return (
              <Card key={index} className="mb-2 p-2">
                <Row className="align-items-center">

                  {/* Spare Part Name */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Spare Part</Form.Label>
                      <Form.Control
                        value={
                          availableSpareparts.find(s => s.id === sp.sparepart_id)?.name || ""
                        }
                        disabled
                      />
                    </Form.Group>
                  </Col>

                  {/* SERIAL TYPE */}
                  {isSerial && (
                    <>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label>
                            From Serial <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            value={sp.from_serial}
                            onChange={(e) => {
                              const value = e.target.value;

                              handleInputChange(index, "from_serial", value);

                              handleInputChange(index, "to_serial", value);
                            }}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2}>
                        <Form.Group>
                          <Form.Label>  To Serial <span style={{ color: "red" }}>*</span>
                          </Form.Label>
                          <Form.Control
                            value={sp.to_serial}
                            onChange={(e) =>
                              handleInputChange(index, "to_serial", e.target.value)
                            }
                          />

                        </Form.Group>
                      </Col>

                      <Col md={2}>
                        <Form.Group>
                          <Form.Label>
                            Qty <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control value={sp.qty} disabled />
                        </Form.Group>
                      </Col>
                    </>
                  )}

                  {/* NON-SERIAL TYPE */}
                  {!isSerial && (
                    <>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label>  Qty <span style={{ color: "red" }}>*</span>
                          </Form.Label>
                          <Form.Control
                            value={sp.qty}
                            onChange={(e) =>
                              handleInputChange(index, "qty", e.target.value)
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2} />
                      <Col md={2} />
                    </>
                  )}
                  {/* ACTIONS */}
                  <Col
                    md={2}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => duplicateSparepart(index)}
                      >
                        <i className="bi bi-plus-lg" />
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteSparepart(index)}
                      >
                        <i className="bi bi-trash" />
                      </Button>
                    </div>
                  </Col>


                </Row>
              </Card>
            );
          })}

        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between mt-3">
        {/* <Button
          variant="success"
          onClick={addSparepart}
        >
          <i className="bi bi-plus-lg me-1" /> Add Spare Parts
        </Button> */}
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
