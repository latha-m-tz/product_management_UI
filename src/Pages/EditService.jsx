import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";
import api, { setAuthToken, API_BASE_URL } from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { IoTrashOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const EditServicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const MySwal = withReactContent(Swal);

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    vendor_id: "",
    challan_no: "",
    challan_date: "",
    tracking_no: "",
    receipt_files: [],
    items: [],
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);

    const loadServiceData = async () => {
      try {
        const [spRes, venRes, serviceRes] = await Promise.all([
          api.get("/spareparts/get"),
          api.get("/vendorsget"),
          api.get(`/service-vci/${id}`),
        ]);

        setProducts(spRes.data.spareparts || []);
        setVendors(venRes.data || []);

        const service = serviceRes.data;

        const formattedItems = service.items.map((it) => {
          const spare = spRes.data.spareparts.find((p) => p.id === it.sparepart_id);
          const isPCB = spare && String(spare.name).toLowerCase().includes("pcb");

          return {
            id: it.id,
            sparepart_id: it.sparepart_id,
            isPCB: isPCB,
            vci_serial_no: it.vci_serial_no || "",
            quantity: it.quantity || "",
            status: it.status || "",
            remarks: it.remarks || "",
            upload_image: it.upload_image || null,
          };
        });

        setFormData({
          vendor_id: service.vendor_id,
          challan_no: service.challan_no,
          challan_date: service.challan_date,
          tracking_no: service.tracking_no,
          receipt_files: service.receipt_files && service.receipt_files.length > 0
            ? service.receipt_files
            : [null],
          items: formattedItems,
        });

        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load data!");
      }
    };

    loadServiceData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleItemChange = (index, e) => {
    const { name, value, files } = e.target;
    const updatedItems = [...formData.items];

    if (name === "sparepart_id") {
      const spare = products.find((p) => p.id === Number(value));
      const isPCB = spare && spare.name.toLowerCase().includes("pcb");

      updatedItems[index].sparepart_id = Number(value);
      updatedItems[index].isPCB = isPCB;

      updatedItems[index].vci_serial_no = "";
      updatedItems[index].quantity = "";

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`vci_serial_no_${index}`];
        delete copy[`quantity_${index}`];
        delete copy[`sparepart_id_${index}`];
        return copy;
      });
    } else {
      updatedItems[index][name] = files ? files[0] : value;
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };
  const validateLastRow = () => {
    const lastIndex = formData.items.length - 1;
    const row = formData.items[lastIndex];

    if (!row.sparepart_id) {
      toast.error("Please select a product before adding another row.");
      return false;
    }

    if (row.isPCB) {
      if (!row.vci_serial_no.trim()) {
        toast.error("Please enter Serial Number before adding another row.");
        return false;
      }
    } else {
      if (!row.quantity || row.quantity <= 0) {
        toast.error("Please enter a valid Quantity before adding another row.");
        return false;
      }
    }

    if (!row.status) {
      toast.error("Please select a Status before adding another row.");
      return false;
    }

    return true;
  };

  const addRow = () => {
    if (!validateLastRow()) return; // <-- prevent adding new row

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sparepart_id: "",
          isPCB: false,
          vci_serial_no: "",
          quantity: "",
          status: "",
          remarks: "",
          upload_image: null,
        },
      ],
    }));

    toast.success("New row added!");
  };


  const removeRow = (index) => {
    MySwal.fire({
      title: "Are you sure?",
      text: "You cannot undo this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = [...formData.items];
        updated.splice(index, 1);
        setFormData((prev) => ({ ...prev, items: updated }));
        toast.success("Row deleted");
      }
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.vendor_id) newErrors.vendor_id = "Vendor is required";
    if (!formData.challan_no) newErrors.challan_no = "Challan No is required";

    formData.items.forEach((item, i) => {
      if (!item.sparepart_id)
        newErrors[`sparepart_id_${i}`] = "Product is required";

      if (item.isPCB) {
        if (!item.vci_serial_no.trim())
          newErrors[`vci_serial_no_${i}`] = "Serial is required for PCB";
      } else {
        if (!item.quantity || item.quantity <= 0)
          newErrors[`quantity_${i}`] = "Quantity required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const isItemRowComplete = (item) => {
    if (!item.sparepart_id) return false;

    if (item.isPCB) {
      return item.vci_serial_no && item.vci_serial_no.trim() !== "";
    }

    return item.quantity && Number(item.quantity) > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append("_method", "PUT");
    fd.append("vendor_id", formData.vendor_id);
    fd.append("challan_no", formData.challan_no);
    fd.append("challan_date", formData.challan_date);
    fd.append("tracking_no", formData.tracking_no || "");

    // Receipt Files
    formData.receipt_files.forEach((file, i) => {
      if (file instanceof File) {
        fd.append(`receipt_files[${i}]`, file);
      }
      // Important: Existing file path is ignored (backend keeps old file)
    });

    // Items
    formData.items.forEach((item, i) => {
      if (item.id) fd.append(`items[${i}][id]`, item.id);

      fd.append(`items[${i}][sparepart_id]`, item.sparepart_id);

      if (item.isPCB) {
        fd.append(`items[${i}][vci_serial_no]`, item.vci_serial_no);
      } else {
        fd.append(`items[${i}][quantity]`, item.quantity);
      }

      fd.append(`items[${i}][status]`, item.status || "");
      fd.append(`items[${i}][remarks]`, item.remarks || "");

      if (item.upload_image instanceof File) {
        fd.append(`items[${i}][upload_image]`, item.upload_image);
      }
    });

    try {
      await api.post(`/service-vci/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Service updated successfully!");
      navigate("/service-product");

    } catch (error) {
      console.error("Update Error:", error);

      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const formatted = {};
        let firstErrorMessage = null;

        Object.keys(backendErrors).forEach((key) => {
          const message = backendErrors[key][0];

          if (!firstErrorMessage) {
            firstErrorMessage = message;
          }

          if (key.startsWith("items.")) {
            const parts = key.split(".");
            const rowIndex = parts[1]; // items.0.quantity => 0

            if (key.includes("vci_serial_no")) {
              formatted[`vci_serial_no_${rowIndex}`] = message;
            } else {
              formatted[`quantity_${rowIndex}`] = message;
            }

          } else {
            formatted[key] = message;
          }
        });

        setErrors(formatted);

        toast.error(firstErrorMessage);

      } else {
        toast.error("Failed to update service!");
      }
    }
  };


  if (loading) return <div className="p-5 text-center">Loading...</div>;

  return (
    <Container fluid>
      <Row className="mb-3 fixed-header align-items-center">
        <Col><h4>Edit Service</h4></Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate("/service-product")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit}>
        {/* TOP SECTION */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Challan No <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="challan_no"
                value={formData.challan_no}
                onChange={handleChange}
                isInvalid={!!errors.challan_no}
              />
              <Form.Control.Feedback type="invalid">
                {errors.challan_no}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Challan Date <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="date"
                name="challan_date"
                value={formData.challan_date}
                onChange={handleChange}
                isInvalid={!!errors.challan_date}
              />

              <Form.Control.Feedback type="invalid">
                {errors.challan_date}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        {/* VENDOR + TRACKING */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Vendor <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                isInvalid={!!errors.vendor_id}
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.vendor}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Tracking No</Form.Label>
              <Form.Control
                type="text"
                name="tracking_no"
                value={formData.tracking_no}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          {/* RECEIPT DOCUMENTS */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Receipt Documents
                  <Button
                    variant="link"
                    size="sm"
                    className="text-success ms-1 p-0"
                    onClick={() => {
                      const lastFile = formData.receipt_files[formData.receipt_files.length - 1];

                      // Must upload before adding next row
                      if (!lastFile || (!(lastFile instanceof File) && typeof lastFile !== "string")) {
                        toast.error("Please upload the receipt file before adding another.");
                        return;
                      }

                      setFormData(prev => ({
                        ...prev,
                        receipt_files: [...prev.receipt_files, null],
                      }));
                    }}
                  >
                    + Add
                  </Button>
                </Form.Label>

                {formData.receipt_files.map((file, i) => (
                  <div key={i} className="d-flex align-items-center mb-2">

                    {/* File Input */}
                    <Form.Control
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const updated = [...formData.receipt_files];
                        updated[i] = e.target.files[0];
                        setFormData(prev => ({ ...prev, receipt_files: updated }));
                      }}
                    />

                    {/* Delete button (DISABLED for first row) */}
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger ms-2 p-0"
                      disabled={i === 0}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          receipt_files: prev.receipt_files.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      ❌
                    </Button>
                  </div>
                ))}

                {/* EXISTING FILE LINKS */}
                {formData.receipt_files.map((file, i) =>
                  typeof file === "string" ? (
                    <div key={`existing-${i}`} className="mt-1">
                      <a
                        href={`${API_BASE_URL.replace("/api", "")}/storage/${file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📄 View Uploaded File {i + 1}
                      </a>
                    </div>
                  ) : null
                )}
              </Form.Group>
            </Col>
          </Row>

        </Row>

        {/* ITEMS TABLE */}
        <h5>Service Items</h5>
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Product</th>
              <th>Serial / Quantity</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Image</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {formData.items.map((item, i) => (
              <tr key={i}>
                {/* PRODUCT */}
                <td>
                  <Form.Select
                    name="sparepart_id"
                    value={item.sparepart_id}
                    onChange={(e) => handleItemChange(i, e)}
                    isInvalid={!!errors[`sparepart_id_${i}`]}
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </td>

                {/* SERIAL / QTY */}
                <td>
                  {item.isPCB ? (
                    <Form.Control
                      type="text"
                      name="vci_serial_no"
                      placeholder="Enter Serial"
                      value={item.vci_serial_no}
                      onChange={(e) => handleItemChange(i, e)}
                      isInvalid={!!errors[`vci_serial_no_${i}`]}
                    />
                  ) : (
                    <Form.Control
                      type="number"
                      name="quantity"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(i, e)}
                      isInvalid={!!errors[`quantity_${i}`]}
                    />
                  )}
                </td>

                {/* STATUS */}
                <td>
                  <Form.Select
                    name="status"
                    value={item.status}
                    onChange={(e) => handleItemChange(i, e)}
                  >
                    <option value="">Select</option>
                    <option value="Inward">Inward</option>
                    <option value="Testing">Testing</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Return">Return</option>
                  </Form.Select>
                </td>

                {/* REMARKS */}
                <td>
                  <Form.Control
                    name="remarks"
                    value={item.remarks}
                    onChange={(e) => handleItemChange(i, e)}
                  />
                </td>

                {/* IMAGE */}
                <td>
                  <Form.Control
                    type="file"
                    name="upload_image"
                    onChange={(e) => handleItemChange(i, e)}
                  />

                  {item.upload_image && typeof item.upload_image === "string" && (
                    <a
                      href={item.upload_image}    // ← FIXED
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View File
                    </a>
                  )}
                </td>

                {/* ACTION */}
                <td className="text-center">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeRow(i)}
                  >
                    <IoTrashOutline />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Button variant="success" onClick={addRow}>
          + Add Row
        </Button>

        {/* SUBMIT BUTTONS */}
        <div className="mt-4 d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate("/service-product")}
          >
            Cancel
          </Button>

          <Button type="submit" variant="success">
            Update Service
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EditServicePage;
