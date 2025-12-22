import React, { useState, useEffect } from "react";
import api, { setAuthToken } from "../api";
import { Button, Form, Card, Table, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useParams } from "react-router-dom";
import { IoTrashOutline } from "react-icons/io5";
import { useRef } from "react";

export default function EditSalesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const saleLoadedRef = useRef(false);

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [shipmentName, setShipmentName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [loadedSale, setLoadedSale] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [receiptFiles, setReceiptFiles] = useState([]);
  const [existingReceipts, setExistingReceipts] = useState([]);
  const [removedReceipts, setRemovedReceipts] = useState([]);

  const MySwal = withReactContent(Swal);

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const addReceiptFile = () => {
    if (receiptFiles.length > 0 && receiptFiles[receiptFiles.length - 1] === null) {
      toast.error("Please choose a file first");
      return;
    }

    setReceiptFiles(prev => [...prev, null]);
  };
  const replaceExistingFile = (index, newFile) => {
    const oldFile = existingReceipts[index];

    setRemovedReceipts(prev => [...prev, oldFile.file_path]);
    setExistingReceipts(prev => prev.filter((_, i) => i !== index));
    setReceiptFiles(prev => [...prev, newFile]);
  };

  const removeReceiptFile = (index) => {
    const updated = [...receiptFiles];
    updated.splice(index, 1);
    setReceiptFiles(updated);
  };

  const handleReceiptFileChange = (index, file) => {
    const updated = [...receiptFiles];
    updated[index] = file;
    setReceiptFiles(updated);
  };
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
  }, []);

  useEffect(() => {
    api
      .get(`/customers/get`)
      .then((res) => setCustomers(res.data))
      .catch(() => toast.error("Failed to load customers"));
  }, []);

  const groupProducts = (products) => {
    const grouped = {};

    products.forEach((item) => {
      const pid = item.product_id;

      if (!grouped[pid]) {
        grouped[pid] = {
          product_id: pid,
          name: item.product?.name || "Unknown Product",
          serials: [],
          quantity: 0,
        };
      }

      if (item.serial_no) {
        grouped[pid].serials.push(String(item.serial_no));
        grouped[pid].quantity = grouped[pid].serials.length;
      } else {
        grouped[pid].quantity += Number(item.quantity || 1);
      }
    });

    return Object.values(grouped);
  };
  useEffect(() => {
    const draft = localStorage.getItem("draftSale");
    if (!draft) return;

    const data = JSON.parse(draft);

    setCustomerId(data.customer_id || "");
    setChallanNo(data.challan_no || "");
    setChallanDate(data.challan_date || "");
    setShipmentDate(data.shipment_date || "");
    setShipmentName(data.shipment_name || "");
    setNotes(data.notes || "");
    if (Array.isArray(data.existingReceipts)) {
      setExistingReceipts(data.existingReceipts);
    }

    // if (Array.isArray(data.receiptFiles)) {
    //   setReceiptFiles(data.receiptFiles);a
    // }

    if (Array.isArray(data.removedReceipts)) {
      setRemovedReceipts(data.removedReceipts);
    }

  }, []);

  useEffect(() => {
    if (saleLoadedRef.current) return;

    api.get(`/sales/${id}`).then((res) => {
      const { sale, products, receipts } = res.data;

      setCustomerId(sale.customer_id || "");
      setChallanNo(sale.challan_no || "");
      setChallanDate(sale.challan_date || "");
      setShipmentDate(sale.shipment_date || "");
      setShipmentName(sale.shipment_name || "");
      setNotes(sale.notes || "");

      // ✅ FIX HERE
      setExistingReceipts(
        (receipts || []).map(r => ({
          file_path: r.file_path,
          file_name: r.file_name,
        }))
      );

      setItems(prev =>
        prev.length > 0 ? prev : groupProducts(products || [])
      );

      saleLoadedRef.current = true;
      setLoadedSale(true);
    });
  }, [id]);




  useEffect(() => {
    if (!loadedSale) return;

    const stored = localStorage.getItem("selectedProducts");
    if (stored) {
      loadSelectedProducts();
      localStorage.removeItem("selectedProducts");
    }
  }, [loadedSale]);


  const loadSelectedProducts = () => {
    const stored = localStorage.getItem("selectedProducts");
    if (!stored) return;

    const selected = JSON.parse(stored);
    if (!Array.isArray(selected)) return;

    setItems(prevItems => {
      const map = {};

      const makeKey = (p) => `${p.product_id}_${p.product_name || p.name}`;

      prevItems.forEach(item => {
        const key = makeKey(item);
        map[key] = { ...item };
      });

      selected.forEach(p => {
        const pid = Number(p.product_id);
        const name = p.product_name || p.name || "Unknown Product";
        const incomingQty = Number(p.quantity || 1);

        const key = `${pid}_${name}`;

        if (!map[key]) {
          // New product (unique combination)
          map[key] = {
            product_id: pid,
            name: name,
            serials: p.serial_no ? [String(p.serial_no)] : [],
            quantity: incomingQty,
          };
        } else {
          // Same product & same name — update this row only
          map[key].quantity += incomingQty;

          if (p.serial_no) {
            const s = String(p.serial_no);
            if (!map[key].serials.includes(s)) {
              map[key].serials.push(s);
            }
          }
        }
      });

      return Object.values(map);
    });
  };
  const validateForm = () => {
    const errors = {};

    const toDate = (d) => new Date(new Date(d).toDateString());
    const today = toDate(new Date());
    const challan = challanDate ? toDate(challanDate) : null;
    const shipment = shipmentDate ? toDate(shipmentDate) : null;

    if (!customerId) errors.customerId = "Customer is required";
    if (!challanNo.trim()) errors.challanNo = "Challan No is required";

    if (!challanDate) {
      errors.challanDate = "Challan Date is required";
    } else if (challan > today) {
      errors.challanDate = "Challan Date cannot be in the future";
    }

    if (!shipmentDate) {
      errors.shipmentDate = "Shipment Date is required";
    } else if (shipment < challan) {
      errors.shipmentDate = "Shipment Date cannot be before Challan Date";
    }

    if (!shipmentName.trim()) errors.shipmentName = "Shipment Name is required";

    if (items.length === 0) {
      errors.items = "Please add at least one product";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.warning("Please fix the highlighted errors!");
      return;
    }

    const formData = new FormData();

    formData.append("customer_id", customerId);
    formData.append("challan_no", challanNo.trim());
    formData.append("challan_date", challanDate);
    formData.append("shipment_date", shipmentDate);
    formData.append("shipment_name", shipmentName.trim());
    formData.append("notes", notes.trim());

    // items.forEach((item, i) => {
    //   if (Array.isArray(item.serials)) {
    //     item.serials.forEach((serial) => {
    //       formData.append(`items[${i}][serial_no]`, String(serial).trim());
    //       formData.append(`items[${i}][quantity]`, 1);
    //     });
    //   }
    // });
    let index = 0;

    items.forEach((item) => {
      // Case 1: Serial based products
      if (Array.isArray(item.serials) && item.serials.length > 0) {
        item.serials.forEach((serial) => {
          formData.append(`items[${index}][product_id]`, item.product_id);
          formData.append(`items[${index}][serial_no]`, serial);
          formData.append(`items[${index}][quantity]`, 1);
          index++;
        });
      }
      else {
        formData.append(`items[${index}][product_id]`, item.product_id);
        formData.append(`items[${index}][quantity]`, item.quantity);
        index++;
      }
    });


    receiptFiles.forEach((file) => {
      if (file instanceof File) {
        formData.append("receipt_files[]", file);
      }
    });

    formData.append(
      "removed_receipt_files",
      JSON.stringify(removedReceipts)
    );

    try {
      await api.post(`/sales/${id}?_method=PUT`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Sale updated successfully!");
      navigate("/sales-order");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update sale!");
    }
  };


  const handleDeleteItem = (index) => {
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
        const deleted = items[index];
        setItems(items.filter((_, i) => i !== index));
        toast.success(`${deleted.name} removed successfully!`);
      }
    });
  };

  return (
    <div className="container-fluid px-4 py-4 bg-light min-vh-100">
      <Row className="align-items-center mb-3">
        <Col>
          <h4>Edit Sale</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => navigate("/sales-order")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      <Card
        className="border-0 shadow-sm rounded-3"
        style={{ backgroundColor: "#f4f4f8" }}
      >
        <Card.Body>
          <Form>
            <div className="row g-3">

              {/* ================= ROW 1 ================= */}
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>
                    Customer <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    isInvalid={!!formErrors.customerId}
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.customer} {cust.city ? `(${cust.city})` : ""}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.customerId}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>
                    Challan No <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    isInvalid={!!formErrors.challanNo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.challanNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>
                    Challan Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={challanDate}
                    onChange={(e) => setChallanDate(e.target.value)}
                    isInvalid={!!formErrors.challanDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.challanDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              {/* ================= ROW 2 ================= */}
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>
                    Shipment Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => setShipmentDate(e.target.value)}
                    isInvalid={!!formErrors.shipmentDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.shipmentDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>
                    Shipment Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={shipmentName}
                    onChange={(e) => setShipmentName(e.target.value)}
                    isInvalid={!!formErrors.shipmentName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.shipmentName}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={1}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Form.Group>
              </div>

              {/* ================= RECEIPT DOCUMENTS ================= */}
              <div className="col-6 mt-2">
                <Form.Group>
                  <Form.Label className="d-flex align-items-center gap-2">
                    Receipt Documents
                    <Button
                      variant="link"
                      size="sm"
                      className="text-success p-0"
                      onClick={addReceiptFile}
                    >
                      <i className="bi bi-plus-circle"></i> Add
                    </Button>
                  </Form.Label>

                  {/* ===== EXISTING RECEIPTS ===== */}
                  {existingReceipts.map((file, idx) => (
                    <div key={idx} className="d-flex align-items-center mb-2">
                      <div className="input-group flex-grow-1">

                        {/* Hidden file input */}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          style={{ display: "none" }}
                          id={`replace-file-${idx}`}
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              replaceExistingFile(idx, e.target.files[0]);
                            }
                          }}
                        />

                        {/* Choose File button */}
                        <span
                          className="input-group-text"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            document.getElementById(`replace-file-${idx}`).click()
                          }
                        >
                          Choose File
                        </span>

                        {/* ✅ Correct file name */}
                        <Form.Control
                          readOnly
                          value={file.file_name || ""}
                          className="bg-white"
                        />
                      </div>

                      {/* Remove button */}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 ms-2"
                        onClick={() => {
                          setExistingReceipts(prev => prev.filter((_, i) => i !== idx));
                          setRemovedReceipts(prev => [...prev, file.file_path]);
                        }}
                      >
                        <i className="bi bi-x-circle text-danger"></i>
                      </Button>
                    </div>
                  ))}
                  {/* ===== NEW FILE INPUTS ===== */}
                  {receiptFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="d-flex align-items-center gap-2 mb-2"
                    >
                      <Form.Control
                        type="file"
                        accept="image/*,application/pdf"
                        className="flex-grow-1"
                        onChange={(e) =>
                          handleReceiptFileChange(idx, e.target.files[0])
                        }
                      />

                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() => removeReceiptFile(idx)}
                      >
                        <i className="bi bi-x-circle text-danger"></i>
                      </Button>

                    </div>
                  ))}
                </Form.Group>
              </div>

            </div>

            {/* ================= PRODUCTS ================= */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label>
                  Products <span className="text-danger">*</span>
                </Form.Label>

                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    const draftSale = {
                      customer_id: customerId,
                      challan_no: challanNo,
                      challan_date: challanDate,
                      shipment_date: shipmentDate,
                      shipment_name: shipmentName,
                      notes,
                      items,
                      existingReceipts,
                      removedReceipts, // ✅ ADD THIS

                    };
                    localStorage.setItem("draftSale", JSON.stringify(draftSale));
                    navigate("/add-product");
                  }}
                >
                  + Add Product
                </Button>
              </div>

              {formErrors.items && (
                <div className="text-danger mb-2">{formErrors.items}</div>
              )}

              {items.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, index) => (
                      <tr key={startIndex + index}>
                        <td>{item.name}</td>
                        <td>
                          <Form.Control
                            type="number"
                            value={item.quantity}
                            readOnly
                          />
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() =>
                              handleDeleteItem(startIndex + index)
                            }
                          >
                            <IoTrashOutline />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-muted">No products added</div>
              )}
            </div>

            {/* ================= FOOTER ================= */}
            <div className="mt-4 d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate("/sales-order")}
              >
                Cancel
              </Button>
              <Button variant="success" onClick={handleSave}>
                Update
              </Button>
            </div>
          </Form>
        </Card.Body>

      </Card>

    </div>
  );
}
