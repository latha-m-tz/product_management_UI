import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col, Card, Spinner } from "react-bootstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import SerialSelectionModal from "./SerialSelectionModal"; // <-- import modal
import { useNavigate } from "react-router-dom";
 
export default function EditSparepartPurchase({ purchaseId }) {
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [errors, setErrors] = useState({});
  const [spareparts, setSpareparts] = useState([]);
  const [availableSpareparts, setAvailableSpareparts] = useState([]);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
// const [serialOptions, setSerialOptions] = useState([]);
const [selectedSerials, setSelectedSerials] = useState([]);
// const [serialOptionsByIndex, setSerialOptionsByIndex] = useState({});
// const [selectedSerialsByIndex, setSelectedSerialsByIndex] = useState({});
// const [fromSerialFilter, setFromSerialFilter] = useState('');
// const [toSerialFilter, setToSerialFilter] = useState('');
const [availableSerials, setAvailableSerials] = useState([]);
const [initialItems, setInitialItems] = useState([]);
 
const [modalIndex, setModalIndex] = useState(null);
const [modalSerials, setModalSerials] = useState([]);
const [deletedSparepartIds, setDeletedSparepartIds] = useState([]);

const navigate = useNavigate();

 
 
const [currentIndex, setCurrentIndex] = useState(null);
  const { id } = useParams();
  const purchaseKey = purchaseId || id;
 
  // ---------- Serial helpers ----------
  const parseSerial = (s) => {
    if (!s || typeof s !== "string") return null;
    // match prefix + numeric suffix (e.g. "SN" + "001")
    const m = s.match(/^(.*?)(\d+)$/);
    if (m) return { orig: s, prefix: m[1], num: parseInt(m[2], 10), pad: m[2].length };
    // no numeric suffix
    return { orig: s, prefix: s, num: null, pad: 0 };
  };
 
  const buildSerial = (prefix, num, pad) => {
    if (num === null || num === undefined) return prefix;
    const nStr = String(num).padStart(pad || 0, "0");
    return `${prefix}${nStr}`;
  };
 
  // numeric-aware range compute (used on fetch grouping)
  const computeRangeFromSerials = (serials = []) => {
    if (!serials || serials.length === 0) return { from_serial: "", to_serial: "" };
    const uniq = Array.from(new Set(serials.filter(Boolean)));
    const parsed = uniq.map((s) => parseSerial(s));
    const byPrefix = {};
    parsed.forEach((p) => {
      const key = p.prefix;
      if (!byPrefix[key]) byPrefix[key] = [];
      byPrefix[key].push(p);
    });
    // choose biggest prefix group
    let bestKey = Object.keys(byPrefix)[0];
    Object.keys(byPrefix).forEach((k) => {
      if (byPrefix[k].length > (byPrefix[bestKey]?.length || 0)) bestKey = k;
    });
    const group = byPrefix[bestKey] || [];
    const numericGroup = group.filter((g) => g.num !== null);
    if (numericGroup.length > 0) {
      numericGroup.sort((a, b) => a.num - b.num);
      return { from_serial: numericGroup[0].orig, to_serial: numericGroup[numericGroup.length - 1].orig };
    }
    // fallback lexicographic
    const sorted = uniq.sort();
    return { from_serial: sorted[0], to_serial: sorted[sorted.length - 1] };
  };
 
 
  const estimateQtyFromRange = (from = "", to = "") => {
    if (!from || !to) return null;
    const m1 = parseSerial(from);
    const m2 = parseSerial(to);
    if (!m1 || !m2) return null;
    if (m1.num === null || m2.num === null) return null;
    if (m1.prefix !== m2.prefix) return null;
    if (m2.num < m1.num) return null;
    return m2.num - m1.num + 1;
  };
 
const fetchAvailableSerials = async (index) => {
  const sp = spareparts[index];
  if (!sp.product_id || !sp.sparepart_id) {
    toast.error("Select sparepart and product first");
    return;
  }

  // --- if new item (id === null) compute serials locally ---
  if (sp.id === null) {
    const from = sp.from_serial;
    const to = sp.to_serial;
    if (!from || !to) {
      toast.error("Enter From/To Serial first");
      return;
    }

    const serialList = [];
    const m1 = parseSerial(from);
    const m2 = parseSerial(to);

    if (m1 && m2 && m1.prefix === m2.prefix && m1.num !== null && m2.num !== null && m2.num >= m1.num) {
      for (let n = m1.num; n <= m2.num; n++) {
        serialList.push(buildSerial(m1.prefix, n, m1.pad));
      }
    } else {
      toast.error("Invalid serial range");
      return;
    }

    setModalSerials(serialList);
    setModalIndex(index);
    setShowModal(true);
    return;
  }

  // --- else fetch from backend for existing item ---
  try {
    const res = await axios.get("http://localhost:8000/api/available-serials", {
      params: {
        purchase_id: purchaseKey,    
        sparepart_id: sp.sparepart_id,  
        product_id: sp.product_id      
      },
    });

    const serials = res.data.serials || [];
    setModalSerials(serials);
    setModalIndex(index);
    setShowModal(true);
  } catch (err) {
    toast.error("Failed to fetch serials");
  }
};

// Handle confirm from modal
// const handleSerialConfirm = (selected) => {
//   if (modalIndex === null) return;
 
//   const updated = [...spareparts];
//   updated[modalIndex].serials = selected; // <-- update full array
 
//   if (selected.length > 0) {
//     updated[modalIndex].from_serial = selected[0];
//     updated[modalIndex].to_serial = selected[selected.length - 1];
//     updated[modalIndex].qty = selected.length;
//   } else {
//     updated[modalIndex].from_serial = "";
//     updated[modalIndex].to_serial = "";
//     updated[modalIndex].qty = 1;
//   }
 
//   setSpareparts(updated);
//   setShowModal(false);
// };
 
const handleSerialConfirm = (selected) => {
  if (modalIndex === null) return;

  const cleanSelected = (selected || []).filter(Boolean);
  const updated = [...spareparts];
  const sp = { ...updated[modalIndex] };

  sp.serials = cleanSelected;

  if (cleanSelected.length > 0) {
    const { from_serial, to_serial } = computeRangeFromSerials(cleanSelected);
    sp.from_serial = from_serial;
    sp.to_serial = to_serial;
    sp.qty = cleanSelected.length;   // ✅ qty = count of serials only
  } else {
    sp.from_serial = "";
    sp.to_serial = "";
    sp.qty = 0;   // ✅ reset qty when no serials
  }

  updated[modalIndex] = sp;
  setSpareparts(updated);
  setShowModal(false);
};

const handleRemoveRow = (index, sp) => {
  if (sp?.id) {
    // Mark it for deletion
    setDeletedSparepartIds(prev => [...prev, sp.id]);
  }

  const updated = [...spareparts];
  updated.splice(index, 1);
  setSpareparts(updated);
};


 
  // ---------- fetch & group ----------
 useEffect(() => {
  const fetchData = async () => {
    try {
      const [spareRes, purchaseRes] = await Promise.all([
        axios.get("http://localhost:8000/api/get-spareparts"),
        axios.get(`http://localhost:8000/api/${purchaseKey}/purchase/edit`),
      ]);

      setAvailableSpareparts(spareRes.data.spareparts || []);
      setAvailableVendors(spareRes.data.vendors || []);
      setAvailableCategories(spareRes.data.categories || []);

      const p = purchaseRes.data.purchase || {};
      setVendorId(p.vendor_id || "");
      setChallanNo(p.challan_no || "");
      setChallanDate(p.challan_date || "");
      setInitialItems(p.items || []);

      // Group backend items by sparepart/product/warranty
      const groups = {};
      (p.items || []).forEach((item) => {
        const key = `${item.sparepart_id || ""}__${item.product_id || ""}__${item.warranty_status || ""}`;
        if (!groups[key]) {
          groups[key] = {
            sparepart_id: item.sparepart_id,
            product_id: item.product_id || "",
            warranty_status: item.warranty_status || "Active",
            serials: [],
            qty: 0,
          };
        }

        if (item.serial_no) {
          groups[key].serials.push(item.serial_no);
          groups[key].qty += 1;
        } else {
          groups[key].qty += item.quantity ? Number(item.quantity) : 0;
        }

        groups[key].serials = groups[key].serials.filter(Boolean);
      });

      const mappedBackend = Object.values(groups).map((g) => {
        const { from_serial, to_serial } = computeRangeFromSerials(g.serials);
        const qty = g.qty || (g.serials?.length || 1);
        const originalItem = p.items.find(
          (i) => i.sparepart_id === g.sparepart_id && i.product_id === g.product_id
        );

        return {
          id: originalItem?.id || null,
          sparepart_id: g.sparepart_id || "",
          product_id: g.product_id || "",
          qty,
          warranty_status: g.warranty_status || "Active",
          from_serial,
          to_serial,
          serials: g.serials?.filter(Boolean) || [],
        };
      });

      // Merge any unsaved frontend rows (id === null)
      const newFrontendRows = spareparts.filter(
        (sp) =>
          sp.id === null &&
          !mappedBackend.some(
            (m) => m.sparepart_id === sp.sparepart_id && m.product_id === sp.product_id
          )
      );

      const finalSpareparts =
        mappedBackend.length || newFrontendRows.length
          ? [...mappedBackend, ...newFrontendRows]
          : [
              {
                id: null,
                sparepart_id: "",
                product_id: "",
                qty: 1,
                warranty_status: "Active",
                from_serial: "",
                to_serial: "",
                serials: [],
              },
            ];

      setSpareparts(finalSpareparts);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch purchase data");
      setLoading(false);
    }
  };
  fetchData();
}, [purchaseKey]);

 
  // ---------- UI helpers ----------
  const sparepartTypeOf = (id) => {
    if (!id) return "";
    const s = availableSpareparts.find((x) => String(x.id) === String(id));
    return (s?.sparepart_type || s?.part_type || "").toString().toLowerCase();
  };
 
  const setItemError = (index, field, message) => {
    setErrors((prev) => {
      const items = { ...(prev.items || {}) };
      items[index] = { ...(items[index] || {}) };
      if (message) items[index][field] = message;
      else {
        if (items[index]) {
          delete items[index][field];
          if (Object.keys(items[index]).length === 0) delete items[index];
        }
      }
      return { ...prev, items };
    });
  };
 
  const clearItemErrors = (index) => {
    setErrors((prev) => {
      const items = { ...(prev.items || {}) };
      if (items[index]) delete items[index];
      return { ...prev, items };
    });
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
    clearItemErrors(index);
  };
 
//   const handleSparepartChange = (index, value) => {
//   const updated = [...spareparts];
//   updated[index] = {
//     ...updated[index],
//     sparepart_id: value,
//     qty: 1,
//     warranty_status: "Active",
//     product_id: "",
//     from_serial: "",
//     to_serial: "",
//     serials: [],   // <-- reset to empty array
//   };
//   setSpareparts(updated);
//   clearItemErrors(index);
// };
 
 
  // more intelligent input change for serials / qty
  const handleInputChange = (index, field, value) => {
  const updated = [...spareparts];
  const sp = { ...updated[index] };

  sp[field] = value;

  if ((field === "from_serial" || field === "to_serial") && sp.serials?.length === 0) {
    // only auto-calc range if no manual serials selected
    const from = sp.from_serial;
    const to = sp.to_serial;
    const qtyEst = estimateQtyFromRange(from, to);
    if (qtyEst !== null) {
      sp.qty = qtyEst;
    }
  }

  if (field === "qty" && sp.serials?.length === 0) {
    // only change qty → to_serial if not serial-based
    const from = sp.from_serial;
    const parsed = parseSerial(from);
    const q = Number(value || 0);
    if (parsed && parsed.num !== null && q > 0) {
      sp.to_serial = buildSerial(parsed.prefix, parsed.num + q - 1, parsed.pad);
    }
  }

  // if (field === "product_id") {
  //   sp.from_serial = "";
  //   sp.to_serial = "";
  //   sp.qty = 1;
  //   sp.serials = [];
  // }

    if (field === "product_id" && sp.product_id !== value) {

    sp.from_serial = "";
    sp.to_serial = "";
    sp.qty = 1;
    sp.serials = [];
  }
  sp[field] = value;
  updated[index] = sp;
  setSpareparts(updated);
};

const addSparepart = () => {
  setSpareparts((prev) => [
    ...prev,
    {
      id: null,
         isNew: true, 
      sparepart_id: "",
      qty: 1,
      warranty_status: "Active",
      product_id: "",
      from_serial: "",
      to_serial: "",
      // serials: [],   // <-- add this
    },
  ]);
};
 
const removeSparepart = (index) => {
  const updated = [...spareparts];
  const removed = updated[index];

  if (removed?.id) {
    // track for backend deletion
    setDeletedSparepartIds((prev) => [...prev, removed.id]);
  }

  updated.splice(index, 1);
  setSpareparts(updated);

  // cleanup validation errors
  setErrors((prev) => {
    const items = { ...(prev.items || {}) };
    if (items[index]) delete items[index];
    return { ...prev, items };
  });
};

const canDeleteRow = (sp) => {
  // If row is new → can delete
  if (!sp.id) return true;

  // Find matching original item(s) by sparepart + product
  const original = initialItems.find(
    (i) =>
      i.sparepart_id === sp.sparepart_id &&
      i.product_id === sp.product_id
  );

  if (!original) return true; // fallback

  // Only allow delete if original warranty is inactive OR original qty === 0
  const warranty = (original.warranty_status || "").toLowerCase().trim();
  const qty = Number(original.quantity || 0);

  return warranty !== "active" || qty === 0;
};


 
  // ---------- validate + submit ----------
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
        // check range correctness
        // if (sp.from_serial && sp.to_serial) {
        //   const est = estimateQtyFromRange(sp.from_serial, sp.to_serial);
        //   if (est === null) itemErr.from_serial = itemErr.to_serial = "Invalid serial range";
        //   else if (Number(sp.qty) !== est) itemErr.qty = `Qty mismatch. Expected ${est}`;
        // }
      }
      if (!sp.qty || Number(sp.qty) < 1) itemErr.qty = "Quantity must be at least 1";
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

    const productIds = {};
  for (let sp of spareparts) {
    const type = sparepartTypeOf(sp.sparepart_id);
    if (type.includes("serial") && sp.product_id) {
      if (productIds[sp.product_id]) {
        toast.error(`Product already selected for another row: ${sp.product_id}`);
        return; // Stop submission
      }
      productIds[sp.product_id] = true;
    }
  }
 
