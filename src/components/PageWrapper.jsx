import React from 'react';

const PageWrapper = ({ children, className = '', style = {} }) => {
    return (
        <div className={`page-wrapper ${className}`} style={style}>
            {children}
        </div>
    );
};

export default PageWrapper;