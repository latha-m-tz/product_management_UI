import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Spinner, Table, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../api";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";

const styles = {
    tableHeaderRow: {
        backgroundColor: "#2E3A59",
        color: "white",
        fontSize: "0.82rem",
        height: "40px",
        verticalAlign: "middle",
    },
};

export default function ComponentsRequirement() {
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [vciCount, setVciCount] = useState(0);
    const [search, setSearch] = useState("");

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");

    // Pagination & Sorting
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortField, setSortField] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");

    useEffect(() => {
        fetchAllSeries();
        fetchProducts();
    }, []);

    const fetchAllSeries = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/counts`);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch spare parts data!");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/product`);
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch products!");
        }
    };

    // Map selectedProduct to seriesData
    const selectedSeriesData = useMemo(() => {
        if (!selectedProduct) return null;
        return data.find(
            (item) => item.series === selectedProduct
        );
    }, [selectedProduct, data]);

    const getFilteredParts = useMemo(() => {
        if (!selectedSeriesData?.spare_parts) return [];
        let parts = [...selectedSeriesData.spare_parts];

        if (search) {
            const lower = search.toLowerCase();
            parts = parts.filter(
                (part) =>
                    part.name.toLowerCase().includes(lower) ||
                    part.available_quantity.toString().includes(lower) ||
                    part.required_per_vci.toString().includes(lower)
            );
        }

        // Sorting
        parts.sort((a, b) => {
            let valA = a[sortField] ?? "";
            let valB = b[sortField] ?? "";
            if (typeof valA === "string") valA = valA.toLowerCase();
            if (typeof valB === "string") valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return parts;
    }, [selectedSeriesData, search, sortField, sortDirection]);

    const paginatedParts = useMemo(() => {
        const start = (page - 1) * perPage;
        return getFilteredParts.slice(start, start + perPage);
    }, [getFilteredParts, page, perPage]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    return (
        <div className="p-4" style={{ fontSize: "0.85rem" }}>
            <BreadCrumb title="Spare Parts Requirement" />

            {/* Controls */}
            <Card className="border-0 shadow-sm rounded-3 bg-white p-3 mb-3">
                <div className="d-flex flex-wrap gap-3 align-items-end">
                    <Form.Group style={{ minWidth: "220px" }}>
                        <Form.Label className="fw-bold">Select Product</Form.Label>
                        <Form.Select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                            <option value="">-- Select Product --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.name}> {/* use name instead of id */}
                                    {p.name}
                                </option>
                            ))}
                        </Form.Select>

                    </Form.Group>

                    <Form.Group style={{ minWidth: "200px" }}>
                        <Form.Label className="fw-bold">Enter VCI Count</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. 400"
                            value={vciCount}
                            onChange={(e) =>
                                setVciCount(parseInt(e.target.value, 10) || 0)
                            }
                        />
                    </Form.Group>

                    <Form.Group style={{ minWidth: "250px" }}>
                        <Form.Label className="fw-bold">Search Parts</Form.Label>
                        <Search
                            search={search}
                            setSearch={setSearch}
                            perPage={perPage}
                            setPerPage={setPerPage}
                            setPage={setPage}
                        />
                    </Form.Group>
                </div>
            </Card>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : selectedSeriesData ? (
                <Card className="border-0 shadow-sm rounded-3 bg-white p-3 px-4 mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0">
                            {selectedSeriesData.series.toUpperCase()} Spare Parts
                        </h6>
                        <span className="text-muted">
                            Max VCI Possible: {selectedSeriesData.max_vci_possible}
                        </span>
                    </div>

                    <div className="table-responsive">
                        <Table
                            className="table-sm align-middle mb-0"
                            style={{ fontSize: "0.85rem" }}
                        >
                            <thead style={styles.tableHeaderRow}>
                                <tr>
                                    <th style={{ width: "50px", textAlign: "center" }}>S.NO</th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("name")}
                                    >
                                        Spare Part Name{" "}
                                        {sortField === "name"
                                            ? sortDirection === "asc"
                                                ? " ▲"
                                                : " ▼"
                                            : ""}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("available_quantity")}
                                    >
                                        Available Qty{" "}
                                        {sortField === "available_quantity"
                                            ? sortDirection === "asc"
                                                ? " ▲"
                                                : " ▼"
                                            : ""}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("required_per_vci")}
                                    >
                                        Required{" "}
                                        {sortField === "required_per_vci"
                                            ? sortDirection === "asc"
                                                ? " ▲"
                                                : " ▼"
                                            : ""}
                                    </th>
                                    <th>Total Required</th>
                                    <th>Shortage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedParts.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted py-4">
                                            No parts found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedParts.map((part, idx) => {
                                        const totalRequired =
                                            (part.required_per_vci || 0) * (vciCount || 0);
                                        const shortage =
                                            totalRequired - (part.available_quantity || 0);
                                        return (
                                            <tr key={idx}>
                                                <td className="text-center text-muted">
                                                    {(page - 1) * perPage + idx + 1}
                                                </td>
                                                <td>{part.name}</td>
                                                <td>{part.available_quantity}</td>
                                                <td>{part.required_per_vci}</td>
                                                <td>{totalRequired || "-"}</td>
                                                <td
                                                    style={{ color: shortage > 0 ? "red" : "green" }}
                                                >
                                                    {shortage > 0 ? shortage : "OK"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>

                    <Pagination
                        page={page}
                        setPage={setPage}
                        perPage={perPage}
                        totalEntries={getFilteredParts.length}
                    />
                </Card>
            ) : (
                <p className="text-muted mt-4">
                    Please select a product to view spare parts requirement.
                </p>
            )}
        </div>
    );
}
