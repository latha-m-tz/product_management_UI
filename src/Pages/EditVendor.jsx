import React, { useEffect, useState } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import CreatableSelect from "react-select/creatable";
import { useParams, useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api";
import "react-phone-number-input/style.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";
import ActionButton from "../components/ActionButton";
import CountrySelect from "../components/CountrySelect";
import CountryPhoneInput from "../components/CountryPhoneInput";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import '../index.css';

export default function EditVendor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("IN");
  const [contactKey, setContactKey] = useState(0);



  const formatPhoneNumber = (number, defaultCountry = "IN") => {
    if (!number) return "N/A";

    try {
      // If number doesn't have "+", prepend default country code
      const fullNumber = number.startsWith("+")
        ? number
        : `+${getCountryCallingCode(defaultCountry)}${number}`;

      const phoneNumber = parsePhoneNumberFromString(fullNumber);

      if (!phoneNumber) return number;

      // ✅ Only one space between country code and full mobile number
      return `+${phoneNumber.countryCallingCode} ${phoneNumber.nationalNumber}`;
    } catch {
      return number;
    }
  };




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
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);

  }, []);


  useEffect(() => {
    if (!countryCode) return;

    const fetchVendor = async () => {
      try {
        const res = await api.get(`/${id}/edit`);
        const data = res.data;

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
                mobile_no = phoneNumber.number;
              }
            } catch { }

            return {
              ...c,
              mobile_no,
              isMain: c.is_main === 1 || c.is_main === true  // 🔥 FIX HERE
            };
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
      city: "",       // clear old city
    }));

    // Reset city options
    setCityOptions([]);

    if (!newValue) {
      setErrors(prev => ({ ...prev, pincode: "Pincode is required" }));
      return;
    } else if (newValue.length < 6) {
      setErrors(prev => ({ ...prev, pincode: "Pincode must be 6 digits" }));
      return;
    } else {
      setErrors(prev => ({ ...prev, pincode: "" }));
    }

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
    let newValue = value;

    // Auto-capitalize certain fields
    const capitalizeFields = ["vendor", "city", "state", "district", "address"];
    if (capitalizeFields.includes(name)) {
      newValue = capitalizeFirstLetter(value);
    }

    // --- Dynamic error handling ---
    setErrors((prev) => {
      const updated = { ...prev };

      if (["vendor", "address", "pincode", "city", "state", "district"].includes(name)) {
        if (!newValue.trim()) {
          updated[name] = `${capitalizeFirstLetter(name)} is required`;
        } else {
          delete updated[name]; // ✅ clear error immediately if valid
        }
      }

      // Email validation logic (special)
      if (name === "email") {
        const trimmed = value.trim();
        let error = "";

        const lowercaseEmailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

        if (trimmed === "") {
          error = "";
        } else if (/\s/.test(trimmed)) {
          error = "Email cannot contain spaces";
        } else if (/[A-Z]/.test(trimmed)) {
          error = "Only lowercase letters are allowed (e.g. name@example.com)";
        } else if (!lowercaseEmailRegex.test(trimmed)) {
          error = "Invalid email format (e.g. name@example.com)";
        }

        if (error) updated.email = error;
        else delete updated.email;
      }

      // GST number validation
      if (name === "gst_no") {
        const rawValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!rawValue) updated.gst_no = "GST No is required";
        else if (rawValue.length !== 15) updated.gst_no = "GST No must be 15 characters";
        else if (!gstRegex.test(rawValue)) updated.gst_no = "Invalid GST No format";
        else delete updated.gst_no;
      }

      return updated;
    });

    // --- Update vendor state ---
    if (name === "pincode") {
      const cleanValue = value.replace(/[^0-9]/g, "").slice(0, 6);
      setVendor((prev) => ({ ...prev, [name]: cleanValue }));
      return;
    }

    setVendor((prev) => ({ ...prev, [name]: newValue }));
  };



  const handleContactChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (["name", "designation"].includes(name)) {
      newValue = capitalizeFirstLetter(value);
    }

    // existing validation logic continues here...
    let newErrors = { ...contactErrors };

    if (name === "name") newValue.trim() ? delete newErrors.name : newErrors.name = "Name is required";
    if (name === "mobile_no") {
      if (!newValue.trim()) {
        newErrors.mobile_no = "Mobile number is required";
      } else if (!/^\d*$/.test(newValue)) {
        newErrors.mobile_no = "Only digits are allowed";
      } else if (newValue.length > 10) {
        newErrors.mobile_no = "Mobile number cannot exceed 10 digits";
      } else if (newValue.length < 10) {
        newErrors.mobile_no = "Enter a valid 10-digit mobile number";
      } else {
        delete newErrors.mobile_no;
      }
    }
    if (name === "email") {
      if (!newValue.trim()) {
        delete newErrors.email;
      } else if (/[A-Z]/.test(newValue)) {
        newErrors.email = "Email must be in lowercase letters only";
      } else if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(newValue)) {
        newErrors.email = "Enter a valid email";
      } else {
        delete newErrors.email;
      }
    }

    setContact({ ...contact, [name]: newValue });
    setContactErrors(newErrors);
  };




  const handleVendorMobileChange = (value) => {
    setVendor(prev => ({ ...prev, mobile_no: value }));

    if (!value) {
      setVendorErrors(prev => ({ ...prev, mobile_no: "" }));
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
    const newErrors = {};

    // 🔸 Name validation
    if (!contact.name || contact.name.trim() === "") {
      newErrors.name = "Name is required";
    }

    if (contact.mobile_no) {
      try {
        const phoneNumber = parsePhoneNumberFromString(contact.mobile_no);
        if (!phoneNumber || !isValidPhoneNumber(contact.mobile_no)) {
          newErrors.mobile_no = "Enter a valid mobile number";
        }
      } catch {
        newErrors.mobile_no = "Invalid mobile number";
      }
    }


    // 🔸 Email validation
    if (contact.email && contact.email.trim() !== "") {
      const emailTrimmed = contact.email.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (/\s/.test(emailTrimmed)) {
        newErrors.email = "Email cannot contain spaces";
      } else if (/[A-Z]/.test(emailTrimmed)) {
        newErrors.email = "Email must be in lowercase (e.g. name@example.com)";
      } else if (!emailPattern.test(emailTrimmed)) {
        newErrors.email = "Invalid email format (e.g. name@example.com)";
      } else if (
        vendor.email &&
        emailTrimmed.toLowerCase() === vendor.email.trim().toLowerCase()
      ) {
        newErrors.email = "Contact email cannot be the same as company email";
      }
    }

    // ✅ Stop here if any field-level validation errors
    if (Object.keys(newErrors).length > 0) {
      setContactErrors(newErrors);
      return;
    }

    // ✅ Prepare contact object
    const contactToSave = { ...contact };
    let updatedContacts = [...contactPersons];

    // 🔹 Check if already has a main contact person
    const hasMainContact = updatedContacts.some(
      (c, idx) => c.isMain && idx !== editingIndex
    );

    if (contactToSave.isMain && hasMainContact) {
      toast.error("A main contact person already exists!");
      return;
    }

    // 🔹 Duplicate mobile number check
    const duplicateMobileInContacts = updatedContacts.some(
      (c, idx) =>
        c.mobile_no &&
        contactToSave.mobile_no &&
        c.mobile_no.trim() === contactToSave.mobile_no.trim() &&
        idx !== editingIndex
    );

    const duplicateMobileWithVendor =
      vendor.mobile_no &&
      contactToSave.mobile_no &&
      contactToSave.mobile_no.trim() === vendor.mobile_no.trim();

    if (duplicateMobileInContacts || duplicateMobileWithVendor) {
      toast.error(`Mobile number ${contactToSave.mobile_no} is already used!`);
      return;
    }


    // 🔹 Duplicate email check
    if (contactToSave.email && contactToSave.email.trim() !== "") {
      const emailTrimmed = contactToSave.email.trim().toLowerCase();

      const duplicateEmailInContacts = updatedContacts.some(
        (c, idx) =>
          c.email?.trim().toLowerCase() === emailTrimmed && idx !== editingIndex
      );

      const duplicateEmailWithVendor =
        vendor.email &&
        vendor.email.trim().toLowerCase() === emailTrimmed;

      if (duplicateEmailInContacts || duplicateEmailWithVendor) {
        toast.error(`Email ${emailTrimmed} is already used!`);
        return;
      }
    }

    // 🔹 If this is marked as main, clear all others
    if (contactToSave.isMain) {
      updatedContacts = updatedContacts.map((c) => ({ ...c, isMain: false }));
    }

    // 🔹 Add or update contact person
    if (editingIndex !== null) {
      updatedContacts[editingIndex] = contactToSave;
      setContactPersons(updatedContacts);
      toast.success(`Contact person "${contactToSave.name}" updated successfully!`);
    } else {
      setContactPersons([...updatedContacts, contactToSave]);
      toast.success(`Contact person "${contactToSave.name}" added successfully!`);
    }

    // ✅ Reset form
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
    setShowPanel(false);
  };




  const editContact = (index) => {
    const c = contactPersons[index];
    let mobileValue = c.mobile_no || "";

    try {
      const phoneNumber = parsePhoneNumberFromString(mobileValue, countryCode.toUpperCase());
      if (phoneNumber && phoneNumber.isValid()) {
        mobileValue = phoneNumber.number; // E.164
      }
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


  const capitalizeFirstLetter = (value) => {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
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
  const validateVendor = () => {
    const newErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Email
    if (vendor.email) {
      const emailTrimmed = vendor.email.trim();

      if (/\s/.test(emailTrimmed)) {
        newErrors.email = "Email cannot contain spaces";
      } else if (/[A-Z]/.test(emailTrimmed)) {
        newErrors.email = "Email must be in lowercase (e.g. name@example.com)";
      } else if (!emailPattern.test(emailTrimmed)) {
        newErrors.email = "Invalid email format (e.g. name@example.com)";
      }
    }

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    // Required fields
    if (!vendor.vendor?.trim()) newErrors.vendor = "Vendor name is required";

    // ❌ MOBILE NOT REQUIRED
    if (vendor.mobile_no) {
      try {
        if (!isValidPhoneNumber(vendor.mobile_no)) {
          newErrors.mobile_no = "Invalid mobile number";
        }
      } catch {
        newErrors.mobile_no = "Invalid mobile number";
      }
    }

    // GST
    if (vendor.gst_no) {
      const gst = vendor.gst_no.trim().toUpperCase();
      if (gst.length !== 15) newErrors.gst_no = "GST No must be 15 characters";
      else if (!gstRegex.test(gst)) newErrors.gst_no = "Invalid GST No format";
    }

    // Required Location Fields
    if (!vendor.pincode?.trim()) newErrors.pincode = "Pincode is required";
    if (!vendor.city?.trim()) newErrors.city = "City is required";
    if (!vendor.district?.trim()) newErrors.district = "District is required";
    if (!vendor.state?.trim()) newErrors.state = "State is required";

    // ❌ ADDRESS NOT REQUIRED
    // removed newErrors.address

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveVendor = async () => {
    if (!validateVendor()) {
      toast.error("Please fill the required fields.");
      return;
    }

    const payload = {
      ...vendor,
      contact_persons: contactPersons.map((c) => ({
        name: c.name.replace(" (Main)", ""),
        designation: c.designation,
        mobile_no: c.mobile_no,
        email: c.email,
        status: c.status,
        is_main: c.isMain ? true : false,
      })),
    };

    try {
      const res = await api.put(`/${id}`, payload);
      const data = res.data;

      setErrors({});
      toast.success("Vendor updated successfully!");
      setTimeout(() => navigate("/vendor"), 1000);

    } catch (err) {
      console.error("Update vendor error:", err);

      // Backend validation errors
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;

        Object.entries(backendErrors).forEach(([key, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : messages;

          if (key === "mobile_no") toast.error("Mobile number already taken");
          else if (key === "email") toast.error("Email already taken");
          else if (key === "vendor") toast.error("Company name already exists");
          else toast.error(msg);
        });

        return;
      }

      // Other backend messages
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
        return;
      }

      // TRUE Network error
      toast.error("Network error! Please try again.");
    }
  };






  const cityOptionsFormatted = [
    ...cityOptions.map(c => ({ label: c, value: c })),
    ...(vendor.city ? [{ label: vendor.city, value: vendor.city }] : [])
  ];


  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


  return (
    <div className="container-fluid " style={{ background: "white", minHeight: "100vh", position: "relative" }}>
      <Row className="align-items-center mb-3">
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
              {errors.pincode && (
                <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {errors.pincode}
                </div>
              )}
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
                classNamePrefix="my-select"
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
            <Form.Group className="mb-3 form-field">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={vendor.email ?? ""}
                onChange={handleVendorChange}
                isInvalid={!!errors.email}
              />
              {errors.email && (
                <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {errors.email}
                </div>
              )}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3  form-field">
              <Form.Label>
                Mobile No<span style={{ color: "red" }}> </span>
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
              {vendorErrors.mobile_no && (
                <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {vendorErrors.mobile_no}
                </div>
              )}

            </Form.Group>
          </Col>


          <Col md={4}>
            <Form.Group className="mb-3  form-field">
              <Form.Label>
                Address<span style={{ color: "red" }}> </span>
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
          // ✅ Check if vendor details are filled before adding contact person
          const requiredFields = [
            "vendor",
            // "mobile_no",
            "pincode",
            "city",
            "state",
            "district",
            // "address",
          ];

          const emptyField = requiredFields.find((field) => {
            const value = vendor[field];
            if (value === undefined || value === null) return true;
            if (typeof value === "string" && value.trim() === "") return true;
            if (typeof value === "number" && value === 0) return true;
            return false;
          });

          if (emptyField) {
            toast.error("Please fill the company details first!");
            return;
          }

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
          setContactKey(prev => prev + 1);
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
                    color: "inherit",
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
        <h5>{editingIndex !== null ? "Add Contact" : "Edit Contact"}</h5>
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

            <Col md={12}>
              <Form.Group>
                <Form.Label>
                  Mobile No<span style={{ color: "red" }}> </span>
                </Form.Label>

                <div
                  className={`country-phone-wrapper ${contactErrors.mobile_no ? "is-invalid" : ""
                    }`}
                >
                  <CountryPhoneInput
                    key={contactKey} // 👈 keep this
                    country={countryCode.toLowerCase()}
                    international
                    value={contact.mobile_no ?? ""}
                    onChange={handleContactMobileChange}
                    enableSearch
                    defaultCountry={countryCode}
                    className={`form-control ${contactErrors.mobile_no ? "is-invalid" : ""
                      }`}
                  />
                </div>

                {contactErrors.mobile_no && (
                  <div
                    className="invalid-feedback"
                    style={{ display: "block", fontSize: "0.875rem" }}
                  >
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
