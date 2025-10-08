import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spinner, Button, Table, Form } from "react-bootstrap"; // Added Form
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../api";

// Assuming these are generic components you have:
import BreadCrumb from "../components/BreadCrumb"; // Added from ProductPage
import Pagination from "../components/Pagination"; // Added from ProductPage
import Search from "../components/Search"; // Added from ProductPage

import {
    DashSquare,
    LightningFill
} from "react-bootstrap-icons";

// Custom styles
const styles = {
    headerBackground: "#f8f9fa",
    tableBorder: "1px solid #dee2e6",
    tableHeaderRow: {
        backgroundColor: "#2E3A59", // Using ProductPage's header color for consistency
        color: "white",
        fontSize: "0.82rem",
        height: "40px",
        verticalAlign: "middle",
    },
    actionIcon: {
        color: "#dc3545",
        cursor: "pointer",
        fontSize: "1rem",
    },
    contentArea: {
        padding: "20px",
    },
};

export default function InventoryDetailsPage() {
    const { id, range } = useParams();
    const navigate = useNavigate();

    // Ensure range exists before splitting
    const [from, to] = range ? range.split("-") : [null, null];

    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(false);

    // Data Table State Management (Copied from ProductPage)
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState(""); // Renamed from searchTerm to search for consistency

    const [sortField, setSortField] = useState("serial_no"); // default sort field
const [sortDirection, setSortDirection] = useState("asc");  // ascending


    // Memoized array of inventory items
    const inventoryItems = useMemo(() => {
        return inventory && Array.isArray(inventory.items) ? inventory.items : [];
    }, [inventory]);

    useEffect(() => {
        if (from && to) {
            fetchInventory();
        }
    }, [from, to]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
        const res = await axios.get(
            `${API_BASE_URL}/inventory/serialrange/${from}/${to}`
        );

        let items = Array.isArray(res.data.items) ? res.data.items : [];

        // Sort ascending by serial_no
        items.sort((a, b) => {
            if (a.serial_no < b.serial_no) return -1;
            if (a.serial_no > b.serial_no) return 1;
            return 0;
        });

        setInventory({ ...res.data, items }); // keep the rest of the object intact
    } catch (err) {
        console.error(err);
        toast.error("Failed to fetch inventory details!");
        setInventory(null);
    } finally {
        setLoading(false);
    }
};


    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case "pass":
                return "success";
            case "fail":
                return "danger";
            case "rework":
                return "warning";
            default:
                return "secondary";
        }
    };

    // --- Sorting and Filtering Logic (Adapted from ProductPage) ---

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const filteredItems = useMemo(() => {
        if (!search) return inventoryItems;

        const lower = search.toLowerCase();
        return inventoryItems.filter(
            (item) =>
                item.serial_no?.toLowerCase().includes(lower) ||
                item.tested_by?.toLowerCase().includes(lower) ||
                item.tested_status?.toLowerCase().includes(lower) ||
                item.test_remarks?.toLowerCase().includes(lower)
        );
    }, [inventoryItems, search]);

    const sortedItems = useMemo(() => {
        const items = [...filteredItems];
        if (!sortField) return items;

        return items.sort((a, b) => {
            let valA = a[sortField] || "";
            let valB = b[sortField] || "";

            // Handle string comparison for sorting
            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredItems, sortField, sortDirection]);

    const paginatedItems = useMemo(() => {
        return sortedItems.slice(
            (page - 1) * perPage,
            page * perPage
        );
    }, [sortedItems, page, perPage]);

 


    return (
        <div className="p-4" style={{ fontSize: "0.85rem" }}>
            {/* Added BreadCrumb */}
            <BreadCrumb title={`Inventory: ${from} to ${to}`} />

            <Card
                className="border-0 shadow-sm rounded-3 bg-white p-2 px-4 mt-2" // Added p-2 px-4 mt-2
                style={{ minHeight: "500px" }}
            >
                {/* Header Row for controls: Records Per Page, Refresh, and Search (Updated) */}
                <div className="row mb-2">
                    <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
                        <label className="me-2 fw-semibold mb-0" style={{fontSize: "0.75rem"}}>Records Per Page:</label>
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
                                <Button
        variant="outline-secondary"
        size="sm"
        className="me-2"
        onClick={() => navigate("/assemble")}
    >
        <i className="bi bi-arrow-left"></i> Back
    </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-2"
                                onClick={fetchInventory}
                                disabled={loading}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                            </Button>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                            {/* Replaced manual search input with the imported Search component style */}
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


                {/* Table Area */}
                <div className="table-responsive">
                    <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                        <thead style={styles.tableHeaderRow}>
                            <tr>
                                <th style={{ ...styles.tableHeaderRow, width: "60px", textAlign: "center" }}>S.NO</th>
                                <th
                                    onClick={() => handleSort("serial_no")}
                                    style={{ ...styles.tableHeaderRow, width: "150px", cursor: "pointer" }}
                                >
                                    Serial No
                                    {sortField === "serial_no" && (sortDirection === "asc" ? " ▲" : " ▼")}
                                </th>
                                <th
                                    onClick={() => handleSort("tested_by")}
                                    style={{ ...styles.tableHeaderRow, width: "120px", cursor: "pointer" }}
                                >
                                    Tested By
                                    {sortField === "tested_by" && (sortDirection === "asc" ? " ▲" : " ▼")}
                                </th>
                                <th
                                    onClick={() => handleSort("tested_status")}
                                    style={{ ...styles.tableHeaderRow, width: "100px", cursor: "pointer" }}
                                >
                                    Status
                                    {sortField === "tested_status" && (sortDirection === "asc" ? " ▲" : " ▼")}
                                </th>
                                <th
                                    onClick={() => handleSort("test_remarks")}
                                    style={{ ...styles.tableHeaderRow, cursor: "pointer" }}
                                >
                                    Test Remarks
                                    {sortField === "test_remarks" && (sortDirection === "asc" ? " ▲" : " ▼")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">
                                        <Spinner animation="border" />
                                    </td>
                                </tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-muted">
                                        {inventoryItems.length === 0 ? (
                                            "No inventory items found"
                                        ) : (
                                            `No items found matching "${search}"`
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item, index) => (
                                    <tr key={item.serial_no || index}>
                                        <td className="text-center text-muted">
                                            {(page - 1) * perPage + index + 1}
                                        </td>
                                        <td>{item.serial_no}</td>
                                        <td>{item.tested_by || "-"}</td>
                                        <td>
                                            <span
                                                className={`badge text-bg-${getStatusVariant(item.tested_status)}`}
                                                style={{ minWidth: "50px" }}
                                            >
                                                {item.tested_status || "N/A"}
                                            </span>
                                        </td>
                                        <td>{item.test_remarks || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                <Pagination
                    page={page}
                    setPage={setPage}
                    perPage={perPage}
                    totalEntries={filteredItems.length}
                />

                {/* Bottom Buttons */}
                <div
                    className="d-flex justify-content-end gap-2 mt-4 pt-3"
                    style={{ borderTop: styles.tableBorder }}
                >
                    {/* <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigate("/assemble")}
                    >
                        Back
                    </Button> */}
                </div>
            </Card>
        </div>
    );
}