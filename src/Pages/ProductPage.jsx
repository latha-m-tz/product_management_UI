import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Spinner,
  Form,
  Card,
  Table,
  Offcanvas,
  Row,
  Col,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Select from "react-select";

import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import { API_BASE_URL } from "../api";

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [spareparts, setSpareparts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [productName, setProductName] = useState("");
  const [requirementPerProduct, setRequirementPerProduct] = useState("");
  const [productTypeName, setProductTypeName] = useState("");
  const [selectedSpareparts, setSelectedSpareparts] = useState([]);
  const [productNameError, setProductNameError] = useState(false);

  const [editingProductId, setEditingProductId] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const MySwal = withReactContent(Swal);

  useEffect(() => {
    fetchProducts();
    fetchSpareparts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/product`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to fetch products!");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpareparts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/spareparts/get`);
      setSpareparts(Array.isArray(res.data) ? res.data : res.data.spareparts || []);
    } catch {
      toast.error("Failed to load spare parts!");
    }
  };

  const handleAddNewClick = () => {
    setEditingProductId(null);
    setProductName("");
    setRequirementPerProduct("");
    setProductTypeName("vci");
    setSelectedSpareparts([]);
    setProductNameError(false);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProductId(null);
    setProductName("");
    setRequirementPerProduct("");
    setProductTypeName("");
    setSelectedSpareparts([]);
    setProductNameError(false);
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setProductName(product.name);
    setRequirementPerProduct(product.requirement_per_product || "");
    setProductTypeName(product.product_type_name || "");

    const mapped = product.spareparts?.map((sp) => ({
      id: sp.id,
      name: sp.name,
      required_quantity: sp.required_per_product || 0,
    })) || [];
    setSelectedSpareparts(mapped);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!productName.trim()) {
      setProductNameError(true);
      return;
    }

    const payload = {
      name: productName.trim(),
      requirement_per_product: requirementPerProduct || 0,
      product_type_name: productTypeName || "",
      sparepart_requirements: selectedSpareparts.map((sp) => ({
        id: sp.id,
        required_quantity: Number(sp.required_quantity || 0),
      })),
    };

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
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product!");
    }
  };

  const handleDelete = async (id) => {
    MySwal.fire({
      title: "Are you sure?",
      text: "This will delete the product!",
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
                <option key={n} value={n}>{n}</option>
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

            <div className="d-flex justify-content-end align-items-center">
              <Search
                search={search}
                setSearch={setSearch}
                perPage={perPage}
                setPerPage={setPerPage}
                setPage={setPage}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
            <thead style={headerStyle}>
              <tr>
                <th style={{ width: "60px", textAlign: "center", backgroundColor: "#2E3A59", color: "white" }}>S.No</th>
                <th onClick={() => handleSort("name")} style={{ cursor: "pointer", backgroundColor: "#2E3A59", color: "white" }}>
                  Product Name {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ cursor: "pointer", backgroundColor: "#2E3A59", color: "white" }} onClick={() => handleSort("product_type_name")}>
                  Product Type {sortField === "product_type_name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ width: "130px", textAlign: "center", backgroundColor: "#2E3A59", color: "white" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4"><Spinner animation="border" /></td></tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    <img src="/empty-box.png" alt="No products found" style={{ width: "80px", opacity: 0.6 }} />
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, index) => (
                  <tr key={product.id}>
                    <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                    <td>{product.name}</td>
                    <td>{product.product_type_name || "-"}</td>
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

      {/* Offcanvas Modal */}
      <Offcanvas show={showModal} onHide={handleModalClose} placement="end" backdrop="static" style={{ width: "420px" }}>
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

        <Offcanvas.Body style={{ fontSize: "0.85rem" }}>
          <Form.Group className="mb-3">
            <Form.Label>Product Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              isInvalid={productNameError}
            />
            {productNameError && (
              <Form.Control.Feedback type="invalid">
                Product name is required
              </Form.Control.Feedback>
            )}
          </Form.Group>

         <Form.Group className="mb-3">
  <Form.Label>Product Type</Form.Label>
  <Form.Select
    value={productTypeName || "VCI"} // default to VCI
    onChange={(e) => setProductTypeName(e.target.value)}
  >
    <option value="VCI">vci</option>
    {/* Add more options as needed */}
  </Form.Select>
</Form.Group>


          {/* <Form.Group className="mb-3">
            <Form.Label>Requirement per Product</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter Requirement Quantity"
              value={requirementPerProduct}
              onChange={(e) => setRequirementPerProduct(e.target.value)}
            />
          </Form.Group> */}

          <Form.Group className="mb-3">
            <Form.Label>Spareparts with Required Quantity</Form.Label>
            <Select
              isMulti
              placeholder="Select Spareparts..."
              value={selectedSpareparts.map((sp) => ({
                value: sp.id,
                label: `${sp.name} (${sp.required_quantity || 0})`,
              }))}
              onChange={(options) => {
                const updated = options.map((opt) => {
                  const existing = selectedSpareparts.find((sp) => sp.id === opt.value);
                  return existing || { id: opt.value, name: opt.label, required_quantity: 0 };
                });
                setSelectedSpareparts(updated);
              }}
              options={spareparts.map((sp) => ({ value: sp.id, label: sp.name }))}
            />
            {selectedSpareparts.map((sp, idx) => (
              <Row key={sp.id} className="align-items-center mt-2">
                <Col xs={7}>{sp.name}</Col>
                <Col xs={5}>
                  <Form.Control
                    type="number"
                    value={sp.required_quantity}
                    onChange={(e) => {
                      const newList = [...selectedSpareparts];
                      newList[idx].required_quantity = e.target.value;
                      setSelectedSpareparts(newList);
                    }}
                    placeholder="Qty"
                  />
                </Col>
              </Row>
            ))}
          </Form.Group>

          <div className="border-top pt-3 mt-2 d-flex justify-content-end">
            <Button variant="success" onClick={handleSave}>
              {editingProductId ? "Update" : "Save"}
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
