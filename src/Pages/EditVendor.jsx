import React, { useEffect, useState } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import CreatableSelect from "react-select/creatable";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";
import ActionButton from "../components/ActionButton";
import CountrySelect from "../components/CountrySelect";
import CountryPhoneInput from "../components/CountryPhoneInput";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";


export default function EditVendor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("IN");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const formatPhoneNumber = (phone) => {
    if (!phone || !phone.startsWith("+")) return phone;

    // Extract country code (1–3 digits after +)
    const match = phone.match(/^\+(\d{1,3})(\d+)$/);
    if (!match) return phone;

    const countryCode = match[1];
    const number = match[2];

    return `+${countryCode} ${number}`;
  };


  const [panelKey, setPanelKey] = useState(0);

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
    if (!countryCode) return;

    const fetchVendor = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${id}/edit`);
        const data = await res.json();

        let vendorMobile = data.vendor?.mobile_no || "";
        if (vendorMobile && !vendorMobile.startsWith("+")) {
          vendorMobile = countryCode === "IN" ? `+91${vendorMobile}` : `+${vendorMobile}`;
        }

        setVendor({
          ...data.vendor,
          mobile_no: vendorMobile,
        });

        setContactPersons(
          (data.contacts || []).map(c => {
            let mobile_no = c.mobile_no || "";
            if (mobile_no && !mobile_no.startsWith("+")) {
              mobile_no = countryCode === "IN" ? `+91${mobile_no}` : `+${mobile_no}`;
            }
            try {
              const phoneNumber = parsePhoneNumberFromString(mobile_no);
              if (phoneNumber && phoneNumber.isValid()) {
                mobile_no = phoneNumber.number; // E.164 format
              }
            } catch { }
            return { ...c, mobile_no };
          })
        );

        if (data.vendor?.pincode) await fetchPincodeDetails(data.vendor.pincode);

      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch vendor details");
      }
    };

    fetchVendor();
  }, [id, countryCode]);



  const handlePincodeChange = async (value) => {
    const newValue = value.replace(/[^0-9]/g, "").slice(0, 6);

    // Update pincode immediately
    setVendor(prev => ({
      ...prev,
      pincode: newValue,
      state: "",       // clear old state
      district: "",    // clear old district
      city: "",        // clear old city
    }));

    // Reset city options
    setCityOptions([]);

    // Validate pincode
    if (!newValue) {
      setErrors(prev => ({ ...prev, pincode: "Pincode is required" }));
      return;
    } else if (newValue.length < 6) {
      setErrors(prev => ({ ...prev, pincode: "Pincode must be 6 digits" }));
      return;
    } else {
      setErrors(prev => ({ ...prev, pincode: "" }));
    }

    // Fetch state/district/city for valid 6-digit pincode
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${newValue}`);
      const data = await res.json();

      if (data[0].Status === "Success") {
        const postOffices = data[0].PostOffice;
        const cities = postOffices.map(po => po.Name);

        setCityOptions(cities);

        setVendor(prev => ({
          ...prev,
          state: postOffices[0].State,
          district: postOffices[0].District,
          city: cities.includes(prev.city) ? prev.city : cities[0],
        }));
      } else {
        toast.error("Invalid Pincode");
        setVendor(prev => ({ ...prev, state: "", district: "", city: "" }));
        setCityOptions([]);
      }
    } catch (err) {
      console.error("Pincode fetch error:", err);
      toast.error("Failed to fetch state/district");
      setVendor(prev => ({ ...prev, state: "", district: "", city: "" }));
      setCityOptions([]);
    }
  };


  const handleVendorChange = async (e) => {
    const { name, value } = e.target;
    let newValue = value.replace(/[^0-9]/g, ""); // allow only digits
    let newErrors = { ...errors };

    if (name === "pincode") {
      setVendor(prev => ({ ...prev, pincode: newValue }));

      if (!newValue.trim()) newErrors.pincode = "Pincode is required";
      else if (newValue.length !== 6) newErrors.pincode = "Pincode must be 6 digits";
      else delete newErrors.pincode;

      setErrors(newErrors);

      if (newValue.length === 6) {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${newValue}`);
          const data = await res.json();
          if (data[0].Status === "Success") {
            const postOffices = data[0].PostOffice;
            const cities = postOffices.map(po => po.Name);

            setCityOptions(cities);
            setVendor(prev => ({
              ...prev,
              state: postOffices[0].State,
              district: postOffices[0].District,
              city: cities.includes(prev.city) ? prev.city : cities[0],
            }));

            // Clear any previous errors
            setErrors(prev => {
              const updated = { ...prev };
              delete updated.city;
              delete updated.state;
              delete updated.district;
              return updated;
            });
          } else {
            setVendor(prev => ({ ...prev, state: "", district: "", city: "" }));
            setCityOptions([]);
            toast.error("Invalid pincode, please check");
          }
        } catch (err) {
          console.error("Pincode fetch error:", err);
          toast.error("Failed to fetch state and district");
        }
      } else {
        // If PIN is incomplete, clear state/district
        setVendor(prev => ({ ...prev, state: "", district: "", city: "" }));
        setCityOptions([]);
      }

      return;
    }

    // Other fields update
    setVendor(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    let newErrors = { ...contactErrors };

    if (name === "name") newValue.trim() ? delete newErrors.name : newErrors.name = "Name is required";
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
      const isValid = isValidPhoneNumber(value);

      if (!isValid) {
        setVendorErrors(prev => ({ ...prev, mobile_no: "Mobile number is invalid for this country" }));
      } else {
        setVendorErrors(prev => ({ ...prev, mobile_no: "" }));
      }
    } catch {
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
    const errors = {};
    if (!contact.name.trim()) errors.name = "Name is required";
    if (!contact.mobile_no.trim()) errors.mobile_no = "Mobile number is required";
    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }

    let updatedContacts = [...contactPersons];

    if (contact.isMain) {
      updatedContacts = updatedContacts.map(c => ({ ...c, isMain: false }));
    }

    if (editingIndex !== null) {
      updatedContacts[editingIndex] = { ...contact }; // update existing
    } else {
      updatedContacts.push({ ...contact });
    }

    setContactPersons(updatedContacts);

    setContact({ name: "", designation: "", mobile_no: "", email: "", status: "Active", isMain: false });
    setEditingIndex(null);
    setShowPanel(false);
    setContactErrors({});
  };



  const editContact = (index) => {
    const c = contactPersons[index];
    let mobileValue = c.mobile_no || "";

    try {
      const phoneNumber = parsePhoneNumberFromString(mobileValue, countryCode.toUpperCase());
      if (phoneNumber && phoneNumber.isValid()) {
        mobileValue = phoneNumber.number; // E.164
      }
      // else fallback to raw number
    } catch (err) {
      console.error("Error parsing mobile:", err);
    }

    setContact({
      ...c,
      mobile_no: mobileValue, // will now show in the input
      isMain: !!c.isMain,
    });

    setEditingIndex(index);
    setShowPanel(true);
  };





  const deleteContact = (index) => {
    const MySwal = withReactContent(Swal);

    MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this contact person?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = [...contactPersons];
        updated.splice(index, 1);
        setContactPersons(updated);

        MySwal.fire({
          icon: "success",
          title: "Deleted!",
          text: "The contact person has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

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
      await fetch(`${API_BASE_URL}/${id}`, {
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
    <div className="container-fluid " style={{ background: "white", minHeight: "100vh", position: "relative" }}>
      <Row className="align-items-center mb-3 fixed-header">
        <Col>
          <h4>Edit Vendor Details</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => navigate("/vendor")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      {/* Vendor Form */}
      <div style={{ background: "#F4F4F8", padding: "20px", borderRadius: "6px", marginBottom: "20px" }}>
        <h6 className="mb-3">Company Details</h6>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3  form-field">
              <Form.Label>
                Vendor<span style={{ color: "red" }}> *</span>
              </Form.Label>

              <Form.Control
                type="text"
                name="vendor"
                value={vendor.vendor ?? ""}
                onChange={handleVendorChange}
                isInvalid={!!errors.vendor}
              />
              <Form.Control.Feedback type="invalid">{errors.vendor}</Form.Control.Feedback>
            </Form.Group>
          </Col>



          <Col md={4}>
            <Form.Group className="mb-3  form-field">
              <Form.Label>GST No</Form.Label>
              <Form.Control
                type="text"
                name="gst_no"
                value={vendor.gst_no ?? ""}
                maxLength={15}
                onChange={(e) => {
                  // Allow only alphanumeric characters, auto-uppercase, limit to 15
                  const rawValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);

                  setVendor({ ...vendor, gst_no: rawValue });

                  // Live validation
                  if (!rawValue.trim()) {
                    setErrors((prev) => ({ ...prev, gst_no: "GST No is required" }));
                  } else if (rawValue.length !== 15) {
                    setErrors((prev) => ({ ...prev, gst_no: "GST No must be 15 characters" }));
                  } else if (!gstRegex.test(rawValue)) {
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
            <Form.Group className="mb-3  form-field">
              <Form.Label>
                Pincode<span style={{ color: "red" }}> *</span>
              </Form.Label>

              <Form.Control
                type="text"
                name="pincode"
                value={vendor.pincode ?? ""}
                maxLength={6}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="Enter Pincode"
                isInvalid={!!errors.pincode}
              />
              <Form.Control.Feedback type="invalid">{errors.pincode}</Form.Control.Feedback>

            </Form.Group>
          </Col>
        </Row>

        <Row>

          <Col md={4}>
            <Form.Group className="mb-3  form-field">
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
            <Form.Group className="mb-3  form-field">
              <Form.Label>
                State<span style={{ color: "red" }}> *</span>
              </Form.Label>

              <Form.Control
                type="text"
                name="state"
                value={vendor.state}
                onChange={(e) => setVendor({ ...vendor, state: e.target.value })}
                placeholder="State"
                readOnly
              />
              <Form.Control.Feedback type="invalid">{errors.state}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3  form-field">
              <Form.Label>
                District<span style={{ color: "red" }}> *</span>
              </Form.Label>

              <Form.Control
                type="text"
                name="district"
                value={vendor.district}
                onChange={(e) => setVendor({ ...vendor, district: e.target.value })}
                placeholder="District"
                readOnly
              />

              <Form.Control.Feedback type="invalid">{errors.district}</Form.Control.Feedback>
            </Form.Group>
          </Col>

        </Row>

        <Row>

          <Col md={4}>
            <Form.Group className="mb-3  form-field">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={vendor.email ?? ""}
                onChange={handleVendorChange}
                isInvalid={!!errors.email}
              />
              {/* <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback> */}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3  form-field">
              <Form.Label>
                Mobile No<span style={{ color: "red" }}> *</span>
              </Form.Label>
              <CountryPhoneInput
                country={countryCode.toLowerCase()}
                international
                value={vendor.mobile_no ?? ""}
                onChange={handleVendorMobileChange}
                enableSearch
                defaultCountry={countryCode}
                className="form-control"
              />
              {/* {vendorErrors.mobile_no && (
                <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {vendorErrors.mobile_no}
                </div>
              )} */}

            </Form.Group>
          </Col>


          <Col md={4}>
            <Form.Group className="mb-3  form-field">
              <Form.Label>
                Address<span style={{ color: "red" }}> *</span>
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={vendor.address ?? ""}
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

      <Button
        variant="success"
        onClick={() => {
          setContact({
            name: "",
            designation: "",
            mobile_no: "",  // important
            email: "",
            status: "Active",
            isMain: false,
          });
          setContactErrors({});
          setEditingIndex(null);  // marks as new contact
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
                    <td>{formatPhoneNumber(c.mobile_no)}</td>
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
        <Button variant="success" onClick={saveVendor}>Update</Button>
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
        <h5>{editingIndex !== null ? "Edit Contact" : "Edit Contact"}</h5>
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-circle border-0 d-flex justify-content-center align-items-center"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "32px",
            height: "32px",
            padding: 0,
          }}
          onClick={() => {
            setShowPanel(false);
            setEditingIndex(null);
          }}
        >
          <i className="bi bi-x-lg fs-6"></i>
        </Button>

        <Form className="mt-4  form-field">
          {/* Row 1: Name + Designation */}
          <Row className="mb-3 p-2" style={{ background: "rgb(244, 244, 248)", borderRadius: "6px" }}>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Name
                  <span style={{ color: "red" }}> *</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={(contact.name ?? "").replace(" (Main person)", "")}
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
            <Col md={12}>
              <Form.Group>
                <Form.Label>
                  Mobile No<span style={{ color: "red" }}> *</span>
                </Form.Label>
                <CountryPhoneInput
                  country={countryCode.toLowerCase()}
                  international
                  value={contact.mobile_no ?? ""}
                  onChange={handleContactMobileChange}
                  enableSearch
                  defaultCountry={countryCode}
                  className="form-control"
                />
                {/* {contactErrors.mobile_no && (
                  <div className="invalid-feedback" style={{ display: "block" }}>
                    {contactErrors.mobile_no}
                  </div>
                )} */}

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
            {/* <Button
              variant="secondary"
              className="me-2"
              onClick={() => {
                setShowPanel(false);
                setEditingIndex(null);
              }}
            >
              Cancel
            </Button> */}
            <Button variant="success" onClick={addContactPerson}>
              {editingIndex !== null ? "Update" : "Save"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
