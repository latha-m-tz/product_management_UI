import { useEffect, useState, useRef } from "react";
import { Button, Spinner, Form, Card, Offcanvas } from "react-bootstrap";
import axios from "axios";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import BreadCrumb from "../components/BreadCrumb";
import Search from "../components/Search.jsx";
import Pagination from "../components/Pagination.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import Select from "react-select";

const MySwal = withReactContent(Swal);

export default function App() {
  const navigate = useNavigate();
  const [spareparts, setSpareparts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [formData, setFormData] = useState(initialFormState());
  const [errors, setErrors] = useState({});
  const tableRef = useRef(null);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const location = useLocation();
  const [productTypes, setProductTypes] = useState([]);

  function initialFormState() {
    return {
      name: "",
      code: "",
      sparepart_type: "",
      sparepart_usages: [],
      required_per_vci: 1,

    };
  }

  const fetchSpareparts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/spareparts/get`);
      const fetchedData = response.data.spareparts ?? [];
      setSpareparts(fetchedData);
    } catch (error) {
      console.error("Error fetching spareparts:", error);
      toast.error("Failed to fetch spare parts.", { toastId: "fetch-fail" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpareparts();
  }, []);
  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/product-types`);
        setProductTypes(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Error fetching product types:", err);
        toast.error("Failed to load product types.");
      }
    };
    fetchProductTypes();
  }, []);

  const saveSparepart = async (payload) => {
    try {
      let response;
      if (editingPart) {
        response = await axios.put(`${API_BASE_URL}/spareparts/${editingPart.id}`, payload);

        // ✅ Update the edited item locally instead of refetching full list
        setSpareparts((prev) =>
          prev.map((part) =>
            part.id === editingPart.id ? { ...part, ...payload } : part
          )
        );
      } else {
        response = await axios.post(`${API_BASE_URL}/spareparts`, payload);

        // ✅ Add new spare part to the top of the list (optional: or push at bottom)
        setSpareparts((prev) => [response.data.sparepart, ...prev]);
      }

      toast.success(`Spare part ${editingPart ? "updated" : "added"} successfully!`);
      closeForm();
    } catch (error) {
      console.error("Error saving sparepart:", error.response || error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        Object.values(error.response.data.errors)
          .flat()
          .forEach((msg) => toast.error(msg));
      } else if (error.response?.data?.message) {
        toast.error(`Failed to save spare part: ${error.response.data.message}`);
      } else {
        toast.error("Failed to save spare part due to a network or server error.");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };


  const handleMultiSelectChange = (selectedOptions, name) => {
    const values = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setFormData((prev) => ({ ...prev, [name]: values }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    // if (!formData.code || !formData.code.trim()) newErrors.code = "Spare Part Code is required.";
    if (!formData.name || !formData.name.trim()) newErrors.name = "Spare Part Name is required.";
    if (!formData.sparepart_type || !formData.sparepart_type.trim()) newErrors.sparepart_type = "Spare part Type is required.";
    return newErrors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const payload = {
      code: formData.code.trim()|| "",
      name: formData.name.trim(),
       sparepart_type: formData.sparepart_type.trim(),
      // sparepart_usages: Array.isArray(formData.sparepart_usages)
      //   ? formData.sparepart_usages.join(",")
      //   : formData.sparepart_usages,

    };
    await saveSparepart(payload);
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this spare part?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
      customClass: { popup: "custom-compact" }
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API_BASE_URL}/spareparts/${id}/del`);
      toast.success("Spare part deleted successfully!");
      if (editingPart?.id === id) closeForm();
      fetchSpareparts();
    } catch (error) {
      console.error("Error deleting:", error);
      if (error.response?.data?.message) {
        toast.error(`Failed to delete spare part: ${error.response.data.message}`);
      } else {
        toast.error("Failed to delete spare part.");
      }
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEdit = (part) => {
    setEditingPart(part);
    setFormData({
      name: part.name || "",
      code: part.code || "",
      sparepart_type: part.sparepart_type || "",
      // sparepart_usages: (part.sparepart_usages ? part.sparepart_usages.split(",") : []),
      // required_per_vci: part.required_per_vci ?? 1,
    });
    setShowForm(true);
    setErrors({});
  };

  const openForm = () => {
    setEditingPart(null);
    setFormData(initialFormState());
    setShowForm(true);
    setErrors({});
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPart(null);
    setFormData(initialFormState());
    setErrors({});
  };

  const errorStyle = { color: "#dc3545", fontSize: "13px", marginTop: "4px" };

  const paginated = spareparts
    .filter(part => {
      const searchLower = search.toLowerCase();
      return (
        part.name?.toLowerCase().includes(searchLower) ||
        (part.code ?? "").toLowerCase().includes(searchLower) ||
        (part.vendor ?? "").toLowerCase().includes(searchLower) ||
        (part.is_active ?? "").toString().toLowerCase().includes(searchLower) ||
        (part.quantity ?? "").toString().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const valueA = (a[sortField] ?? "").toString().toLowerCase();
      const valueB = (b[sortField] ?? "").toString().toLowerCase();
      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    })
    .slice((page - 1) * perPage, page * perPage);

  return (
    <div className="px-4 " style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="Spare Parts" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2 form-field">
          <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
            <Form.Select
              size="sm"
              style={{ width: "100px" }}
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            >
              {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </Form.Select>
          </div>
          <div className="col-md-6 text-md-end" style={{ fontSize: '0.8rem' }}>
            <div className="mt-2 d-inline-block mb-2 form-field" style={{ fontSize: '0.8rem' }}>
              <Button variant="outline-secondary" size="sm" className="me-2" onClick={fetchSpareparts}>
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button
                size="sm"
                onClick={openForm}
                style={{
                  backgroundColor: '#2FA64F',
                  borderColor: '#2FA64F',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  minWidth: '90px',
                  height: '28px',
                }}
                className="btn-success text-white"
              >
                + Add Spare Part
              </Button>
            </div>
            <Search search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} setPage={setPage} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0 form-field" ref={tableRef}>
            <thead>
              <tr>
                <th
                  style={{
                    backgroundColor: "#2E3A59",
                    color: "white",
                    fontSize: "0.82rem",
                    height: "40px",
                    textAlign: "center"
                  }}
                >
                  S.No
                </th>

                <th
                  onClick={() => handleSort("name")}
                  style={{
                    backgroundColor: "#2E3A59",
                    color: "white",
                    fontSize: "0.82rem",
                    height: "40px",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  Spare Part Name{" "}
                  {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>

                <th
                  onClick={() => handleSort("code")}
                  style={{
                    backgroundColor: "#2E3A59",
                    color: "white",
                    fontSize: "0.82rem",
                    height: "40px",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  Code{" "}
                  {sortField === "code" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>

                {/* ✅ NEW COLUMN */}
                <th
                  style={{
                    backgroundColor: "#2E3A59",
                    color: "white",
                    fontSize: "0.82rem",
                    height: "40px",
                    textAlign: "center"
                  }}
                >
                  Available Quantity
                </th>

                <th
                  style={{
                    backgroundColor: "#2E3A59",
                    color: "white",
                    fontSize: "0.82rem",
                    height: "40px",
                    width: "130px",
                    textAlign: "center"
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>



            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4"><Spinner animation="border" /></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted"><img src="/empty-box.png" alt="No data" style={{ width: 80, height: 100, opacity: 0.6 }} /></td></tr>
              ) : (
                paginated.map((part, index) => (
                  <tr key={part.id}>
                    <td className="text-center" style={{ width: "70px" }}>{(page - 1) * perPage + index + 1}</td>
                    <td className="text-start" style={{ wordBreak: "break-word", fontSize: "0.90rem" }}>{part.name}</td>

                    <td className="text-center" style={{ wordBreak: "break-word", fontSize: "0.90rem" }}>{part.code ?? "-"}</td>
                    <td className="text-center" style={{ wordBreak: "break-word", fontSize: "0.90rem" }}>
                      {part.available_quantity ?? 0}
                    </td>

                    <td className="text-center" style={{ width: "130px" }}>
                      <Button variant="" size="sm" className="me-1" onClick={() => handleEdit(part)} style={{ borderColor: "#2E3A59", color: "#2E3A59" }}>
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                      <Button variant="outline-primary" size="sm" onClick={() => handleDelete(part.id)} style={{ borderColor: "#2E3A59", color: "#2E3A59" }}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} setPage={setPage} perPage={perPage} totalEntries={spareparts.length} />
      </Card>

      {showForm && (
        <Offcanvas show={showForm} onHide={closeForm} placement="end" backdrop="static" scroll={true} className="custom-offcanvas">
          <Offcanvas.Header className="border-bottom px-3 py-2 d-flex align-items-center">
            <h6 className="fw-bold mb-0b form-field">{editingPart ? "Edit Spare Part" : "Add New Spare Part"}</h6>
            <Button variant="outline-secondary" onClick={closeForm} className="rounded-circle border-0 d-flex align-items-center justify-content-center ms-auto p-0" style={{ width: "28px", height: "28px" }}>
              <i className="bi bi-x-lg" style={{ fontSize: "14px" }}></i>
            </Button>
          </Offcanvas.Header>
          <Offcanvas.Body className="px-3 py-2" style={{ fontSize: "14px" }}>
            <form onSubmit={handleFormSubmit}>
              <div className="row g-2">

                <div className="mb-2 col-12 form-field">
                  <Form.Label className="mb-1" style={{ fontSize: "13px", fontWeight: 500 }}>Spare Part Name <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} className="custom-placeholder" placeholder="Enter Name" isInvalid={!!errors.name} style={{ height: "34px", fontSize: "13px" }} />
                  <Form.Control.Feedback type="invalid" style={errorStyle}>{errors.name}</Form.Control.Feedback>
                </div>

                <div className="mb-2 col-12 form-field">
<Form.Label className="mb-1" style={{ fontSize: "13px", fontWeight: 500 }}>
  Spare Part Code
</Form.Label>
                  <Form.Control type="text" name="code" value={formData.code} onChange={handleChange} className="custom-placeholder" placeholder="Enter Code" isInvalid={!!errors.code} style={{ height: "34px", fontSize: "13px" }} />
                  <Form.Control.Feedback type="invalid" style={errorStyle}>{errors.code}</Form.Control.Feedback>
                </div>
                                <div className="mb-2 col-12 form-field">
                  <Form.Label className="mb-1" style={{ fontSize: "13px", fontWeight: 500 }}>Spare part Type <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Select name="sparepart_type" value={formData.sparepart_type} onChange={handleChange} className="custom-placeholder" isInvalid={!!errors.sparepart_type} style={{ height: "34px", fontSize: "13px" }}>
                    <option value="">-- Select Type --</option>
                    <option value="serial_based">Serial Based</option>
                    <option value="warranty_based">Warranty Based</option>
                    <option value="quantity_based">Quantity Based</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid" style={errorStyle}>{errors.sparepart_type}</Form.Control.Feedback>
                </div>
{/* 

                <div className="mb-2 col-12 form-field">
                  <Form.Label className="mb-1" style={{ fontSize: "13px", fontWeight: 500 }}>
                    Spare Part Usage <span style={{ color: "red" }}>*</span>
                  </Form.Label>

                  <Select
                    isMulti
                    name="sparepart_usages"
                    value={formData.sparepart_usages.map((val) => ({
                      value: val,
                      label: val,
                    }))}
                    onChange={(selected) => handleMultiSelectChange(selected, "sparepart_usages")}
                    options={productTypes.map((pt) => {
                      const usage =
                        pt.product?.name ? `${pt.product.name} (${pt.name})` : pt.name;
                      return { value: usage, label: usage };
                    })}
                    placeholder="Select or search usage..."
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        minHeight: "34px",
                        height: "34px",
                        fontSize: "13px",
                        borderColor: errors.sparepart_usages ? "red" : base.borderColor,
                        boxShadow: state.isFocused ? "0 0 0 1px #0f1010ff" : "none",
                        "&:hover": { borderColor: "#0f1010ff" },
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        padding: "0 6px",
                        display: "flex",
                        flexWrap: "nowrap",
                        overflowX: "auto",
                        scrollbarWidth: "none", // Firefox
                        msOverflowStyle: "none", // IE
                        "&::-webkit-scrollbar": { display: "none" }, // Chrome/Safari
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: "#E8F5E9",
                        borderRadius: "12px",
                        padding: "0 4px",
                        margin: "1px 2px",
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        fontSize: "12px",
                        color: "#2E3A59",
                        padding: "2px 4px",
                      }),
                      multiValueRemove: (base) => ({
                        ...base,
                        color: "#2E3A59",
                        cursor: "pointer",
                        ":hover": { backgroundColor: "#0f1010ff", color: "white" },
                      }),
                      indicatorsContainer: (base) => ({
                        ...base,
                        height: "32px",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        padding: "0 4px",
                      }),
                      clearIndicator: (base) => ({
                        ...base,
                        padding: "0 4px",
                      }),
                      menu: (base) => ({
                        ...base,
                        fontSize: "13px",
                        zIndex: 9999,
                      }),
                    }}
                  />


                  {errors.sparepart_usages && (
                    <div style={{ color: "red", fontSize: "12px" }}>
                      {errors.sparepart_usages}
                    </div>
                  )}
                </div>


                <div className="mb-2 col-12 form-field">
                  <Form.Label className="mb-1" style={{ fontSize: "13px", fontWeight: 500 }}>
                    Required per VCI <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="required_per_vci"
                    value={formData.required_per_vci}
                    onChange={handleChange}
                    min={1}
                    className="custom-placeholder"
                    placeholder="Enter required quantity per VCI"
                    isInvalid={!!errors.required_per_vci}
                    style={{ height: "34px", fontSize: "13px" }}
                  />
                  <Form.Control.Feedback type="invalid" style={errorStyle}>
                    {errors.required_per_vci}
                  </Form.Control.Feedback>
                </div> */}

              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <Button type="submit" variant="success" className="btn-common btn-save">{editingPart ? "Update" : "Save"}</Button>
              </div>
            </form>
          </Offcanvas.Body>
        </Offcanvas>
      )}

      <style>{`
        /* Your full custom styles from previous snippet */
        .slide-in { position: fixed; top: 0; right: 0; width: 600px; height: 100vh; transition: right 0.4s ease-in-out; z-index: 2000; }
        .slide-out { position: fixed; top: 0; right: -600px; width: 600px; height: 100vh; transition: right 0.4s ease-in-out; z-index: 2000; }
        .custom-offcanvas .form-select { font-size: 16px; padding: 4px 22px 5px 10px; height: 34px; line-height: 1.3; }
        .custom-offcanvas .form-control { font-size: 14px; height: 34px; padding: 4px 10px; line-height: 1.3; }
        .custom-offcanvas .custom-dropdown-container { height: 32px; }
        .custom-offcanvas .custom-dropdown-toggle { font-size: 14px; padding: 4px 10px; }
        .custom-table th, .custom-table td { font-weight: 400; font-size: 16px; color: #212529; white-space: normal; }
        .flex-grow-1 { overflow-x: auto !important; }
        .custom-placeholder::placeholder { font-family: 'Product Sans', sans-serif; font-weight: 400; color: #828282; }
        .form-control:focus { border-color: #CED4DA !important; box-shadow: none !important; }
        .form-control:valid { border-color: #CED4DA !important; box-shadow: none !important; }
        .form-control.is-invalid ~ .invalid-feedback { display: block; }
        .custom-dropdown-container { position: relative; width: 100%; height: 50px; }
        .custom-dropdown-toggle { height: 100%; font-family: "Product Sans, sans-serif"; font-weight: 400; font-size: 16px; border-radius: 4px; border: 1px solid #D3DBD5; background-color: #FFFFFF; color: #212529; padding: 0 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .custom-dropdown-toggle.is-invalid { border-color: #dc3545; }
        .custom-dropdown-toggle .selected-value { line-height: 1.5; flex-grow: 1; padding-right: 1rem; }
        .custom-dropdown-arrow { font-size: 1rem; color: #6c757d; transition: transform 0.2s ease-in-out; }
        .custom-dropdown-toggle.active .custom-dropdown-arrow { transform: rotate(180deg); }
        .custom-dropdown-menu { position: absolute; top: 100%; left: 0; width: 100%; z-index: 1000; background-color: #fff; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-top:5px; overflow:hidden; }
        .custom-dropdown-item { padding:10px 15px; cursor:pointer; font-family:"Product Sans, sans-serif"; font-weight:400; font-size:16px; color:#212529; }
        .custom-dropdown-item:hover { background-color:#f1f1f1; }
        .drawer { position: fixed; top: 63px; right: 0; width: 600px; height: 100vh; background-color: #fff; box-shadow: -2px 0 10px rgba(0,0,0,0.1); z-index: 2000; padding:30px; overflow-y:auto; border-left:1px solid #dee2e6; transition: transform 1s ease-in-out, opacity 1s ease-in-out; transform: translateX(100%); opacity:0; pointer-events:none; visibility:hidden; }
        .drawer.show { transform: translateX(0%); opacity:1; pointer-events:auto; visibility:visible; }
      `}</style>
    </div>
  );
}
