import React from "react";

export const FormInput = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  ...rest
}) => (
  <div className="form-group">
    {label && <label htmlFor={name}>{label}</label>}
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="form-control"
      {...rest}
    />
  </div>
);

export const FormDropdown = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  ...rest
}) => (
  <div className="form-group">
    {label && <label htmlFor={name}>{label}</label>}
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="form-control"
      {...rest}
    >
      <option value="">Select...</option>
      {options.map((opt) =>
        typeof opt === "object" ? (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ) : (
          <option key={opt} value={opt}>
            {opt}
          </option>
        )
      )}
    </select>
  </div>
);

export default FormInput;
