import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../api";
import "react-toastify/dist/ReactToastify.css";
import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";
import { useNavigate } from "react-router-dom"; // <-- import

export default function AddCustomer() {
  const [customer, setCustomer] = useState({
    customer: "",
    gst_no: "",
    email: "",
    pincode: "",
    city: "",
    state: "",
    district: "",
    address: "",
    mobile_no: "",
    status: "active",
  });

  const [cityOptions, setCityOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [countryCode, setCountryCode] = useState("");
   const navigate = useNavigate();

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country_calling_code) {
          setCountryCode(data.country_calling_code); // e.g. "+91"
        }
      })
      .catch(() => setCountryCode(""));
  }, []);

  const validateCustomer = () => {
    const errs = {};

    // Required fields
    if (!customer.customer.trim()) errs.customer = "Customer Name is required";
    // if (!customer.gst_no.trim()) errs.gst_no = "GST No is required";
    // else if (customer.gst_no.length !== 15) errs.gst_no = "GST No must be 15 characters";

if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
  errs.email = "Invalid email format";
}



    if (!customer.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(customer.pincode)) errs.pincode = "Pincode must be 6 digits";

    if (!customer.city.trim()) errs.city = "City is required";
    if (!customer.district.trim()) errs.district = "District is required";
    if (!customer.state.trim()) errs.state = "State is required";
    if (!customer.address.trim()) errs.address = "Address is required";

    if (!customer.status) errs.status = "Status is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));

   if (name === "gst_no") {
    if (value.length > 15) {
      setErrors((prev) => ({ ...prev, gst_no: "GST No must be 15 characters" }));
    } else {
      setErrors((prev) => ({ ...prev, gst_no: "" }));
    }
  }

    if (name === "pincode" && value.length === 6) {
      fetchPincodeDetails(value);
    }

    // clear other field errors while typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  
  const handleMobileChange = (value) => {
    setCustomer((prev) => ({ ...prev, mobile_no: value || "" }));

    // Live validation
    if (!value) {
      setErrors((prev) => ({ ...prev, mobile_no: "Mobile number is required" }));
      return;
    }

    try {
      const phoneNumber = parsePhoneNumberFromString(value);
      if (!phoneNumber || !isValidPhoneNumber(value)) {
        setErrors((prev) => ({ ...prev, mobile_no: "Invalid mobile number for this country" }));
      } else {
        setErrors((prev) => ({ ...prev, mobile_no: "" }));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, mobile_no: "Invalid mobile number" }));
    }
  };

  const fetchPincodeDetails = async (pincode) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();

      if (data[0].Status === "Success") {
        const postOffices = data[0].PostOffice;
        const cities = postOffices.map((po) => po.Name);

              setErrors((prev) => ({
        ...prev,
        pincode: "",
        state: "",
        district: "",
        city: "",
      }));

        setCityOptions(cities);
        setCustomer((prev) => ({
          ...prev,
          state: postOffices[0].State,
          district: postOffices[0].District,
          city: cities.length === 1 ? cities[0] : "",
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
    setCustomer((prev) => ({
      ...prev,
      state: "",
      district: "",
      city: "",
    }));
    toast.error("Could not fetch details. Please enter City, District, and State manually.");
  };

  const saveCustomer = async () => {
    if (!validateCustomer()) return;

    try {
      const response = await fetch("http://localhost:8000/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });

      const data = await response.json();

    if (!response.ok) {
      // Check for duplicate fields
      if (data.errors) {
        if (data.errors.email) toast.error(`Email already taken: ${data.errors.email}`);
        if (data.errors.mobile_no) toast.error(`Mobile number already taken: ${data.errors.mobile_no}`);
      } else if (data.message) {
        toast.error(data.message);
      } else {
        toast.error("Error saving customer!");
      }
      console.error(data);
      return;
    }

      toast.success("Customer saved successfully!");
       navigate("/customer");
      console.log(data);
    } catch (err) {
      console.error(err);
      toast.error("Error saving customer!");
    }
  };

  const feedbackStyle = { color: "red", fontSize: "0.85rem", marginTop: "4px" };
  // ✅ GST regex
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


  return (
    <div className="container-fluid p-4" style={{ background: "white", minHeight: "100vh" }}>
      <h5 className="mb-3">Add Customer</h5>

      <div style={{ background: "#f1f3f5", padding: "20px", borderRadius: "6px", marginBottom: "20px" }}>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
             <Form.Label>
  Customer Name<span style={{ color: "red" }}> *</span>
</Form.Label>

              <Form.Control
                type="text"
                name="customer"
                value={customer.customer}
                onChange={handleChange}
                placeholder="Enter Customer Name"
              />
              {errors.customer && <div style={feedbackStyle}>{errors.customer}</div>}
            </Form.Group>
          </Col>
          <Col md={4}>
           <Form.Group className="mb-3">
  <Form.Label>GST No</Form.Label>
  <Form.Control
    type="text"
    name="gst_no"
    value={customer.gst_no}
    onChange={(e) => {
      const value = e.target.value.toUpperCase();
      setCustomer({ ...customer, gst_no: value });

      if (!value.trim()) {
        setErrors((prev) => ({ ...prev, gst_no: "GST No is required" }));
      } else if (value.length !== 15) {
        setErrors((prev) => ({ ...prev, gst_no: "GST No must be 15 characters" }));
      } else if (!gstRegex.test(value)) {
        setErrors((prev) => ({ ...prev, gst_no: "Invalid GST No format (e.g. 33ABCDE1234F1Z5)" }));
      } else {
        setErrors((prev) => ({ ...prev, gst_no: "" }));
      }
    }}
    placeholder="Enter GST No"
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
                value={customer.pincode}
                onChange={handleChange}
                placeholder="Enter Pincode"
              />
              {errors.pincode && <div style={feedbackStyle}>{errors.pincode}</div>}
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
                isClearable
                options={cityOptions.map((c) => ({ label: c, value: c }))}
                value={customer.city ? { label: customer.city, value: customer.city } : null}
                onChange={(selected) =>
                  setCustomer((prev) => ({ ...prev, city: selected ? selected.value : "" }))
                }
                placeholder="Select or type city"
                  classNamePrefix="my-select"   // ✅ Add this
              />
              {errors.city && <div style={feedbackStyle}>{errors.city}</div>}
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
                value={customer.district}
                onChange={handleChange}
                placeholder="Enter District"
              />
              {errors.district && <div style={feedbackStyle}>{errors.district}</div>}
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
                value={customer.state}
                onChange={handleChange}
                placeholder="Enter State"
              />
              {errors.state && <div style={feedbackStyle}>{errors.state}</div>}
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
                value={customer.email}
                onChange={handleChange}
                placeholder="Enter Email"
              />
              {/* {errors.email && <div style={feedbackStyle}>{errors.email}</div>} */}
            </Form.Group>
          </Col>
               <Col md={4}>
            <Form.Group className="mb-3">
             <Form.Label>
  Mobile No<span style={{ color: "red" }}> *</span>
</Form.Label>

              <PhoneInput international 
                  defaultCountry="IN" 
              className="form-control" value={customer.mobile_no} onChange={handleMobileChange} />
              {errors.mobile_no && <div style={feedbackStyle}>{errors.mobile_no}</div>}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={customer.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
  <Form.Label>
  Address<span style={{ color: "red" }}> *</span>
</Form.Label>

              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={customer.address}
                onChange={handleChange}
                placeholder="Enter Address"
              />
            </Form.Group>
          </Col>
        </Row>
      </div>

      <div className="d-flex justify-content-end">
               <Button 
         variant="secondary" 
         className="me-2" 
         onClick={() => navigate(-1)}  // go back to previous page
       >
         Cancel
       </Button>
        <Button variant="success" onClick={saveCustomer}>
          Save
        </Button>
      </div>
    </div>
  );
}
