import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import metadata from "libphonenumber-js/metadata.full.json";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { Form } from "react-bootstrap";
import { parsePhoneNumberFromString, getExampleNumber, isValidNumberForRegion } from "libphonenumber-js";

countries.registerLocale(enLocale);

const countryOptions = getCountries(metadata).map((code) => {
    const name = countries.getName(code, "en") || code;
    const callingCode = getCountryCallingCode(code, metadata);
    const flagUrl = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`;
    return {
        value: code,
        label: name,
        callingCode: `+${callingCode}`,
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

export default function CountryPhoneInput({ label, value, onChange, error, defaultCountry = "IN" }) {
const getMaxDigits = (country) => {
    switch (country) {
        case "AF": return 9;    // Afghanistan
        case "AL": return 9;    // Albania
        case "DZ": return 9;    // Algeria
        case "AD": return 9;    // Andorra
        case "AO": return 9;    // Angola
        case "AG": return 7;    // Antigua and Barbuda
        case "AR": return 10;   // Argentina
        case "AM": return 8;    // Armenia
        case "AU": return 9;    // Australia
        case "AT": return 10;   // Austria
        case "AZ": return 9;    // Azerbaijan
        case "BS": return 7;    // Bahamas
        case "BH": return 8;    // Bahrain
        case "BD": return 11;   // Bangladesh
        case "BB": return 7;    // Barbados
        case "BY": return 9;    // Belarus
        case "BE": return 9;    // Belgium
        case "BZ": return 7;    // Belize
        case "BJ": return 8;    // Benin
        case "BT": return 8;    // Bhutan
        case "BO": return 8;    // Bolivia
        case "BA": return 8;    // Bosnia and Herzegovina
        case "BW": return 8;    // Botswana
        case "BR": return 11;   // Brazil
        case "BN": return 7;    // Brunei
        case "BG": return 9;    // Bulgaria
        case "BF": return 8;    // Burkina Faso
        case "BI": return 8;    // Burundi
        case "CV": return 7;    // Cabo Verde
        case "KH": return 9;    // Cambodia
        case "CM": return 9;    // Cameroon
        case "CA": return 10;   // Canada
        case "CF": return 8;    // Central African Republic
        case "TD": return 8;    // Chad
        case "CL": return 9;    // Chile
        case "CN": return 13;   // China
        case "CO": return 10;   // Colombia
        case "KM": return 7;    // Comoros
        case "CD": return 9;    // Congo, DR
        case "CG": return 9;    // Congo, Republic
        case "CR": return 8;    // Costa Rica
        case "CI": return 8;    // Côte d'Ivoire
        case "HR": return 9;    // Croatia
        case "CU": return 8;    // Cuba
        case "CY": return 8;    // Cyprus
        case "CZ": return 9;    // Czechia
        case "DK": return 8;    // Denmark
        case "DJ": return 8;    // Djibouti
        case "DM": return 7;    // Dominica
        case "DO": return 10;   // Dominican Republic
        case "EC": return 9;    // Ecuador
        case "EG": return 11;   // Egypt
        case "SV": return 8;    // El Salvador
        case "GQ": return 9;    // Equatorial Guinea
        case "ER": return 8;    // Eritrea
        case "EE": return 8;    // Estonia
        case "SZ": return 8;    // Eswatini
        case "ET": return 9;    // Ethiopia
        case "FJ": return 7;    // Fiji
        case "FI": return 9;    // Finland
        case "FR": return 10;   // France
        case "GA": return 8;    // Gabon
        case "GM": return 8;    // Gambia
        case "GE": return 9;    // Georgia
        case "DE": return 11;   // Germany
        case "GH": return 9;    // Ghana
        case "GR": return 10;   // Greece
        case "GD": return 7;    // Grenada
        case "GT": return 8;    // Guatemala
        case "GN": return 8;    // Guinea
        case "GW": return 8;    // Guinea-Bissau
        case "GY": return 7;    // Guyana
        case "HT": return 8;    // Haiti
        case "VA": return 8;    // Vatican
        case "HN": return 8;    // Honduras
        case "HU": return 9;    // Hungary
        case "IS": return 7;    // Iceland
        case "IN": return 10;   // India
        case "ID": return 10;   // Indonesia
        case "IR": return 11;   // Iran
        case "IQ": return 10;   // Iraq
        case "IE": return 9;    // Ireland
        case "IL": return 9;    // Israel
        case "IT": return 10;   // Italy
        case "JM": return 7;    // Jamaica
        case "JP": return 11;   // Japan
        case "JO": return 9;    // Jordan
        case "KZ": return 10;   // Kazakhstan
        case "KE": return 10;   // Kenya
        case "KI": return 5;    // Kiribati
        case "KW": return 8;    // Kuwait
        case "KG": return 9;    // Kyrgyzstan
        case "LA": return 8;    // Laos
        case "LV": return 8;    // Latvia
        case "LB": return 8;    // Lebanon
        case "LS": return 8;    // Lesotho
        case "LR": return 8;    // Liberia
        case "LY": return 9;    // Libya
        case "LI": return 8;    // Liechtenstein
        case "LT": return 8;    // Lithuania
        case "LU": return 8;    // Luxembourg
        case "MG": return 9;    // Madagascar
        case "MW": return 9;    // Malawi
        case "MY": return 10;   // Malaysia
        case "MV": return 7;    // Maldives
        case "ML": return 8;    // Mali
        case "MT": return 8;    // Malta
        case "MH": return 7;    // Marshall Islands
        case "MR": return 8;    // Mauritania
        case "MU": return 8;    // Mauritius
        case "MX": return 10;   // Mexico
        case "FM": return 7;    // Micronesia
        case "MD": return 8;    // Moldova
        case "MC": return 8;    // Monaco
        case "MN": return 8;    // Mongolia
        case "ME": return 8;    // Montenegro
        case "MA": return 10;   // Morocco
        case "MZ": return 12;   // Mozambique
        case "MM": return 9;    // Myanmar
        case "NA": return 9;    // Namibia
        case "NR": return 4;    // Nauru
        case "NP": return 10;   // Nepal
        case "NL": return 9;    // Netherlands
        case "NZ": return 9;    // New Zealand
        case "NI": return 8;    // Nicaragua
        case "NE": return 8;    // Niger
        case "NG": return 10;   // Nigeria
        case "KP": return 9;    // North Korea
        case "MK": return 8;    // North Macedonia
        case "NO": return 8;    // Norway
        case "OM": return 8;    // Oman
        case "PK": return 11;   // Pakistan
        case "PW": return 7;    // Palau
        case "PS": return 9;    // Palestine
        case "PA": return 8;    // Panama
        case "PG": return 8;    // Papua New Guinea
        case "PY": return 9;    // Paraguay
        case "PE": return 9;    // Peru
        case "PH": return 11;   // Philippines
        case "PL": return 9;    // Poland
        case "PT": return 9;    // Portugal
        case "QA": return 8;    // Qatar
        case "RO": return 10;   // Romania
        case "RU": return 10;   // Russia
        case "RW": return 9;    // Rwanda
        case "KN": return 7;    // Saint Kitts and Nevis
        case "LC": return 7;    // Saint Lucia
        case "VC": return 7;    // Saint Vincent and the Grenadines
        case "WS": return 7;    // Samoa
        case "SM": return 8;    // San Marino
        case "ST": return 7;    // Sao Tome and Principe
        case "SA": return 9;    // Saudi Arabia
        case "SN": return 8;    // Senegal
        case "RS": return 8;    // Serbia
        case "SC": return 7;    // Seychelles
        case "SL": return 8;    // Sierra Leone
        case "SG": return 8;    // Singapore
        case "SK": return 9;    // Slovakia
        case "SI": return 9;    // Slovenia
        case "SB": return 5;    // Solomon Islands
        case "SO": return 8;    // Somalia
        case "ZA": return 10;   // South Africa
        case "KR": return 10;   // South Korea
        case "SS": return 9;    // South Sudan
        case "ES": return 9;    // Spain
        case "LK": return 10;   // Sri Lanka
        case "SD": return 9;    // Sudan
        case "SR": return 8;    // Suriname
        case "SE": return 9;    // Sweden
        case "CH": return 9;    // Switzerland
        case "SY": return 9;    // Syria
        case "TJ": return 9;    // Tajikistan
        case "TZ": return 9;    // Tanzania
        case "TH": return 9;    // Thailand
        case "TL": return 7;    // Timor-Leste
        case "TG": return 8;    // Togo
        case "TO": return 7;    // Tonga
        case "TT": return 7;    // Trinidad and Tobago
        case "TN": return 8;    // Tunisia
        case "TR": return 10;   // Turkey
        case "TM": return 8;    // Turkmenistan
        case "TV": return 4;    // Tuvalu
        case "UG": return 9;    // Uganda
        case "UA": return 9;    // Ukraine
        case "AE": return 9;    // United Arab Emirates
        case "GB": return 10;   // United Kingdom
        case "US": return 10;   // United States
        case "UY": return 9;    // Uruguay
        case "UZ": return 9;    // Uzbekistan
        case "VU": return 7;    // Vanuatu
        case "VE": return 10;   // Venezuela
        case "VN": return 10;   // Vietnam
        case "YE": return 9;    // Yemen
        case "ZM": return 9;    // Zambia
        case "ZW": return 9;    // Zimbabwe
        default: return 10;     // fallback
    }
};

    const phoneNumber = value ? parsePhoneNumberFromString(value) : null;

    const initialCountry = phoneNumber
        ? countryOptions.find(c => c.callingCode === `+${phoneNumber.countryCallingCode}`)
        : countryOptions.find(c => c.value === defaultCountry);

    const [selectedCountry, setSelectedCountry] = useState(initialCountry);
    const [mobile, setMobile] = useState(phoneNumber?.nationalNumber || "");
    const [internalError, setInternalError] = useState("");

 const handleMobileChange = (e) => {
    // Only digits
    let input = e.target.value.replace(/\D/g, "");

    // Get max digits for selected country
    const maxDigits = getMaxDigits(selectedCountry?.value);

    // Prevent typing beyond allowed digits
    if (input.length > maxDigits) {
        input = input.slice(0, maxDigits);
    }

    setMobile(input);

    if (!input) {
        // setInternalError("Mobile number is required");
        onChange && onChange("");
        return;
    }

    const fullNumber = `+${getCountryCallingCode(selectedCountry.value)}${input}`;
    const phone = parsePhoneNumberFromString(fullNumber);

    if (phone && phone.isValid()) {
        setInternalError(""); // valid
        onChange && onChange(fullNumber);
    } else {
        setInternalError("Invalid mobile number");
        onChange && onChange(""); // invalid number not sent
    }
};



    useEffect(() => {
        if (value) {
            const phone = parsePhoneNumberFromString(value);
            if (phone) {
                setMobile(phone.nationalNumber);
                const country = countryOptions.find(c => c.callingCode === `+${phone.countryCallingCode}`);
                setSelectedCountry(country || countryOptions.find(c => c.value === defaultCountry));
                setInternalError(""); // reset error
            } else {
                setMobile(value.replace(/^\+?\d{1,3}/, ""));
                setSelectedCountry(countryOptions.find(c => c.value === defaultCountry));
                setInternalError("Invalid mobile number");
            }
        }
    }, [value, defaultCountry]);

    return (
        <div>
            {label && <Form.Label>{label} <span style={{ color: "red" }}> </span></Form.Label>}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <Select
                    options={countryOptions}
                    value={selectedCountry}
                    onChange={sel => {
                        setSelectedCountry(sel);
                        setMobile("");
                        // setInternalError("Mobile number is required");
                        onChange && onChange("");
                    }}
                    components={{ SingleValue }}
                    formatOptionLabel={(country) => (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <img src={country.flagUrl} alt={country.label} style={{ width: "15px", height: "15px" }} />
                            <span>{country.label} ({country.callingCode})</span>
                        </div>
                    )}
                    styles={{ control: base => ({ ...base, width: "120px", minHeight: "38px", borderRadius: "8px" }) }}
                />
                <Form.Control
                    type="text"
                    value={mobile}
                    onChange={handleMobileChange}
                    placeholder={`Enter up to ${getMaxDigits(selectedCountry?.value)} digits`}
                    maxLength={getMaxDigits(selectedCountry?.value)}
                />
            </div>
            {(error || internalError) && <small style={{ color: "red" }}>{error || internalError}</small>}
        </div>
    );
}
