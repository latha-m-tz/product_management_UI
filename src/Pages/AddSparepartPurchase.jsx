import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col, Card } from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";


export default function AddSparepartPurchase() {
  const [vendorId, setVendorId] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [errors, setErrors] = useState({});
const navigate = useNavigate();
const [existingSerials, setExistingSerials] = useState([]);

  const [spareparts, setSpareparts] = useState([
    {
      sparepart_id: "",
      qty: 1,
      warranty_status: "Active",
      product_id: "",
      from_serial: "",
      to_serial: "",
    },
  ]);
  const [availableSpareparts, setAvailableSpareparts] = useState([]);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/get-spareparts");
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
    const updated = [...spareparts];
    updated[index].sparepart_id = value;
    updated[index].qty = 1;
    updated[index].warranty_status = "Active";
    updated[index].product_id = "";
    updated[index].from_serial = "";
    updated[index].to_serial = "";
    setSpareparts(updated);
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...spareparts];
    updated[index][field] = value;
    setSpareparts(updated);

       setErrors((prev) => {
      if (prev.items?.[index]?.[field]) {
        const newItems = { ...prev.items };
        delete newItems[index][field];
        if (Object.keys(newItems[index]).length === 0) delete newItems[index];
        return { ...prev, items: newItems };
      }
      return prev;
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

  if (!vendorId) errs.vendor_id = "Vendor is required";
  if (!challanNo) errs.challan_no = "Challan No is required";
  if (!challanDate) errs.challan_date = "Challan Date is required";

  const itemErrors = {};
  spareparts.forEach((sp, idx) => {
    const type = sparepartTypeOf(sp.sparepart_id);
    const itemErr = {};

    if (!sp.sparepart_id) itemErr.sparepart_id = "Select sparepart";

    if (type.includes("serial")) {
      if (!sp.product_id) itemErr.product_id = "Select product";
      if (!sp.from_serial) itemErr.from_serial = "From Serial required";
      if (!sp.to_serial) itemErr.to_serial = "To Serial required";
    }

    if (!sp.qty || sp.qty < 1) itemErr.qty = "Quantity must be at least 1";
    if (type.includes("warranty") && !sp.warranty_status) itemErr.warranty_status = "Select warranty status";

    if (Object.keys(itemErr).length) itemErrors[idx] = itemErr;
  });

  if (Object.keys(itemErrors).length) errs.items = itemErrors;

  setErrors(errs);
  return Object.keys(errs).length === 0;
};




 const handleSubmit = async () => {
  if (!validateForm()) {
    toast.error("Please fix the errors below");
    return;
  }

   // 2️⃣ Check for overlapping serials within this purchase
  const serialErrors = {};
  spareparts.forEach((sp, i) => {
    if (sp.sparepart_id && sparepartTypeOf(sp.sparepart_id).includes("serial")) {
      const fromA = sp.from_serial;
      const toA = sp.to_serial;

      spareparts.forEach((otherSp, j) => {
        if (i === j) return;
        if (
          otherSp.sparepart_id &&
          sparepartTypeOf(otherSp.sparepart_id).includes("serial")
        ) {
          const fromB = otherSp.from_serial;
          const toB = otherSp.to_serial;

          if (
            fromA && toA && fromB && toB &&
            !(toA < fromB || fromA > toB) // check overlap
          ) {
            if (!serialErrors.items) serialErrors.items = {};
            if (!serialErrors.items[i]) serialErrors.items[i] = {};
            if (!serialErrors.items[j]) serialErrors.items[j] = {};

            serialErrors.items[i].from_serial = "Overlapping serial range";
            serialErrors.items[i].to_serial = "Overlapping serial range";
            serialErrors.items[j].from_serial = "Overlapping serial range";
            serialErrors.items[j].to_serial = "Overlapping serial range";
          }
        }
      });
    }
  });

  if (serialErrors.items) {
    setErrors(serialErrors);
    toast.error("Duplicate or overlapping serials detected within this purchase!");
    return;
  }

  const serialProductsMap = {}; // { product_id: [indexes] }
  spareparts.forEach((sp, idx) => {
    const type = sparepartTypeOf(sp.sparepart_id);
    if (type.includes("serial") && sp.product_id) {
      if (!serialProductsMap[sp.product_id]) serialProductsMap[sp.product_id] = [];
      serialProductsMap[sp.product_id].push(idx);
    }
  });

  const dupErrors = {};
  Object.entries(serialProductsMap).forEach(([productId, indexes]) => {
    if (indexes.length > 1) {
      indexes.forEach((i) => {
        if (!dupErrors.items) dupErrors.items = {};
        if (!dupErrors.items[i]) dupErrors.items[i] = {};
        dupErrors.items[i].product_id = "Duplicate product not allowed";
      });
    }
  });

    if (dupErrors.items) {
    setErrors(dupErrors);
    toast.error("Duplicate product selected in serial-based spareparts!");
    return;
  }

  
  const items = spareparts
    .map((sp) => {
      if (!sp.sparepart_id) return null;
      const type = sparepartTypeOf(sp.sparepart_id);
      const qty = Number(sp.qty) || 1;

      if (type.includes("serial")) {
        return {
          sparepart_id: sp.sparepart_id,
          product_id: sp.product_id || null,
          from_serial: sp.from_serial || null,
          to_serial: sp.to_serial || null,
          warranty_status: sp.warranty_status || null,
          quantity: qty,
        };
      } else if (type.includes("warranty")) {
        return {
          sparepart_id: sp.sparepart_id,
          warranty_status: sp.warranty_status || null,
          quantity: qty,
        };
      } else {
        return {
          sparepart_id: sp.sparepart_id,
          quantity: qty,
        };
      }
    })
    .filter(Boolean);

  const payload = {
    vendor_id: vendorId || null,
    challan_no: challanNo || null,
    challan_date: challanDate || null,
    items,
  };

  try {
    const res = await axios.post(
      "http://localhost:8000/api/sparepartNew-purchases",
      payload
    );
    toast.success("Purchase saved successfully!");
     navigate("/spare-partsPurchase");
    console.log(res.data);
  } catch (err) {
  if (err.response?.data?.errors) {
    const backendErrors = err.response.data.errors;
    setErrors(backendErrors);

    // Loop through each field's error messages
    Object.values(backendErrors).forEach((fieldErrors) => {
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((msg) => toast.error(msg));
      } else if (typeof fieldErrors === "string") {
        toast.error(fieldErrors);
      }
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
      className="container-fluid p-4"
      style={{ background: "white", minHeight: "100vh" }}
    >
      <h5 className="mb-3">Add New Spareparts Purchase</h5>

      {/* Purchase Details */}
      <Card className="mb-3" style={{ background: "#f1f3f5", borderRadius: 6 }}>
        <Card.Body>
          <h6 className="mb-3">Purchase Details</h6>

          <Row className="mb-2">
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Vendor*</Form.Label>
                <Form.Select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {availableVendors.map((v) =>
                    v.contact_persons?.length > 0 ? (
                      v.contact_persons.map((c, idx) => (
                        <option key={`${v.id}-${c.id}`} value={v.id}>
                          {v.vendor} – {c.name}
                          {idx === 0 ? " (Main person)" : ""}
                        </option>
                      ))
                    ) : (
                      <option key={v.id} value={v.id}>
                        {v.vendor}
                      </option>
                    )
                  )}
                </Form.Select>
    {errors.vendor_id && <div style={feedbackStyle}>{errors.vendor_id}</div>}
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Challan No</Form.Label>
                <Form.Control
                  type="text"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                  placeholder="Enter Challan No"
                  
                />
                 {errors.challan_no && <div style={feedbackStyle}>{errors.challan_no}</div>}

              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Challan Date</Form.Label>
                <Form.Control
                  type="date"
                  value={challanDate}
                  onChange={(e) => setChallanDate(e.target.value)}
                />
             {errors.challan_date && <div style={feedbackStyle}>{errors.challan_date}</div>}

              </Form.Group>
            </Col>
          </Row>

          {/* First sparepart dropdown + conditional fields */}
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Spareparts</Form.Label>
                <Form.Select
                  value={spareparts[0].sparepart_id}
                  onChange={(e) =>
                    handleSparepartChange(0, e.target.value)
                  }
                >
                  <option value="">Select Spareparts</option>
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
                          <Form.Group className="mb-2">
                            <Form.Label>Product</Form.Label>
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
                          <Form.Group className="mb-2">
                            <Form.Label>From Serial</Form.Label>
                            <Form.Control
                              type="text"
                              value={spareparts[0].from_serial}
                              onChange={(e) =>
                                handleInputChange(0, "from_serial", e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>

                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label>To Serial</Form.Label>
                            <Form.Control
                              type="text"
                              value={spareparts[0].to_serial}
                              onChange={(e) =>
                                handleInputChange(0, "to_serial", e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Row 2 */}
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-2">
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
                          <Form.Group className="mb-2">
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
                        <Form.Group className="mb-2">
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
                        <Form.Group className="mb-2">
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
                      <Form.Group className="mb-2">
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
            style={{ background: "#f1f3f5", borderRadius: 6 }}
          >
            <Card.Body>
              <Row className="mb-2 align-items-center">
                <Col>
                  <h6 className="mb-0">Spareparts Details</h6>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeSparepart(realIndex)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </Col>
              </Row>

              <Row className="align-items-end mb-2" key={realIndex}>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Spareparts</Form.Label>
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

                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>To Serial</Form.Label>
                        <Form.Control
                          type="text"
                          value={sp.to_serial}
                          onChange={(e) => handleInputChange(realIndex, "to_serial", e.target.value)}
                        />
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
          <i className="bi bi-plus-lg me-1" /> Add Spareparts
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
