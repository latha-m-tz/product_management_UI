import React, { useState } from "react";
import { Form } from "react-bootstrap";

// Define PIN code length by country (you can expand this easily)
const PIN_LENGTH_BY_COUNTRY = {
  "en-IN": 6, // India
  "hi": 6,
  "bn": 6,
  "te": 6,
  "mr": 6,
  "ta": 6,
  "gu": 6,
  "kn": 6,
  "ml": 6,
  "or": 6,
  "pa": 6,
  "ne": 5, // Nepal
  "fr": 5, // France
  "sd": 5,
  "sa": 6,
  "ur": 6,
};

export default function PincodeField({ countryCode = "en-IN" }) {
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");

  // Determine the max length based on country
  const maxLength = PIN_LENGTH_BY_COUNTRY[countryCode] || 6;

  const handleChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // only digits

    if (value.length > maxLength) {
      setError(`Pincode cannot exceed ${maxLength} digits`);
      return; // stop accepting further input
    } else {
      setError("");
      setPincode(value);
    }
  };

  return (
    <div className="mb-3">
      <Form.Label>Pincode</Form.Label>
      <Form.Control
        type="text"
        value={pincode}
        onChange={handleChange}
        placeholder={`Enter ${maxLength}-digit pincode`}
        maxLength={maxLength}
      />
      {error && <div className="text-danger mt-1" style={{ fontSize: "0.8rem" }}>{error}</div>}
    </div>
  );
}