const items = spareparts.map((sp) => {
  const serials = (sp.serials || []).filter(Boolean);
  return {
    id: sp.id,
    sparepart_id: sp.sparepart_id,
    product_id: sp.product_id || null,
    from_serial: serials.length > 0 ? sp.from_serial : null,
    to_serial: serials.length > 0 ? sp.to_serial : null,
    serials,
    warranty_status: sp.warranty_status || null,
    quantity: serials.length > 0 ? serials.length : Number(sp.qty) || 0,
  };
});

console.log(`items`, items);


// Tell backend which items were removed
const deleted_ids = initialItems
  .map(i => i.id)
  .filter(Boolean)
  .filter(id => !items.some(it => it.id === id) && !deletedSparepartIds.includes(id));
  // exclude ones that are already in sparepart delete

const payload = {
  vendor_id: vendorId,
  challan_no: challanNo,
  challan_date: challanDate,
  items,
  deleted_ids,               // only normal item deletes
  deleted_sparepart_ids: deletedSparepartIds,

};


console.log(`payload`, payload);


  try {
    const res = await axios.put(
      `http://localhost:8000/api/purchaseUpdate/${purchaseKey}`,
      payload
    );
    toast.success("Purchase updated successfully!");
    console.log(res.data);
      navigate("/spare-partsPurchase");
  // } catch (err) {
  //   if (err.response?.data?.errors) {
  //     setErrors(err.response.data.errors);
  //     toast.error("Please fix the errors below");
  //   } else {
  //     toast.error("Something went wrong!");
  //   }
  // }

  } catch (err) {
  if (err.response?.data?.errors) {
    setErrors(err.response.data.errors);

    const errors = err.response.data.errors;

    // Loop through each error field
    Object.keys(errors).forEach((field) => {
      const fieldErrors = errors[field];
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((msg) => toast.error(msg));
      } else if (typeof fieldErrors === "string") {
        toast.error(fieldErrors);
      }
    });
  } else {
    toast.error("Something went wrong!");
    console.error(err);
  }
}

};
 
  // if (loading) return <Spinner animation="border" />;
 
  const feedbackStyle = { color: "red", fontSize: "0.85rem", marginTop: "4px" };
  const serialInputStyle = { background: "#e9ecef" }; // light gray box
 
  return (
    <div className="container-fluid p-4" style={{ background: "white", minHeight: "100vh" }}>
      <ToastContainer />
      <h5 className="mb-3">Edit Spareparts Purchase</h5>
 
      {/* Purchase Details */}
      <Card className="mb-3" style={{ background: "#f1f3f5", borderRadius: 6 }}>
        <Card.Body>
          <h6 className="mb-3">Purchase Details</h6>
 
          <Row className="mb-2">
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Vendor*</Form.Label>
                <Form.Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                  <option value="">Select Vendor</option>
                  {availableVendors.map((v) =>
                    v.contact_persons?.length > 0
                      ? v.contact_persons.map((c, idx) => (
                          <option key={`${v.id}-${c.id}`} value={v.id}>
                            {v.vendor} – {c.name} {idx === 0 ? " (Main person)" : ""}
                          </option>
                        ))
                      : (
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
                <Form.Control type="text" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} placeholder="Enter Challan No" />
                {errors.challan_no && <div style={feedbackStyle}>{errors.challan_no}</div>}
              </Form.Group>
            </Col>
 
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Challan Date</Form.Label>
                <Form.Control type="date" value={challanDate} onChange={(e) => setChallanDate(e.target.value)} />
                {errors.challan_date && <div style={feedbackStyle}>{errors.challan_date}</div>}
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
 
      {/* Sparepart Items (grouped -> single row per sparepart) */}
      {spareparts.map((sp, idx) => {
        const type = sparepartTypeOf(sp.sparepart_id);
        return (
          <Card key={idx} className="mb-3" style={{ background: "#f1f3f5", borderRadius: 6 }}>
            <Card.Body>
              <Row className="mb-2 align-items-center">
                <Col>
                  <h6 className="mb-0">Sparepart Details</h6>
                </Col>
                <Col xs="auto">
                  {/* <Button variant="danger" size="sm" onClick={() => removeSparepart(idx)}>
                    <i className="bi bi-trash" />
                  </Button> */}

<Col xs="auto">
  {sp.isNew && (
    <Button
      variant="danger"
      size="sm"
      onClick={() => handleRemoveRow(idx, sp)}
    >
      🗑️
    </Button>
  )}
</Col>





                </Col>
              </Row>
 
           {/* Sparepart Item Row */}
<Row className="align-items-end mb-2">
  {/* Spareparts dropdown */}
  <Col md={4}>
    <Form.Group className="mb-2">
      <Form.Label>Spareparts</Form.Label>
      <Form.Select
        value={sp.sparepart_id}
        onChange={(e) => handleSparepartChange(idx, e.target.value)}
      >
        <option value="">Select Sparepart</option>
        {availableSpareparts.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Form.Select>
      {errors.items?.[idx]?.sparepart_id && (
        <div style={feedbackStyle}>{errors.items[idx].sparepart_id}</div>
      )}
    </Form.Group>
  </Col>
 
  {/* --- Serial Based --- */}
  {type.includes("serial") && (
    <>
      {/* Product + fetch serials */}
      <Col md={4}>
        <Form.Group className="mb-2">
          <Form.Label>Product</Form.Label>
          <div className="d-flex">
            <Form.Select
              className="flex-grow-1"
              value={sp.product_id}
              onChange={(e) => handleInputChange(idx, "product_id", e.target.value)}
            >
              <option value="">Select Product</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
            <Button
              title="Fetch Serials"
              onClick={() => fetchAvailableSerials(idx)}
              size="sm"
              variant="outline-primary"
              className="ms-2"
            >
              <i className="bi bi-cloud-download" />
            </Button>
          </div>
          {errors.items?.[idx]?.product_id && (
            <div style={feedbackStyle}>{errors.items[idx].product_id}</div>
          )}
        </Form.Group>
      </Col>
 
      {/* From Serial */}
      <Col md={4}>
        <Form.Group className="mb-2">
          <Form.Label>From Serial</Form.Label>
          <Form.Control
            type="text"
            value={sp.from_serial}
            onChange={(e) => handleInputChange(idx, "from_serial", e.target.value)}
            style={serialInputStyle}
          />
          {errors.items?.[idx]?.from_serial && (
            <div style={feedbackStyle}>{errors.items[idx].from_serial}</div>
          )}
        </Form.Group>
      </Col>
 
      {/* To Serial */}
      <Col md={4}>
        <Form.Group className="mb-2">
          <Form.Label>To Serial</Form.Label>
          <Form.Control
            type="text"
            value={sp.to_serial}
            onChange={(e) => handleInputChange(idx, "to_serial", e.target.value)}
            style={serialInputStyle}
          />
          {errors.items?.[idx]?.to_serial && (
            <div style={feedbackStyle}>{errors.items[idx].to_serial}</div>
          )}
        </Form.Group>
      </Col>
 
      {/* Quantity */}
      <Col md={4}>
        <Form.Group className="mb-2">
          <Form.Label>Quantity</Form.Label>
          <Form.Control
            type="number"
            value={sp.qty}
            onChange={(e) => handleInputChange(idx, "qty", e.target.value)}
          />
          {errors.items?.[idx]?.qty && (
            <div style={feedbackStyle}>{errors.items[idx].qty}</div>
          )}
        </Form.Group>
      </Col>
 
      {/* Warranty */}
      <Col md={4}>
        <Form.Group className="mb-2">
          <Form.Label>Warranty</Form.Label>
          <Form.Select
            value={sp.warranty_status}
            onChange={(e) => handleInputChange(idx, "warranty_status", e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Form.Select>
          {errors.items?.[idx]?.warranty_status && (
            <div style={feedbackStyle}>{errors.items[idx].warranty_status}</div>
          )}
        </Form.Group>
      </Col>
    </>
  )}
 
  {/* --- Warranty Based --- */}
  {type.includes("warranty") && (
    <>
      {/* Quantity */}
      <Col md={4}>
        <Form.Group className="mb-2">
          <Form.Label>Quantity</Form.Label>
          <Form.Control
            type="number"
            value={sp.qty}
            onChange={(e) => handleInputChange(idx, "qty", e.target.value)}
          />
          {errors.items?.[idx]?.qty && (
            <div style={feedbackStyle}>{errors.items[idx].qty}</div>
          )}
        </Form.Group>
      </Col>
 
      {/* Warranty */}
      <Col md={4}>
        <Form.Group className="mb-2">
          <Form.Label>Warranty</Form.Label>
          <Form.Select
            value={sp.warranty_status}
            onChange={(e) => handleInputChange(idx, "warranty_status", e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Form.Select>
          {errors.items?.[idx]?.warranty_status && (
            <div style={feedbackStyle}>{errors.items[idx].warranty_status}</div>
          )}
        </Form.Group>
      </Col>
    </>
  )}
 
  {/* --- Quantity Based --- */}
  {type.includes("quantity") && (
    <Col md={4}>
      <Form.Group className="mb-2">
        <Form.Label>Quantity</Form.Label>
        <Form.Control
          type="number"
          value={sp.qty}
          onChange={(e) => handleInputChange(idx, "qty", e.target.value)}
        />
        {errors.items?.[idx]?.qty && (
          <div style={feedbackStyle}>{errors.items[idx].qty}</div>
        )}
      </Form.Group>
    </Col>
  )}
</Row>
 
            </Card.Body>
          </Card>
        );
      })}
 
      {/* Buttons */}
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
 
 
<SerialSelectionModal
  show={showModal}
  availableSerials={modalSerials}  // <-- use the fetched serials
  // selectedSerials={spareparts[modalIndex]?.serials || []}
    // selectedSerials={modalIndex !== null ? spareparts[modalIndex]?.serials || [] : []}
      selectedSerials={modalIndex !== null ? (spareparts[modalIndex]?.serials || []).filter(Boolean) : []}

  onConfirm={handleSerialConfirm}  // <-- apply selected serials to the row
  onClose={() => setShowModal(false)}
/>
 
 
 
 
    </div>
  );
}
 
 