import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col, Spinner } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
const [mobileError, setMobileError] = useState("");


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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country_calling_code) {
          setCountryCode(data.country_calling_code);
        }
      })
      .catch(() => setCountryCode(""));
  }, []);


  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/customers/${id}/edit`);
        const data = await res.json();
        if (res.ok && data.status === "success") {
          setCustomer(data.customer); 
          if (data.customer.pincode) {
            fetchPincodeDetails(data.customer.pincode);
          }
        }
        else {
          toast.error("Failed to load customer");
          navigate("/customers");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching customer");
        navigate("/customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, navigate]);


  const validateCustomer = () => {
    const errs = {};
    if (!customer.customer.trim()) errs.customer = "Customer Name is required";

    if (!customer.gst_no.trim()) errs.gst_no = "GST No is required";
    else if (customer.gst_no.length !== 15)
      errs.gst_no = "GST No must be 15 characters";

    if (!customer.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
      errs.email = "Invalid email format";

 if (!customer.mobile_no) {
  errs.mobile_no = "Mobile number is required";
} else if (!isValidPhoneNumber(customer.mobile_no)) {
  errs.mobile_no = "Invalid mobile number";
}


    if (!customer.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(customer.pincode))
      errs.pincode = "Pincode must be 6 digits";

    if (!customer.city.trim()) errs.city = "City is required";
    if (!customer.district.trim()) errs.district = "District is required";
    if (!customer.state.trim()) errs.state = "State is required";
    if (!customer.address.trim()) errs.address = "Address is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));

    if (name === "gst_no") {
      if (value.length > 15) {
        setErrors((prev) => ({
          ...prev,
          gst_no: "GST No must be 15 characters",
        }));
      } else {
        setErrors((prev) => ({ ...prev, gst_no: "" }));
      }
    }

    if (name === "pincode" && value.length === 6) {
      fetchPincodeDetails(value);
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

   const handleMobileChange = (value) => {
  const val = value || "";
  setMobile(val);
  setCustomer((prev) => ({ ...prev, mobile_no: val }));

  if (!val) {
    setMobileError("Mobile number is required");
    return;
  }

  try {
    if (!isValidPhoneNumber(val)) {
      setMobileError("Invalid mobile number");
    } else {
      setMobileError("");
    }
  } catch {
    setMobileError("Invalid mobile number");
  }
};


  const fetchPincodeDetails = async (pincode) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0].Status === "Success") {
        const postOffices = data[0].PostOffice;
        const cities = postOffices.map((po) => po.Name);
        setCityOptions(cities);
        setCustomer((prev) => ({
          ...prev,
          state: postOffices[0].State,
          district: postOffices[0].District,

          city: cities.includes(prev.city) ? prev.city : cities[0],
        }));

        
      } else {
        setCityOptions([]);
        toast.error("Could not fetch cities, enter manually");
      }
    } catch (err) {
      console.error(err);
      setCityOptions([]);
      toast.error("Could not fetch cities, enter manually");
    }
  };

  const fallbackToManual = () => {
    setCityOptions([]);
    toast.error("Could not fetch details. Please enter manually.");
  };

  const updateCustomer = async () => {
    if (!validateCustomer()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Error updating customer!");
        console.error(data);
        return;
      }

      toast.success("Customer updated successfully!");
      navigate("/customer");
    } catch (err) {
      console.error(err);
      toast.error("Error updating customer!");
    }
  };

  const feedbackStyle = { color: "red", fontSize: "0.85rem", marginTop: "4px" };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div
      className="container-fluid p-4"
      style={{ background: "white", minHeight: "100vh" }}
    >
      <h5 className="mb-3">Edit Customer</h5>

      <div
        style={{
          background: "#f1f3f5",
          padding: "20px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Customer Name</Form.Label>
              <Form.Control
                type="text"
                name="customer"
                value={customer.customer}
                onChange={handleChange}
                placeholder="Enter Customer Name"
              />
              {errors.customer && (
                <div style={feedbackStyle}>{errors.customer}</div>
              )}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>GST No</Form.Label>
              <Form.Control
                type="text"
                name="gst_no"
                value={customer.gst_no}
                onChange={handleChange}
                placeholder="Enter GST No"
              />
              {errors.gst_no && (
                <div style={feedbackStyle}>{errors.gst_no}</div>
              )}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Pincode</Form.Label>
              <Form.Control
                type="text"
                name="pincode"
                value={customer.pincode}
                onChange={handleChange}
                placeholder="Enter Pincode"
              />
              {errors.pincode && (
                <div style={feedbackStyle}>{errors.pincode}</div>
              )}
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <CreatableSelect
                isClearable
                options={cityOptions.map((c) => ({ label: c, value: c }))}
                value={
                  customer.city
                    ? { label: customer.city, value: customer.city }
                    : null
                }
                onChange={(selected) =>
                  setCustomer((prev) => ({
                    ...prev,
                    city: selected ? selected.value : "",
                  }))
                }
                placeholder="Select or type city"
                  classNamePrefix="my-select"   // ✅ Add this
              />
              {errors.city && (
                <div style={feedbackStyle}>{errors.city}</div>
              )}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>District</Form.Label>
              <Form.Control
                type="text"
                name="district"
                value={customer.district}
                onChange={handleChange}
                placeholder="Enter District"
              />
              {errors.district && (
                <div style={feedbackStyle}>{errors.district}</div>
              )}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>State</Form.Label>
              <Form.Control
                type="text"
                name="state"
                value={customer.state}
                onChange={handleChange}
                placeholder="Enter State"
              />
              {errors.state && (
                <div style={feedbackStyle}>{errors.state}</div>
              )}
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
              {errors.email && (
                <div style={feedbackStyle}>{errors.email}</div>
              )}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Mobile No</Form.Label>
              <PhoneInput
                international
                defaultCountry="IN"
                className="form-control"
                value={customer.mobile_no}
                onChange={handleMobileChange}
              />
              {errors.mobile_no && (
                <div style={feedbackStyle}>{errors.mobile_no}</div>
              )}
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
              <Form.Label>Address</Form.Label>
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
        <Button variant="secondary" className="me-2" onClick={() => navigate("/customers")}>
          Cancel
        </Button>
        <Button variant="success" onClick={updateCustomer}>
          Update
        </Button>
      </div>
    </div>
  );
}
