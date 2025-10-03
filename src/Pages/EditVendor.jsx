import React, { useEffect, useState } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import CreatableSelect from "react-select/creatable";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";
import ActionButton from "../components/ActionButton";

export default function EditVendor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("IN");
  const [page, setPage] = useState(1);
const [perPage, setPerPage] = useState(5);

  const [vendor, setVendor] = useState({
    vendor: "",
    gst_no: "",
    email: "",
    pincode: "",
    city: "",
    state: "",
    district: "",
    address: "",
    mobile_no: "",
  });

  const [cityOptions, setCityOptions] = useState([]);
  const [contactPersons, setContactPersons] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [contactErrors, setContactErrors] = useState({});
  const [vendorErrors, setVendorErrors] = useState({});


  const [contact, setContact] = useState({
    name: "",
    designation: "",
    mobile_no: "",
    email: "",
    status: "Active",
    isMain: false,
  });


  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country) {
          setCountryCode(data.country);
        }
      })
      .catch(() => {
        setCountryCode("IN");
      });
  }, []);


  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${id}/edit`);
        const data = await res.json();

        setVendor({
          vendor: data.vendor?.vendor || "",
          gst_no: data.vendor?.gst_no || "",
          email: data.vendor?.email || "",
          pincode: data.vendor?.pincode || "",
          city: data.vendor?.city || "",
          state: data.vendor?.state || "",
          district: data.vendor?.district || "",
          address: data.vendor?.address || "",
          mobile_no: data.vendor?.mobile_no || "",
        });

        setContactPersons(data.contacts?.map(c => ({
          name: c.name || "",
          designation: c.designation || "",
          mobile_no: c.mobile_no || "",
          email: c.email || "",
          status: c.status || "Active",
          isMain: !!c.is_main,
        })) || []);

        if (data.vendor?.pincode) {
          fetchPincodeDetails(data.vendor.pincode);
        }

      } catch (err) {
        console.error("Error fetching vendor:", err);
      }
    };

    fetchVendor();
  }, [id]);

  // ------------------- HANDLE VENDOR INPUTS -------------------
  const handleVendorChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    let newErrors = { ...errors };

    // ------------------- PINCODE -------------------
    if (name === "pincode") {
      // Update pincode
      setVendor((prev) => ({ ...prev, pincode: newValue }));

      // Validate pincode
      if (!/^\d*$/.test(newValue)) newErrors.pincode = "Only digits are allowed";
      else if (newValue.length > 6) newErrors.pincode = "Pincode cannot exceed 6 digits";
      else if (newValue.length < 6 && newValue.length > 0) newErrors.pincode = "Pincode must be 6 digits";
      else delete newErrors.pincode;

      // Auto-fetch details if 6 digits
      if (newValue.length === 6) {
        fetchPincodeDetails(newValue);
      } else {
        // clear city/state/district if invalid
        setVendor((prev) => ({ ...prev, state: "", district: "", city: "" }));
        setCityOptions([]);
      }

      setErrors(newErrors);
      return; // stop further processing
    }

    // ------------------- OTHER FIELDS -------------------
    if (name === "vendor") newValue.trim() ? delete newErrors.vendor : newErrors.vendor = "Company name is required";
    // if (name === "gst_no") {
    //   if (!newValue.trim()) newErrors.gst_no = "GST number is required";
    //   else if (newValue.length > 15) newErrors.gst_no = "GST number cannot exceed 15 characters";
    //   else delete newErrors.gst_no;
    // }
if (name === "email") {
  if (newValue.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
    newErrors.email = "Enter a valid email";
  } else {
    delete newErrors.email;
  }
}

    if (name === "city") newValue.trim() ? delete newErrors.city : newErrors.city = "City is required";
    if (name === "state") newValue.trim() ? delete newErrors.state : newErrors.state = "State is required";
    if (name === "district") newValue.trim() ? delete newErrors.district : newErrors.district = "District is required";
    if (name === "address") newValue.trim() ? delete newErrors.address : newErrors.address = "Address is required";
    if (name === "mobile_no") {
      if (!/^\d*$/.test(newValue)) newErrors.mobile_no = "Only digits are allowed";
      else if (newValue.length > 10) newErrors.mobile_no = "Mobile number cannot exceed 10 digits";
      else if (newValue.length < 10 && newValue.length > 0) newErrors.mobile_no = "Mobile number must be 10 digits";
      else delete newErrors.mobile_no;
    }

    // Update vendor state for other fields
    setVendor({ ...vendor, [name]: newValue });
    setErrors(newErrors);
  };

  // ------------------- HANDLE CONTACT INPUTS -------------------
  const handleContactChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    let newErrors = { ...contactErrors };

    if (name === "name") newValue.trim() ? delete newErrors.name : newErrors.name = "Name is required";
    // if (name === "designation") newValue.trim() ? delete newErrors.designation : newErrors.designation = "Designation is required";
    if (name === "mobile_no") {
      if (!/^\d*$/.test(newValue)) newErrors.mobile_no = "Only digits are allowed";
      else if (newValue.length > 10) newErrors.mobile_no = "Mobile number cannot exceed 10 digits";
      else if (newValue.length > 0 && newValue.length < 10) newErrors.mobile_no = "Enter a valid 10-digit mobile number";
      else delete newErrors.mobile_no;
    }
    if (name === "email") {
      if (!newValue.trim()) delete newErrors.email;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) newErrors.email = "Enter a valid email";
      else delete newErrors.email;
    }
    if (name === "status") !newValue.trim() ? newErrors.status = "Status is required" : delete newErrors.status;

    setContact({ ...contact, [name]: newValue });
    setContactErrors(newErrors);
  };


  const handleVendorMobileChange = (value) => {
    setVendor(prev => ({ ...prev, mobile_no: value }));

    if (!value) {
      setVendorErrors(prev => ({ ...prev, mobile_no: "Mobile number is required" }));
      return;
    }

    try {
      const phoneNumber = parsePhoneNumberFromString(value);

      if (!phoneNumber) {
        setVendorErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
        return;
      }

      if (!isValidPhoneNumber(value)) {
        setVendorErrors(prev => ({ ...prev, mobile_no: "Mobile number is invalid for this country" }));
      } else {
        setVendorErrors(prev => ({ ...prev, mobile_no: "" }));
      }
    } catch (err) {
      setVendorErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
    }
  };

  const handleContactMobileChange = (value) => {
    setContact(prev => ({ ...prev, mobile_no: value }));

    if (!value) {
      setContactErrors(prev => ({ ...prev, mobile_no: "Mobile number is required" }));
      return;
    }

    try {
      const phoneNumber = parsePhoneNumberFromString(value);

      if (!phoneNumber) {
        setContactErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
        return;
      }

      if (!isValidPhoneNumber(value)) {
        setContactErrors(prev => ({ ...prev, mobile_no: "Mobile number is invalid for this country" }));
      } else {
        setContactErrors(prev => ({ ...prev, mobile_no: "" }));
      }
    } catch (err) {
      setContactErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
    }
  };

  // ------------------- CONTACT TABLE -------------------
  const columns = [
    {
      name: "Name",
      selector: row => row.name + (row.isMain ? " (Main)" : ""),
      sortable: true
    },

    { name: "Designation", selector: row => row.designation || "", sortable: true },
    { name: "Mobile", selector: row => row.mobile_no || "", sortable: true },
    { name: "Email", selector: row => row.email || "", sortable: true },
    { name: "Status", selector: row => row.status || "", sortable: true },
    {
      name: "Actions",
      cell: (row) => {
        const realIndex = contactPersons.findIndex(c => c === row);
        return (
          <div>
            <Button
              size="sm"
              variant="outline-primary"
              className="me-2"
              onClick={() => editContact(realIndex)}
            >
              <i className="bi bi-pencil-square"></i>
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => deleteContact(realIndex)}
            >
              <i className="bi bi-trash"></i>
            </Button>
          </div>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // ------------------- FETCH PINCODE DETAILS -------------------
  const fetchPincodeDetails = async (pincode) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0].Status === "Success") {
        const postOffices = data[0].PostOffice;
        const cities = postOffices.map((po) => po.Name);

        setCityOptions(cities);
        setVendor((prev) =>
        ({
          ...prev, state: postOffices[0].State,
          district: postOffices[0].District,
          city: prev.city || cities[0],

        }));


        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.state;
          delete updated.district;
          delete updated.city;
          return updated;
        });
      } else {
        setCityOptions([]);
        setVendor((prev) => ({ ...prev, state: "", district: "", city: "" }));
      }
    } catch (err) {
      console.error(err);
    }
  };


  const addContactPerson = () => {
    // Validate required fields manually
    const errors = {};
    // if (!contact.name.trim()) errors.name = "Name is required";
    // if (!contact.designation.trim()) errors.designation = "Designation is required";
    if (!contact.mobile_no.trim()) errors.mobile_no = "Mobile number is required";
    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }

    let updatedContacts = [...contactPersons];

    // If this contact is marked as Main, unset isMain for all others
    if (contact.isMain) {
      updatedContacts = updatedContacts.map(c => ({ ...c, isMain: false }));
    }

    if (editingIndex !== null) {
      updatedContacts[editingIndex] = { ...contact }; // update existing
    } else {
      updatedContacts.push({ ...contact }); // add new
    }

    setContactPersons(updatedContacts);

    // Reset contact form correctly
    setContact({ name: "", designation: "", mobile_no: "", email: "", status: "Active", isMain: false });
    setEditingIndex(null);
    setShowPanel(false);
    setContactErrors({});
  };

  // const editContact = (index) => {
  //   setContact({ ...contactPersons[index] }); // clone
  //   setEditingIndex(index);
  //   setShowPanel(true);
  // };

  const editContact = (index) => {
    const c = contactPersons[index];
    setContact({ ...c, isMain: !!c.isMain });
    setEditingIndex(index);
    setShowPanel(true);
  };

  const deleteContact = (index) => {
    const updated = [...contactPersons];
    updated.splice(index, 1);
    setContactPersons(updated);
  };

  // ------------------- SAVE VENDOR -------------------
  const saveVendor = async () => {
    const payload = {
      ...vendor,
      contact_persons: contactPersons.map(c => ({
        name: c.name.replace(" (Main)", ""),
        designation: c.designation,
        mobile_no: c.mobile_no,
        email: c.email,
        status: c.status,
        is_main: c.isMain ? true : false,
      })),
    };

    try {
      await fetch(`http://localhost:8000/api/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Vendor updated successfully!", { position: "top-right" });
      setTimeout(() => navigate("/vendor"), 1500);

    } catch (err) {
      console.error(err);
      toast.error("Error updating vendor!");

    }
  };

  const cityOptionsFormatted = [
    ...cityOptions.map(c => ({ label: c, value: c })),
    ...(vendor.city ? [{ label: vendor.city, value: vendor.city }] : [])
  ];


