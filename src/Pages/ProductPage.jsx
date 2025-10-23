import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Form, Card, Table, Offcanvas } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";

import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";

import { API_BASE_URL } from "../api";

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [productName, setProductName] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [productNameError, setProductNameError] = useState(false);

  const MySwal = withReactContent(Swal);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/product`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to fetch products!");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = () => {
    setEditingProductId(null);
    setProductName("");
    setProductNameError(false);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setProductName("");
    setEditingProductId(null);
    setProductNameError(false);
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductNameError(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!productName.trim()) {
      setProductNameError(true);
      return;
    }
    setProductNameError(false);

    const duplicate = products.some(
      (p) =>
        p.name.toLowerCase() === productName.trim().toLowerCase() &&
        p.id !== editingProductId
    );
    if (duplicate) {
      toast.error("Product already exists!");
      return;
    }

    const payload = { name: productName.trim() };

    try {
      if (editingProductId) {
        await axios.put(`${API_BASE_URL}/product/${editingProductId}`, payload);
        toast.success("Product updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/product`, payload);
        toast.success("Product added successfully!");
      }
      await fetchProducts();
      handleModalClose();
    } catch {
      toast.error("Failed to save product!");
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
          await axios.delete(`${API_BASE_URL}/product/${id}`);
          toast.success("Product deleted!");
          await fetchProducts();
        } catch {
          toast.error("Failed to delete product!");
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

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0;

    let valA = a[sortField];
    let valB = b[sortField];

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedProducts = sortedProducts.slice(
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
      <BreadCrumb title="Products" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
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
                onClick={fetchProducts}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>

              <Button
                type="button"
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
                + Add Product
              </Button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
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

        <div className="table-responsive">
          <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
            <thead style={headerStyle}>
              <tr>
                <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
                <th
                  onClick={() => handleSort("name")}
                  style={{ ...headerStyle, cursor: "pointer" }}
                >
                  Product Name{" "}
                  {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ ...headerStyle, width: "130px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-muted">
                    <img src="/empty-box.png" alt="No products found" style={{ width: "80px", opacity: 0.6 }} />
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, index) => (
                  <tr key={product.id}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td>{product.name}</td>
                    <td className="text-center">
                      <Button
                        variant=""
                        size="sm"
                        className="me-1"
                        onClick={() => handleEdit(product)}
                        style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        style={{
                          borderColor: "#2E3A59",
                          color: "#2E3A59",
                          backgroundColor: "transparent",
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={filteredProducts.length}
        />
      </Card>

      {/* Modal Offcanvas */}
      <Offcanvas
        show={showModal}
        onHide={handleModalClose}
        placement="end"
        backdrop="static"
        style={{ width: "400px" }}
      >
        <Offcanvas.Header className="border-bottom d-flex justify-content-between align-items-center">
          <Offcanvas.Title className="m-0">
            {editingProductId ? "Edit Product" : "Add New Product"}
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
              <Form.Label>Product Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Product Name"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  if (productNameError && e.target.value.trim()) {
                    setProductNameError(false);
                  }
                }}
                isInvalid={productNameError}
              />
              {productNameError && (
                <Form.Control.Feedback type="invalid" className="d-block">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  Product name is required!
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </div>

          <div className="border-top pt-3 mt-2 d-flex justify-content-end gap-2">
            {/* <Button variant="outline-danger" onClick={handleModalClose}>
              Cancel
            </Button> */}
            <Button variant="success" onClick={handleSave}>
              {editingProductId ? "Update" : "Save"}
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}