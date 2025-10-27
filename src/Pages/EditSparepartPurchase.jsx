import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col, Card, Spinner } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import SerialSelectionModal from "./SerialSelectionModal";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

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
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [initialItems, setInitialItems] = useState([]);

  const [modalIndex, setModalIndex] = useState(null);
  const [modalSerials, setModalSerials] = useState([]);
  const [deletedSparepartIds, setDeletedSparepartIds] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);
  const [receivedDate, setReceivedDate] = useState("");
  const [documentRecipient, setDocumentRecipient] = useState("");
  const [documentChallan1, setDocumentChallan1] = useState("");
  const [documentChallan2, setDocumentChallan2] = useState("");
  const [documentRecipientFile, setDocumentRecipientFile] = useState(null);
  const [documentChallan1File, setDocumentChallan1File] = useState(null);
  const [documentChallan2File, setDocumentChallan2File] = useState(null);

  const MySwal = withReactContent(Swal);

  const navigate = useNavigate();


  const [currentIndex, setCurrentIndex] = useState(null);
  const { id } = useParams();
  const purchaseKey = purchaseId || id;

  // Helper: Parse serial into prefix and number
  const parseSerial = (serial) => {
    if (!serial) return { prefix: "", num: null, orig: "" };
    const match = serial.match(/^(.*?)(\d+)$/);
    return {
      prefix: match?.[1] || "",
      num: match?.[2] ? parseInt(match[2], 10) : null,
      orig: serial,
    };
  };
  const buildSerial = (prefix, num, pad) => {
    if (num === null || num === undefined) return prefix;
    const nStr = String(num).padStart(pad || 0, "0");
    return `${prefix}${nStr}`;
  };

  const validateSerialPrefix = (serial, productId) => {
    if (!serial || !productId) return null;

    const product = availableCategories.find(c => c.id === productId);
    if (!product) return null;

    let series = (product.seriesPrefix || product.series || "").toString().trim();
    series = series.replace(/[-\s]/g, "").toLowerCase();

    const parsed = parseSerial(serial);

    const numericPrefix = series.match(/^\d+/)?.[0] || null;

    if (numericPrefix) {
      if (!String(parsed.num || "").startsWith(numericPrefix)) {
        toast.error(`Serial ${serial} does not match numeric product series (${series})`);
        return false;
      }
    } else {
      if (!parsed.prefix.toLowerCase().startsWith(series.toLowerCase())) {
        toast.error(`Serial ${serial} does not match product prefix (${series})`);
        return false;
      }
    }

    return true;
  };

  const isSerialMatchingProduct = (serial, productSeries) => {
    if (!serial || !productSeries) return true; // skip empty
    const parsed = parseSerial(serial);

    if (/^\d+$/.test(productSeries)) {
      return String(parsed.num || serial).startsWith(productSeries);
    }

    return parsed.prefix.toLowerCase().startsWith(productSeries.toLowerCase());
  };

  const computeRangeFromSerials = (serials = []) => {
    if (!serials || serials.length === 0) return { from_serial: "", to_serial: "" };
    const uniq = Array.from(new Set(serials.filter(Boolean)));
    const parsed = uniq.map((s) => parseSerial(s));

    // Sort all numeric serials together, ignore prefix grouping
    const numericGroup = parsed.filter(p => p.num !== null);
    if (numericGroup.length > 0) {
      numericGroup.sort((a, b) => a.num - b.num);
      return {
        from_serial: numericGroup[0].orig,
        to_serial: numericGroup[numericGroup.length - 1].orig
      };
    }

    // Fallback lexicographic
    const sorted = uniq.sort();
    return { from_serial: sorted[0], to_serial: sorted[sorted.length - 1] };
  };


  const handleDeleteRow = (id) => {
    if (id) {
      // If item has an ID (existing in DB), track it for deletion
      setDeletedItems((prev) => [...prev, id]);
    }
    // Remove from UI state
    setRows((prev) => prev.filter((r) => r.id !== id));
  };
  const handleDelete = async (id, sp) => {
    if (!id) {
      // Item not saved in DB yet, just remove from frontend
      removeSparepart(spareparts.indexOf(sp));
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE_URL}/purchase-items/${purchaseKey}/${sp.id}`);
          toast.success("Product deleted successfully!");
          // Remove from frontend state
          removeSparepart(spareparts.indexOf(sp));
        } catch (error) {
          console.error(error);
          toast.error(error.response?.data?.error || "Failed to delete product!");
        }
      }
    });
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
    const type = sparepartTypeOf(sp.sparepart_id);

    if (!sp.sparepart_id || (type.includes("serial") && !sp.product_id)) {
      toast.error("Select sparepart and product first");
      return;
    }

    if (sp.from_serial && sp.to_serial && type.includes("serial")) {
      const serialList = [];
      const m1 = parseSerial(sp.from_serial);
      const m2 = parseSerial(sp.to_serial);

      if (!m1 || !m2 || m1.prefix !== m2.prefix || m1.num === null || m2.num === null || m2.num < m1.num) {
        toast.error("Invalid serial range");
        return;
      }

      for (let n = m1.num; n <= m2.num; n++) {
        const paddedNum = String(n).padStart(6, "0");
        serialList.push(`${m1.prefix}${paddedNum}`);
      }

      setModalSerials(serialList);   // <-- always update with current inputs
      setModalIndex(index);
      setShowModal(true);
      return;
    }

    // fallback: fetch from backend if no From/To range
    if (sp.id) {
      try {
        const res = await axios.get(`${API_BASE_URL}/available-serials`, {
          params: {
            purchase_id: purchaseKey,
            sparepart_id: sp.sparepart_id,
            product_id: sp.product_id,
          },
        });
        setModalSerials(res.data.serials || []);
        setModalIndex(index);
        setShowModal(true);
      } catch (err) {
        toast.error("Failed to fetch serials from backend");
      }
    }
  };





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
      sp.qty = cleanSelected.length;
    } else {
      sp.from_serial = "";
      sp.to_serial = "";
      sp.qty = 0;
    }

    updated[modalIndex] = sp;
    setSpareparts(updated);
    setShowModal(false);

    setErrors((prev) => {
      const items = { ...(prev.items || {}) };
      if (items[modalIndex]?.from_serial) delete items[modalIndex].from_serial;
      if (items[modalIndex]?.to_serial) delete items[modalIndex].to_serial;
      if (Object.keys(items[modalIndex] || {}).length === 0) delete items[modalIndex];
      return { ...prev, items };
    });
  };



  const handleRemoveRow = async (index, sp) => {
    if (sp?.sparepart_id) {
      try {
        await axios.delete(
          `${API_BASE_URL}/purchase-items/${purchaseKey}/${sp.sparepart_id}`
        );
        toast.success("spare part  deleted successfully");
      } catch (err) {
        toast.error("Failed to delete");
        console.error(err);
        return;
      }
    }

    // Remove from frontend state
    const updated = [...spareparts];
    updated.splice(index, 1);
    setSpareparts(updated);

    // Cleanup validation errors
    setErrors((prev) => {
      const items = { ...(prev.items || {}) };
      if (items[index]) delete items[index];
      return { ...prev, items };
    });
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [spareRes, purchaseRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/get-spareparts`),
          axios.get(`${API_BASE_URL}/${purchaseKey}/purchase/edit`),
        ]);

        setAvailableSpareparts(spareRes.data.spareparts || []);
        setAvailableVendors(spareRes.data.vendors || []);
        setAvailableCategories(spareRes.data.categories || []);

        const p = purchaseRes.data || {}; // or purchaseRes.data.purchase if wrapped
        setVendorId(p.vendor_id || "");
        setChallanNo(p.challan_no || "");
        setChallanDate(p.challan_date || "");
        setReceivedDate(p.received_date || "");
        setDocumentRecipient(p.document_recipient || "");
        setDocumentChallan1(p.document_challan_1 || "");
        setDocumentChallan2(p.document_challan_2 || "");
        setInitialItems(p.items || []);


        const groups = {};
        (p.items || []).forEach((item) => {
          const key = `${item.sparepart_id}__${item.product_id || ""}__${item.warranty_status || "Active"}`;

          if (!groups[key]) {
            groups[key] = {
              sparepart_id: item.sparepart_id,
              product_id: item.product_id || "",
              warranty_status: item.warranty_status || "Active",
              serials: [],
              qty: 0,
              id: null, // we'll pick first item's ID later if needed
            };
          }
          if (item.serial_no) {
            if (!groups[key].serials.includes(item.serial_no)) {
              groups[key].serials.push(item.serial_no);
              groups[key].qty = groups[key].serials.length;
            }
          } else {
            groups[key].qty = item.quantity ? Number(item.quantity) : 0;
          }

          // save first ID as representative
          if (!groups[key].id && item.id) {
            groups[key].id = item.id;
          }
        });

        const mappedBackend = Object.values(groups).map((g) => {
          const from_serial = g.serials[0] || "";
          const to_serial = g.serials[g.serials.length - 1] || "";
          const qty = g.qty || (g.serials?.length || 1);

          return {
            id: g.id,
            sparepart_id: g.sparepart_id || "",
            product_id: g.product_id || "",
            qty,
            warranty_status: g.warranty_status || "Active",
            from_serial,
            to_serial,
            serials: g.serials?.filter(Boolean) || [],
          };
        });

        const newFrontendRows = spareparts.filter(
          (sp) =>
            !mappedBackend.some(
              (m) =>
                m.sparepart_id === sp.sparepart_id &&
                m.product_id === sp.product_id &&
                m.warranty_status === sp.warranty_status
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
    const sp = updated[index];

    if (sp.sparepart_id !== value) {
      // Changing to a completely new sparepart
      sp.sparepart_id = value;
      sp.qty = 1;

      // Only reset product and serials if needed
      sp.product_id = "";
      sp.from_serial = "";
      sp.to_serial = "";
      sp.serials = [];
    }

    updated[index] = sp;
    setSpareparts(updated);
  };


  const validateSerialRange = (from, to, productSeries) => {
    if (!from || !to || !productSeries) return null;

    const m1 = parseSerial(from);
    const m2 = parseSerial(to);

    if (m1.num === null || m2.num === null) return "Serial numeric part missing";

    if (m1.prefix !== m2.prefix) return "Serial prefix mismatch";

    if (!isSerialMatchingProduct(m1.orig, productSeries) || !isSerialMatchingProduct(m2.orig, productSeries)) {
      return `Serial does not match product series (${productSeries})`;
    }

    // if (m2.num < m1.num) return "From Serial cannot be greater than To Serial";

    if (!/^\d{6}$/.test(String(m1.num)) || !/^\d{6}$/.test(String(m2.num))) {
      return "Serial numeric part must be 6 digits";
    }

    return null;
  };

  const handleInputChange = (index, field, value) => {
    const type = sparepartTypeOf(spareparts[index].sparepart_id);
    const updated = [...spareparts];

    if (type.includes("serial") && (field === "from_serial" || field === "to_serial")) {
      const productId = updated[index].product_id;

      if (!productId) {
        toast.error("Please choose product first");
        updated[index][field] = "";
        setSpareparts(updated);
        return;
      }

      const product = availableCategories.find(p => String(p.id) === String(productId));
      const seriesPrefix = (product?.seriesPrefix || product?.series || "").replace(/[-\s]/g, "");

      // Only keep prefix + numeric digits
      if (!value.startsWith(seriesPrefix)) {
        toast.error(`Serial must start with product prefix (${seriesPrefix})`);
        return; // Block typing invalid prefix
      }

      let numericPart = value.slice(seriesPrefix.length).replace(/\D/g, "").slice(0, 6);
      updated[index][field] = seriesPrefix + numericPart;

      const fromSerial = updated[index].from_serial;
      const toSerial = updated[index].to_serial;

      if (fromSerial && toSerial) {
        const prefixFrom = fromSerial.slice(0, seriesPrefix.length);
        const prefixTo = toSerial.slice(0, seriesPrefix.length);

        if (prefixFrom !== prefixTo) {
          toast.error("From Serial and To Serial must start with the same prefix");
        }

        // const fromNum = parseInt(fromSerial.slice(seriesPrefix.length), 10);
        // const toNum = parseInt(toSerial.slice(seriesPrefix.length), 10);

        // if (!isNaN(fromNum) && !isNaN(toNum) && fromNum > toNum) {
        //   toast.error("From Serial must be less than or equal to To Serial");
        // }
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






  const addSparepart = () => {
    setSpareparts((prev) => [
      ...prev,
      {
        id: null,
        rowKey: Date.now(),
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

    // Track deleted sparepart IDs only if it exists in DB
    if (removed?.id) {
      setDeletedSparepartIds((prev) => [...prev, removed.id]);
    }

    // Remove the row from state
    updated.splice(index, 1);
    setSpareparts(updated);

    // Cleanup validation errors for that index
    setErrors((prev) => {
      const items = { ...(prev.items || {}) };
      if (items[index]) delete items[index];

      // Re-index remaining errors
      const reIndexed = {};
      Object.keys(items).forEach((key) => {
        const k = parseInt(key, 10);
        if (k < index) reIndexed[k] = items[key];
        else if (k > index) reIndexed[k - 1] = items[key];
      });

      return { ...prev, items: reIndexed };
    });
  };


  // const canDeleteRow = (sp) => {
  //   // If row is new → can delete
  //   if (!sp.id) return true;

  //   // Find matching original item(s) by sparepart + product
  //   const original = initialItems.find(
  //     (i) =>
  //       i.sparepart_id === sp.sparepart_id &&
  //       i.product_id === sp.product_id
  //   );

  //   if (!original) return true; // fallback

  //   // Only allow delete if original warranty is inactive OR original qty === 0
  //   const warranty = (original.warranty_status || "").toLowerCase().trim();
  //   const qty = Number(original.quantity || 0);

  //   return warranty !== "active" || qty === 0;
  // };





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

      if (sp.from_serial && sp.to_serial) {
        const m1 = parseSerial(sp.from_serial);
        const m2 = parseSerial(sp.to_serial);

        if (m2.num < m1.num) {
          itemErr.from_serial = "From Serial must be less than or equal to To Serial";
          itemErr.to_serial = "From Serial must be less than or equal to To Serial";
        }

        if (!/^\d{6}$/.test(String(m1.num)) || !/^\d{6}$/.test(String(m2.num))) {
          itemErr.from_serial = "From Serial must have exactly 6 digits after prefix";
          itemErr.to_serial = "To Serial must have exactly 6 digits after prefix";
        }

        const productData = availableCategories.find(c => c.id === sp.product_id);
        const prefix = (productData?.seriesPrefix || productData?.series || "").replace(/[-\s]/g, "");
        if (!sp.from_serial.startsWith(prefix) || !sp.to_serial.startsWith(prefix)) {
          itemErr.from_serial = `Serial must start with product prefix (${prefix})`;
          itemErr.to_serial = `Serial must start with product prefix (${prefix})`;
        }
      }
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

    const payload = {
      vendor_id: vendorId,
      challan_no: challanNo,
      challan_date: challanDate,
      received_date: receivedDate,
      items: spareparts.map(sp => ({
        id: sp.id,
        sparepart_id: sp.sparepart_id,
        product_id: sp.product_id || null,
        from_serial: sp.serials?.length ? sp.from_serial : null,
        to_serial: sp.serials?.length ? sp.to_serial : null,
        serials: sp.serials?.filter(Boolean) || [],
        warranty_status: sp.warranty_status || null,
        quantity: sp.serials?.length ? sp.serials.length : Number(sp.qty) || 0
      })),
      deleted_ids: initialItems.map(i => i.id).filter(Boolean).filter(id => !spareparts.some(it => it.id === id) && !deletedSparepartIds.includes(id)),
      deleted_sparepart_ids: deletedSparepartIds,
      deleted_item_ids: deletedItemIds
    };

    try {
      const res = await axios.put(`${API_BASE_URL}/purchaseUpdate/${purchaseKey}`, payload);
      toast.success("Purchase updated successfully!");
      navigate("/spare-partsPurchase");
    } catch (err) {
      console.error(err);

      const backendError =
        err.response?.data?.errors?.items?.[0] ||  // Laravel validation-style error
        err.response?.data?.message ||            // Custom message
        "Failed to update purchase";              // Default fallback

      toast.error(backendError);
    }
  }



  const feedbackStyle = { color: "red", fontSize: "0.85rem", marginTop: "4px" };
  const serialInputStyle = { background: "#e9ecef" }; // light gray box

  return (
    <div className="container-fluid " style={{ background: "#F4F4F8", minHeight: "100vh", position: "relative" }}>
      <Row className="align-items-center mb-3 fixed-header">
        <Col>
          <h4>Edit Purchase Details</h4>
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
              <Form.Group className="mb-2">
                <Form.Label>
                  Vendor<span style={{ color: "red" }}> *</span>
                </Form.Label>

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
                <Form.Label>
                  Challan No<span style={{ color: "red" }}> *</span>
                </Form.Label>

                <Form.Control type="text" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} placeholder="Enter Challan No" />
                {errors.challan_no && <div style={feedbackStyle}>{errors.challan_no}</div>}
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>
                  Challan Date<span style={{ color: "red" }}> *</span>
                </Form.Label>

                <Form.Control type="date" value={challanDate} onChange={(e) => setChallanDate(e.target.value)} />
                {errors.challan_date && <div style={feedbackStyle}>{errors.challan_date}</div>}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Received Date</Form.Label>
                <Form.Control
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Document Recipient</Form.Label>
                <div className="input-group">
                  {/* Button on the left side */}
                  <label className="btn btn-outline-secondary mb-0">
                    Choose File
                    <input
                      type="file"
                      onChange={(e) => setDocumentRecipientFile(e.target.files[0])}
                      hidden
                    />
                  </label>

                  {/* Text input showing file name */}
                  <Form.Control
                    type="text"
                    readOnly
                    value={
                      documentRecipientFile
                        ? documentRecipientFile.name
                        : documentRecipient
                          ? documentRecipient.split("/").pop()
                          : ""
                    }
                  />
                </div>
              </Form.Group>
            </Col>



            {/* Document Challan 1 */}
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Document Challan 1</Form.Label>
                <div className="input-group">
                  <label className="btn btn-outline-secondary mb-0">
                    Choose File
                    <input
                      type="file"
                      onChange={(e) => setDocumentChallan1File(e.target.files[0])}
                      hidden
                    />
                  </label>
                  <Form.Control
                    type="text"
                    readOnly
                    value={
                      documentChallan1File
                        ? documentChallan1File.name
                        : documentChallan1
                          ? documentChallan1.split("/").pop()
                          : ""
                    }
                  />
                </div>
              </Form.Group>
            </Col>

            {/* Document Challan 2 */}
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Document Challan 2</Form.Label>
                <div className="input-group">
                  <label className="btn btn-outline-secondary mb-0">
                    Choose File
                    <input
                      type="file"
                      onChange={(e) => setDocumentChallan2File(e.target.files[0])}
                      hidden
                    />
                  </label>
                  <Form.Control
                    type="text"
                    readOnly
                    value={
                      documentChallan2File
                        ? documentChallan2File.name
                        : documentChallan2
                          ? documentChallan2.split("/").pop()
                          : ""
                    }
                  />
                </div>
              </Form.Group>
            </Col>



          </Row>

        </Card.Body>
      </Card>

      {/* Sparepart Items (grouped -> single row per sparepart) */}
      {spareparts.map((sp, idx) => {
        const type = sparepartTypeOf(sp.sparepart_id);
        return (
          <Card key={idx} className="mb-3" style={{ background: "#F4F4F8", borderRadius: 6 }}>
            <Card.Body>
              <Row className="mb-2 align-items-center">
                <Col>
                  <h6 className="mb-0">Spare part Details</h6>
                </Col>
                <Col xs="auto">


                  <Col xs="auto">
                    <Button variant="danger" size="sm" onClick={() => handleDelete(sp.id, sp)}>
                      <i className="bi bi-trash"></i>
                    </Button>

                  </Col>


                </Col>
              </Row>

              {/* Sparepart Item Row */}
              <Row className="align-items-end mb-2">
                {/* Spareparts dropdown */}
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Spare parts</Form.Label>
                    <Form.Select
                      value={sp.sparepart_id}
                      onChange={(e) => handleSparepartChange(idx, e.target.value)}
                    >
                      <option value="">Select Spare part</option>
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
                            value={sp.product_id || ""}
                            onChange={(e) => handleInputChange(idx, "product_id", e.target.value)}
                          >
                            <option value="">Select Product</option>
                            {availableCategories.map((cat) => (
                              <option key={cat.id} value={String(cat.id)}>
                                {cat.series} {cat.name ? `${cat.name}` : ""}
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
                          min={1}
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
                )
                }

                {/* --- Warranty Based --- */}
                {
                  type.includes("warranty") && (
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
                  )
                }

                {/* --- Quantity Based --- */}
                {
                  type.includes("quantity") && (
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          value={sp.qty}
                          onChange={(e) => handleInputChange(idx, "qty", e.target.value)}
                        />
                        {errors.items?.[idx]?.qty && (
                          <div style={feedbackStyle}>{errors.items[idx].qty}</div>
                        )}
                      </Form.Group>
                    </Col>
                  )
                }
              </Row>

            </Card.Body >
          </Card >
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
            Update
          </Button>
        </div>
      </div>
      <SerialSelectionModal
        show={showModal}
        availableSerials={modalSerials}
        selectedSerials={
          modalIndex !== null
            ? (spareparts[modalIndex]?.serials || []).filter(s => modalSerials.includes(s)) // only current serial range
            : []
        }
        onConfirm={handleSerialConfirm}
        onClose={() => setShowModal(false)}
      />
    </div >
  );
}