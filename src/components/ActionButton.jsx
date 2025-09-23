import React from 'react';

const BUTTON_STYLES = {
    save: {
        backgroundColor: '#2ed70cff', // Primary (blue)
        color: '#fff',
        border: 'none',
    },
    delete: {
        backgroundColor: '#d32f2f', // Error (red)
        color: '#fff',
        border: 'none',
    },
    edit: {
        backgroundColor: '#388e3c', // Success (green)
        color: '#fff',
        border: 'none',
    },
    preview: {
        backgroundColor: '#fbc02d', // Warning (yellow)
        color: '#fff',
        border: 'none',
    },
    secondary: {
        backgroundColor: '#fff',
        color: '#1976d2',
        border: '1px solid #1976d2',
    },
    default: {
        backgroundColor: '#e0e0e0',
        color: '#333',
        border: 'none',
    },
};

const ActionButton = ({
    type = 'default', // save, delete, edit, preview, secondary, default
    children,
    onClick,
    disabled = false,
    style = {},
    ...props
}) => {
    const buttonStyle = {
        padding: '8px 16px',
        borderRadius: '4px',
        fontWeight: 500,
        fontSize: '1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.2s',
        ...BUTTON_STYLES[type] || BUTTON_STYLES.default,
        ...style,
    };

    return (
        <button
            style={buttonStyle}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default ActionButton;