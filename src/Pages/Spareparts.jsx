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
import "datatables.net-dt/css/dataTables.dataTables.css";
import { useLocation, useNavigate } from "react-router-dom";

const MySwal = withReactContent(Swal);
import { API_BASE_URL } from "../api";

//   const dropdownRef = useRef(null);

//   const handleToggle = () => setIsOpen(!isOpen);

//   const handleOptionClick = (optionValue) => {
//     onChange({ target: { name, value: optionValue } });
//     setIsOpen(false);
//   };

//   const handleClickOutside = (event) => {
//     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//       setIsOpen(false);
//     }
//   };

//   useEffect(() => {
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const selectedLabel = options.find(option => option.value === value)?.label || "Select Status";

//   return (
//     <div ref={dropdownRef} className="custom-dropdown-container">
//       <div
//         className={`custom-dropdown-toggle ${isOpen ? 'active' : ''} ${isInvalid ? 'is-invalid' : ''}`}
//         onClick={handleToggle}
//         style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
//       >
//         <span className="selected-value">{selectedLabel}</span>
//         <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} custom-dropdown-arrow`}></i>
//       </div>
//       {isOpen && (
//         <div className="custom-dropdown-menu">
//           {options.map((option) => (
//             <div
//               key={option.value}
//               className="custom-dropdown-item"
//               onClick={() => handleOptionClick(option.value)}
//             >
//               {option.label}
//             </div>
//           ))}
//         </div>
//       )}
//       {isInvalid && <div className="invalid-feedback" style={{ color: "#dc3545", fontSize: "13px", marginTop: "4px", display: 'block' }}>{error}</div>}
//     </div>
//   );
// };

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
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const location = useLocation();


  function initialFormState() {
    return {
      name: "",
      sparepart_type: "",
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
    // just fetch directly, no token check
    fetchSpareparts();
  }, []);

  // useEffect(() => {

  //   if ($.fn.DataTable.isDataTable(tableRef.current)) {
  //     $(tableRef.current).DataTable().destroy();
  //   }
  //   if (spareparts.length > 0) {
  //     $(tableRef.current).DataTable({
  //       ordering: true,
  //       paging: false,
  //       searching: false,
  //       lengthChange: false,
  //       info: false,
  //       columnDefs: [{ targets: 0, className: "text-center" }],
  //     });
  //   }
  // }, [spareparts]);

  // saveSparepart now posts/puts only { name, sparepart_type }
  const saveSparepart = async (payload) => {
    try {
      let response;
      if (editingPart) {
        response = await axios.put(`${API_BASE_URL}/spareparts/${editingPart.id}`, payload);
      } else {
        response = await axios.post(`${API_BASE_URL}/spareparts`, payload);
      }
      toast.success(`Spare part ${editingPart ? "updated" : "added"} successfully!`);
      closeForm();
      fetchSpareparts();
    } catch (error) {
      console.error("Error saving sparepart:", error.response || error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        Object.values(error.response.data.errors).flat().forEach(msg => {
          toast.error(msg);
        });
      } else if (error.response?.data?.message) {
        toast.error(`Failed to save spare part: ${error.response.data.message}`);
      } else {
        toast.error("Failed to save spare part due to a network or server error.");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const alphaRegex = /^[A-Za-z\s]*$/;
      if (!alphaRegex.test(value)) {
        setErrors((prev) => ({ ...prev, name: "Only letters are allowed." }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || !formData.name.trim()) newErrors.name = "Spare Part Name is required.";
    if (!formData.sparepart_type || !formData.sparepart_type.trim()) newErrors.sparepart_type = "Sparepart Type is required.";
    return newErrors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fill in all required fields correctly.");
      return;
    }
    const payload = {
      name: formData.name.trim(),
      sparepart_type: formData.sparepart_type.trim(),
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
      customClass: {
        popup: "custom-compact"
      }
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
    const typeValue = ["serial_based", "warranty_based", "quantity_based"].includes(part.sparepart_type)
      ? part.sparepart_type
      : "";
    setFormData({
      name: part.name || "",
      sparepart_type: part.sparepart_type || "",
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

  const errorStyle = {
    color: "#dc3545",
    fontSize: "13px",
    marginTop: "4px",
  };

  const paginated = spareparts
    .filter(part => {
      const searchLower = search.toLowerCase();
      return (
        part.name?.toLowerCase().includes(searchLower) ||
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

          <div className="col-md-6 text-md-end" style={{ fontSize: '0.8rem' }}>
            <div className="mt-2 d-inline-block mb-2" style={{ fontSize: '0.8rem' }}>
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
            <Search
              search={search}
              setSearch={setSearch}
              perPage={perPage}
              setPerPage={setPerPage}
              setPage={setPage}
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" ref={tableRef}>
            <thead style={{
              backgroundColor: "#2E3A59", color: "white", fontSize: "0.82rem", height: "40px",
              verticalAlign: "middle",
            }}>
              <tr>
                <th style={{ width: "70px", textAlign: "center", backgroundColor: "#2E3A59", color: "white" }}>S.No</th>
                <th
                  onClick={() => handleSort("name")}
                  style={{ cursor: "pointer", textAlign: "center", backgroundColor: "#2E3A59", color: "white" }}
                >
                  Spare Part Name {sortField === "name"}
                </th>
                {/* <th
                  onClick={() => handleSort("sparepart_type")}
                  style={{ cursor: "pointer", textAlign: "center", backgroundColor: "#2E3A59", color: "white" }}
                >
                  Spare Part Type {sortField === "sparepart_type" && (sortDirection === "asc" ? "▲" : "▼")}
                </th> */}


                <th style={{ width: "130px", textAlign: "center", backgroundColor: "#2E3A59", color: "white" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No data"
                      style={{ width: 80, height: 100, opacity: 0.6 }}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((part, index) => (
                  <tr key={part.id}>
                    <td className="text-center" style={{ width: "70px" }}>
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="text-center" style={{ wordBreak: "break-word" }}>
                      {part.name}
                    </td>
                    {/* <td className="text-center" style={{ wordBreak: "break-word" }}>
                      {part.sparepart_type}
                    </td> */}


                    <td className="text-center" style={{ width: "130px" }}>
                      <Button
                        variant=""
                        size="sm"
                        className="me-1"
                        onClick={() => handleEdit(part)}
                        style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleDelete(part.id)}
                        style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                      >
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
        <Offcanvas
          show={showForm}
          onHide={closeForm}
          placement="end"
          backdrop="static"
          scroll={true}
          className="custom-offcanvas"
        >
          <Offcanvas.Header className="border-bottom px-3 py-2 d-flex align-items-center">
            <h6 className="fw-bold mb-0">
              {editingPart ? "Edit Spare Part" : "Add New Spare Part"}
            </h6>

            <Button
              variant="outline-secondary"
              onClick={closeForm}
              className="rounded-circle border-0 d-flex align-items-center justify-content-center ms-auto p-0"
              style={{ width: "28px", height: "28px" }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: "14px" }}></i>
            </Button>
          </Offcanvas.Header>

          <Offcanvas.Body className="px-3 py-2" style={{ fontSize: "14px" }}>
            <form onSubmit={handleFormSubmit}>
              <div className="row g-2">
                <div className="mb-2 col-12">
                  <Form.Label className="mb-1" style={{ fontSize: "13px", fontWeight: 500 }}>
                    Spare Part Name <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="custom-placeholder"
                    placeholder="Enter Name"
                    isInvalid={!!errors.name}
                    style={{ height: "34px", fontSize: "13px" }}
                  />
                  <Form.Control.Feedback type="invalid" style={errorStyle}>
                    {errors.name}
                  </Form.Control.Feedback>
                </div>

                <div className="mb-2 col-12">
                  <Form.Label
                    className="mb-1"
                    style={{ fontSize: "13px", fontWeight: 500 }}
                  >
                    Sparepart Type <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Select
                    name="sparepart_type"
                    value={formData.sparepart_type}
                    onChange={handleChange}
                    className="custom-placeholder"
                    isInvalid={!!errors.sparepart_type}
                    style={{ height: "34px", fontSize: "13px" }}
                  >
                    <option value="">-- Select Type --</option>
                    <option value="serial_based">Serial Based</option>
                    <option value="warranty_based">Warranty Based</option>
                    <option value="quantity_based">Quantity Based</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid" style={errorStyle}>
                    {errors.sparepart_type}
                  </Form.Control.Feedback>
                </div>

              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <Button className="btn-common btn-cancel" variant="light" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  className="btn-common btn-save"
                >
                  {editingPart ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </Offcanvas.Body>
        </Offcanvas>
      )}
      <style>{`
          .slide-in {
            position: fixed;
            top: 0;
            right: 0;
            width: 600px;
            height: 100vh;
            transition: right 0.4s ease-in-out;
            z-index: 2000;
          }

          .slide-out {
            position: fixed;
            top: 0;
            right: -600px;
            width: 600px;
            height: 100vh;
            transition: right 0.4s ease-in-out;
            z-index: 2000;
          }
            .custom-offcanvas .form-select {
  font-size: 16px;
  padding: 4px 22px 5px 10px; /* slightly more padding */
  height: 34px; /* lightly bigger height */
  line-height: 1.3;
}

.custom-offcanvas .form-control {
  font-size: 14px;
  height: 34px;
  padding: 4px 10px;
  line-height: 1.3;
}

.custom-offcanvas .custom-dropdown-container {
  height: 32px;
}

.custom-offcanvas .custom-dropdown-toggle {
  font-size: 14px;
  padding: 4px 10px;
}


          .custom-table th, .custom-table td {
            font-weight: 400;
            font-size: 16px;
            color: #212529;
            white-space: normal;
          }

          .flex-grow-1 {
            overflow-x: auto !important;
          }

          .custom-placeholder::placeholder {
            font-family: 'Product Sans', sans-serif;
            font-weight: 400;
            color: #828282;
          }

          .form-control:focus {
            border-color: #CED4DA !important;
            box-shadow: none !important;
          }

          .form-control:valid {
            border-color: #CED4DA !important;
            box-shadow: none !important;
          }

          .form-control.is-invalid ~ .invalid-feedback {
            display: block;
          }

          /* New Custom Dropdown Styles */
          .custom-dropdown-container {
            position: relative;
            width: 100%;
            height: 50px; /* Set a fixed height for consistency */
          }

          .custom-dropdown-toggle {
            height: 100%;
            font-family: "Product Sans, sans-serif";
            font-weight: 400;
            font-size: 16px;
            border-radius: 4px;
            border: 1px solid #D3DBD5;
            background-color: #FFFFFF;
            color: #212529;
            padding: 0 10px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .custom-dropdown-toggle.is-invalid {
            border-color: #dc3545;
          }

          .custom-dropdown-toggle .selected-value {
            line-height: 1.5;
            flex-grow: 1;
            padding-right: 1rem;
          }
          
          .custom-dropdown-arrow {
            font-size: 1rem;
            color: #6c757d;
            transition: transform 0.2s ease-in-out;
          }

          .custom-dropdown-toggle.active .custom-dropdown-arrow {
            transform: rotate(180deg);
          }

          .custom-dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            z-index: 1000;
            background-color: #fff;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            margin-top: 5px;
            overflow: hidden;
          }

          .custom-dropdown-item {
            padding: 10px 15px;
            cursor: pointer;
            font-family: "Product Sans, sans-serif";
            font-weight: 400;
            font-size: 16px;
            color: #212529;
          }

          .custom-dropdown-item:hover {
            background-color: #f1f1f1;
          }
            .drawer {
  position: fixed;
  top: 63px;
  right: 0;
  width: 600px;
  height: 100vh;
  background-color: #fff;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 2000;
  padding: 30px;
  overflow-y: auto;
  border-left: 1px solid #dee2e6;
  transition: transform 1s ease-in-out, opacity 1s ease-in-out;
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.drawer.show {
  transform: translateX(0%);
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
}
        `}</style>


    </div>
  );
}
