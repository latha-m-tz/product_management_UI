import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { toast } from "react-toastify";
import api, { setAuthToken } from "../api";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import CountrySelect from "../components/CountrySelect";
import CountryPhoneInput from "../components/CountryPhoneInput";
// FIX: Ensure both parsing functions are imported
import { parsePhoneNumberFromString, parsePhoneNumber } from "libphonenumber-js";

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
          // data.country_calling_code is typically something like "+91"
          setCountryCode(data.country_calling_code);
        }
      })
      .catch(() => setCountryCode(""));
  }, []);
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthToken(token); // this adds token to axios default headers
    }
  }, []);
  const validateCustomer = () => {
    const errs = {};

    if (!customer.customer.trim()) errs.customer = "Customer Name is required";
    if (!customer.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(customer.pincode)) errs.pincode = "Pincode must be 6 digits";
    if (!customer.city.trim()) errs.city = "City is required";
    if (!customer.district.trim()) errs.district = "District is required";
    if (!customer.state.trim()) errs.state = "State is required";
    // if (!customer.address.trim()) errs.address = "Address is required";
    if (!customer.status) errs.status = "Status is required";

    // FIX: Simplified and corrected mobile validation logic
    if (!customer.mobile_no.trim()) {
      // errs.mobile_no = "Mobile number is required";
    } else {
      const phoneNumber = parsePhoneNumberFromString(customer.mobile_no);
      // Check if it's parsable and valid
      if (!phoneNumber || !phoneNumber.isValid()) {
        errs.mobile_no = "Invalid mobile number";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));

    if (name === "gst_no") {
      // Note: The GST validation is done inline in the render section for better live feedback
    }

    if (name === "pincode" && value.length === 6) {
      fetchPincodeDetails(value);
    }

    // FIX: Modified email handling. Removed "Email is required" as it doesn't have an asterisk.
    if (name === "email") {
      const emailValue = value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Only validate format if a value is present
      if (emailValue && !emailRegex.test(emailValue)) {
        setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    }

    // Clear the error for the changed field if it exists, to allow re-validation
    if (errors[name] && name !== 'email') {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleMobileChange = (inputNumber) => {
    // This is the value provided by the react-phone-number-input component (usually in E.164 format)
    setCustomer(prev => ({ ...prev, mobile_no: inputNumber || "" }));

    if (!inputNumber) {
      setErrors(prev => ({ ...prev, mobile_no: "" }));
      return;
    }

    // FIX: Use the parsePhoneNumber function you imported (which uses the default country code if available)
    try {
      // inputNumber is already E.164 (starts with +) if a country was selected
      const phoneNumber = parsePhoneNumber(inputNumber);
      if (phoneNumber && phoneNumber.isValid()) {
        setErrors(prev => ({ ...prev, mobile_no: "" }));
      } else {
        setErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
      }
    } catch {
      setErrors(prev => ({ ...prev, mobile_no: "Invalid mobile number" }));
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
  if (!validateCustomer()) {
    toast.error("Please correct the errors in the form before saving.");
    return;
  }

  try {
    const response = await api.post("/customers", customer);

    // axios returns the data directly
    const data = response.data;

    toast.success("Customer saved successfully!");
    navigate("/customer");
  } 
 catch (error) {
  if (error.response) {
    const data = error.response.data;

    // Prefer backend errors[] array
    if (data.errors) {
      const firstError = Object.values(data.errors)[0][0]; 
      toast.error(firstError);
      return;
    }

    // Otherwise show message only if errors[] does NOT exist
    if (data.message) {
      toast.error(data.message);
      return;
    }
  }

  toast.error("Network error! Check your connection.");


  }
};


  const feedbackStyle = { color: "red", fontSize: "0.85rem", marginTop: "4px" };
  // GST regex is only needed for the inline validation logic
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


  return (
    <div className="container-fluid p-4" style={{ background: "white", minHeight: "100vh" }}>
      <Row className="align-items-center mb-3">
        <Col>
          <h4>Add  customer</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => navigate("/customer")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </Button>
        </Col>
      </Row>

      <div style={{ background: "#f4f4f8", padding: "20px", borderRadius: "6px", marginBottom: "20px" }}>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3 form-field">
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
            <Form.Group className="mb-3 form-field">
              <Form.Label>GST No</Form.Label>
              <Form.Control
                type="text"
                name="gst_no"
                value={customer.gst_no}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase();

                  // Block typing beyond 15 characters
                  if (value.length > 15) value = value.slice(0, 15);

                  setCustomer({ ...customer, gst_no: value });

                  // Live validation for GST No (optional field)
                  if (value.trim() && !gstRegex.test(value)) {
                    setErrors((prev) => ({ ...prev, gst_no: "Invalid GST No format" }));
                  } else {
                    setErrors((prev) => ({ ...prev, gst_no: "" }));
                  }
                }}
                placeholder="Enter GST No"
                maxLength={15}
              />

              {errors.gst_no && (
                <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {errors.gst_no}
                </div>
              )}
            </Form.Group>

          </Col>
          <Col md={4}>
            <Form.Group className="mb-3 form-field">
              <Form.Label>
                Pincode<span style={{ color: "red" }}> *</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="pincode"
                value={customer.pincode}
                onChange={(e) => {
                  let value = e.target.value;

                  // Allow only digits and max 6 characters
                  value = value.replace(/\D/g, ""); // remove non-digits
                  if (value.length > 6) value = value.slice(0, 6);

                  setCustomer((prev) => ({ ...prev, pincode: value }));

                  if (value.length === 6) {
                    fetchPincodeDetails(value);
                  }

                  // Allow clearing of error on typing
                  if (errors.pincode) {
                    setErrors((prev) => ({ ...prev, pincode: "" }));
                  }
                }}
                placeholder="Enter Pincode"
                maxLength={6}
              />

              {errors.pincode && <div style={feedbackStyle}>{errors.pincode}</div>}
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
                options={cityOptions.map((c) => ({ label: c, value: c }))}
                value={customer.city ? { label: customer.city, value: customer.city } : null}
                onChange={(selected) => {
                  setCustomer((prev) => ({ ...prev, city: selected ? selected.value : "" }))
                  if (errors.city) setErrors(prev => ({ ...prev, city: "" })); // Clear error on change
                }}
                placeholder="Select or type city"
                classNamePrefix="my-select"
              />
              {errors.city && <div style={feedbackStyle}>{errors.city}</div>}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3 form-field">
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
            <Form.Group className="mb-3 form-field">
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
            <Form.Group className="mb-3 form-field">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={customer.email}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, "");
                  setCustomer((prev) => ({ ...prev, email: value }));

                  // Live validation for email (optional field)
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (value && !emailRegex.test(value)) {
                    setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
                  } else {
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                placeholder="Enter Email"
              />

              {errors.email && <div style={feedbackStyle}>{errors.email}</div>}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3 form-field">
              <Form.Label>
                Mobile No<span style={{ color: "red" }}> </span>
              </Form.Label>

              <CountryPhoneInput
                international
                defaultCountry={countryCode || undefined}
                value={customer.mobile_no}
                onChange={handleMobileChange}
                className="form-control"
                placeholder="Enter mobile number"
                countrySelectComponent={CountrySelect}
              />
              {errors.mobile_no && (
                <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {errors.mobile_no}
                </div>
              )}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3 form-field">
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
          <Col md={6}>
            <Form.Group className="mb-3 form-field">
              <Form.Label>
                Address<span style={{ color: "red" }}> </span>
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={customer.address}
                onChange={handleChange}
                placeholder="Enter Address"
              />
              {errors.address && <div style={feedbackStyle}>{errors.address}</div>}
            </Form.Group>
          </Col>
        </Row>
      </div>

      <div className="d-flex justify-content-end">
        <Button
          variant="secondary"
          className="me-2"
          onClick={() => navigate(-1)}
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