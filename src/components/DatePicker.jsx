import React from 'react';

const DatePicker = ({ value, onChange, min, max, disabled }) => {
    return (
        <input
            type="date"
            value={value}
            onChange={e => onChange(e.target.value)}
            min={min}
            max={max}
            disabled={disabled}
            style={{
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '16px',
            }}
        />
    );
};

export default DatePicker;