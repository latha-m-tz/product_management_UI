import { useEffect, useState } from "react";
import { Button, Spinner, Card, Form, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap-icons/font/bootstrap-icons.css";
import ActionButtons from "../components/ActionButton";

import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import { API_BASE_URL } from "../api";

export default function AssemblePage() {
    const navigate = useNavigate();

    const [inventories, setInventories] = useState([]);
    // REMOVED: [products, setProducts] state is no longer needed
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");

    const MySwal = withReactContent(Swal);

    // Style object from ProductPage for consistency
    const headerStyle = {
        backgroundColor: "#2E3A59",
        color: "white",
        fontSize: "0.82rem",
        height: "40px",
        verticalAlign: "middle",
    };

    useEffect(() => {
        fetchInventories();
        // REMOVED: fetchProducts() is no longer needed
    }, []);

    const fetchInventories = async () => {
        setLoading(true);
        try {
            // This API call now provides the product object directly, as per your data
            const res = await axios.get(`${API_BASE_URL}/inventory/serialranges`);
            setInventories(Array.isArray(res.data) ? res.data : []);
        } catch {
            toast.error("Failed to fetch inventory items!");
            setInventories([]);
        } finally {
            setLoading(false);
        }
    };

    // REMOVED: fetchProducts is no longer needed

    const handleAddNewClick = () => {
        navigate("/assemble/add");
    };

    const handleDeleteRange = async (item) => {
        const fromSerial = item.from_serial;
        const toSerial = item.to_serial;
        // Use item.product.id and item.product_type.id directly
        const product_id = item.product?.id;
        const productType = item.product_type?.id;

        MySwal.fire({
            title: "Are you sure?",
            text: `You want to delete serial range ${fromSerial} - ${toSerial}. You won't be able to revert this!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#2FA64F",
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.delete(
                        `${API_BASE_URL}/inventory/serialrange/${fromSerial}/${toSerial}`,
                        // ENSURE the backend expects these payload keys
                        { data: { product_id, product_type_id: productType } }
                    );

                    // Remove deleted items from frontend
                    setInventories(prev =>
                        prev.filter(
                            inv => !(inv.from_serial === fromSerial && inv.to_serial === toSerial)
                        )
                    );

                    toast.success(res.data.message || "Serial range deleted!");
                } catch (err) {
                    console.error(err);
                    toast.error(err.response?.data?.message || "Failed to delete serial range");
                }
            }
        });
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // 🔎 Filter
    const filteredData = inventories.filter((item) => {
        // DIRECTLY ACCESS the nested product name
        const productName = item.product?.name || "";
        const productTypeName = item.product_type?.name || "";

        return (
            productName.toLowerCase().includes(search.toLowerCase()) ||
            productTypeName.toLowerCase().includes(search.toLowerCase()) ||
            item.from_serial.toLowerCase().includes(search.toLowerCase()) ||
            item.to_serial.toLowerCase().includes(search.toLowerCase())
        );
    });

    // 🔄 Sort
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortField) return 0;

        let valA, valB;

        if (sortField === "product") {
            // DIRECTLY ACCESS the nested product name for sorting
            valA = a.product?.name || "";
            valB = b.product?.name || "";
        } else if (sortField === "product_type") {
            valA = a.product_type?.name || "";
            valB = b.product_type?.name || "";
        } else {
            // Handles sorting for 'from_serial', 'to_serial', 'quantity'
            valA = a[sortField];
            valB = b[sortField];
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    // 📄 Pagination
    const paginatedData = sortedData.slice((page - 1) * perPage, page * perPage);

    return (
        <div className="px-4" style={{ fontSize: "0.75rem" }}>
            <BreadCrumb title="Inventory List" />

            <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
                {/* Header Actions */}
                <div className="row mb-2">
                    <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
                        <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
                        <Form.Select
                            size="sm"
                            style={{ width: "100px" }}
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
                                onClick={fetchInventories} // Now refreshes only inventory
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                            </Button>

                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAddNewClick}
                                style={{
                                    backgroundColor: "#2FA64F",
                                    borderColor: "#2FA64F",
                                    color: "#fff",
                                    padding: "0.25rem 0.5rem",
                                    fontSize: "0.8rem",
                                    minWidth: "90px",
                                    height: "28px",
                                }}
                            >
                                + Add Assemble
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
                        <thead style={headerStyle}>
                            <tr>
                                <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
                                <th
                                    onClick={() => handleSort("product")}
                                    style={{ ...headerStyle, cursor: "pointer" }}
                                >
                                    Product{" "}
                                    {sortField === "product" &&
                                        (sortDirection === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    onClick={() => handleSort("product_type")}
                                    style={{ ...headerStyle, cursor: "pointer" }}
                                >
                                    Product Type{" "}
                                    {sortField === "product_type" &&
                                        (sortDirection === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    onClick={() => handleSort("from_serial")}
                                    style={{ ...headerStyle, cursor: "pointer" }}
                                >
                                    From Serial{" "}
                                    {sortField === "from_serial" &&
                                        (sortDirection === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    onClick={() => handleSort("to_serial")}
                                    style={{ ...headerStyle, cursor: "pointer" }}
                                >
                                    To Serial{" "}
                                    {sortField === "to_serial" &&
                                        (sortDirection === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    onClick={() => handleSort("quantity")}
                                    style={{ ...headerStyle, cursor: "pointer" }}
                                >
                                    Quantity{" "}
                                    {sortField === "quantity" &&
                                        (sortDirection === "asc" ? "▲" : "▼")}
                                </th>
                                <th style={{ ...headerStyle, width: "170px", textAlign: "center" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4">
                                        <Spinner animation="border" />
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-muted">
                                        <img
                                            src="/empty-box.png"
                                            alt="No inventory"
                                            style={{ width: "80px", opacity: 0.6 }}
                                        />
                                        <div>No records found</div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => (
                                    <tr key={`${item.from_serial}-${item.to_serial}`}>
                                        <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                                        <td style={{ fontSize: "0.90rem" }}>{item.product?.name || "-"}</td>
                                        <td style={{ fontSize: "0.90rem" }}>{item.product_type?.name || "-"}</td>
                                        <td style={{ fontSize: "0.90rem" }}>{item.from_serial}</td>
                                        <td style={{ fontSize: "0.90rem" }}>{item.to_serial}</td>
                                        <td style={{ fontSize: "0.90rem" }}>{item.quantity}</td>
                                        <td className="text-center">
                                            <ActionButtons
                                                onView={() => navigate(`/inventory/${item.from_serial}-${item.to_serial}`)}
                                                onEdit={() =>
                                                    navigate(`/inventory/edit/${item.from_serial}/${item.to_serial}`)
                                                }
                                                onDelete={() => handleDeleteRange(item)}
                                                onMissing={() => navigate(`/missing-serials/${item.from_serial}/${item.to_serial}`)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                    </Table>
                </div>

                {/* Pagination */}
                <Pagination
                    page={page}
                    setPage={setPage}
                    perPage={perPage}
                    totalEntries={filteredData.length}
                />
            </Card>
        </div>
    );
}