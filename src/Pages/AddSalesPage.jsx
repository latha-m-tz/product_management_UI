import React, { useState, useEffect } from "react";
import api, { setAuthToken } from "../api";
import {
  Button,
  Form,
  Card,
  Table,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";
import BreadCrumb from "../components/BreadCrumb";
import { useNavigate, useParams } from "react-router-dom";
import { IoTrashOutline } from "react-icons/io5";
import { useLoader } from "../LoaderContext";

export default function AddSalesPage() {
  const navigate = useNavigate();
  const { loading, setLoading } = useLoader();
  const { saleId } = useParams();
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [shipmentName, setShipmentName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const itemsPerPage = 10;
  const [receiptFiles, setReceiptFiles] = useState([null]);
  const [savedReceiptNames, setSavedReceiptNames] = useState([]);
  const [needsReceiptReupload, setNeedsReceiptReupload] = useState(false);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const MySwal = withReactContent(Swal);
  const addReceiptFile = () => {
    setReceiptFiles(prev => {
      if (prev.length === 0) return [null];

      const last = prev[prev.length - 1];
      if (!last) {
        toast.error("Please choose a file before adding another");
        return prev;
      }

      return [...prev, null];
    });
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

    if (file instanceof File) {
      setNeedsReceiptReupload(false);
    }
  };

  useEffect(() => {
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) setAuthToken(token);

      const res = await api.get("/customers/get");
      setCustomers(res.data);
    } catch {
      toast.error("Failed to load customers");
    }
  };

  fetchCustomers();
}, []);


  useEffect(() => {
    const draft = localStorage.getItem("draftSale");

    if (draft && !saleId) {
      const data = JSON.parse(draft);
      setCustomerId(data.customer_id || "");
      setChallanNo(data.challan_no || "");
      setChallanDate(data.challan_date || "");
      setShipmentDate(data.shipment_date || "");
      setShipmentName(data.shipment_name || "");
      setNotes(data.notes || "");
      setItems(
        (data.items || []).map(item => ({
          ...item,
          serials: item.serials || []
        }))
      );
      setSavedReceiptNames(data.receiptFileNames || []);
      setReceiptFiles([]);

      if ((data.receiptFileNames || []).length > 0) {
        setNeedsReceiptReupload(true);
      }
      localStorage.removeItem("draftSale");
    } else if (saleId) {
      api
        .get(`/sales/${saleId}`)
        .then((res) => {
          const sale = res.data;
          setCustomerId(sale.customer_id);
          setChallanNo(sale.challan_no);
          setChallanDate(sale.challan_date);
          setShipmentDate(sale.shipment_date);
          setShipmentName(sale.shipment_name || "");
          setNotes(sale.notes || "");
          setSavedReceiptNames(data.receiptFileNames || []);
          setItems(
            sale.items.map(item => ({
              product_id: item.product_id,
              product_name: item.product_name,
              serials: item.serial_no ? [item.serial_no] : [],
              quantity: item.quantity,
            }))
          );
        })
        .catch(() => toast.error("Failed to load sale data"));
    }
  }, [saleId]);
  useEffect(() => {
    const stored = localStorage.getItem("selectedProducts");
    if (stored) {
      const selected = JSON.parse(stored);

      // Group by product_id
      // Group by product_name instead of product_id
      const grouped = selected.reduce((acc, item) => {
        const key = item.product_name || "Unknown Product";

        if (!acc[key]) {
          acc[key] = {
            product_name: key,
            product_id: item.product_id,  // still keep product_id
            serials: [],
          };
        }

        acc[key].serials.push(item.serial_no);
        return acc;
      }, {});


      // Convert grouped object to array
      const groupedArray = Object.values(grouped).map(g => ({
        product_id: g.product_id,
        product_name: g.product_name,
        serials: [...new Set(g.serials)],
        quantity: g.serials.length
      }));

      setItems(prev => {
        const merged = [...prev];

        groupedArray.forEach(newItem => {
          const index = merged.findIndex(
            item => item.product_name === newItem.product_name
          );

          if (index >= 0) {
            merged[index].serials = [
              ...new Set([...merged[index].serials, ...newItem.serials])
            ];
            merged[index].quantity = merged[index].serials.length;
          } else {
            merged.push({
              ...newItem,
              serials: [...new Set(newItem.serials)],
              quantity: newItem.serials.length,
            });
          }
        });

        return merged;
      });


      localStorage.removeItem("selectedProducts");
    }
  }, [navigate]);

  const validateForm = () => {
    const errors = {};

    if (!customerId || parseInt(customerId) <= 0)
      errors.customerId = "Customer is required";
    if (!challanNo.trim()) errors.challanNo = "Challan No is required";
    // if (!challanDate) {
    //   errors.challanDate = "Challan Date is required";
    // } else if (new Date(challanDate) > new Date()) {
    //   errors.challanDate = "Challan Date cannot be in the future";
    // }
    if (!challanDate) {
      errors.challanDate = "Challan Date is required";
    }
    if (!shipmentName.trim()) errors.shipmentName = "Shipment Name is required";
    if (!shipmentDate) {
      errors.shipmentDate = "Shipment Date is required";
    }
    // } else if (new Date(shipmentDate) > new Date()) {
    //   errors.shipmentDate = "Shipment Date cannot be in the future";
    else if (new Date(shipmentDate) < new Date(challanDate)) {
      errors.shipmentDate = "Shipment Date cannot be before Challan Date";
    }
    // if (savedReceiptNames.length > 0) {
    //   const uploadedFiles = receiptFiles.filter(f => f instanceof File);

    //   if (uploadedFiles.length === 0) {
    //     errors.receiptFiles = "Please re-upload receipt files before saving";
    //   }
    // }
    if (items.length === 0) {
      errors.items = "Please add at least one product";
    } else {
      const serials = new Set();
      items.forEach((item, index) => {
        if (!item.serials || item.serials.length === 0) {
          errors[`serials_${index}`] = `No serials selected for ${item.product_name}`;
        } else {
          item.serials.forEach((sn) => {
            const trimmed = String(sn || "").trim();
            if (!trimmed)
              errors[`serials_${index}`] = `Empty serial found for ${item.product_name}`;
            if (serials.has(trimmed))
              errors[`serials_${index}`] = `Duplicate serial number: ${trimmed}`;
            serials.add(trimmed);
          });
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (loading) return; 
    if (!validateForm()) return;

    try {
      setLoading(true); 
      const formData = new FormData();
      formData.append("customer_id", String(customerId));
      formData.append("challan_no", challanNo.trim());
      formData.append("challan_date", challanDate);
      formData.append("shipment_date", shipmentDate);
      formData.append("shipment_name", shipmentName.trim());
      formData.append("notes", notes.trim());

      let itemIndex = 0;
      items.forEach(item => {
        item.serials.forEach(sn => {
          formData.append(`items[${itemIndex}][serial_no]`, String(sn).trim());
          formData.append(`items[${itemIndex}][quantity]`, "1");
          itemIndex++;
        });
      });

      savedReceiptNames.forEach((name, index) => {
        formData.append(`existing_receipts[${index}]`, name);
      });

      receiptFiles
        .filter(f => f instanceof File)
        .forEach(file => formData.append("receipt_files[]", file));

      if (saleId) {
        await api.post(`/sales/${saleId}?_method=PUT`, formData);
        toast.success("Sale updated successfully!");
      } else {
        await api.post("/sales", formData);
        toast.success("Sale added successfully!");
      }

      navigate("/sales-order");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save sale!");
    } finally {
      setLoading(false); // 🔥 GLOBAL LOADER OFF
    }
  };




  const handleChange = (field, value) => {
    const setters = {
      customerId: setCustomerId,
      challanNo: setChallanNo,
      challanDate: setChallanDate,
      shipmentDate: setShipmentDate,
      shipmentName: setShipmentName,
      notes: setNotes,
    };
    setters[field]?.(value);
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(() => {
      const newList = groupedArray.map((g) => ({
        product_id: g.product_id,
        product_name: g.product_name,
        serials: Array.from(new Set(g.serials)),
        quantity: g.serials.length,
      }));

      return newList;
    });
    setFormErrors((prev) => ({ ...prev, [`${field}_${index}`]: undefined }));
  };

  const removeItem = (index) => {
    const removedItem = items[index];

    MySwal.fire({
      title: "Are you sure?",
      text: `Do you want to remove all serials for "${removedItem.product_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);

        const stored = localStorage.getItem("inSaleProducts");
        if (stored) {
          const existing = JSON.parse(stored);
          const filtered = existing.filter((id) => id !== String(removedItem.product_id));
          localStorage.setItem("inSaleProducts", JSON.stringify(filtered));
        }

        window.dispatchEvent(new Event("inSaleProductsUpdated"));

        toast.success(`"${removedItem.product_name}" removed successfully!`);
      }
    });
  };




  const RequiredLabel = ({ children }) => (
    <Form.Label>
      {children}
      <span style={{ color: "red" }}> *</span>
    </Form.Label>
  );

  /** ✅ Render */
  return (
    <div className="container-fluid px-4 py-4 bg-light min-vh-100">


      <BreadCrumb title={saleId ? "Edit Sale" : "Add Sale"} />
      <Row className="align-items-center mb-3">
        <Col>
          <h4>Add Sale</h4>
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

              {/* ================= ROW 1 (3 ITEMS) ================= */}
              <div className="col-md-4">
                <Form.Group>
                  <RequiredLabel>Customer</RequiredLabel>
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Form.Select
                      value={customerId || ""}
                      onChange={(e) => handleChange("customerId", e.target.value)}
                      isInvalid={!!formErrors.customerId}
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.customer} {cust.city ? `(${cust.city})` : ""}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                  <Form.Control.Feedback type="invalid">
                    {formErrors.customerId}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <RequiredLabel>Challan No</RequiredLabel>
                  <Form.Control
                    type="text"
                    value={challanNo}
                    onChange={(e) => handleChange("challanNo", e.target.value)}
                    placeholder="Enter Challan No"
                    isInvalid={!!formErrors.challanNo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.challanNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <RequiredLabel>Challan Date</RequiredLabel>
                  <Form.Control
                    type="date"
                    value={challanDate}
                    onChange={(e) => handleChange("challanDate", e.target.value)}
                    isInvalid={!!formErrors.challanDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.challanDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              {/* ================= ROW 2 (3 ITEMS) ================= */}
              <div className="col-md-4">
                <Form.Group>
                  <RequiredLabel>Shipment Date</RequiredLabel>
                  <Form.Control
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => handleChange("shipmentDate", e.target.value)}
                    isInvalid={!!formErrors.shipmentDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.shipmentDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <RequiredLabel>Shipment Name</RequiredLabel>
                  <Form.Control
                    type="text"
                    value={shipmentName}
                    onChange={(e) => handleChange("shipmentName", e.target.value)}
                    placeholder="Enter Shipment Name"
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
                    onChange={(e) => handleChange("notes", e.target.value)}
                  />
                </Form.Group>
              </div>

              {/* ================= ROW 3 (RECEIPT DOCUMENTS) ================= */}
              <div className="col-6">
                <Form.Group className="mt-2">
                  <Form.Label>
                    Receipt Documents
                    <Button
                      variant="link"
                      size="sm"
                      className="text-success ms-2 p-0"
                      onClick={addReceiptFile}
                    >
                      <i className="bi bi-plus-circle"></i> Add
                    </Button>
                  </Form.Label>
                  {/* 🔹 EXISTING RECEIPTS (UI mimic like file input) */}
                  {savedReceiptNames.map((name, idx) => (
                    <div
                      key={`saved-${idx}`}
                      className="d-flex align-items-center gap-2 mb-2"
                    >
                      <div className="input-group">
                        <span className="input-group-text">
                          Choose File
                        </span>

                        <Form.Control
                          type="text"
                          value={name}
                          disabled
                          className="bg-white"
                        />
                      </div>

                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() =>
                          setSavedReceiptNames(prev =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        <i className="bi bi-x-circle text-danger"></i>
                      </Button>
                    </div>
                  ))}
                  {receiptFiles.map((file, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                      <Form.Control
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          handleReceiptFileChange(idx, file);
                        }}
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

            {/* ================= PRODUCTS (UNCHANGED) ================= */}
            <div className="mt-4">
              <RequiredLabel>Products</RequiredLabel>
              <Button
                variant="success"
                size="sm"
                className="mb-2 ms-2"
                onClick={() => {
                  const draftSale = {
                    customer_id: customerId,
                    challan_no: challanNo,
                    challan_date: challanDate,
                    shipment_date: shipmentDate,
                    shipment_name: shipmentName,
                    notes,
                    items,
                    receiptFileNames: [
                      ...savedReceiptNames,
                      ...receiptFiles
                        .filter(f => f instanceof File)
                        .map(f => f.name)
                    ]
                  };
                  localStorage.setItem("draftSale", JSON.stringify(draftSale));
                  navigate("/add-product");
                }}
              >
                + Add Product
              </Button>

              {formErrors.items && (
                <div className="text-danger mb-2">{formErrors.items}</div>
              )}

              {items.length > 0 && (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>
                          <Form.Control type="number" value={item.quantity} readOnly />
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <IoTrashOutline />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>

            {/* ================= ACTIONS ================= */}
            <div className="mt-4 d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => navigate("/sales-order")}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleSave} disabled={loading}>
                {loading ? "Processing..." : saleId ? "Update" : "Save"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

    </div>
  );
}
