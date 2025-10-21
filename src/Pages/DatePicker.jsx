import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isValid } from "date-fns";

const CustomDatePicker = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const datePattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/;

    if (datePattern.test(value)) {
      const [day, month, year] = value.split("-");
      const date = new Date(year, month - 1, day);

      if (isValid(date)) {
        setSelectedDate(date);
        setError("");
      } else {
        setError("Invalid date");
      }
    } else {
      setError("Date must be in dd-mm-yyyy format");
    }
  };

  return (
    <div>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => {
          setSelectedDate(date);
          setInputValue(format(date, "dd-MM-yyyy"));
          setError("");
        }}
        dateFormat="dd-MM-yyyy"
        customInput={
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="dd-mm-yyyy"
          />
        }
        // Optional: allow typing
        showPopperArrow={false}
      />
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
};

export default CustomDatePicker;
