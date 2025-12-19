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
import Select, { components } from "react-select";

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
  const [receivedDate, setReceivedDate] = useState("");
  // const recomputeBaseQty = (updated, sparepartId) => {
  //   const rows = updated.filter(sp => sp.sparepart_id === sparepartId);
  //   if (rows.length === 0) return;

  //   const total = rows.reduce(
  //     (sum, sp) => sum + (Number(sp._rowQty ?? sp.qty) || 0),
  //     0
  //   );

  //   const baseIndex = updated.findIndex(
  //     sp => sp.sparepart_id === sparepartId
  //   );

  //   if (baseIndex !== -1) {
  //     updated[baseIndex] = {
  //       ...updated[baseIndex],
  //       qty: total,          // TOTAL shown only in base row
  //     };
  //   }
  // };
  const [removedFiles, setRemovedFiles] = useState({
    recipient: [],
  });
  const [vendorIdOnly, contactPersonId] = String(vendorId || "").split("-");
  const sparepartOptions = availableSpareparts.map(s => ({
    value: s.id,
    label: s.name,
  }));
  const buildSerialsFromRange = (from, to) => {
    const m1 = parseSerial(from);
    const m2 = parseSerial(to);

    if (
      !m1.prefix ||
      m1.num === null ||
      m2.num === null ||
      m2.num < m1.num
    ) {
      return [];
    }

    const list = [];
    for (let n = m1.num; n <= m2.num; n++) {
      list.push(`${m1.prefix}${String(n).padStart(6, "0")}`);
    }
    return list;
  };


  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "36px",
      borderColor: "#ced4da",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#86b7fe",
      },
    }),

    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#e9ecef"
        : state.isFocused
          ? "#f8f9fa"
          : "white",
      color: "#212529",
      cursor: "pointer",
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

  const CheckboxOption = (props) => (
    <components.Option {...props}>
      <input
        type="checkbox"
        checked={props.isSelected}
        readOnly
        style={{ marginRight: 8 }}
      />
      <label>{props.label}</label>
    </components.Option>
  );

  const handleMultiSelectEdit = (selectedOptions = []) => {
    setSpareparts(prev => {
      const selectedIds = selectedOptions.map(o => o.value);

      // remove only rows whose sparepart was unselected
      const filtered = prev.filter(sp =>
        sp.sparepart_id && selectedIds.includes(sp.sparepart_id)
      );

      // add ONE new row only for newly selected spareparts
      selectedIds.forEach(id => {
        const exists = filtered.some(sp => sp.sparepart_id === id);
        if (!exists) {
          filtered.push({
            id: null,
            rowKey: Date.now() + Math.random(),
            sparepart_id: id,
            qty: "",
            warranty_status: "Active",
            from_serial: "",
            to_serial: "",
            serials: [],
          });
        }
      });

      return filtered;
    });
  };



  const MySwal = withReactContent(Swal);

  const navigate = useNavigate();


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
  const groupConsecutiveSerials = (serials = []) => {
    if (!serials.length) return [];

    const nums = serials
      .map(s => Number(s))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    const ranges = [];
    let start = nums[0];
    let prev = nums[0];

    for (let i = 1; i <= nums.length; i++) {
      if (nums[i] === prev + 1) {
        prev = nums[i];
        continue;
      }

      ranges.push({
        from: String(start),
        to: String(prev),
        qty: prev - start + 1,
        serials: nums.filter(n => n >= start && n <= prev).map(String),
      });

      start = nums[i];
      prev = nums[i];
    }

    return ranges;
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

    const numericGroup = parsed.filter(p => p.num !== null);
    if (numericGroup.length > 0) {
      numericGroup.sort((a, b) => a.num - b.num);
      return {
        from_serial: numericGroup[0].orig,
        to_serial: numericGroup[numericGroup.length - 1].orig
      };
    }

    const sorted = uniq.sort();
    return { from_serial: sorted[0], to_serial: sorted[sorted.length - 1] };
  };



  const handleDelete = async (id, sp) => {
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
        if (!id) {
          removeSparepart(spareparts.indexOf(sp));
          toast.success("Item removed!");
          return;
        }

        await api.delete(`/purchase-items/${purchaseKey}/${id}`);

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

      setModalSerials(serialList);
      setModalIndex(index);
      setShowModal(true);
      return;
    }

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



  const duplicateSparepart = (index) => {
    const current = spareparts[index];

    const newRow = {
      id: null,
      rowKey: Date.now() + Math.random(),

      sparepart_id: current.sparepart_id,
      product_id: current.product_id || "",

      qty: "",                 // 🔥 EMPTY — do NOT copy
      warranty_status: current.warranty_status || "Active",

      from_serial: "",
      to_serial: "",
      serials: [],
    };

    const updated = [...spareparts];
    updated.splice(index + 1, 0, newRow);

    setSpareparts(updated);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [spareRes, purchaseRes] = await Promise.all([
          api.get(`/get-spareparts`),
          api.get(`/${purchaseKey}/purchase/edit`),
        ]);

        /* ================= BASIC DATA ================= */

        setAvailableSpareparts(spareRes.data.spareparts || []);
        setAvailableVendors(spareRes.data.vendors || []);
        setAvailableCategories(spareRes.data.categories || []);

        const p = purchaseRes.data || {};

        setVendorId(p.vendor_id || "");
        setChallanNo(p.challan_no || "");

        const convertToInputDate = (dateStr) => {
          if (!dateStr) return "";
          const [d, m, y] = dateStr.split("-");
          return `${y}-${m}-${d}`;
        };

        setChallanDate(convertToInputDate(p.challan_date));
        setReceivedDate(convertToInputDate(p.received_date));
        setTrackingNumber(p.tracking_number || "");
        setCourierName(p.courier_name || "");

        setRecipientFiles(
          Array.isArray(p.document_recipient) && p.document_recipient.length
            ? p.document_recipient
            : [null]
        );

        /* ================= SERIAL RANGE REBUILD ================= */

        const serialMap = {};
        const nonSerialMap = {};

        // 1️⃣ Collect backend rows
        (p.items || []).forEach((item) => {
          const key = `${item.sparepart_id}-${item.product_id || ""}-${item.warranty_status || "Active"}`;

          if (item.serial_no) {
            if (!serialMap[key]) serialMap[key] = [];
            serialMap[key].push(item.serial_no);
          } else {
            if (!nonSerialMap[key]) {
              nonSerialMap[key] = {
                id: item.id || null,
                sparepart_id: item.sparepart_id,
                product_id: item.product_id || "",
                warranty_status: item.warranty_status || "Active",
                qty: 0,
              };
            }
            nonSerialMap[key].qty += Number(item.quantity) || 0;
          }
        });

        // 2️⃣ Build UI rows
        const mappedBackend = [];

        // SERIAL → RANGE ROWS
        Object.entries(serialMap).forEach(([key, serials]) => {
          const [sparepart_id, product_id, warranty_status] = key.split("-");

          const ranges = groupConsecutiveSerials(serials);

          ranges.forEach((r) => {
            mappedBackend.push({
              id: null,
              sparepart_id: Number(sparepart_id),
              product_id: product_id || "",
              warranty_status,
              from_serial: r.from,
              to_serial: r.to,
              qty: r.qty,
              serials: r.serials,
            });
          });
        });

        // NON-SERIAL ROWS
        Object.values(nonSerialMap).forEach((row) => {
          mappedBackend.push({
            ...row,
            from_serial: "",
            to_serial: "",
            serials: [],
          });
        });

        /* ================= SET STATE ================= */

        setSpareparts(
          mappedBackend.length
            ? mappedBackend
            : [{
              id: null,
              sparepart_id: "",
              product_id: "",
              qty: "",
              warranty_status: "Active",
              from_serial: "",
              to_serial: "",
              serials: [],
            }]
        );

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch purchase data");
        setLoading(false);
      }
    };

    fetchData();
  }, [purchaseKey]);

  const addFileField = (type) => {
    if (type === "recipient") setRecipientFiles((prev) => [...prev, null]);
  };

  const removeFileField = (type, index) => {
    let updated;

    if (type === "recipient") {
      updated = [...recipientFiles];
    }

    const removedFile = updated[index];

    if (typeof removedFile === "string") {
      setRemovedFiles((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), removedFile],
      }));
    }

    updated.splice(index, 1);

    if (updated.length === 0) {
      updated = [null];
    }

    if (type === "recipient") setRecipientFiles(updated);
  };

  const handleFileChange = (type, index, file) => {
    if (type === "recipient") {
      const updated = [...recipientFiles];
      updated[index] = file;
      setRecipientFiles(updated);
    } else if (type === "challan") {
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

    updated[index].from_serial = "";
    updated[index].to_serial = "";
    updated[index].qty = "";

    setSpareparts(updated);

    clearItemError(index, "sparepart_id");
  };

  const handleInputChange = (index, field, value) => {
    clearItemError(index, field);

    const updated = [...spareparts];
    const current = updated[index];
    const type = sparepartTypeOf(current.sparepart_id);

    /* SERIAL ITEMS */
    if (type.includes("serial") && (field === "from_serial" || field === "to_serial")) {
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      updated[index][field] = cleaned;

      const from = updated[index].from_serial;
      const to = updated[index].to_serial;

      const m1 = parseSerial(from);
      const m2 = parseSerial(to);

      if (m1.num !== null && m2.num !== null && m2.num >= m1.num) {
        updated[index].qty = m2.num - m1.num + 1; // ✔ row-only qty
      } else {
        updated[index].qty = "";
      }

      setSpareparts(updated);
      return;
    }

    /* NON-SERIAL ITEMS */
    if (field === "qty") {
      updated[index].qty = Number(value) || "";
      setSpareparts(updated);
      return;
    }

    updated[index][field] = value;
    setSpareparts(updated);
  };

  const getTotalQty = (sparepartId) => {
    return spareparts
      .filter(sp => sp.sparepart_id === sparepartId)
      .reduce((sum, sp) => sum + (Number(sp.qty) || 0), 0);
  };

  const addSparepart = () => {
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

    const lastRow = spareparts[spareparts.length - 1];

    if (!isPreviousRowComplete(lastRow)) {
      toast.error("Please complete the previous spare part before adding another.");
      return;
    }

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

    if (spareparts.length === 0) {
      toast.error("Please add at least one spare part before updating.");
      return false;
    }

    const hasValidItem = spareparts.some(sp => sp.sparepart_id);
    if (!hasValidItem) {
      toast.error("Please complete at least one sparepart entry.");
      return false;
    }

    if (!vendorId) errs.vendor_id = "Vendor is required";

    if (!challanNo) errs.challan_no = "Challan No is required";

    if (!challanDate) errs.challan_date = "Challan Date is required";

    if (!receivedDate) errs.received_date = "Received Date is required";

    if (challanDate && receivedDate) {
      const cd = new Date(challanDate);
      const rd = new Date(receivedDate);

      if (rd < cd) {
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
      const mergedSpareparts = Object.values(
        spareparts.reduce((acc, sp) => {
          if (!sp.sparepart_id) return acc;

          const type = sparepartTypeOf(sp.sparepart_id);

          let serials = Array.isArray(sp.serials) ? [...sp.serials] : [];

          if (
            type.includes("serial") &&
            serials.length === 0 &&
            sp.from_serial &&
            sp.to_serial
          ) {
            serials = buildSerialsFromRange(sp.from_serial, sp.to_serial);
          }

          // 🔥 UNIQUE KEY PER SERIAL RANGE
          const key = `${sp.sparepart_id}-${sp.warranty_status}-${sp.from_serial}-${sp.to_serial}`;

          if (!acc[key]) {
            acc[key] = {
              sparepart_id: sp.sparepart_id,
              warranty_status: sp.warranty_status || "Active",
              from_serial: sp.from_serial || "",
              to_serial: sp.to_serial || "",
              serials,
              qty: serials.length || Number(sp.qty) || 0,
              ids: sp.id ? [sp.id] : [],
            };
          } else {
            // same exact range (rare case)
            acc[key].serials.push(...serials);
            acc[key].qty = acc[key].serials.length;
            if (sp.id) acc[key].ids.push(sp.id);
          }

          return acc;
        }, {})
      );

      const payload = new FormData();
      payload.append("_method", "PUT");

      payload.append("vendor_id", vendorIdOnly || "");
      payload.append(
        "contact_person_id",
        contactPersonId && contactPersonId !== "0" ? contactPersonId : ""
      );

      payload.append("challan_no", String(challanNo || ""));
      payload.append("challan_date", challanDate || "");
      payload.append("received_date", receivedDate || "");
      payload.append("tracking_number", String(trackingNumber || ""));
      payload.append("courier_name", String(courier_name || ""));
      mergedSpareparts.forEach((sp, i) => {
        (sp.ids || []).forEach((id, j) => {
          payload.append(`items[${i}][ids][${j}]`, id);
        });

        payload.append(`items[${i}][sparepart_id]`, sp.sparepart_id);
        payload.append(`items[${i}][from_serial]`, sp.from_serial || "");
        payload.append(`items[${i}][to_serial]`, sp.to_serial || "");
        payload.append(`items[${i}][warranty_status]`, sp.warranty_status);

        // ✅ Quantity must follow serial count
        payload.append(
          `items[${i}][quantity]`,
          sp.serials.length || Number(sp.qty) || 0
        );

        // 🔥 CRITICAL FIX: ALWAYS SEND serials[]
        sp.serials.forEach((serial, j) => {
          payload.append(`items[${i}][serials][${j}]`, serial);
        });
      });
      deletedSparepartIds.forEach((id, i) => {
        payload.append(`deleted_ids[${i}]`, id);
      });

      recipientFiles.forEach((file, i) => {
        if (file instanceof File) {
          payload.append(`document_recipient[${i}]`, file);
        }
      });

      payload.append(
        "removed_recipient_files",
        JSON.stringify(removedFiles.recipient || [])
      );

      await api.post(`/purchaseUpdate/${purchaseKey}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
  const serialInputStyle = { background: "#e9ecef" };

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
                          disabled={idx > 0 && !recipientFiles[idx - 1]}
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
                      onClick={() => removeFileField("recipient", idx)}
                    >
                      <i className="bi bi-x-circle"></i>
                    </Button>
                  </div>
                ))}
              </Form.Group>
            </Col>
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
            <Form.Group className="mb-3">
              <Form.Label>
                Select Spare Parts <span className="text-danger">*</span>
              </Form.Label>

              <Select
                isMulti
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                options={sparepartOptions}
                components={{ Option: CheckboxOption }}
                styles={selectStyles}
                isDisabled={!vendorId}
                value={[
                  ...new Map(
                    spareparts
                      .filter(sp => sp.sparepart_id)
                      .map(sp => {
                        const part = availableSpareparts.find(a => a.id === sp.sparepart_id);
                        return [sp.sparepart_id, {
                          value: sp.sparepart_id,
                          label: part?.name || ""
                        }];
                      })
                  ).values()
                ]}
                onChange={handleMultiSelectEdit}
              />

              {!vendorId && (
                <small className="text-danger">
                  Please select Vendor first
                </small>
              )}
            </Form.Group>

            {spareparts.map((sp, idx) => {
              const type = sparepartTypeOf(sp.sparepart_id);

              return (
                <Card key={sp.rowKey || sp.id} className="mb-2 p-3">
                  <Row className="align-items-center g-2">

                    {/* Spare Part */}
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Spare Part</Form.Label>
                        <Form.Control
                          disabled
                          value={
                            availableSpareparts.find(a => a.id === sp.sparepart_id)?.name || ""
                          }
                        />
                      </Form.Group>
                    </Col>

                    {/* SERIAL ITEMS */}
                    {type.includes("serial") && (
                      <>
                        <Col md={2}>
                          <Form.Label>
                            From Serial <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            value={sp.from_serial}
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6 digits"
                            onChange={(e) => {
                              handleInputChange(idx, "from_serial", e.target.value);
                              handleInputChange(idx, "to_serial", e.target.value);
                            }}
                          />
                        </Col>

                        <Col md={2}>
                          <Form.Label>
                            To Serial <span className="text-danger">*</span>
                          </Form.Label>                          <Form.Control
                            value={sp.to_serial}
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6 digits"
                            onChange={(e) =>
                              handleInputChange(idx, "to_serial", e.target.value)
                            }
                          />
                        </Col>

                        <Col md={2}>
                          <Form.Label>Qty</Form.Label>
                          <Form.Control
                            value={sp.qty || ""}
                            placeholder="Auto"
                            disabled
                          />
                        </Col>
                      </>
                    )}
                    {/* NON-SERIAL ITEMS */}
                    {!type.includes("serial") && (
                      <>
                        <Col md={2}>
                          <Form.Label>
                            Qty <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            value={sp.qty}
                            onChange={(e) =>
                              handleInputChange(idx, "qty", e.target.value)
                            }
                          />
                        </Col>

                        <Col md={2} />
                        <Col md={2} />
                      </>
                    )}



                    {/* ACTION BUTTONS — NEVER MOVE NOW */}
                    <Col md={2} className="d-flex justify-content-center align-items-center">
                      <div className="d-flex gap-2 mt-4">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => duplicateSparepart(idx)}
                        >
                          <i className="bi bi-plus-lg" />
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(sp.id, sp)}
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
      )}
      {/* Buttons */}
      <div className="d-flex justify-content-between mt-3">
        {/* <Button variant="success" onClick={addSparepart}>
          <i className="bi bi-plus-lg me-1" /> Add Spareparts
        </Button> */}
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
