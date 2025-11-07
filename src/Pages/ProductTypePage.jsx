import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Spinner,
  Form,
  Card,
  Table,
  Offcanvas,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // ✅ for icons

// Custom components
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";

// API base URL
import { API_BASE_URL } from "../api";

export default function ProductTypePage() {
  const [productTypes, setProductTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [typeName, setTypeName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [validationErrors, setValidationErrors] = useState({});

  const MySwal = withReactContent(Swal);

  useEffect(() => {
    fetchProductTypes();
    fetchProducts();
  }, []);

  const fetchProductTypes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/product-types`);
      setProductTypes(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to fetch product types!");
      setProductTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/product`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to fetch products!");
    }
  };

  const handleAddNewClick = () => {
    setEditingTypeId(null);
    setTypeName("");
    setSelectedProductId("");
    setValidationErrors({});
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setTypeName("");
    setSelectedProductId("");
    setEditingTypeId(null);
    setValidationErrors({});
  };

  const handleEdit = (type) => {
    setEditingTypeId(type.id);
    setTypeName(type.name);
    setSelectedProductId(type.product_id || "");
    setValidationErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    setValidationErrors({});
    let errors = {};

    if (!selectedProductId) {
      errors.product = "Please select a product!";
    }
    if (!typeName.trim()) {
      errors.typeName = "Product type name is required!";
    }

    const duplicate = productTypes.some(
      (p) =>
        p.name.trim().toLowerCase() === typeName.trim().toLowerCase() &&
        Number(p.product_id) === Number(selectedProductId) &&
        p.id !== editingTypeId
    );

    if (duplicate) {
      errors.typeName = "Product type already exists for this product!";
    }

    if (Object.keys(errors).length > 0) {
      // ✅ Only set validationErrors to show messages in UI
      setValidationErrors(errors);
      return;
    }

    const payload = {
      name: typeName.trim(),
      product_id: Number(selectedProductId),
    };

    try {
      if (editingTypeId) {
        const res = await axios.put(
          `${API_BASE_URL}/product-types/${editingTypeId}`,
          payload
        );
        if (res.status === 200) {
          toast.success("Product type updated successfully!");

          // Update in-place
          setProductTypes((prev) =>
            prev.map((p) => (p.id === editingTypeId ? { ...p, ...payload } : p))
          );
        }
      } else {
        const res = await axios.post(`${API_BASE_URL}/product-types`, payload);
        if (res.status === 201) {
          toast.success("Product type added successfully!");

          // Add new type at the end or start
          const newType = { id: res.data.id, ...payload };
          setProductTypes((prev) => [newType, ...prev]);
        }
      }

      handleModalClose();
    } catch {
      toast.error("Failed to save product type!");
    }
  };

  const handleDelete = async (id) => {
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
          await axios.delete(`${API_BASE_URL}/product-types/${id}`);
          toast.success("Product type deleted!");
          await fetchProductTypes();
        } catch {
          toast.error("Failed to delete product type!");
        }
      }
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredTypes = productTypes.filter((type) => {
    const product = products.find((p) => p.id === type.product_id);
    const productName = product ? product.name.toLowerCase() : "";
    const typeName = type.name.toLowerCase();
    const query = search.toLowerCase();

    return typeName.includes(query) || productName.includes(query);
  });


  const sortedTypes = [...filteredTypes].sort((a, b) => {
    if (!sortField) return 0;

    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === "product") {
      const prodA = products.find((p) => p.id === a.product_id);
      const prodB = products.find((p) => p.id === b.product_id);
      valA = prodA ? prodA.name : "";
      valB = prodB ? prodB.name : "";
    } else if (sortField === "name") {
      valA = a.name;
      valB = b.name;
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedTypes = sortedTypes.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
    fontSize: "0.82rem",
    height: "40px",
    verticalAlign: "middle",
  };

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="Product Types" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        {/* Header */}
        <div className="row mb-2">
          <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
            <Form.Select
              size="sm"
              style={{ width: "100px" }}
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Form.Select>
          </div>

          <div className="col-md-6 text-md-end" style={{ fontSize: "0.8rem" }}>
            <div className="mt-2 d-inline-block mb-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={fetchProductTypes}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button
                size="sm"
                onClick={handleAddNewClick}
                style={{
                  backgroundColor: "#2FA64F",
                  borderColor: "#2FA64F",
                  color: "#fff",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem",
                  minWidth: "90px",
                  height: "28px",
                }}
              >
                + Add Type
              </Button>
            </div>
            <div className="d-flex justify-content-end align-items-center">
              <Search
                search={search}
                setSearch={setSearch}
                perPage={perPage}
                setPerPage={setPerPage}
                setPage={setPage}
                style={{ fontSize: "0.8rem" }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <Table
            className="table-sm align-middle mb-0"
            style={{ fontSize: "0.85rem" }}
          >
            <thead style={headerStyle}>
              <tr>
                <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
                <th
                  onClick={() => handleSort("name")}
                  style={{ ...headerStyle, cursor: "pointer" }}
                >
                  Product Type {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("product")}
                  style={{ ...headerStyle, cursor: "pointer" }}
                >
                  Product {sortField === "product" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ ...headerStyle, width: "130px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedTypes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">
                    <img src="/empty-box.png" alt="No types found" style={{ width: "80px", opacity: 0.6 }} />
                  </td>
                </tr>
              ) : (
                paginatedTypes.map((type, index) => {
                  const product = products.find((p) => p.id === type.product_id);
                  return (
                    <tr key={type.id}>
                      <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                      <td style={{ fontSize: "0.90rem" }}>{type.name}</td>
                      <td style={{ fontSize: "0.90rem" }}>{product ? product.name : "-"}</td>
                      <td className="text-center">
                        <Button
                          variant=""
                          size="sm"
                          className="me-1"
                          onClick={() => handleEdit(type)}
                          style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                          style={{ borderColor: "#2E3A59", color: "#2E3A59", backgroundColor: "transparent" }}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>

        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={filteredTypes.length}
        />
      </Card>

      {/* Offcanvas Modal */}
      <Offcanvas
        show={showModal}
        onHide={handleModalClose}
        placement="end"
        backdrop="static"
        style={{ width: "400px" }}
      >
        <Offcanvas.Header className="border-bottom d-flex justify-content-between align-items-center">
          <Offcanvas.Title className="m-0">
            {editingTypeId ? "Edit Product Type" : "Add New Product Type"}
          </Offcanvas.Title>
          <Button
            variant="outline-secondary"
            onClick={handleModalClose}
            className="rounded-circle border-0 d-flex justify-content-center align-items-center"
            style={{ width: "32px", height: "32px" }}
          >
            <i className="bi bi-x-lg fs-6"></i>
          </Button>
        </Offcanvas.Header>

        <Offcanvas.Body
          className="d-flex flex-column justify-content-between"
          style={{ fontSize: "0.85rem" }}
        >
          <div>
            <Form.Group className="mb-3">
              <Form.Label>Product</Form.Label>
              <Form.Select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, product: "" }));
                }}
                isInvalid={!!validationErrors.product}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
              {validationErrors.product && (
                <p className="text-danger mt-1" style={{ fontSize: "0.8rem" }}>
                  <i className="bi bi-exclamation-triangle-fill"></i> {validationErrors.product}
                </p>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Product Type</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Product Type Name"
                value={typeName}
                onChange={(e) => {
                  setTypeName(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, typeName: "" }));
                }}
                isInvalid={!!validationErrors.typeName}
              />
              {validationErrors.typeName && (
                <p className="text-danger mt-1" style={{ fontSize: "0.8rem" }}>
                  <i className="bi bi-exclamation-triangle-fill"></i> {validationErrors.typeName}
                </p>
              )}
            </Form.Group>
          </div>

          <div className="border-top pt-3 mt-2 d-flex justify-content-end gap-2">
            {/* <Button variant="outline-danger" onClick={handleModalClose}>
              Cancel
            </Button> */}
            <Button variant="success" onClick={handleSave}>
              {editingTypeId ? "Update" : "Save"}
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
