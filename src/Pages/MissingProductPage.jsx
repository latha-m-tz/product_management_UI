import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spinner, Button, Table, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../api";

import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";

const styles = {
    headerBackground: "#f8f9fa",
    tableBorder: "1px solid #dee2e6",
    tableHeaderRow: {
        backgroundColor: "#2E3A59",
        color: "white",
        fontSize: "0.82rem",
        height: "40px",
        verticalAlign: "middle",
    },
    contentArea: {
        padding: "20px",
    },
};

export default function MissingSerialsPage() {
    const { from_serial, to_serial } = useParams();
    const navigate = useNavigate();

    const [missingSerials, setMissingSerials] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination & search state
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");

    const [sortField, setSortField] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");

    useEffect(() => {
        if (from_serial && to_serial) fetchMissingSerials();
    }, [from_serial, to_serial]);

    const fetchMissingSerials = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/inventory/missing-serials/${from_serial}/${to_serial}`
            );

            // Wrap numbers in objects if API returns array of serials
            let items = Array.isArray(res.data.missing_serials)
                ? res.data.missing_serials.map((serial) => ({
                    serial_no: serial.serial_no ?? serial, // handle object or number
                    product: serial.product ?? { name: "-" },
                    product_type: serial.product_type ?? { name: "-" },
                }))
                : [];

            // Sort ascending by serial_no
            items.sort((a, b) => a.serial_no - b.serial_no);

            setMissingSerials(items);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch missing serials!");
            setMissingSerials([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const filteredItems = useMemo(() => {
        if (!search) return missingSerials;

        const lower = search.toLowerCase();
        return missingSerials.filter((item) => {
            const product = String(item.product?.name ?? "").toLowerCase();
            const type = String(item.product_type?.name ?? "").toLowerCase();
            const serial = String(item.serial_no ?? "").toLowerCase();

            return product.includes(lower) || type.includes(lower) || serial.includes(lower);
        });
    }, [missingSerials, search]);

    const sortedItems = useMemo(() => {
        const items = [...filteredItems];
        if (!sortField) return items;

        return items.sort((a, b) => {
            let valA = sortField.includes(".")
                ? sortField.split(".").reduce((obj, key) => obj?.[key], a)
                : a[sortField];
            let valB = sortField.includes(".")
                ? sortField.split(".").reduce((obj, key) => obj?.[key], b)
                : b[sortField];

            if (typeof valA === "string") valA = valA.toLowerCase();
            if (typeof valB === "string") valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredItems, sortField, sortDirection]);

    const paginatedItems = useMemo(() => {
        return sortedItems.slice((page - 1) * perPage, page * perPage);
    }, [sortedItems, page, perPage]);

    return (
        <div className="p-4" style={{ fontSize: "0.85rem" }}>
            <BreadCrumb title={`Missing Serials: ${from_serial} to ${to_serial}`} />

            <Card className="border-0 shadow-sm rounded-3 bg-white p-2 px-4 mt-2" style={{ minHeight: "500px" }}>
                {/* Controls */}
                <div className="row mb-2">
                    <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
                        <label className="me-2 fw-semibold mb-0" style={{ fontSize: "0.75rem" }}>
                            Records Per Page:
                        </label>
                        <Form.Select
                            size="sm"
                            style={{ width: "100px", fontSize: "0.8rem" }}
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            {[5, 10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </Form.Select>
                    </div>

                    <div className="col-md-6 text-md-end" style={{ fontSize: "0.8rem" }}>
                        <div className="mt-2 d-inline-block mb-2">
                            <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => navigate(-1)}>
                                <i className="bi bi-arrow-left"></i> Back
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-2"
                                onClick={fetchMissingSerials}
                                disabled={loading}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                            </Button>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                            <Search
                                search={search}
                                setSearch={setSearch}
                                perPage={perPage}
                                setPerPage={setPerPage}
                                setPage={setPage}
                                style={{ fontSize: "0.8rem" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                        <thead style={styles.tableHeaderRow}>
                            <tr>
                                <th style={{ ...styles.tableHeaderRow, width: "60px", textAlign: "center" }}>S.NO</th>
                                <th
                                    onClick={() => handleSort("product.name")}
                                    style={{ ...styles.tableHeaderRow, cursor: "pointer" }}
                                >
                                    Product
                                    {sortField === "product.name" && (sortDirection === "asc" ? " ▲" : " ▼")}
                                </th>
                                <th
                                    onClick={() => handleSort("product_type.name")}
                                    style={{ ...styles.tableHeaderRow, cursor: "pointer" }}
                                >
                                    Product Type
                                    {sortField === "product_type.name" && (sortDirection === "asc" ? " ▲" : " ▼")}
                                </th>
                                <th
                                    onClick={() => handleSort("serial_no")}
                                    style={{ ...styles.tableHeaderRow, cursor: "pointer" }}
                                >
                                    Serial No
                                    {sortField === "serial_no" && (sortDirection === "asc" ? " ▲" : " ▼")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-4">
                                        <Spinner animation="border" />
                                    </td>
                                </tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-4 text-muted">
                                        {missingSerials.length === 0
                                            ? "No missing serials found"
                                            : `No items matching "${search}"`}
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item, index) => (
                                    <tr key={item.serial_no || index}>
                                        <td className="text-center text-muted">
                                            {(page - 1) * perPage + index + 1}
                                        </td>
                                        <td>{item.product?.name || "-"}</td>
                                        <td>{item.product_type?.name || "-"}</td>
                                        <td>{item.serial_no}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination */}
                <Pagination page={page} setPage={setPage} perPage={perPage} totalEntries={filteredItems.length} />
            </Card>
        </div>
    );
}
