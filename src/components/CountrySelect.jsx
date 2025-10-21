import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import metadata from "libphonenumber-js/metadata.full.json";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { Form } from "react-bootstrap";

// Register English locale
countries.registerLocale(enLocale);

// Define phone digits by country
const phoneDigitsByCountry = {
  US: 10,
  CA: 10,
  GB: 10,
  IN: 10,
  AU: 9,
  DE: 10,
  FR: 9,
  SG: 8,
  AE: 9,
  SA: 9,
  ZA: 9,
  CN: 11,
  JP: 10,
  PH: 10,
  MY: 9,
  ID: 10,
  BD: 10,
  NP: 10,
  LK: 9,
  PK: 10,
  BR: 11,
  MX: 10,
  AR: 10,
  RU: 10,
  IT: 10,
};

// Prepare country options
const countryOptions = getCountries(metadata).map((code) => {
  const name = countries.getName(code, "en") || code;
  const callingCode = getCountryCallingCode(code, metadata);
  const flagUrl = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`;
  return { value: code, label: name, callingCode: `+${callingCode}`, flagUrl };
});

const SingleValue = ({ data, ...props }) => (
  <components.SingleValue {...props}>
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <img src={data.flagUrl} alt={data.label} style={{ width: "20px", height: "15px" }} />
      <span>{data.callingCode}</span>
    </div>
  </components.SingleValue>
);

export default function CountryPhoneInput({ value, onChange, defaultCountry = "IN", error }) {
  const [selectedCountry, setSelectedCountry] = useState(
    countryOptions.find(c => c.value === defaultCountry)
  );
  const [mobile, setMobile] = useState("");

  useEffect(() => {
    if (value) {
      setMobile(value.replace(selectedCountry.callingCode, "").replace(/\D/g, ""));
    } else {
      setMobile("");
    }
  }, [value, selectedCountry]);

  const handleMobileChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setMobile(digits);
    if (onChange) {
      onChange(`${selectedCountry.callingCode}${digits}`);
    }
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setMobile("");
    if (onChange) onChange(""); // reset value
  };

  return (
    <div>
      <Form.Group className="mb-2">
        <Form.Label>Country <span style={{ color: "red" }}>*</span></Form.Label>
        <Select
          options={countryOptions}
          isSearchable
          value={selectedCountry}
          onChange={handleCountryChange}
          formatOptionLabel={(country) => (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <img src={country.flagUrl} alt={country.label} style={{ width: "15px", height: "15px" }} />
              <span>{country.label} ({country.callingCode})</span>
            </div>
          )}
          components={{ SingleValue }}
          styles={{ control: base => ({ ...base, borderRadius: "8px", minHeight: "38px" }) }}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>
          Mobile No <span style={{ color: "red" }}>*</span>
        </Form.Label>
        <Form.Control
          type="text"
          value={mobile}
          onChange={handleMobileChange}
          placeholder="Enter mobile number"
        />
        {error && <small style={{ color: "red" }}>{error}</small>}
      </Form.Group>
    </div>
  );
}