const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


  return (
    <div className="container-fluid p-4" style={{ background: "white", minHeight: "100vh", position: "relative" }}>
      <h5 className="mb-3">Edit Vendor Details</h5>

      {/* --- Vendor Form UI --- */}
      <div style={{ background: "#f1f3f5", padding: "20px", borderRadius: "6px", marginBottom: "20px" }}>
        <h6 className="mb-3">Company Details</h6>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
            <Form.Label>
  Vendor<span style={{ color: "red" }}> *</span>
</Form.Label>

              <Form.Control
                type="text"
                name="vendor"
                value={vendor.vendor}
                onChange={handleVendorChange}
                isInvalid={!!errors.vendor}
              />
              <Form.Control.Feedback type="invalid">{errors.vendor}</Form.Control.Feedback>
            </Form.Group>
          </Col>



<Col md={4}>
  <Form.Group className="mb-3">
    <Form.Label>GST No</Form.Label>
    <Form.Control
      type="text"
      name="gst_no"
      value={vendor.gst_no}
      onChange={(e) => {
        const value = e.target.value.toUpperCase();
        setVendor({ ...vendor, gst_no: value });

        // Live validation
        if (!value.trim()) {
          setErrors((prev) => ({ ...prev, gst_no: "GST No is required" }));
        } else if (value.length !== 15) {
          setErrors((prev) => ({ ...prev, gst_no: "GST No must be 15 characters" }));
        } else if (!gstRegex.test(value)) {
          setErrors((prev) => ({ ...prev, gst_no: "Invalid GST No format" }));
        } else {
          setErrors((prev) => ({ ...prev, gst_no: "" })); 
        }
      }}
      placeholder="Enter GST No"
      isInvalid={!!errors.gst_no}
    />
    {errors.gst_no && (
      <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
        {errors.gst_no}
      </div>
    )}
  </Form.Group>
</Col>


          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>
  Pincode<span style={{ color: "red" }}> *</span>
</Form.Label>

              <Form.Control
                type="text"
                name="pincode"
                value={vendor.pincode}
                onChange={handleVendorChange}
                isInvalid={!!errors.pincode}
              />
              <Form.Control.Feedback type="invalid">{errors.pincode}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row>

          <Col md={4}>
            <Form.Group className="mb-3">
        <Form.Label>
  City<span style={{ color: "red" }}> *</span>
</Form.Label>

              <CreatableSelect
                name="city"
                value={vendor.city ? { label: vendor.city, value: vendor.city } : null}
                onChange={(option) => setVendor({ ...vendor, city: option ? option.value : "" })}
                options={cityOptionsFormatted}
                isClearable
                placeholder="Select or type city"
                  classNamePrefix="my-select"   // ✅ Add this
              />

              {errors.city && <div style={{ color: "red", fontSize: "12px" }}>{errors.city}</div>}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
          <Form.Label>
  State<span style={{ color: "red" }}> *</span>
</Form.Label>

              <Form.Control
                type="text"
                name="state"
                value={vendor.state}
                onChange={handleVendorChange}
                isInvalid={!!errors.state}
              />
              <Form.Control.Feedback type="invalid">{errors.state}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
             <Form.Label>
  District<span style={{ color: "red" }}> *</span>
</Form.Label>

              <Form.Control
                type="text"
                name="district"
                value={vendor.district}
                onChange={handleVendorChange}
                isInvalid={!!errors.district}
              />
              <Form.Control.Feedback type="invalid">{errors.district}</Form.Control.Feedback>
            </Form.Group>
          </Col>

        </Row>

        <Row>

          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={vendor.email}
                onChange={handleVendorChange}
                isInvalid={!!errors.email}
              />
              {/* <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback> */}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
          <Form.Label>
  Mobile No<span style={{ color: "red" }}> *</span>
</Form.Label>

              <PhoneInput
                country={countryCode.toLowerCase()}
                international
                className="form-control"
                value={vendor.mobile_no}
                onChange={handleVendorMobileChange} // Use handler
                enableSearch
                inputClass="form-control"
              />
              {vendorErrors.mobile_no && (
                <div className="invalid-feedback" style={{ display: "block" }}>
                  {vendorErrors.mobile_no}
                </div>
              )}
            </Form.Group>
          </Col>


          <Col md={12}>
            <Form.Group className="mb-3">
           <Form.Label>
  Address<span style={{ color: "red" }}> *</span>
</Form.Label>

              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={vendor.address}
                onChange={handleVendorChange}
                placeholder="Enter Address"
                isInvalid={!!errors.address}
              />

              {errors.address && (
                <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {errors.address}
                </div>
              )}
            </Form.Group>
          </Col>

        </Row>
      </div>

      {/* --- Contact Persons --- */}
      <Button
        variant="success"
        onClick={() => {
          setContact({
            name: "",
            designation: "",
            mobile_no: "",
            email: "",
            status: "Active",
            isMain: false,
          });
          setContactErrors({});
          setEditingIndex(null);
          setShowPanel(true);
        }}
      >
        + Add Contact Person
      </Button>

  {contactPersons.length > 0 && (
  <div className="mt-3 table-responsive">
    <table className="table align-middle mb-0">
      <thead>
  <tr>
    <th
      style={{
        width: "50px",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: "#f1f3f5",
            fontWeight: "normal", // normal text weight
        color: "inherit", // keeps default text color (black)

      }}
    >
      S.No
    </th>
    {[
      { label: "Name", field: "name" },
      { label: "Designation", field: "designation" },
      { label: "Mobile", field: "mobile_no" },
      { label: "Email", field: "email" },
      { label: "Status", field: "status" },
    ].map(({ label, field }) => (
      <th
        key={field}
        style={{
          cursor: "pointer",
          backgroundColor: "#f1f3f5",
              fontWeight: "normal", // normal text weight
        color: "inherit", // keeps default text color (black)
        }}
      >
        {label}
      </th>
    ))}
    <th
      style={{
        textAlign: "center",
        backgroundColor: "#f1f3f5",
            fontWeight: "normal", // normal text weight
        color: "inherit", // keeps default text color (black)
      }}
    >
      Action
    </th>
  </tr>
</thead>

      <tbody>
        {contactPersons.length === 0 ? (
          <tr>
            <td colSpan="7" className="text-center py-4 text-muted">
              No contact persons found
            </td>
          </tr>
        ) : (
          contactPersons.map((c, index) => (
            <tr key={index}>
              <td className="text-center">{index + 1}</td>
              <td>{c.name}{c.isMain ? " (Main)" : ""}</td>
              <td>{c.designation}</td>
              <td>{c.mobile_no}</td>
              <td>{c.email}</td>
              <td>
                <span className={`badge ${c.status === "Active" ? "bg-success" : "bg-danger"}`}>
                  {c.status}
                </span>
              </td>
             <td className="text-center">
  <ActionButton
    onEdit={() => editContact(index)}
    onDelete={() => deleteContact(index)}
    // Optional: if you want a view action, you can add it, or omit
    // onView={() => {}}
  />
</td>

            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}


      {/* --- Save / Cancel Buttons --- */}
      <div className="d-flex justify-content-end mt-3">
        <Button variant="secondary" className="me-2" onClick={() => navigate("/vendor")}>Cancel</Button>
        <Button variant="success" onClick={saveVendor}>Save</Button>
      </div>
      {/* Right Side Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: showPanel ? 0 : "-500px",
          width: "500px",
          height: "100%",
          background: "white",
          boxShadow: "-2px 0 6px rgba(0,0,0,0.2)",
          transition: "right 0.3s",
          zIndex: 1050,
          padding: "20px",
        }}
      >
        <h5>{editingIndex !== null ? "Edit Contact" : "Add Contact"}</h5>
        <Button
          variant="secondary"
          size="sm"
          style={{ position: "absolute", top: "10px", right: "10px" }}
          onClick={() => {
            setShowPanel(false);
            setEditingIndex(null);
          }}
        >
          X
        </Button>

        <Form className="mt-4">
          {/* Row 1: Name + Designation */}
          <Row className="mb-3 p-2" style={{ background: "#f5f5f5", borderRadius: "6px" }}>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={contact.name.replace(" (Main person)", "")}
                  onChange={handleContactChange}
                  isInvalid={!!contactErrors.name}
                    placeholder="Enter Name"
                />
                <Form.Control.Feedback type="invalid">{contactErrors.name}</Form.Control.Feedback>

                <Form.Check
                  type="checkbox"
                  label="Main Contact"
                  checked={contact.isMain || false}
                  onChange={(e) => setContact({ ...contact, isMain: e.target.checked })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Designation</Form.Label>
                <Form.Control
                  type="text"
                  name="designation"
                  value={contact.designation}
                  onChange={handleContactChange}
                  isInvalid={!!contactErrors.designation}
                    placeholder="Enter Designation"
                />
                <Form.Control.Feedback type="invalid">{contactErrors.designation}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          {/* </Row> */}

          {/* Row 2: Mobile + Email */}
          {/* <Row className="mb-3 p-2" style={{ background: "#f5f5f5", borderRadius: "6px" }}> */}
            <Col md={6}>
              <Form.Group>
               <Form.Label>
  Mobile No<span style={{ color: "red" }}> *</span>
</Form.Label>

                <PhoneInput
                  country={countryCode.toLowerCase()}
                  international
                  className="form-control"
                  defaultCountry="IN"
                  value={contact.mobile_no}
                  onChange={handleContactMobileChange} 
                  enableSearch
                />
                {contactErrors.mobile_no && (
                  <div className="invalid-feedback" style={{ display: "block" }}>
                    {contactErrors.mobile_no}
                  </div>
                )}

              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={contact.email}
                  onChange={handleContactChange}
                    placeholder="Enter Email"
                  isInvalid={!!contactErrors.email}
                />
                <Form.Control.Feedback type="invalid">{contactErrors.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          {/* </Row> */}

          {/* Row 3: Status */}
          {/* <Row className="mb-3 p-2" style={{ background: "#f5f5f5", borderRadius: "6px" }}> */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={contact.status}
                  onChange={handleContactChange}
                  isInvalid={!!contactErrors.status}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{contactErrors.status}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Action buttons */}
          <div className="d-flex justify-content-end mt-3">
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => {
                setShowPanel(false);
                setEditingIndex(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={addContactPerson}>
              {editingIndex !== null ? "Update" : "Save"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
