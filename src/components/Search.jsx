import React from 'react';

const Search = ({ search, setSearch, setPage }) => {
    return (
        <div className="d-flex justify-content-end align-items-center">
            <label className="d-flex align-items-center mb-0">
                <span className="me-2 fw-semibold">Search:</span>
                <input
                    type="search"
                    className="form-control form-control-sm"
                   style={{ fontSize: '0.8rem', minWidth: '32px', height: '28px' }}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </label>
        </div>
    );
};

export default Search;
