import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col, Card, Spinner } from "react-bootstrap";
import api, { setAuthToken, API_BASE_URL } from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useParams } from "react-router-dom";
import SerialSelectionModal from "./SerialSelectionModal";
import { useNavigate } from "react-router-dom";
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
  const [trackingNumber, setTrackingNumber] = useState("");
  const [recipientFiles, setRecipientFiles] = useState([null]);
  const [courier_name, setCourierName] = useState("");
  // const [challanFiles, setChallanFiles] = useState([null]);

  const [initialItems, setInitialItems] = useState([]);

  const [modalIndex, setModalIndex] = useState(null);
  const [modalSerials, setModalSerials] = useState([]);
  const [deletedSparepartIds, setDeletedSparepartIds] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);
  const [receivedDate, setReceivedDate] = useState("");

  // const [existingChallanFiles, setExistingChallanFiles] = useState([]); 
  const [removedFiles, setRemovedFiles] = useState({
    recipient: [],
    // challan: [],
  });
  const [vendorIdOnly, contactPersonId] = String(vendorId || "").split("-");


  const MySwal = withReactContent(Swal);

  const navigate = useNavigate();


  const [currentIndex, setCurrentIndex] = useState(null);
  const { id } = useParams();
  const purchaseKey = purchaseId || id;

  const parseSerial = (serial) => {
    if (!serial) return { prefix: "", num: null, orig: "" };
    const match = serial.match(/^(.*?)(\d+)$/);
    return {
      prefix: match?.[1] || "",
      num: match?.[2] ? parseInt(match[2], 10) : null,
      orig: serial,
    };
  };
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
  }, []);

  const isPreviousRowComplete = (prevRow) => {
    if (!prevRow || !prevRow.sparepart_id) return false;

    const type = sparepartTypeOf(prevRow.sparepart_id);

    if (type.includes("serial")) {
      return (
        prevRow.from_serial &&
        prevRow.to_serial &&
        prevRow.qty > 0
      );
    }

    // quantity or warranty based
    return prevRow.qty > 0;
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



  const handleDelete = async (id, sp) => {
    // ❗ Prevent deleting last row
    if (spareparts.length === 1) {
      toast.error("At least one spare part is required.");
      return;
    }

    MySwal.fire({
      title: "Are you sure?",
      text: "This will delete the item!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        // If item is not saved in backend → delete locally
        if (!id) {
          removeSparepart(spareparts.indexOf(sp));
          toast.success("Item removed!");
          return;
        }

        // If saved → delete from backend
        await api.delete(`/purchase-items/${purchaseKey}/${id}`);

        // Remove from UI
        removeSparepart(spareparts.indexOf(sp));

        toast.success("Item deleted!");
      } catch (error) {
        toast.error("Failed to delete item!");
        console.error(error);
      }
    });
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
        const res = await api.get(`/available-serials`, {
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



  // const handleRemoveRow = async (index, sp) => {
  //   if (sp?.sparepart_id) {
  //     try {
  //       await axios.delete(
  //         `${API_BASE_URL}/purchase-items/${purchaseKey}/${sp.sparepart_id}`
  //       );
  //       toast.success("spare part  deleted successfully");
  //     } catch (err) {
  //       toast.error("Failed to delete");
  //       console.error(err);
  //       return;
  //     }
  //   }

  //   // Remove from frontend state
  //   const updated = [...spareparts];
  //   updated.splice(index, 1);
  //   setSpareparts(updated);

  //   // Cleanup validation errors
  //   setErrors((prev) => {
  //     const items = { ...(prev.items || {}) };
  //     if (items[index]) delete items[index];
  //     return { ...prev, items };
  //   });
  // };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [spareRes, purchaseRes] = await Promise.all([
          api.get(`/get-spareparts`),
          api.get(`/${purchaseKey}/purchase/edit`),
        ]);

        setAvailableSpareparts(spareRes.data.spareparts || []);
        setAvailableVendors(spareRes.data.vendors || []);
        setAvailableCategories(spareRes.data.categories || []);

        const p = purchaseRes.data || {}; // or purchaseRes.data.purchase if wrapped
        setVendorId(p.vendor_id || "");
        // setVendorId(`${p.vendor_id}-${p.contact_person_id || 0}`);
        setChallanNo(p.challan_no || "");
        const convertToInputDate = (dateStr) => {
          if (!dateStr) return "";
          const [d, m, y] = dateStr.split("-");
          return `${y}-${m}-${d}`;
        };

        setChallanDate(convertToInputDate(p.challan_date) || "");
        setReceivedDate(convertToInputDate(p.received_date) || "");
        setTrackingNumber(p.tracking_number || "");
        setCourierName(p.courier_name || "");
        // Map backend arrays to local state
        // setRecipientFiles(
        //   Array.isArray(p.document_recipient) ? p.document_recipient : []
        // );
        // setChallanFiles(
        //   Array.isArray(p.document_challan) ? p.document_challan : []
        // );

        setRecipientFiles(
          Array.isArray(p.document_recipient) && p.document_recipient.length > 0
            ? p.document_recipient
            : [null]   // 👈 add one empty input by default
        );

        // setChallanFiles(
        //   Array.isArray(p.document_challan) && p.document_challan.length > 0
        //     ? p.document_challan
        //     : [null]   
        // );


        // Also keep existing files separately for display/download
        // setExistingChallanFiles(
        //   Array.isArray(p.document_challan) ? p.document_challan : []
        // );

        setInitialItems(p.items || []);

        const groups = [];

        (p.items || []).forEach((item) => {
          const spareId = item.sparepart_id;
          const productId = item.product_id || "";
          const warranty = item.warranty_status || "Active";

          // Find if an existing group can continue (only if contiguous serials)
          let targetGroup = null;

          if (item.serial_no) {
            const serial = item.serial_no;

            for (const g of groups) {
              if (
                g.sparepart_id === spareId &&
                g.product_id === productId &&
                g.warranty_status === warranty
              ) {
                const lastSerial = g.serials[g.serials.length - 1];
                const parsedLast = parseSerial(lastSerial);
                const parsedCurr = parseSerial(serial);

                if (
                  parsedLast.prefix === parsedCurr.prefix &&
                  parsedCurr.num === parsedLast.num + 1
                ) {
                  targetGroup = g;
                  break;
                }
              }
            }
          }

          if (!targetGroup) {
            targetGroup = {
              sparepart_id: spareId,
              product_id: productId,
              warranty_status: warranty,
              serials: [],
              qty: 0,
              ids: [],
            };
            groups.push(targetGroup);
          }

          if (item.serial_no) {
            if (!targetGroup.serials.includes(item.serial_no)) {
              targetGroup.serials.push(item.serial_no);
            }
            targetGroup.qty = targetGroup.serials.length;
          } else {
            targetGroup.qty += Number(item.quantity) || 0;
          }

          if (item.id) targetGroup.ids.push(item.id);
        });


        const mappedBackend = groups.map((g) => {
          const from_serial = g.serials[0] || "";
          const to_serial = g.serials[g.serials.length - 1] || "";
          return {
            id: g.id,
            sparepart_id: g.sparepart_id,
            product_id: g.product_id,
            qty: g.qty,
            warranty_status: g.warranty_status,
            from_serial,
            to_serial,
            serials: g.serials || [],
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
                qty: "",
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

  // Add file field dynamically
  const addFileField = (type) => {
    if (type === "recipient") setRecipientFiles((prev) => [...prev, null]);
    // if (type === "challan") setChallanFiles((prev) => [...prev, null]);
  };

  const removeFileField = (type, index) => {
    let updated;

    if (type === "recipient") {
      updated = [...recipientFiles];
    }

    const removedFile = updated[index];

    // Store removed backend file names
    if (typeof removedFile === "string") {
      setRemovedFiles((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), removedFile],
      }));
    }

    // Remove from array
    updated.splice(index, 1);

    // If user removes all → keep 1 empty input
    if (updated.length === 0) {
      updated = [null];
    }

    if (type === "recipient") setRecipientFiles(updated);
  };





  // const handleRemoveFile = (fileName) => {
  //   setRemovedFiles((prev) => [...prev, fileName]);
  // };


  const handleFileChange = (type, index, file) => {
    if (type === "recipient") {
      const updated = [...recipientFiles];
      updated[index] = file;
      setRecipientFiles(updated);
    } else if (type === "challan") {
      // const updated = [...challanFiles];
      // updated[index] = file;
      // setChallanFiles(updated);
    }

  };



  const sparepartTypeOf = (id) => {
    if (!id) return "";
    const s = availableSpareparts.find((x) => String(x.id) === String(id));
    return (s?.sparepart_type || s?.part_type || "").toString().toLowerCase();
  };



  const handleSparepartChange = (index, value) => {
    const updated = [...spareparts];
    updated[index].sparepart_id = value;

    // reset dependent fields
    updated[index].from_serial = "";
    updated[index].to_serial = "";
    updated[index].qty = "";

    setSpareparts(updated);

    // 🔥 clear error
    clearItemError(index, "sparepart_id");
  };



  const handleInputChange = (index, field, value) => {

    clearItemError(index, field);

    if (field === "from_serial" || field === "to_serial") {
      clearItemError(index, "from_serial");
      clearItemError(index, "to_serial");
    }

    const updated = [...spareparts];

    const isSerial = field === "from_serial" || field === "to_serial";

    if (isSerial) {
      // allow digits only
      value = value.replace(/\D/g, "").slice(0, 6);

      updated[index][field] = value;

      const from = updated[index].from_serial;
      const to = updated[index].to_serial;

      const fromNum = Number(from);
      const toNum = Number(to);

      // auto calculate qty
      if (!isNaN(fromNum) && !isNaN(toNum) && fromNum <= toNum) {
        updated[index].qty = toNum - fromNum + 1;
        clearItemError(index, "qty");   // 🔥 remove qty error
      } else {
        updated[index].qty = "";
      }

      setSpareparts(updated);
      return;
    }

    // non-serial fields
    updated[index][field] = value;

    // if qty changes → clear qty error
    if (field === "qty") {
      clearItemError(index, "qty");
    }

    setSpareparts(updated);
  };




  // 🆕 Automatically rebuild serial range when from_serial / to_serial change
  useEffect(() => {
    const updated = [...spareparts];
    let changed = false;

    updated.forEach((sp, idx) => {
      const type = sparepartTypeOf(sp.sparepart_id);
      if (!type.includes("serial")) return;

      const { from_serial, to_serial } = sp;
      if (from_serial && to_serial) {
        const m1 = parseSerial(from_serial);
        const m2 = parseSerial(to_serial);

        if (m1.num !== null && m2.num !== null && m2.num >= m1.num) {
          const newSerials = [];
          for (let n = m1.num; n <= m2.num; n++) {
            const paddedNum = String(n).padStart(6, "0");
            newSerials.push(`${m1.prefix}${paddedNum}`);
          }

          if (JSON.stringify(sp.serials) !== JSON.stringify(newSerials)) {
            updated[idx] = { ...sp, serials: newSerials, qty: newSerials.length };
            changed = true;
          }
        }
      }
    });

    if (changed) setSpareparts(updated);
  }, [spareparts.map(sp => `${sp.from_serial}-${sp.to_serial}`).join("|")]);





  const addSparepart = () => {
    // If no spareparts yet → allow first row
    if (spareparts.length === 0) {
      setSpareparts([
        {
          id: null,
          rowKey: Date.now(),
          isNew: true,
          sparepart_id: "",
          qty: "",
          warranty_status: "Active",
          from_serial: "",
          to_serial: "",
          serials: [],
        }
      ]);
      return;
    }

    // Validate previous row
    const lastRow = spareparts[spareparts.length - 1];

    if (!isPreviousRowComplete(lastRow)) {
      toast.error("Please complete the previous spare part before adding another.");
      return; // ❌ STOP – do not add row
    }

    // If last row is complete → add new row
    setSpareparts(prev => [
      ...prev,
      {
        id: null,
        rowKey: Date.now(),
        isNew: true,
        sparepart_id: "",
        qty: "",
        warranty_status: "Active",
        from_serial: "",
        to_serial: "",
        serials: [],
      }
    ]);
  };


  const removeSparepart = (index) => {
    const updated = [...spareparts];
    const removed = updated[index];

    if (removed?.ids?.length) {
      setDeletedSparepartIds((prev) => [...prev, ...removed.ids]);
    } else if (removed?.id) {
      setDeletedSparepartIds((prev) => [...prev, removed.id]);
    }


    // Remove the row from state
    updated.splice(index, 1);
    setSpareparts(updated);

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

  const clearItemError = (index, field) => {
    setErrors(prev => {
      const items = { ...(prev.items || {}) };

      if (items[index]?.[field]) {
        delete items[index][field];
      }

      if (items[index] && Object.keys(items[index]).length === 0) {
        delete items[index];
      }

      return { ...prev, items };
    });
  };

  const validateForm = () => {
    const errs = {};

    // 🔥 Must have at least one sparepart row
    if (spareparts.length === 0) {
      toast.error("Please add at least one spare part before updating.");
      return false;
    }

    // 🔥 Must have at least one *valid* sparepart (not an empty row)
    const hasValidItem = spareparts.some(sp => sp.sparepart_id);
    if (!hasValidItem) {
      toast.error("Please complete at least one sparepart entry.");
      return false;
    }

    // Vendor Required
    if (!vendorId) errs.vendor_id = "Vendor is required";

    // Challan No Required
    if (!challanNo) errs.challan_no = "Challan No is required";

    // Challan Date Required
    if (!challanDate) errs.challan_date = "Challan Date is required";

    // Received Date Required
    if (!receivedDate) errs.received_date = "Received Date is required";

    if (challanDate && receivedDate) {
      const cd = new Date(challanDate);
      const rd = new Date(receivedDate);

      if (rd < cd) {
        errs.received_date = "Received Date cannot be before Challan Date";
      }
    }

    // Spareparts Validation
    const itemErrors = {};

    spareparts.forEach((sp, idx) => {
      const type = sparepartTypeOf(sp.sparepart_id);
      const itemErr = {};

      if (!sp.sparepart_id) itemErr.sparepart_id = "Sparepart is required";

      if (type.includes("serial")) {
        if (!sp.from_serial) itemErr.from_serial = "From Serial is required";
        if (!sp.to_serial) itemErr.to_serial = "To Serial is required";

        if (sp.from_serial && sp.to_serial) {
          const fromNum = Number(sp.from_serial);
          const toNum = Number(sp.to_serial);

          if (fromNum > toNum) {
            itemErr.from_serial = "From Serial must be <= To Serial";
            itemErr.to_serial = "From Serial must be <= To Serial";
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
    if (!validateForm()) {
      toast.error("Please fill the form correctly before submitting.");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("_method", "PUT");

      payload.append("vendor_id", String(vendorId || ""));
      payload.append("vendor_id", vendorIdOnly || "");
      payload.append(
        "contact_person_id",
        contactPersonId && contactPersonId !== "0" ? contactPersonId : ""
      );
      payload.append("challan_no", String(challanNo || ""));
      const formatDateForBackend = (dateStr) => (dateStr ? dateStr : "");
      payload.append("challan_date", formatDateForBackend(challanDate));
      payload.append("received_date", formatDateForBackend(receivedDate));
      payload.append("tracking_number", String(trackingNumber || ""));
      payload.append("courier_name", String(courier_name || ""));

      spareparts.forEach((sp, i) => {
        payload.append(`items[${i}][id]`, sp.id || "");
        payload.append(`items[${i}][sparepart_id]`, sp.sparepart_id || "");
        payload.append(`items[${i}][from_serial]`, sp.from_serial || "");
        payload.append(`items[${i}][to_serial]`, sp.to_serial || "");
        payload.append(`items[${i}][warranty_status]`, sp.warranty_status || "");
        payload.append(
          `items[${i}][quantity]`,
          sp.serials?.length ? sp.serials.length : Number(sp.qty) || 0
        );

        // ✅ Send serials as array
        (sp.serials || []).forEach((serial, j) => {
          payload.append(`items[${i}][serials][${j}]`, serial);
        });
      });

      deletedSparepartIds.forEach((id, i) => payload.append(`deleted_ids[${i}]`, id));

      if (recipientFiles && recipientFiles.length > 0) {
        recipientFiles.forEach((file, i) => {
          if (file instanceof File) {
            payload.append(`document_recipient[${i}]`, file);
          }
        });
      }

      payload.append(
        "removed_recipient_files",
        JSON.stringify(removedFiles.recipient || [])
      );

      const res = await api.post(
        `/purchaseUpdate/${purchaseKey}`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Purchase updated successfully!");
      navigate("/spare-partsPurchase");
    } catch (err) {
      console.error(err);

      const backendError =
        err.response?.data?.errors?.items?.[0] ||
        err.response?.data?.message ||
        "Failed to update purchase";

      toast.error(backendError);
    }
  };

  const feedbackStyle = { color: "red", fontSize: "0.85rem", marginTop: "4px" };
  const serialInputStyle = { background: "#e9ecef" }; // light gray box

  return (
    <div className="container-fluid " style={{ background: "#F4F4F8", minHeight: "100vh", position: "relative" }}>
      <Row className="align-items-center mb-3">
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

                <Form.Select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {availableVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendor}
                    </option>
                  ))}
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
                <Form.Label>
                  Received Date<span style={{ color: "red" }}> *</span>
                </Form.Label>

                <Form.Control
                  type="date"
                  value={receivedDate}
                  onChange={(e) => {
                    setReceivedDate(e.target.value);
                    setErrors((prev) => ({ ...prev, received_date: null })); // clear error
                  }}
                />

                {errors.received_date && (
                  <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                    {errors.received_date}
                  </div>
                )}
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Courier Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Courier Name"
                  value={courier_name}
                  onChange={(e) => setCourierName(e.target.value)}
                />
              </Form.Group>
            </Col>
            {/* Tracking Number */}
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Tracking Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Tracking Number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>
                  Receipt Documents
                  <Button
                    variant="link"
                    size="sm"
                    className="text-success ms-1 p-0"
                    onClick={() => addFileField("recipient")}
                    disabled={!recipientFiles[recipientFiles.length - 1]}
                  >
                    <i className="bi bi-plus-circle"></i> Add
                  </Button>

                  {!recipientFiles[recipientFiles.length - 1] && (
                    <small className="text-danger d-block"></small>
                  )}
                </Form.Label>

                {recipientFiles.map((file, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                    <div className="file-input-wrapper flex-grow-1 d-flex align-items-center border rounded overflow-hidden">
                      <label className="custom-file-label mb-0">
                        <span className="btn btn-outline-secondary btn-sm">
                          {idx > 0 && !recipientFiles[idx - 1] ? "Locked" : "Choose File"}
                        </span>

                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={idx > 0 && !recipientFiles[idx - 1]}  // ⛔ disable if previous is empty
                          onChange={(e) => handleFileChange("recipient", idx, e.target.files[0])}
                          style={{ display: "none" }}
                        />

                      </label>

                      <div className="file-display px-2 text-truncate">
                        {typeof file === "string"
                          ? <a href={`${API_BASE_URL.replace("/api", "")}/${file}`} target="_blank">
                            {file.split("/").pop()}
                          </a>
                          : file
                            ? file.name
                            : "No file chosen"}
                      </div>
                    </div>

                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-0"
                      onClick={() => removeFileField("recipient", idx)}
                    >
                      <i className="bi bi-x-circle"></i>
                    </Button>
                  </div>
                ))}
              </Form.Group>
            </Col>
            {/* 
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
                  <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                    <div className="file-input-wrapper flex-grow-1 d-flex align-items-center border rounded overflow-hidden">
                      <label className="custom-file-label mb-0">
                        <span className="btn btn-outline-secondary btn-sm">Choose File</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileChange("challan", idx, e.target.files[0])}
                          style={{ display: "none" }}
                        />
                      </label>

                      <div className="file-display px-2 text-truncate">
                        {typeof file === "string" ? (
                          <a
                            href={`${API_BASE_URL.replace("/api", "")}/${file}`}

                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-truncate"
                            style={{ maxWidth: "100%" }}
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
            </Col> */}

          </Row>

        </Card.Body>
      </Card>

      {/* Sparepart Section */}
      {spareparts.length > 0 && (
        <Card className="mb-3" style={{ background: "#F4F4F8", borderRadius: 6 }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Spare Parts Details</h6>
            </div>

            {spareparts.map((sp, idx) => {
              const type = sparepartTypeOf(sp.sparepart_id);

              return (
                <div
                  key={idx}
                  className="p-3 mb-3 position-relative"
                  style={{
                    border: "1px solid #dee2e6",
                    borderRadius: "6px",
                    backgroundColor: "#fff",
                  }}
                >
                  {/* Delete Button */}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(sp.id, sp)}
                    className="position-absolute"
                    style={{ top: "50px", right: "8px" }}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>

                  <Row className="align-items-end mt-3">
                    {/* Spare Parts Dropdown */}
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>
                          Spare Parts<span style={{ color: "red" }}> *</span>
                        </Form.Label>
                        <Form.Select
                          value={sp.sparepart_id}
                          disabled={idx > 0 && !isPreviousRowComplete(spareparts[idx - 1])}
                          onClick={() => {
                            if (idx > 0 && !isPreviousRowComplete(spareparts[idx - 1])) {
                              toast.error("Please complete the previous spare part before adding another.");
                            }
                          }}
                          onChange={(e) => {
                            if (idx > 0 && !isPreviousRowComplete(spareparts[idx - 1])) {
                              toast.error("Please complete the previous spare part before adding another.");
                              return;
                            }
                            handleSparepartChange(idx, e.target.value);
                          }}
                        >
                          <option value="">Select Spare Part</option>
                          {availableSpareparts.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </Form.Select>


                        {errors.items?.[idx]?.sparepart_id && (
                          <div style={feedbackStyle}>{errors.items[idx].sparepart_id}</div>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Conditional Fields */}
                    {sp.sparepart_id && (() => {
                      // Serial Based
                      if (type.includes("serial")) {
                        return (
                          <>
                            {/* <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>Product</Form.Label>
                                <div className="d-flex">
                                  <Form.Select
                                    value={sp.product_id || ""}
                                    onChange={(e) =>
                                      handleInputChange(idx, "product_id", e.target.value)
                                    }
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
                            </Col> */}

                            <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>From Serial<span style={{ color: "red" }}> *</span></Form.Label>
                                <Form.Control
                                  type="text"
                                  maxLength={6}
                                  value={sp.from_serial}
                                  onChange={(e) => {
                                    const value = e.target.value;

                                    // Update FROM SERIAL
                                    handleInputChange(idx, "from_serial", value);

                                    // 🔥 MATCH ADD PAGE BEHAVIOR: Auto-fill TO SERIAL with same value
                                    handleInputChange(idx, "to_serial", value);
                                  }}
                                />

                                {errors.items?.[idx]?.from_serial && (
                                  <div style={feedbackStyle}>{errors.items[idx].from_serial}</div>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>To Serial<span style={{ color: "red" }}> *</span></Form.Label>
                                <Form.Control
                                  type="text"
                                  value={sp.to_serial}
                                  onChange={(e) =>
                                    handleInputChange(idx, "to_serial", e.target.value)
                                  }
                                />
                                {errors.items?.[idx]?.to_serial && (
                                  <div style={feedbackStyle}>{errors.items[idx].to_serial}</div>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>Quantity<span style={{ color: "red" }}> *</span></Form.Label>
                                <Form.Control
                                  type="number"
                                  value={sp.qty}
                                  onChange={(e) =>
                                    handleInputChange(idx, "qty", e.target.value)
                                  }
                                />
                                {errors.items?.[idx]?.qty && (
                                  <div style={feedbackStyle}>{errors.items[idx].qty}</div>
                                )}
                              </Form.Group>
                            </Col>

                            {/* <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>Warranty</Form.Label>
                                <Form.Select
                                  value={sp.warranty_status}
                                  onChange={(e) =>
                                    handleInputChange(idx, "warranty_status", e.target.value)
                                  }
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </Form.Select>
                              </Form.Group>
                            </Col> */}
                          </>
                        );
                      }

                      // Warranty Based
                      if (type.includes("warranty")) {
                        return (
                          <>
                            <Col md={3}>
                              <Form.Group className="mb-2">
                                <Form.Label>Quantity<span style={{ color: "red" }}> *</span></Form.Label>
                                <Form.Control
                                  type="number"
                                  value={sp.qty}
                                  onChange={(e) =>
                                    handleInputChange(idx, "qty", e.target.value)
                                  }
                                />
                              </Form.Group>
                            </Col>
                            {/* <Col md={3}>
                              <Form.Group className="mb-2">
                                <Form.Label>Warranty</Form.Label>
                                <Form.Select
                                  value={sp.warranty_status}
                                  onChange={(e) =>
                                    handleInputChange(idx, "warranty_status", e.target.value)
                                  }
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </Form.Select>
                              </Form.Group>
                            </Col> */}
                          </>
                        );
                      }

                      // Quantity Based
                      if (type.includes("quantity")) {
                        return (
                          <Col md={3}>
                            <Form.Group className="mb-2">
                              <Form.Label>Quantity<span style={{ color: "red" }}> *</span></Form.Label>
                              <Form.Control
                                type="number"
                                min={1}
                                value={sp.qty}
                                onChange={(e) =>
                                  handleInputChange(idx, "qty", e.target.value)
                                }
                              />
                            </Form.Group>
                          </Col>
                        );
                      }

                      return null;
                    })()}
                  </Row>
                </div>
              );
            })}
          </Card.Body>
        </Card>
      )}


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
