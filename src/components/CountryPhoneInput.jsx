// src/components/CountryPhoneInput.js
import React, { useState } from "react";
import Select, { components } from "react-select";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import metadata from "libphonenumber-js/metadata.full.json";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { Form } from "react-bootstrap";

countries.registerLocale(enLocale);

const phoneDigitsByCountry = {
    US: 10, CA: 10, GB: 10, IN: 10, AU: 9, DE: 10, FR: 9, SG: 8,
    AE: 9, SA: 9, ZA: 9, CN: 11, JP: 10, PH: 10, MY: 9, ID: 10,
    BD: 10, NP: 10, LK: 9, PK: 10, BR: 11, MX: 10, AR: 10, RU: 10, IT: 10,
};

const countryOptions = getCountries(metadata).map((code) => {
    const name = countries.getName(code, "en") || code;
    const callingCode = getCountryCallingCode(code, metadata);
    const flagUrl = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`;
    return {
        value: code,
        label: name,
        callingCode: `+${callingCode}`,
        phoneDigits: phoneDigitsByCountry[code] || 10,
        flagUrl,
    };
});

const SingleValue = ({ data, ...props }) => (
    <components.SingleValue {...props}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <img src={data.flagUrl} alt={data.label} style={{ width: "20px", height: "15px" }} />
            <span>{data.callingCode}</span>
        </div>
    </components.SingleValue>
);

export default function CountryPhoneInput({ label, value, onChange, error }) {
    const [selectedCountry, setSelectedCountry] = useState(countryOptions.find(c => c.value === "IN"));
    const [mobile, setMobile] = useState(value || "");
    const [localError, setLocalError] = useState("");

    const handleMobileChange = (e) => {
        const input = e.target.value.replace(/\D/g, "");
        const limit = selectedCountry?.phoneDigits || 10;

        if (input.length > limit) {
            setLocalError(`Mobile number cannot exceed ${limit} digits.`);
            setMobile(input.slice(0, limit));
            onChange && onChange(input.slice(0, limit));
        } else {
            setLocalError("");
            setMobile(input);
            onChange && onChange(input);
        }
    };

    return (
        <div>
            {label && (
                <Form.Label>
                    {label}
                    <span style={{ color: "red" }}> *</span>
                </Form.Label>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Select
                    options={countryOptions}
                    isSearchable
                    value={selectedCountry}
                    onChange={(sel) => {
                        setSelectedCountry(sel);
                        setLocalError("");
                        setMobile("");
                        onChange && onChange("");
                    }}
                    components={{ SingleValue }}
                    formatOptionLabel={(country) => (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <img src={country.flagUrl} alt={country.label} style={{ width: "15px", height: "15px" }} />
                            <span>
                                {country.label} ({country.callingCode})
                            </span>
                        </div>
                    )}
                    styles={{
                        control: (base) => ({
                            ...base,
                            width: "120px",
                            borderRadius: "8px",
                            minHeight: "38px",
                        }),
                    }}
                />

                <Form.Control
                    type="text"
                    value={mobile}
                    onChange={handleMobileChange}
                    placeholder={`Enter ${selectedCountry?.phoneDigits || 10}-digit number`}
                    maxLength={selectedCountry?.phoneDigits}
                />
            </div>

            {(error || localError) && (
                <small style={{ color: "red" }}>{error || localError}</small>
            )}
        </div>
    );
}
