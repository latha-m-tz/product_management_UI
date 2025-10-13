import React from "react";
import Select, { components } from "react-select";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import metadata from "libphonenumber-js/metadata.full.json";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register English locale
countries.registerLocale(enLocale);

// Prepare options
const options = getCountries(metadata).map((code) => ({
    value: code,
    label: countries.getName(code, "en") || code,
    callingCode: getCountryCallingCode(code, metadata),
    flagUrl: `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`,
}));

// Custom SingleValue component (only show flag in selected field)
const SingleValue = ({ data, ...props }) => (
    <components.SingleValue {...props}>
        <img
            src={data.flagUrl}
            alt={data.label}
            style={{ width: "20px", height: "15px", objectFit: "cover" }}
        />
    </components.SingleValue>
);

export default function CountrySelect({ value, onChange }) {
    return (
        <Select
            options={options}
            isSearchable
            value={options.find((c) => c.value === value)}
            onChange={(selected) => onChange(selected?.value)}
            placeholder="Select country"
            // Dropdown shows flag + country name
            formatOptionLabel={(country) => (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <img
                        src={country.flagUrl}
                        alt={country.label}
                        style={{ width: "15px", height: "15px", objectFit: "cover" }}
                    />
                    <span>{country.label}</span>
                </div>
            )}
            // Only show flag in the selected value field
            components={{ SingleValue }}
            styles={{
                control: (base) => ({
                    ...base,
                    borderRadius: "8px",
                    borderColor: "#ccc",
                    minHeight: "38px",
                }),
                option: (base) => ({
                    ...base,
                    display: "flex",
                    alignItems: "center",
                }),
            }}
        />
    );
}
