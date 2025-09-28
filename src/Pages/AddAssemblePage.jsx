import React, { useState, useEffect } from "react";
import { Table, Button, Form, Card, Row, Col, Container } from "react-bootstrap";
import axios from "axios";
import { IoArrowBack, IoTrashOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { FaQrcode } from "react-icons/fa";
import QrScannerPage from "./QrScannerPage";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { API_BASE_URL } from "../api";

// const headerStyle = {
//     backgroundColor: "#F8F9FA",
//     color: "#2E3A59",
//     fontWeight: "bold",
//     borderTop: "1px solid #dee2e6",
//     borderBottom: "1px solid #dee2e6",
// };
// Custom styles
const headerStyle = {
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
export default function AddAssemblePage() {
    const [form, setForm] = useState({
        productType: "",
        product_id: "",
        firmwareVersion: "",
        testedBy: "",
        quantity: "",
        fromSerial: "",
        toSerial: "",
        testedDate: "",
    });


    const [errors, setErrors] = useState({});
    const [productTypes, setProductTypes] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [products, setProducts] = useState([]);
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const navigate = useNavigate();



    useEffect(() => {
        axios.get(`${API_BASE_URL}/product-types`)
            .then((res) => setProductTypes(res.data))
            .catch((err) => console.error(err));
    }, []);


    useEffect(() => {
        if (form.productType) {
            axios.get(`${API_BASE_URL}/product`)
                .then((res) => setProductOptions(res.data))
                .catch((err) => console.error(err));
        } else {
            setProductOptions([]);
        }
    }, [form.productType]);

    const customStyles = {
        control: (provided) => ({
            ...provided,
            height: "38px",        // Bootstrap Form.Select height
            minHeight: "38px",
            borderRadius: "0.25rem",
            borderColor: "#ced4da",
        }),
        option: (provided, state) => ({
            ...provided,
            color: state.isFocused ? "#888" : "#000",      // Gray on hover
            backgroundColor: state.isFocused ? "#f0f0f0" : "#fff",
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#000",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#888",
        }),
    };




    const handleChange = (e) => {
        setErrors({ ...errors, [e.target.name]: "" });
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleScan = (serialNumber) => {
        const newProduct = {
            serial_no: serialNumber,
            tested_by: form.testedBy,
            tested_status: ["PASS"],
            test_remarks: "",
            // NOTE: Added from_serial, to_serial, quantity for consistency, though they might be less relevant for a single scan
            from_serial: serialNumber,
            to_serial: serialNumber,
            quantity: 1,
        };
        setProducts((prevProducts) => [...prevProducts, newProduct]);
        setForm((prev) => ({
            ...prev,
            // Automatically update From/To Serial to reflect the whole list after a scan
            fromSerial: prevProducts.length === 0 ? serialNumber : prev.fromSerial,
            toSerial: serialNumber,
            quantity: prevProducts.length + 1,
        }));
    };

    const validateSerialRange = (startSN, endSN) => {
        const prefixStart = startSN.match(/[^\d]+/)?.[0] || "";
        const prefixEnd = endSN.match(/[^\d]+/)?.[0] || "";
        const startNum = parseInt(startSN.match(/\d+/)?.[0], 10);
        const endNum = parseInt(endSN.match(/\d+/)?.[0], 10);

        if (prefixStart !== prefixEnd) {
            return false;
        }

        if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
            return false;
        }
        return true;
    };

    const handleAddProduct = () => {
        const { fromSerial, toSerial, testedBy } = form;
        let newErrors = {};
        if (!form.productType) newErrors.productType = "Product Type is required.";
        if (!form.product_id) newErrors.product_id = "Product is required.";
        if (!form.firmwareVersion) newErrors.firmwareVersion = "Firmware Version is required.";
        if (!form.testedDate) newErrors.testedDate = "Tested Date is required.";
        if (!fromSerial) newErrors.fromSerial = "From Serial is required.";
        if (!toSerial) newErrors.toSerial = "To Serial is required.";
        if (!testedBy) newErrors.testedBy = "Tested By is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!validateSerialRange(fromSerial, toSerial)) {
            setErrors({ fromSerial: "Invalid serial range", toSerial: "Invalid serial range" });
            return;
        }

        const prefix = fromSerial.match(/[^\d]+/)?.[0] || "";
        const start = parseInt(fromSerial.match(/\d+/)?.[0], 10);
        const end = parseInt(toSerial.match(/\d+/)?.[0], 10);

        const newProducts = [];
        for (let i = start; i <= end; i++) {
            const serial = `${prefix}${i.toString().padStart(fromSerial.length - prefix.length, "0")}`;
            newProducts.push({
                serial_no: serial,
                tested_by: testedBy,
                tested_status: ["PASS"],
                test_remarks: "",
                from_serial: fromSerial,
                to_serial: toSerial,
                quantity: 1,
            });
        }

        const updatedProducts = [...products, ...newProducts];
        setProducts(updatedProducts);

        setForm((prev) => ({
            ...prev,
            fromSerial: updatedProducts.length > 0 ? updatedProducts[0].serial_no : "", // New first serial
            toSerial: updatedProducts.length > 0 ? updatedProducts[updatedProducts.length - 1].serial_no : "", // New last serial
            quantity: updatedProducts.length, // Update quantity to the total count
        }));

        setErrors({});
    };

    const handleRowChange = (index, field, value) => {
        const updated = [...products];
        const globalIndex = products.findIndex(
            (p) => p.serial_no === paginatedProducts[index].serial_no
        );

        if (globalIndex === -1) return; // safeguard

        if (field === "tested_status") {
            updated[globalIndex][field] = [value]; // enforce single PASS/FAIL
        } else {
            updated[globalIndex][field] = value;
        }

        setProducts(updated);
    };

    const handleDelete = (globalIndex) => {
        const updated = products.filter((_, i) => i !== globalIndex);
        setProducts(updated);

    if (updated.length > 0) {
    const newFromSerial = updated[0].serial_no;
    const newToSerial = updated[updated.length - 1].serial_no;

    // If deleted item was the original fromSerial → bump to next serial
    const deletedSerial = products[globalIndex].serial_no;
    const newStartIndex = updated.findIndex(p => p.serial_no > deletedSerial);
    const adjustedFrom = newStartIndex !== -1 ? updated[newStartIndex].serial_no : newFromSerial;

    setForm((prev) => ({
        ...prev,
        fromSerial: adjustedFrom,
        toSerial: newToSerial,
        quantity: updated.length,
    }));
} else {
    setForm((prev) => ({ ...prev, fromSerial: "", toSerial: "", quantity: "" }));
}


        if (paginatedProducts.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                product_id: parseInt(form.product_id, 10),
                product_type_id: parseInt(form.productType, 10),
                firmware_version: form.firmwareVersion,
                tested_date: form.testedDate,
                items: products.map(p => ({
                    serial_no: p.serial_no,
                    tested_by: p.tested_by,
                    tested_status: Array.isArray(p.tested_status) ? p.tested_status.join(",") : p.tested_status,
                    test_remarks: p.test_remarks,
                    from_serial: p.from_serial,
                    to_serial: p.to_serial,
                    quantity: p.quantity,
                })),
            };

            await axios.post(`${API_BASE_URL}/inventory`, payload);

            toast.success("Inventory saved successfully!");
            navigate("/assemble");

        } catch (error) {
            console.error(error);

            if (error.response && error.response.data && error.response.data.errors) {
                const validationErrors = error.response.data.errors;

                toast.error(
                    <div>
                        <strong>{error.response.data.message || "Error"}</strong>
                        {Object.entries(validationErrors).map(([key, messages]) => (
                            <div key={key}>
                                {messages.map((msg, index) => (
                                    <p key={index} className="mb-0 small">{msg}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                    , {
                        autoClose: 8000
                    }
                );
            } else {
                toast.error("Error saving inventory. Please try again.");
            }
        }
    };

    const filteredProducts = products.filter(
        (p) =>
            p.serial_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tested_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tested_status.join(",").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleItemsPerPageChange = (e) => {
        const newItemsPerPage = parseInt(e.target.value, 10);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const startItem = filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    const paginationRange = filteredProducts.length === 0 ? '0' : `${startItem}-${endItem}`;


    return (
        <Container className="main-container">
            {/* 3. Add ToastContainer near the top of the return block */}
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />


            <Row className="align-items-center mb-3">
                <Col>
                    <h4>Add New Inventory</h4>
                </Col>
                <Col className="text-end">
                     <Button
        variant="outline-secondary"
        size="sm"
        className="me-2"
        onClick={() => navigate("/assemble")}
    >
        <i className="bi bi-arrow-left"></i> Back
    </Button>
                </Col>
            </Row>

            <Card className="p-4 mb-3 shadow-sm rounded-3 bg-white" style={{ position: "relative" }}>
                <h5 className="mb-4">Product Details</h5>
                <div className="qr-scanner-button" onClick={() => setShowQrScanner(true)}>
                    <div className="qr-scanner-icon-container">
                        <FaQrcode />
                    </div>
                    <span className="qr-scanner-text">QR code scanner</span>
                </div>
                <Row className="mb-3 g-3">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Product Type</Form.Label>
                            <Form.Select name="productType" value={form.productType} onChange={handleChange}

                            >
                                <option value="">Select Product Type</option>
                                {productTypes.map((pt) => (
                                    <option key={pt.id} value={pt.id}>
                                        {pt.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Product</Form.Label>
                            <Form.Select name="product_id" value={form.product_id} onChange={handleChange}>
                                <option value="">Select Product</option>
                                {productOptions.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Firmware Version</Form.Label>
                            <Form.Control
                                name="firmwareVersion"
                                value={form.firmwareVersion}
                                onChange={handleChange}
                                placeholder="Enter Firmware Version"
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3 g-3">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Quantity</Form.Label>
                            <Form.Control name="quantity" value={products.length} readOnly />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>From Serial</Form.Label>
                            <Form.Control name="fromSerial" value={form.fromSerial} onChange={handleChange} isInvalid={!!errors.fromSerial} />
                            <Form.Control.Feedback type="invalid">
                                {errors.fromSerial}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>To Serial</Form.Label>
                            <Form.Control name="toSerial" value={form.toSerial} onChange={handleChange} isInvalid={!!errors.toSerial} />
                            <Form.Control.Feedback type="invalid">
                                {errors.toSerial}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3 g-3 align-items-end">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Tested Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="testedDate"
                                value={form.testedDate}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Tested By</Form.Label>
                            <Form.Control name="testedBy" value={form.testedBy} onChange={handleChange} placeholder="Enter Name" isInvalid={!!errors.testedBy} />
                            <Form.Control.Feedback type="invalid">
                                {errors.testedBy}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        <Button variant="success" onClick={handleAddProduct} className="w-100">
                            + Add Product
                        </Button>
                    </Col>
                </Row>
            </Card>

            {products.length > 0 && (
                <Card className="p-2 px-4 mt-2 bg-white border-0 shadow-sm rounded-3"> {/* Added Card classes from sample */}
                    <div className="row mb-2 d-flex align-items-center"> {/* Use row for alignment */}
                        <div className="col-md-6">
                            <h5 className="mb-0">Product List</h5>
                        </div>
                        <div className="col-md-6 d-flex justify-content-end"> {/* Search box aligned right */}
                            <Form.Control
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '200px', fontSize: "0.85rem" }} // Sizing the search input
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        {/* Applied classes and styles from the sample table */}
                        <Table className="table-sm align-middle mb-0 table-sm-custom align-middle-custom" style={{ fontSize: "0.85rem" }}>
                            <thead style={headerStyle}>
                                <tr>
                                    <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
                                    <th style={headerStyle}>Serial No</th>
                                    <th style={headerStyle}>Tested By</th>
                                    <th style={{ ...headerStyle, width: "150px" }}>Status</th>
                                    <th style={headerStyle}>Remarks</th>
                                    <th style={{ ...headerStyle, width: "70px", textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Check for empty results after filtering */}
                                {filteredProducts.length === 0 && searchTerm !== "" ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-muted">
                                            No products found matching "{searchTerm}"
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedProducts.map((row, i) => (
                                        <tr key={i}>
                                            <td className="text-center">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                            <td>{row.serial_no}</td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    size="sm" // Added size="sm" for smaller input
                                                    value={row.tested_by}
                                                    onChange={(e) =>
                                                        handleRowChange(
                                                            i,
                                                            "tested_by",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>
                                                {/* Adjusted checkbox logic for cleaner display */}
                                                <div className="custom-checkbox-color">
                                                    <Form.Check
                                                        inline
                                                        label="Pass"
                                                        type="checkbox"
                                                        name={`status-pass-${i}`} // Updated name to avoid group behavior
                                                        id={`pass-${i}`}
                                                        value="PASS"
                                                        checked={row.tested_status.includes("PASS")}
                                                        onChange={(e) =>
                                                            handleRowChange(
                                                                i,
                                                                "tested_status",
                                                                e.target.value // You might need a more complex handler for multiple checkboxes
                                                            )
                                                        }
                                                    />
                                                    <Form.Check
                                                        inline
                                                        label="Fail"
                                                        type="checkbox"
                                                        name={`status-fail-${i}`} // Updated name to avoid group behavior
                                                        id={`fail-${i}`}
                                                        value="FAIL"
                                                        checked={row.tested_status.includes("FAIL")}
                                                        onChange={(e) =>
                                                            handleRowChange(
                                                                i,
                                                                "tested_status",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    size="sm" // Added size="sm" for smaller input
                                                    value={row.test_remarks}
                                                    onChange={(e) =>
                                                        handleRowChange(
                                                            i,
                                                            "test_remarks",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Button
                                                    variant="outline-danger" // Using a standard danger variant for consistency
                                                    size="sm"
                                                    onClick={() => handleDelete(i + (currentPage - 1) * itemsPerPage)}
                                                >
                                                    <IoTrashOutline />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3" style={{ fontSize: "0.85rem" }}>
                        <div className="total-items">Total: {filteredProducts.length}</div>

                        <div className="d-flex align-items-center">
                            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
                            <Form.Select
                                size="sm"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                style={{ width: "100px" }} // Fixed width for select
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </Form.Select>

                            <div className="d-flex align-items-center ms-3">
                                <span className="mx-2 text-muted small">Showing {paginationRange} of {filteredProducts.length}</span> {/* Updated text */}
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="me-1" // Added margin for spacing
                                >
                                    <IoChevronBack />
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages || filteredProducts.length === 0}
                                >
                                    <IoChevronForward />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Save/Cancel buttons outside the card as per original file structure, but aligned right */}
            {products.length > 0 && (
                <div className="d-flex justify-content-end mt-3 gap-2">
                    <Button variant="outline-secondary">Cancel</Button>
                    <Button variant="success" onClick={handleSubmit}>
                        Save
                    </Button>
                </div>
            )}

            <QrScannerPage show={showQrScanner} onClose={() => setShowQrScanner(false)} onScanSuccess={handleScan} />
        </Container>
    );
}