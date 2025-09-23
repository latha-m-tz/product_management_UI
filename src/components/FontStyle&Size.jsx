import React from 'react';

// Example font styles and sizes for sidebar, pages, and fields
const styles = {
    sidebar: {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '16px',
        fontWeight: '600',
        color: '#333',
    },
    pageTitle: {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '24px',
        fontWeight: '700',
        color: '#222',
    },
    fieldLabel: {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        color: '#555',
    },
    fieldInput: {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: '400',
        color: '#222',
    },
};

export function SidebarText({ children }) {
    return <div style={styles.sidebar}>{children}</div>;
}

export function PageTitle({ children }) {
    return <h1 style={styles.pageTitle}>{children}</h1>;
}

export function FieldLabel({ children }) {
    return <label style={styles.fieldLabel}>{children}</label>;
}

export function FieldInput(props) {
    return <input style={styles.fieldInput} {...props} />;
}