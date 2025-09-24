import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import DataTable from "react-data-table-component";
import CreatableSelect from "react-select/creatable";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

import { parsePhoneNumberFromString, getCountryCallingCode, isValidPhoneNumber } from "libphonenumber-js";


// import { getCountryCallingCode } from "libphonenumber-js";

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
  });

  const [cityOptions, setCityOptions] = useState([]);
  const [contactPersons, setContactPersons] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [contactErrors, setContactErrors] = useState({});
  const [countryCode, setCountryCode] = useState("");
  const [countries, setCountries] = useState([]);
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
        if (data && data.country_calling_code) {
          setCountryCode(data.country_calling_code); // e.g. "+1", "+91"
        }
      })
      .catch(() => {
        setCountryCode("");
      });
  }, []);

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


  // const handleMobileChange = (e) => {
  //   let value = e.target.value;

  //   // Use detected country code
  //   if (countryCode && !value.startsWith("+")) {
  //     // convert 'IN' -> '91'
  //     const numericCode = getCountryCallingCode(countryCode.replace("+", ""));
  //     value = `+${numericCode}${value.replace(/\D/g, "")}`;
  //   }

  //   setVendor({ ...vendor, mobile_no: value });
  // };


  const validateVendor = () => {
    const errors = {};

    if (!vendor.vendor.trim()) errors.vendor = "Company Name is required";
    if (!vendor.gst_no.trim()) errors.gst_no = "GST No is required";
    if (!vendor.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendor.email))
      errors.email = "Invalid email format";
    if (!vendor.mobile_no.trim()) errors.mobile_no = "Mobile number is required";
    if (!vendor.pincode.trim()) errors.pincode = "Pincode is required";
    if (!vendor.city.trim()) errors.city = "City is required";
    if (!vendor.district.trim()) errors.district = "District is required";
    if (!vendor.state.trim()) errors.state = "State is required";
    if (!vendor.address.trim()) errors.address = "Address is required";

    setVendorErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateContact = () => {
    const errors = {};

    if (!contact.name.trim()) errors.name = "Name is required";
    if (!contact.designation.trim()) errors.designation = "Designation is required";
    if (!contact.mobile_no || contact.mobile_no.length < 10)
      errors.mobile_no = "Mobile number is required and must be valid";

    // if (!contact.email.trim()) errors.email = "Email is required";
    // else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
    //   errors.email = "Invalid email format";

      if (!contact.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
    errors.email = "Invalid email format";
  else if (contact.email.trim().toLowerCase() === vendor.email.trim().toLowerCase())
    errors.email = "Contact email cannot be the same as company email";

    if (!contact.status) errors.status = "Status is required";


    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle vendor inputs
  // const handleVendorChange = (e) => {
  //   const { name, value } = e.target;
  //   setVendor({ ...vendor, [name]: value });
  //    if (vendorErrors[name]) {
  //   setVendorErrors((prev) => ({ ...prev, [name]: "" }));
  // }

  // };

  const handleVendorChange = (e) => {
    const { name, value } = e.target;

    setVendor({ ...vendor, [name]: value });

    if (name === "mobile_no") {
      if (!value.trim()) {
        setVendorErrors((prev) => ({ ...prev, mobile_no: "Mobile number is required" }));
      } else if (value.replace(/\D/g, "").length > 15) {
        setVendorErrors((prev) => ({ ...prev, mobile_no: "Mobile number cannot exceed 15 digits" }));
      } else {
        setVendorErrors((prev) => ({ ...prev, mobile_no: "" }));
      }
    }

    else if (vendorErrors[name]) {
      setVendorErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "pincode" && value.length === 6) {
      fetchPincodeDetails(value);
    }
  };

  // Handle contact inputs
  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContact({ ...contact, [name]: value });

    if (name === "mobile_no") {
      if (!value.trim()) {
        setContactErrors((prev) => ({ ...prev, mobile_no: "Mobile number is required" }));
      } else if (value.replace(/\D/g, "").length > 15) {
        setContactErrors((prev) => ({ ...prev, mobile_no: "Mobile number cannot exceed 15 digits" }));
      } else {
        setContactErrors((prev) => ({ ...prev, mobile_no: "" }));
      }
    } else if (contactErrors[name]) {
      setContactErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const columns = [
    { name: "Name", selector: (row) => row.name + (row.isMain ? " (Main person)" : "") },
    { name: "Designation", selector: (row) => row.designation, sortable: true },
    { name: "Mobile", selector: (row) => row.mobile_no, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
    {
      name: "Actions",
      cell: (row, index) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => editContact(index)}
          >
            <i className="bi bi-pencil-square"></i>
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => deleteContact(index)}
          >
            <i className="bi bi-trash"></i>
          </Button>
        </div>
      ),

      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

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
          state: postOffices[0].State,
          district: postOffices[0].District,
          city: cities.length === 1 ? cities[0] : "",
        }));

        setVendorErrors((prev) => ({
          ...prev,
          city: cities.length === 1 ? "" : prev.city,
          district: postOffices[0].District ? "" : prev.district,
          state: postOffices[0].State ? "" : prev.state,
        }));
      } else {
        // API returned error
        fallbackToManual();
      }
    } catch (err) {
      console.error("Pincode API failed", err);
      // Network or parse error → fallback
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

  const contactToSave = { ...contact };
  let updatedContacts = [...contactPersons];

  // If this contact is marked as Main, unset isMain for all others
  if (contactToSave.isMain) {
    updatedContacts = updatedContacts.map(c => ({ ...c, isMain: false }));
  }

  if (editingIndex !== null) {
    updatedContacts[editingIndex] = contactToSave;
    setContactPersons(updatedContacts);
  } else {
    setContactPersons([...updatedContacts, contactToSave]);
  }

  // Reset form
  setContact({
    name: "",
    designation: "",
    mobile_no: "",
    email: "",
    status: "Active",
    isMain: false,
  });
  setEditingIndex(null);
  setShowPanel(false);
};


  const handleContactMobileChange = (e) => {
    let value = e.target.value;

    if (!value.startsWith("+") && countryCode) {
      value = countryCode + value.replace(/\D/g, "");
    }

    setContact({ ...contact, mobile_no: value });
  };


  const editContact = (index) => {
    const c = contactPersons[index];
    setContact({
      ...c,
      isMain: !!c.isMain, 
    });
    setEditingIndex(index);
    setShowPanel(true);
  };

  const deleteContact = (index) => {
    const updated = [...contactPersons];
    updated.splice(index, 1);
    setContactPersons(updated);
  };

  const handleContacMobileChange = (value) => {
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


  const saveVendor = async () => {
    if (!validateVendor()) return;

    const payload = {
      ...vendor,
      contact_persons: contactPersons.map(c => ({
        name: c.name.replace(" (Main person)", ""),
        designation: c.designation,
        mobile_no: c.mobile_no,
        alt_mobile_no: c.alt_mobile_no || null,
        email: c.email,
        status: c.status,
        is_main: c.isMain ? true : false,
      })),
    };

    try {
      const response = await fetch("http://localhost:8000/api/vendors/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        toast.error("Error saving vendor!");
        return;
      }

      toast.success("Vendor saved successfully!");
          navigate("/vendor");
      console.log(data);
    } catch (err) {
      console.error(err);
      toast.error("Error saving vendor!");
    }
  };

  const feedbackStyle = { color: "red", fontSize: "0.85rem", marginTop: "4px" };

  return (
    <div className="container-fluid p-4" style={{ background: "white", minHeight: "100vh", position: "relative" }}>
      <h5 className="mb-3">Add Vendor Details</h5>

      {/* Vendor Form */}
      <div style={{ background: "#f1f3f5", padding: "20px", borderRadius: "6px", marginBottom: "20px" }}>
        <h6 className="mb-3">Company Details</h6>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Company Name</Form.Label>
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
            <Form.Group className="mb-3">
              <Form.Label>GST No</Form.Label>
              <Form.Control
                type="text"
                name="gst_no"
                value={vendor.gst_no}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setVendor({ ...vendor, gst_no: value });

                  if (value.length > 15) {
                    setVendorErrors((prev) => ({ ...prev, gst_no: "GST No cannot exceed 15 characters" }));
                  } else if (value.length === 15 && !/^[0-9A-Z]{15}$/.test(value)) {
                    setVendorErrors((prev) => ({ ...prev, gst_no: "GST No must be 15 alphanumeric characters" }));
                  } else {
                    setVendorErrors((prev) => ({ ...prev, gst_no: "" }));
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
            <Form.Group className="mb-3">
              <Form.Label>Pincode</Form.Label>
              <Form.Control type="text" name="pincode" value={vendor.pincode} onChange={handleVendorChange}
                placeholder=" Enter pincode"
              />
              {vendorErrors.pincode && <div style={feedbackStyle}>{vendorErrors.pincode}</div>}

            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
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
              />
              {vendorErrors.city && <div style={feedbackStyle}>{vendorErrors.city}</div>}

            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>District</Form.Label>
              <Form.Control type="text" name="district" value={vendor.district}
                onChange={handleVendorChange}
                placeholder="Enter District" />
              {vendorErrors.district && <div style={feedbackStyle}>{vendorErrors.district}</div>}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>State</Form.Label>
              <Form.Control type="text" name="state" value={vendor.state}
                onChange={handleVendorChange}
                placeholder="Enter State" />
              {vendorErrors.state && <div style={feedbackStyle}>{vendorErrors.state}</div>}
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" value={vendor.email} onChange={handleVendorChange}
                placeholder="Enter Email"
              />
              {vendorErrors.email && <div style={feedbackStyle}>{vendorErrors.email}</div>}

            </Form.Group>
          </Col>
          <Col md={4}>
          <Form.Group className="mb-3">
  <Form.Label>Mobile No</Form.Label>
  <PhoneInput
    international
    defaultCountry="IN"
    className="form-control"
    value={vendor.mobile_no}
    onChange={handleVendorMobileChange} 
  />
  {vendorErrors.mobile_no && (
    <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
      {vendorErrors.mobile_no}
    </div>
  )}
</Form.Group>


          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control as="textarea" rows={1} name="address" value={vendor.address} onChange={handleVendorChange}
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
        <div className="mt-3">
          <DataTable
            columns={columns}
            data={contactPersons}
            pagination
            highlightOnHover
            striped
            responsive
            customStyles={{
              headRow: {
                style: {
                  backgroundColor: "#f1f3f5",
                  color: "black",
                  fontWeight: "semibold",
                  fontSize: "14px",
                },
              },
            }}
          />
        </div>
      )}

      <div className="d-flex justify-content-end">
  <Button
  variant="secondary"
  className="me-2"
  onClick={() => navigate("/vendor")}  // navigate to vendor list
>
  Cancel
</Button>

        <Button variant="success" onClick={saveVendor}>
          Save
        </Button>
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
          <div style={{ background: "#f5f5f5", borderRadius: "6px" }}>

            <Row className="p-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={contact.name.replace(" (Main person)", "")} // show clean name
                    // onChange={(e) =>
                    //   setContact({ ...contact, name: e.target.value })
                    // }
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
                  <Form.Label>Designation*</Form.Label>
                  <Form.Control
                    type="text"
                    name="designation"
                    value={contact.designation}
                    onChange={handleContactChange}

                    placeholder="Enter Designation"
                  />
                  {contactErrors.designation && <div style={feedbackStyle}>{contactErrors.designation}</div>}                </Form.Group>
              </Col>
            </Row>

            {/* Row 2: Mobile + Email */}
            <Row className="p-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Mobile No</Form.Label>
                  <PhoneInput
  international
  defaultCountry="IN"
  value={contact.mobile_no}
  onChange={handleContacMobileChange}
  className="form-control"
/>
                  {contactErrors.mobile_no && <div style={feedbackStyle}>{contactErrors.mobile_no}</div>}


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
                  />
                  {contactErrors.email && <div style={feedbackStyle}>{contactErrors.email}</div>}
                </Form.Group>
              </Col>
            </Row>

            {/* Row 3: Status */}
            <Row className=" p-2">
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
                  {contactErrors.status && <div style={feedbackStyle}>{contactErrors.status}</div>}                </Form.Group>
              </Col>
            </Row>

          </div>

          <div className="d-flex justify-content-end mt-3">
            {/* <Button variant="secondary" className="me-2" onClick={() => setShowPanel(false)}>
              Cancel
            </Button> */}
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
              Save
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
