import React, { useState } from 'react';

const Toaster = ({ message, type, onClose }) => {
    if (!message) return null;

    const bgColor = type === 'error' ? '#f44336' : '#4caf50';

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: bgColor,
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 9999,
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <span>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    marginLeft: '16px',
                    fontSize: '18px',
                    cursor: 'pointer'
                }}
                aria-label="Close"
            >
                &times;
            </button>
        </div>
    );
};

export const useToaster = () => {
    const [toaster, setToaster] = useState({ message: '', type: '' });

    const showToaster = (message, type = 'success') => {
        setToaster({ message, type });
        setTimeout(() => setToaster({ message: '', type: '' }), 3000);
    };

    const ToasterComponent = (
        <Toaster
            message={toaster.message}
            type={toaster.type}
            onClose={() => setToaster({ message: '', type: '' })}
        />
    );

    return [ToasterComponent, showToaster];
};

export default Toaster;