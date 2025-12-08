import { useState, useEffect, useMemo } from "react";
import api, { setAuthToken } from "../api";
import { Button, Spinner, Card, Table, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap-icons/font/bootstrap-icons.css";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Select from "react-select";

export default function AssemblePage() {
    const navigate = useNavigate();
    const MySwal = withReactContent(Swal);

    const [inventories, setInventories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10); // default records per page

    const [seriesList, setSeriesList] = useState([]);
    const [selectedSeries, setSelectedSeries] = useState([]);
    const [labelToSeriesMap, setLabelToSeriesMap] = useState({});

    const headerStyle = {
        backgroundColor: "#2E3A59",
        color: "white",
        fontSize: "0.82rem",
        height: "40px",
        verticalAlign: "middle",
    };
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (token) setAuthToken(token);
    }, []);
    // Fetch all serials and product list on page load
    useEffect(() => {
        fetchAllActiveSerials();
        fetchSeriesList();
    }, []);

    const fetchAllActiveSerials = async () => {
        setLoading(true);
        try {
            const res = await api.get("/inventory/serials/active");
            if (res.data.exists && Array.isArray(res.data.data)) {
                setInventories(res.data.data);
            } else {
                setInventories([]);
                toast.info("No active serial numbers found");
            }
        } catch (err) {
            console.error(err);
            // toast.error("Failed to load active serial numbers");
        } finally {
            setLoading(false);
        }
    };

    const fetchSeriesList = async () => {
        try {
            const res = await api.get("/product");
            const labelMap = {};
            const seriesNames = res.data.map((item) => {
                const label = item.name; // only product name
                labelMap[label] = item.name;
                return label;
            });
            setSeriesList(seriesNames);
            setLabelToSeriesMap(labelMap);
        } catch (err) {
            toast.error("Failed to fetch product list!");
        }
    };

    const handleDeleteSerial = async (item) => {
        const serial = item.serial_no;

        MySwal.fire({
            title: "Are you sure?",
            text: `You want to delete serial number ${serial}? This action cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#2FA64F",
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await api.delete(`/inventory/delete/${serial}`);
                    toast.success(res.data?.message || `Serial ${serial} deleted successfully`);
                    setInventories((prev) => prev.filter((inv) => inv.serial_no !== serial));
                } catch (err) {
                    toast.error("Failed to delete serial");
                }
            }
        });
    };

    // Apply product filter locally
    const filteredInventories = useMemo(() => {
        if (selectedSeries.length === 0) return inventories;
        const selectedNames = selectedSeries.map((label) => labelToSeriesMap[label]);
        return inventories.filter((inv) => selectedNames.includes(inv.product_name));
    }, [inventories, selectedSeries, labelToSeriesMap]);

    const paginatedData = filteredInventories.slice((page - 1) * perPage, page * perPage);

    return (
        <div className="px-4" style={{ fontSize: "0.75rem" }}>
            <BreadCrumb title="Inventory Serial Details" />

            <Card className="border-0 shadow-sm rounded-3 p-3 mt-2 bg-white">
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-bold mb-0 text-dark">Assemble List</h6>
                    <Button
                        size="sm"
                        onClick={() => navigate("/assemble/add")}
                        style={{ backgroundColor: "#2FA64F", borderColor: "#2FA64F", color: "#fff", fontSize: "0.8rem", height: "28px" }}
                    >
                        + Add Assemble
                    </Button>
                </div>

                <div className="mb-3">
                    <Form.Group>
                        <Form.Label className="fw-semibold">Filter by Products</Form.Label>
                        <Select
                            isMulti
                            placeholder="Select Products..."
                            value={selectedSeries.map((name) => ({ label: name, value: name }))}
                            onChange={(options) => {
                                const selected = options ? options.map((opt) => opt.value) : [];
                                setSelectedSeries(selected);
                            }}
                            options={seriesList.map((name) => ({ label: name, value: name }))}
                            styles={{
                                container: (provided) => ({
                                    ...provided,
                                    width: "30%", // makes it full width
                                }),
                                menu: (provided) => ({
                                    ...provided,
                                    zIndex: 9999, // ensures dropdown is above other elements
                                }),
                            }}
                        />
                    </Form.Group>
                </div>

                {/* Records per page dropdown (moved below filter) */}
                <div className="mb-3 d-flex align-items-center">
                    <Form.Label className="me-2 mb-0">Records per page:</Form.Label>
                    <Form.Select
                        size="sm"
                        style={{ width: "80px" }}
                        value={perPage}
                        onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setPage(1); // reset to first page
                        }}
                    >
                        {[5, 10, 25, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </Form.Select>
                </div>


                {/* Table */}
                <div className="table-responsive">
                    <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }} bordered>
                        <thead style={headerStyle}>
                            <tr>
                                <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
                                <th style={headerStyle}>Product Name</th>
                                <th style={headerStyle}>Serial No</th>
                                <th style={headerStyle}>Tested Status</th>
                                <th style={headerStyle}>Tested By</th>
                                <th style={headerStyle}>Created Time</th>
                                <th style={{ ...headerStyle, textAlign: "center" }}>Action</th>
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
                                        <img src="/empty-box.png" alt="No data" style={{ width: "80px", opacity: 0.6 }} />
                                        {/* <div>No records found</div> */}
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                                        <td style={{ fontSize: "0.90rem" }}>{item.product_name}</td>
                                        <td style={{ fontSize: "0.90rem" }}>{item.serial_no}</td>
                                        <td
                                            style={{
                                                color: item.tested_status?.toLowerCase() === "fail" ? "red" : "inherit",
                                                fontSize: "0.90rem"
                                            }}
                                        >
                                            {item.tested_status ?? "null"}
                                        </td>

                                        <td style={{ fontSize: "0.90rem" }}>{item.tested_by}</td>
                                        <td style={{ fontSize: "0.90rem" }}>{item.created_at}</td>
                                        <td className="text-center">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleDeleteSerial(item)}>
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination */}
                <Pagination page={page} setPage={setPage} perPage={perPage} totalEntries={filteredInventories.length} />
            </Card>
        </div>
    );
}
