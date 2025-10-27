import { useEffect, useState, useRef } from "react";
import { Button, Spinner, Form, Card, Offcanvas, Table } from "react-bootstrap";
import axios from "axios";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import BreadCrumb from "../components/BreadCrumb";
import Search from "../components/Search.jsx";
import Pagination from "../components/Pagination.jsx";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

const MySwal = withReactContent(Swal);

export default function TechnicianPage() {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [formData, setFormData] = useState(initialFormState());
  const [errors, setErrors] = useState({});
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  function initialFormState() {
    return { employee_id: "", name: "", };
  }

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/technicians`);
      setTechnicians(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      toast.error("Failed to fetch technicians.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTechnicians(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employee_id?.trim()) newErrors.employee_id = "Employee ID is required.";
    if (!formData.name?.trim()) newErrors.name = "Name is required.";
    return newErrors;
  };

  const saveTechnician = async (payload) => {
    try {
      if (editingTech) {
        await axios.put(`${API_BASE_URL}/technicians/${editingTech.id}`, payload);
        toast.success("Technician updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/technicians`, payload);
        toast.success("Technician added successfully!");
      }
      closeForm();
      fetchTechnicians();
    } catch (error) {
      console.error("Error saving technician:", error.response || error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        Object.values(error.response.data.errors).flat().forEach(msg => toast.error(msg));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save technician.");
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    await saveTechnician(formData);
  };

  const handleEdit = (tech) => {
    setEditingTech(tech);
    setFormData({
      employee_id: tech.employee_id || "",
      name: tech.name || "",
    });
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!"
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API_BASE_URL}/technicians/${id}`);
      toast.success("Technician deleted successfully!");
      if (editingTech?.id === id) closeForm();
      fetchTechnicians();
    } catch (error) {
      console.error("Error deleting technician:", error);
      toast.error("Failed to delete technician.");
    }
  };

  const openForm = () => { setEditingTech(null); setFormData(initialFormState()); setShowForm(true); setErrors({}); };
  const closeForm = () => { setShowForm(false); setEditingTech(null); setFormData(initialFormState()); setErrors({}); };

  const handleSort = (field) => {
    if (field === sortField) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  const errorStyle = { color: "#dc3545", fontSize: "13px", marginTop: "4px" };

  const filteredTechnicians = technicians
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.employee_id.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = (a[sortField] ?? "").toString().toLowerCase();
      const valB = (b[sortField] ?? "").toString().toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const paginated = filteredTechnicians.slice((page - 1) * perPage, page * perPage);

  const headerStyle = { backgroundColor: "#2E3A59", color: "white", fontSize: "0.82rem", height: "40px", verticalAlign: "middle" };

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="Technicians" />
      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2">
          <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
            <Form.Select
              size="sm"
              style={{ width: "100px" }}
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            >
              {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </Form.Select>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="d-inline-block mb-2">
              <Button variant="outline-secondary" size="sm" className="me-2" onClick={fetchTechnicians}>
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button size="sm" onClick={openForm} style={{ backgroundColor: "#2FA64F", borderColor: "#2FA64F", color: "#fff", padding: "0.25rem 0.5rem", minWidth: "90px", height: "28px" }}>
                + Add Technician
              </Button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <Search search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} setPage={setPage} />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
            <thead style={headerStyle}>
              <tr>
                <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
                <th onClick={() => handleSort("employee_id")} style={{ ...headerStyle, cursor: "pointer" }}>Employee ID {sortField === "employee_id" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                <th onClick={() => handleSort("name")} style={{ ...headerStyle, cursor: "pointer" }}>Name {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                <th style={{ ...headerStyle, width: "130px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4"><Spinner animation="border" /></td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    <img src="/empty-box.png" alt="No data" style={{ width: 80, opacity: 0.6 }} />
                  </td>
                </tr>
              ) : (
                paginated.map((t, i) => (
                  <tr key={t.id}>
                    <td className="text-center">{(page - 1) * perPage + i + 1}</td>
                    <td>{t.employee_id}</td>
                    <td>{t.name}</td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        className="me-1"
                        onClick={() => handleEdit(t)}
                        style={{ borderColor: "#2E3A59", backgroundColor: "transparent" }}
                      >
                        <i className="bi bi-pencil-square" style={{ color: "#2E3A59" }}></i>
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(t.id)} style={{ borderColor: "#2E3A59", color: "#2E3A59", backgroundColor: "transparent" }}><i className="bi bi-trash"></i></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <Pagination page={page} setPage={setPage} perPage={perPage} totalEntries={filteredTechnicians.length} />
      </Card>

      {/* Modal Offcanvas */}
      <Offcanvas show={showForm} onHide={closeForm} placement="end" backdrop="static" style={{ width: "400px" }}>
        <Offcanvas.Header className="border-bottom d-flex justify-content-between align-items-center">
          <Offcanvas.Title className="m-0">{editingTech ? "Edit Technician" : "Add New Technician"}</Offcanvas.Title>
          <Button variant="outline-secondary" onClick={closeForm} className="rounded-circle border-0 d-flex justify-content-center align-items-center" style={{ width: "32px", height: "32px" }}>
            <i className="bi bi-x-lg fs-6"></i>
          </Button>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column justify-content-between" style={{ fontSize: "0.85rem" }}>
          <form onSubmit={handleFormSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>
                Employee ID <span style={{ color: "#dc3545" }}>*</span>
              </Form.Label>              <Form.Control type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} isInvalid={!!errors.employee_id} />
              {errors.employee_id && <Form.Control.Feedback type="invalid" className="d-block">{errors.employee_id}</Form.Control.Feedback>}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Name <span style={{ color: "#dc3545" }}>*</span>
              </Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} isInvalid={!!errors.name} />
              {errors.name && <Form.Control.Feedback type="invalid" className="d-block">{errors.name}</Form.Control.Feedback>}
            </Form.Group>

            <div className="border-top pt-3 mt-2 d-flex justify-content-end gap-2">
              <Button type="submit" variant="success">{editingTech ? "Update" : "Save"}</Button>
            </div>
          </form>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
