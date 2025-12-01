import { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import api, { setAuthToken } from "../api";
import CreatableSelect from "react-select/creatable";
import "react-phone-number-input/style.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import { isValidPhoneNumber } from "libphonenumber-js";
import CountryPhoneInput from "../components/CountryPhoneInput";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export default function AddVendor() {
  const navigate = useNavigate();
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
    country_code: "",
  });

  const [cityOptions, setCityOptions] = useState([]);
  const [contactPersons, setContactPersons] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [contactErrors, setContactErrors] = useState({});
  const [vendorErrors, setVendorErrors] = useState({});
  const MySwal = withReactContent(Swal);
  const [panelKey, setPanelKey] = useState(0);
  const [contactCountry, setContactCountry] = useState("IN");
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  const capitalizeWords = (str) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const [contact, setContact] = useState({
    name: "",
    designation: "",
    mobile_no: "",
    email: "",
    status: "Active",
    isMain: false,
  });
  const formatMobileNumber = (number, defaultCountry = "IN") => {
    if (!number) return "N/A";

    try {
      const fullNumber = number.startsWith("+")
        ? number
        : `+${getCountryCallingCode(defaultCountry)}${number}`;

      const phoneNumber = parsePhoneNumberFromString(fullNumber);

      if (!phoneNumber) return number;

      return `+${phoneNumber.countryCallingCode} ${phoneNumber.nationalNumber}`;
    } catch {
      return number;
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
  }, []);

  const handleVendorMobileChange = (value) => {
    if (!value) {
      setVendor(prev => ({ ...prev, mobile_no: "", country_code: "" }));
      setVendorErrors(prev => ({ ...prev, mobile_no: "" }));
      return;
    }

    try {
      const phone = parsePhoneNumberFromString(value);

      if (phone && phone.isValid()) {
        setVendor(prev => ({
          ...prev,
          mobile_no: phone.number, // store in E.164 format
          country_code: phone.countryCallingCode,
        }));
        setVendorErrors(prev => ({ ...prev, mobile_no: "" }));
      } else {
        setVendorErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
      }
    } catch {
      setVendorErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
    }
  };

  const validateVendor = () => {
    const errors = {};

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    // Email Validation
    if (vendor.email) {
      const emailTrimmed = vendor.email.trim();

      if (/\s/.test(emailTrimmed)) {
        errors.email = "Email cannot contain spaces";
      } else if (emailTrimmed !== emailTrimmed.toLowerCase()) {
        errors.email = "Email must be in lowercase (e.g. name@example.com)";
      } else if (!emailPattern.test(emailTrimmed)) {
        errors.email = "Invalid email format (e.g. name@example.com)";
      }
    }

    // Vendor Name Required
    if (!vendor.vendor?.trim()) {
      errors.vendor = "Vendor name is required";
    }

    // ❌ Vendor Mobile Not Required
    if (vendor.mobile_no) {
      if (!isValidPhoneNumber(vendor.mobile_no)) {
        errors.mobile_no = "Invalid mobile number for selected country";
      }
    }

    // GST Check
    if (vendor.gst_no) {
      const gst = vendor.gst_no.trim().toUpperCase();
      if (gst.length !== 15) {
        errors.gst_no = "GST No must be 15 characters";
      } else if (!gstRegex.test(gst)) {
        errors.gst_no = "Invalid GST No format";
      }
    }

    // Required location fields
    if (!vendor.pincode?.trim()) errors.pincode = "Pincode is required";
    if (!vendor.city?.trim()) errors.city = "City is required";
    if (!vendor.district?.trim()) errors.district = "District is required";
    if (!vendor.state?.trim()) errors.state = "State is required";


    setVendorErrors(errors);
    return Object.keys(errors).length === 0;
  };



  const handleVendorChange = (e) => {
    const { name, value } = e.target;

    // For pincode, keep numeric logic as is
    if (name === "pincode") {
      let input = value.replace(/\D/g, "");
      if (input.length > 6) input = input.slice(0, 6);

      setVendor((prev) => ({ ...prev, pincode: input }));
      setVendorErrors((prev) => ({ ...prev, pincode: "" }));

      if (input.length === 6) {
        fetchPincodeDetails(input);
      }
      return;
    }

    // Capitalize all text fields except email, gst_no, and address
    let updatedValue = value;
    if (!["email", "gst_no", "address"].includes(name)) {
      updatedValue = capitalizeWords(value);
    }

    setVendor((prev) => ({ ...prev, [name]: updatedValue }));

    if (vendorErrors[name]) {
      setVendorErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };


  const handleContactChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    // Only capitalize text fields (not email or mobile)
    if (!["email", "mobile_no"].includes(name)) {
      updatedValue = capitalizeWords(value);
    }

    setContact({ ...contact, [name]: updatedValue });

    if (name !== "mobile_no" && contactErrors[name]) {
      setContactErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };


  const cityOptionsFormatted = cityOptions.map((c) => ({ label: c, value: c }));

  const fetchPincodeDetails = async (pincode) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();

      if (data[0].Status === "Success") {
        const postOffices = data[0].PostOffice;
        const cities = postOffices.map((po) => po.Name);

        setCityOptions(cities);
        setVendor((prev) => ({
          ...prev,
          state: postOffices[0].State || "",
          district: postOffices[0].District || "",
          city: cities.length === 1 ? cities[0] : "",
        }));

        setVendorErrors((prev) => ({
          ...prev,
          city: cities.length === 1 ? "" : prev.city,
          district: postOffices[0].District ? "" : prev.district,
          state: postOffices[0].State ? "" : prev.state,
        }));
      } else {
        fallbackToManual();
      }
    } catch (err) {
      console.error("Pincode API failed", err);
      fallbackToManual();
    }
  };

  const fallbackToManual = () => {
    setCityOptions([]);
    setVendor((prev) => ({
      ...prev,
      state: "",
      district: "",
      city: "",
    }));
    toast.error("Could not fetch details. Please enter City, District, and State manually.");
  };

  const addContactPerson = () => {
    if (!validateContact()) return;

    const errors = {};

    if (contact.email) {
      const emailTrimmed = contact.email.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (/\s/.test(emailTrimmed)) {
        errors.email = "Email cannot contain spaces";
      } else if (emailTrimmed !== emailTrimmed.toLowerCase()) {
        errors.email = "Email must be in lowercase (e.g. name@example.com)";
      } else if (!emailPattern.test(emailTrimmed)) {
        errors.email = "Invalid email format (e.g. name@example.com)";
      } else if (
        vendor.email &&
        emailTrimmed.toLowerCase() === vendor.email.trim().toLowerCase()
      ) {
        errors.email = "Contact email cannot be the same as company email";
      }
    }

    if (contact.email && vendor?.backendErrors) {
      const backendErrorKey = Object.keys(vendor.backendErrors).find((key) =>
        key.includes(contact.email)
      );
      if (backendErrorKey) {
        errors.email = "This email address is already taken.";
      }
    }

    // 🔹 Stop if any email error found
    if (errors.email) {
      toast.error(errors.email);
      setContactErrors(errors);
      return;
    }

    const contactToSave = { ...contact };
    let updatedContacts = [...contactPersons];

    // 🔹 Check if already has a main contact person (when adding or editing)
    const hasMainContact = updatedContacts.some(
      (c, idx) => c.isMain && idx !== editingIndex
    );

    if (contactToSave.isMain && hasMainContact) {
      toast.error("A main contact person already exists!");
      return;
    }

    // 🔹 Check for duplicate mobile numbers
    const duplicateInContacts =
      contactToSave.mobile_no &&
      updatedContacts.some(
        (c, idx) =>
          c.mobile_no &&
          c.mobile_no === contactToSave.mobile_no &&
          idx !== editingIndex
      );

    const duplicateWithVendor =
      contactToSave.mobile_no &&
      vendor.mobile_no &&
      contactToSave.mobile_no === vendor.mobile_no;

    if (duplicateInContacts || duplicateWithVendor) {
      toast.error(
        `Mobile number ${contactToSave.mobile_no} is already used!`
      );
      return;
    }
    if (contactToSave.isMain) {
      updatedContacts = updatedContacts.map((c) => ({ ...c, isMain: false }));
    }

    if (editingIndex !== null) {
      updatedContacts[editingIndex] = contactToSave;
      setContactPersons(updatedContacts);
      toast.success(`Contact person "${contactToSave.name}" updated successfully!`);
    } else {
      setContactPersons([...updatedContacts, contactToSave]);
      toast.success(`Contact person "${contactToSave.name}" added successfully!`);
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
    setShowPanel(false);
    setTimeout(() => setShowPanel(false), 0);
  };



  const editContact = (index) => {
    const c = contactPersons[index];
    let mobileValue = c.mobile_no || "";

    try {
      const phoneNumber = parsePhoneNumberFromString(mobileValue);
      if (phoneNumber && phoneNumber.isValid()) {
        mobileValue = phoneNumber.number; // ✅ Always E.164 format (+91xxxx)
      }
    } catch { }

    setContact({
      ...c,
      mobile_no: mobileValue,
      isMain: !!c.isMain,
    });

    setEditingIndex(index);
    setShowPanel(true);
  };


  const deleteContact = (index) => {
    const contactName = contactPersons[index].name;
    MySwal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${contactName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = [...contactPersons];
        updated.splice(index, 1);
        setContactPersons(updated);
        toast.success(`Contact person "${contactName}" deleted successfully!`);
      }
    });
  };
  const handleContactMobileChange = (value) => {
    setContact(prev => ({ ...prev, mobile_no: value }));

    if (!value) {
      setContactErrors(prev => ({ ...prev, mobile_no: "" }));
      return;
    }

    try {
      const phone = parsePhoneNumberFromString(value);

      if (!phone) {
        setContactErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
        return;
      }

      if (!phone.isValid()) {
        setContactErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
        return;
      }

      // ✅ Valid number: store E.164 format
      setContact(prev => ({
        ...prev,
        mobile_no: phone.number,
        country_code: phone.countryCallingCode
      }));

      setContactErrors(prev => ({ ...prev, mobile_no: "" }));
    } catch (error) {
      setContactErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
    }
  };

  const validateContact = () => {
    const errors = {};

    if (!contact.name.trim()) errors.name = "Name is required";

    if (contact.mobile_no) {
      if (!isValidPhoneNumber(contact.mobile_no)) {
        errors.mobile_no = "Invalid mobile number for selected country";
      }
    }

    // Email validation
    if (contact.email) {
      const emailCleaned = contact.email.trim();

      if (/\s/.test(emailCleaned)) {
        errors.email = "Email cannot contain spaces";
      } else if (/[A-Z]/.test(emailCleaned)) {
        errors.email = "Email must be in lowercase (e.g. name@example.com)";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCleaned)) {
        errors.email = "Invalid email format (e.g. name@example.com)";
      } else if (
        vendor.email &&
        emailCleaned.toLowerCase() === vendor.email.trim().toLowerCase()
      ) {
        errors.email = "Contact email cannot be the same as company email";
      }
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveVendor = async () => {
    if (!validateVendor()) return;


    try {
      const response = await api.post(
        "/vendors/new",
        {
          ...vendor,
          contact_persons: contactPersons,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      // ✅ If API call succeeds
      toast.success("Vendor added successfully!");
      navigate("/vendor");
    } catch (err) {
      console.error(err);

      // ✅ Handle Laravel validation errors
      if (err.response && err.response.data && err.response.data.errors) {
        const errors = err.response.data.errors;

        Object.entries(errors).forEach(([key, messages]) => {
          const message = Array.isArray(messages) ? messages.join(", ") : messages;

          if (key === "vendor") {
            toast.error("Company name already exists");
          } else if (key === "email") {
            toast.error("Email already taken");
          } else if (key === "mobile_no") {
            toast.error("Mobile number already taken");
          } else if (key === "gst_no") {
            toast.error("GST number already exists");
          } else if (key.startsWith("contact_persons")) {
            // Example key: contact_persons.0.email
            const parts = key.split(".");
            const index = parts[1] || "?";
            const field = parts[2] || "field";
            const contactName =
              contactPersons[index]?.name || `#${parseInt(index) + 1}`;
            toast.error(
              `Contact person ${contactName} ${field.replace(
                "_",
                " "
              )} error: ${message}`
            );
          } else {
            // fallback for unknown field
            toast.error(`${key.replace("_", " ")}: ${message}`);
          }
        });
      } else if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Error saving vendor!");
      }
    }
  };


  const feedbackStyle = { color: "red", fontSize: "0.85rem", marginTop: "4px" };
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  return (
    <>
      <div className="container-fluid " style={{ background: "white", minHeight: "100vh", position: "relative" }}>
        <Row className="align-items-center mb-3">
          <Col>
            <h4>Add Vendor Details</h4>
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
              <Form.Group className="mb-3 form-field">
                <Form.Label>
                  Vendor<span style={{ color: "red" }}> *</span>
                </Form.Label>

                <Form.Control type="text" name="vendor" value={vendor.vendor} onChange={handleVendorChange}
                  placeholder="Enter company name"
                />
                {vendorErrors.vendor && (
                  <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                    {vendorErrors.vendor}
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3 form-field">
                <Form.Label>GST No</Form.Label>
                <Form.Control
                  type="text"
                  name="gst_no"
                  value={vendor.gst_no}
                  maxLength={15}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase().trim();

                    if (value.length > 15) value = value.slice(0, 15);

                    setVendor({ ...vendor, gst_no: value });

                    if (!value) {
                      setVendorErrors(prev => ({ ...prev, gst_no: "GST No is required" }));
                    } else if (value.length !== 15) {
                      setVendorErrors(prev => ({ ...prev, gst_no: "GST No must be 15 characters" }));
                    } else if (!gstRegex.test(value)) {
                      setVendorErrors(prev => ({ ...prev, gst_no: "Invalid GST No format" }));
                    } else {
                      setVendorErrors(prev => ({ ...prev, gst_no: "" }));
                    }
                  }}
                  placeholder="Enter GST No"
                />

                {vendorErrors.gst_no && (
                  <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                    {vendorErrors.gst_no}
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3 form-field">
                <Form.Label>
                  Pincode<span style={{ color: "red" }}> *</span>
                </Form.Label>
                <Form.Control type="number" name="pincode" value={vendor.pincode} onChange={handleVendorChange}
                  placeholder=" Enter pincode"
                />

                {vendorErrors.pincode && <div style={feedbackStyle}>{vendorErrors.pincode}</div>}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3 form-field">
                <Form.Label>
                  City<span style={{ color: "red" }}> *</span>
                </Form.Label>

                <CreatableSelect
                  isClearable
                  options={cityOptionsFormatted}
                  value={vendor.city ? { label: vendor.city, value: vendor.city } : null}
                  onChange={(selected) => {
                    const cityValue = selected ? selected.value : "";
                    setVendor({ ...vendor, city: cityValue });

                    if (cityValue) {
                      setVendorErrors((prev) => ({ ...prev, city: "" }));
                    }
                  }}
                  onInputChange={(inputValue, { action }) => {
                    if (action === "input-change") {
                      setVendor({ ...vendor, city: inputValue });

                      if (inputValue) {
                        setVendorErrors((prev) => ({ ...prev, city: "" }));
                      }
                    }
                  }}
                  placeholder="Select or type city"
                  classNamePrefix="my-select"
                />
                {vendorErrors.city && <div style={feedbackStyle}>{vendorErrors.city}</div>}

              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3 form-field">
                <Form.Label>
                  District<span style={{ color: "red" }}> *</span>
                </Form.Label>

                <Form.Control type="text" name="district" value={vendor.district}
                  onChange={handleVendorChange}
                  placeholder="Enter District"
                  readOnly={!!vendor.district}
                />

                {vendorErrors.district && <div style={feedbackStyle}>{vendorErrors.district}</div>}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3 form-field">
                <Form.Label>
                  State<span style={{ color: "red" }}> *</span>
                </Form.Label>

                <Form.Control type="text" name="state" value={vendor.state}
                  onChange={handleVendorChange}
                  placeholder="Enter State" />
                {vendorErrors.state && <div style={feedbackStyle}>{vendorErrors.state}</div>}
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
                  value={vendor.email}
                  placeholder="Enter Email"
                  onChange={(e) => {
                    const value = e.target.value;

                    // ✅ Update email value
                    setVendor({ ...vendor, email: value });

                    // ✅ Remove the email error when the user corrects input
                    if (vendorErrors.email) {
                      setVendorErrors((prev) => ({
                        ...prev,
                        email: "", // Clear only email error
                      }));
                    }
                  }}
                />

                {vendorErrors.email && (
                  <div style={feedbackStyle}>{vendorErrors.email}</div>
                )}
              </Form.Group>

            </Col>
            <Col md={4}>
              <Form.Group className="mb-3 form-field">
                <CountryPhoneInput
                  label="Mobile No"
                  value={vendor.mobile_no}
                  onChange={handleVendorMobileChange} // ✅ correct handler
                  country={contactCountry}
                  onCountryChange={setContactCountry}
                  error={vendorErrors.mobile_no} // ✅ vendor errors
                />


              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3 form-field">
                <Form.Label>
                  Address<span style={{ color: "red" }}> </span>
                </Form.Label>

                <Form.Control as="textarea" rows={2} name="address" value={vendor.address} onChange={handleVendorChange}
                  placeholder="Enter Address"
                />
                {vendorErrors.address && <div style={feedbackStyle}>{vendorErrors.address}</div>}

              </Form.Group>
            </Col>
          </Row>
        </div>
        <Button
          variant="success"
          onClick={() => {
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
            setPanelKey((prev) => prev + 1);
            setShowPanel(true);
          }}
        >
          + Add Contact Person
        </Button>


        <div style={{ marginTop: "20px", background: "#fff", borderRadius: "6px", padding: "20px" }}>
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th
                  style={{
                    width: "50px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#f1f3f5",
                    fontWeight: "normal",
                    color: "inherit",
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
                      fontWeight: "normal",
                      color: "inherit",
                    }}
                  >
                    {label}
                  </th>
                ))}
                <th
                  style={{
                    textAlign: "center",
                    backgroundColor: "#f1f3f5",
                    fontWeight: "normal",
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
                    <td>{formatMobileNumber(c.mobile_no, " ")}</td>
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
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate("/vendor")}
          >
            Cancel
          </Button>

          <Button variant="success" onClick={saveVendor}>
            Save
          </Button>
        </div>

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

          <Form key={panelKey} className="mt-4 form-field">
            <div style={{ background: "rgb(244, 244, 248)", borderRadius: "6px" }}>
              <Row className="p-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      Name<span style={{ color: "red" }}> *</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={contact.name.replace(" (Main person)", "")}
                      onChange={handleContactChange}
                      placeholder="Enter Name"
                    />
                    {contactErrors.name && <div style={feedbackStyle}>{contactErrors.name}</div>}
                  </Form.Group>

                  <Form.Check
                    type="checkbox"
                    label="Main Contact"
                    checked={contact.isMain || false}
                    onChange={(e) => setContact({ ...contact, isMain: e.target.checked })}
                  />
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Designation</Form.Label>
                    <Form.Control
                      type="text"
                      name="designation"
                      value={contact.designation}
                      onChange={handleContactChange}
                      placeholder="Enter Designation"
                    />
                    {contactErrors.designation && <div style={feedbackStyle}>{contactErrors.designation}</div>}
                  </Form.Group>
                </Col>
              </Row>

              <Row className="p-2">
                <Col md={12}>
                  <Form.Group className="mb-3 form-field">
                    <CountryPhoneInput
                      label="Mobile No"
                      value={contact.mobile_no}
                      onChange={handleContactMobileChange}
                      defaultCountry="IN"
                      error={contactErrors.mobile_no}
                    />


                  </Form.Group>
                </Col>
              </Row>
              <Row className="p-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={contact.email}
                      placeholder="Enter Email"
                      onChange={(e) => {
                        const input = e.target.value;
                        setContact({ ...contact, email: input });

                        // ✅ Clear email error instantly when user changes input
                        if (contactErrors.email) {
                          setContactErrors((prev) => ({
                            ...prev,
                            email: "",
                          }));
                        }
                      }}
                    />
                    {contactErrors.email && (
                      <div style={feedbackStyle}>{contactErrors.email}</div>
                    )}
                  </Form.Group>

                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={contact.status}
                      onChange={handleContactChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Form.Select>
                    {contactErrors.status && <div style={feedbackStyle}>{contactErrors.status}</div>}
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="d-flex justify-content-end mt-3">
              <Button variant="success" onClick={addContactPerson}>
                Save
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
}
