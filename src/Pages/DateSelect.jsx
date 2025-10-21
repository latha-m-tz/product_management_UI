import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";

const MyDateInput = () => {
  const [challanDate, setChallanDate] = useState(null);

  return (
    <DatePicker
      selected={challanDate}
      onChange={(date) => setChallanDate(date)}
      dateFormat="yyyy-MM-dd"
      showYearDropdown
      scrollableYearDropdown
      yearItemNumber={100}
      placeholderText="YYYY-MM-DD"
      maxDate={new Date(2100, 11, 31)}
      minDate={new Date(1900, 0, 1)}
      // Custom input to block typing more than 4 digits for year
      customInput={
        <input
          type="text"
          onKeyDown={(e) => {
            const input = e.target.value;
            const yearPart = input.split("-")[0];
            if (yearPart.length >= 4 && /\d/.test(e.key)) {
              e.preventDefault(); // block extra digits in year
            }
          }}
        />
      }
    />
  );
};

export default MyDateInput;
