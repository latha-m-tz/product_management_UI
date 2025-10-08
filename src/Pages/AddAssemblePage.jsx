import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";
import { Table, Button, Form, Card, Row, Col, Container } from "react-bootstrap";
import { IoArrowBack, IoTrashOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { FaQrcode } from "react-icons/fa";
import 'react-toastify/dist/ReactToastify.css';
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import '../index.css';
import { API_BASE_URL } from "../api";
import QrScannerPage from "./QrScannerPage";


const headerStyle = {
    headerBackground: "#2E3A59",
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

    const [allProducts, setAllProducts] = useState([]);

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
    const [checkedForDelete, setCheckedForDelete] = useState({});
    const displayedProducts = form.productType
        ? productOptions
        : allProducts;
    const RequiredLabel = ({ children }) => (
        <Form.Label>
            {children}
            <span style={{ color: "red" }}> *</span>
        </Form.Label>
    );
    const [selectedRows, setSelectedRows] = useState([]);
    const [serialSearchType, setSerialSearchType] = useState('single'); // 'single' or 'range'
    const [fromSerialSearch, setFromSerialSearch] = useState('');
    const [toSerialSearch, setToSerialSearch] = useState('');
    useEffect(() => {
        axios.get(`${API_BASE_URL}/product`) // replace with your real API
            .then(res => setAllProducts(res.data))
            .catch(err => console.error("Error fetching products:", err));
    }, []);
    const handleDeleteRange = () => {
        const from = parseInt(fromSerialSearch, 10);
        const to = parseInt(toSerialSearch, 10);

        if (isNaN(from) || isNaN(to)) {
            alert("Please enter valid numeric serial numbers.");
            return;
        }

        const min = Math.min(from, to);
        const max = Math.max(from, to);

        const updated = products.filter(p => {
            const snNum = parseInt(p.serial_no.match(/\d+/)?.[0], 10);

            // ✅ Only delete if inside range AND still checked
            if (!isNaN(snNum) && snNum >= min && snNum <= max) {
                return !checkedForDelete[p.serial_no];
            }
            return true; // keep others outside range
        });

        setProducts(updated);
        setCheckedForDelete({});
        setFromSerialSearch("");
        setToSerialSearch("");
    };

    useEffect(() => {
        if (fromSerialSearch && toSerialSearch) {
            const from = parseInt(fromSerialSearch, 10);
            const to = parseInt(toSerialSearch, 10);

            if (!isNaN(from) && !isNaN(to)) {
                const min = Math.min(from, to);
                const max = Math.max(from, to);

                const updatedChecks = {};
                products.forEach(p => {
                    const snNum = parseInt(p.serial_no.match(/\d+/)?.[0], 10);
                    if (!isNaN(snNum) && snNum >= min && snNum <= max) {
                        updatedChecks[p.serial_no] = true; // ✅ default checked
                    }
                });

                setCheckedForDelete(updatedChecks);
            }
        }
    }, [fromSerialSearch, toSerialSearch, products]);


    useEffect(() => {
        axios.get(`${API_BASE_URL}/product-types`)
            .then((res) => setProductTypes(res.data))
            .catch((err) => console.error(err));
    }, []);


    // useEffect(() => {
    //     if (form.productType) {
    //         const selectedType = productTypes.find(pt => pt.id === parseInt(form.productType, 10));
    //         if (selectedType && Array.isArray(selectedType.products)) {
    //             setProductOptions(selectedType.products);
    //         } else {
    //             setProductOptions([]);
    //         }
    //     } else {
    //         setProductOptions([]);
    //     }
    // }, [form.productType, productTypes]);
    useEffect(() => {
        if (form.productType) {
            const filteredProducts = allProducts.filter(product =>
                product.product_types.some(pt => pt.id === parseInt(form.productType, 10))
            );
            setProductOptions(filteredProducts);
        } else {
            setProductOptions(allProducts);
        }
    }, [form.productType, allProducts]);

    const customStyles = {
        control: (provided) => ({
            ...provided,
            height: "38px", // Bootstrap Form.Select height
            minHeight: "38px",
            borderRadius: "0.25rem",
            borderColor: "#ced4da",
        }),
        option: (provided, state) => ({
            ...provided,
            color: state.isFocused ? "#888" : "#000", // Gray on hover
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
            from_serial: serialNumber,
            to_serial: serialNumber,
            quantity: 1,
        };

        setProducts((prevProducts) => {
            const updatedProducts = [...prevProducts, newProduct];

            // update form based on updated products
            setForm((prev) => ({
                ...prev,
                fromSerial: updatedProducts[0]?.serial_no || serialNumber,
                toSerial: updatedProducts[updatedProducts.length - 1]?.serial_no || serialNumber,
                quantity: updatedProducts.length,
            }));

            return updatedProducts;
        });
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
        if (!fromSerial) newErrors.fromSerial = "From Serial is required.";
        if (!toSerial) newErrors.toSerial = "To Serial is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // If single serial
        if (fromSerial === toSerial) {
            const newProduct = {
                serial_no: fromSerial,
                tested_by: testedBy,
                tested_status: ["PASS"],
                test_remarks: "",
                from_serial: fromSerial,
                to_serial: toSerial,
                quantity: 1,
            };

            setProducts((prevProducts) => {
                const updatedProducts = [...prevProducts, newProduct];

                // Update form values
                setForm((prev) => ({
                    ...prev,
                    fromSerial: updatedProducts[0]?.serial_no || fromSerial,
                    toSerial: updatedProducts[updatedProducts.length - 1]?.serial_no || toSerial,
                    quantity: updatedProducts.length,
                }));

                return updatedProducts;
            });

            setErrors({});
            return;
        }

        // Existing range logic for multiple serials
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
            fromSerial: updatedProducts[0].serial_no,
            toSerial: updatedProducts[updatedProducts.length - 1].serial_no,
            quantity: updatedProducts.length,
        }));

        setErrors({});
    };



    const handleRowChange = (index, field, value) => {
        const updated = [...products];
        const globalIndex = products.findIndex(
            (p) => paginatedProducts.length > index && p.serial_no === paginatedProducts[index].serial_no
        );

        if (globalIndex === -1) return; // safeguard

        if (field === "tested_status") {
            const currentStatus = updated[globalIndex].tested_status;
            let newStatus;

            if (currentStatus.includes(value)) {
                newStatus = [];
            } else {
                newStatus = [value];
            }

            updated[globalIndex][field] = newStatus.length > 0 ? newStatus : ["PASS"];

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
            if (products.length === 0) {
                toast.error("Add at least one product before saving.");
                return;
            }

            const payload = {
                product_id: parseInt(form.product_id, 10),
                product_type_id: parseInt(form.productType, 10),
                firmware_version: form.firmwareVersion,
                tested_date: form.testedDate,
                items: products
                    .filter((v, i, a) => a.findIndex(t => t.serial_no === v.serial_no) === i) // remove duplicates
                    .map(p => ({
                        serial_no: p.serial_no,
                        tested_by: p.tested_by || null,
                        tested_status: Array.isArray(p.tested_status) ? p.tested_status.join(",") : p.tested_status || "PASS",
                        test_remarks: p.test_remarks || "",
                        from_serial: p.from_serial,
                        to_serial: p.to_serial,
                        quantity: parseInt(p.quantity, 10),
                        tested_date: form.testedDate
                    })),
            };

            const response = await axios.post(`${API_BASE_URL}/inventory`, payload);

            // ✅ Handle duplicates if present
            if (response.data.items && Array.isArray(response.data.items)) {
                const existsItems = response.data.items.filter(i => i.status === "exists");

                if (existsItems.length > 0) {
                    // Show a grouped toast
                    toast.warn(
                        <div>
                            <strong>{response.data.message}</strong>
                            <ul className="mb-0 mt-1 small">
                                {existsItems.slice(0, 5).map((item, i) => (
                                    <li key={i}>
                                        Serial {item.serial_no}: {item.message}
                                    </li>
                                ))}
                                {existsItems.length > 5 && (
                                    <li>...and {existsItems.length - 5} more</li>
                                )}
                            </ul>
                        </div>,
                        { autoClose: 8000 }
                    );
                } else {
                    toast.success(response.data.message || "Inventory saved successfully!");
                    navigate("/assemble");
                }
            } else {
                toast.success(response.data.message || "Inventory saved successfully!");
                navigate("/assemble");
            }

        } catch (error) {
            console.error(error);

            if (error.response?.data?.errors) {
                const messages = [];
                Object.entries(error.response.data.errors).forEach(([key, msgs]) => {
                    msgs.forEach(m => messages.push(m));
                });
                toast.error(
                    <div>
                        <strong>{error.response.data.message || "Validation Error"}</strong>
                        {messages.map((m, i) => <p key={i} className="mb-0 small">{m}</p>)}
                    </div>,
                    { autoClose: 8000 }
                );
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Error saving inventory. Please try again.");
            }
        }
    };

    const filteredProducts = products.filter((p) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const serialNo = p.serial_no.toLowerCase();
        const testedBy = p.tested_by.toLowerCase();
        const testedStatus = p.tested_status.join(",").toLowerCase();

        // Text search match
        const textMatch =
            serialNo.includes(lowerCaseSearchTerm) ||
            testedBy.includes(lowerCaseSearchTerm) ||
            testedStatus.includes(lowerCaseSearchTerm);

        // Serial range filtering
        let serialMatch = true;
        if (fromSerialSearch && toSerialSearch) {
            const startNum = parseInt(fromSerialSearch.replace(/\D/g, ''), 10);
            const endNum = parseInt(toSerialSearch.replace(/\D/g, ''), 10);
            const productNum = parseInt(p.serial_no.replace(/\D/g, ''), 10);

            if (!isNaN(startNum) && !isNaN(endNum)) {
                serialMatch = productNum >= startNum && productNum <= endNum;
            }
        }

        // Combine filters
        if (searchTerm.trim() !== '' && (fromSerialSearch || toSerialSearch)) {
            return textMatch && serialMatch;
        } else if (searchTerm.trim() !== '') {
            return textMatch;
        } else if (fromSerialSearch || toSerialSearch) {
            return serialMatch;
        }

        return true; // no filters, return all
    });



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

            <Card className="p-4 mb-3 shadow-sm rounded-3 card-custom" style={{ position: "relative" }}>
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
                            {/* ✅ Product Type */}
                            <RequiredLabel>Product Type</RequiredLabel>
                            <Form.Select
                                name="productType"
                                value={form.productType}
                                onChange={handleChange}
                                isInvalid={!!errors.productType}
                            >
                                <option value="">Select Product Type</option>
                                {productTypes.map((pt) => (
                                    <option key={pt.id} value={pt.id}>
                                        {pt.name}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.productType}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            {/* ✅ Product */}
                            <RequiredLabel>Product</RequiredLabel>
                            <Form.Select
                                name="product_id"
                                value={form.product_id}
                                onChange={handleChange}
                                isInvalid={!!errors.product_id}
                            >
                                <option value="">Select Product</option>
                                {displayedProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </Form.Select>


                            <Form.Control.Feedback type="invalid">
                                {errors.product_id}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Firmware Version</Form.Label>
                            <Form.Control
                                name="firmwareVersion"
                                value={form.firmwareVersion}
                                onChange={handleChange}
                                isInvalid={!!errors.firmwareVersion}
                                placeholder="Enter Firmware Version"
                            />
                            <Form.Control.Feedback type="invalid">{errors.firmwareVersion}</Form.Control.Feedback>
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
                            {/* ✅ From Serial */}
                            <RequiredLabel>From Serial</RequiredLabel>
                            <Form.Control
                                name="fromSerial"
                                value={form.fromSerial}
                                onChange={handleChange}
                                isInvalid={!!errors.fromSerial}
                            />
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
                                isInvalid={!!errors.testedDate}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.testedDate}
                            </Form.Control.Feedback>
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
                <Card className="p-2 px-4 mt-2 card-custom border-0 shadow-sm rounded-3">
                    <div className="row mb-2 d-flex align-items-center">
                        <div className="col-md-3">
                            <h5 className="mb-0">Product List</h5>
                        </div>
                        <Row className="mb-3">
                            <Col>
                                <div className="search-input-wrapper">
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        placeholder="Search serials..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                    {searchTerm && (
                                        <i
                                            className="bi bi-x search-clear-icon"
                                            onClick={() => {
                                                setSearchTerm("");
                                                setCurrentPage(1);
                                            }}
                                        />
                                    )}
                                </div>
                            </Col>

                            <Col md={3}>
                                <div className="search-input-wrapper">
                                    <Form.Control
                                        placeholder="Delete From Serial"
                                        value={fromSerialSearch}
                                        onChange={(e) => setFromSerialSearch(e.target.value)}
                                    />
                                    {fromSerialSearch && (
                                        <i
                                            className="bi bi-x search-clear-icon"
                                            onClick={() => setFromSerialSearch("")}
                                        />
                                    )}
                                </div>
                            </Col>

                            <Col md={3}>
                                <div className="search-input-wrapper">
                                    <Form.Control
                                        placeholder="Delete To Serial"
                                        value={toSerialSearch}
                                        onChange={(e) => setToSerialSearch(e.target.value)}
                                    />
                                    {toSerialSearch && (
                                        <i
                                            className="bi bi-x search-clear-icon"
                                            onClick={() => setToSerialSearch("")}
                                        />
                                    )}
                                </div>
                            </Col>

                            <Col md={2}>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={handleDeleteRange}
                                    disabled={!fromSerialSearch || !toSerialSearch}
                                >
                                    <IoTrashOutline />
                                </Button>
                            </Col>
                        </Row>


                        {/* UPDATED SEARCH SECTION */}
                        <Col md={9} className="d-flex justify-content-end align-items-center">
                            {/* <Form.Group className="d-flex align-items-center me-3" style={{ fontSize: "0.85rem" }}>
                                <Form.Check
                                    inline
                                    label="Serial No."
                                    name="serialSearchType"
                                    type="radio"
                                    id="search-type-single"
                                    checked={serialSearchType === 'single'}
                                    onChange={() => {
                                        setSerialSearchType('single');
                                        setFromSerialSearch('');
                                        setToSerialSearch('');
                                    }}
                                />
                                <Form.Check
                                    inline
                                    label="Serial Range"
                                    name="serialSearchType"
                                    type="radio"
                                    id="search-type-range"
                                    checked={serialSearchType === 'range'}
                                    onChange={() => {
                                        setSerialSearchType('range');
                                        setSearchTerm('');
                                    }}
                                />
                            </Form.Group> */}

                            {serialSearchType === 'single' ? (
                                <>
                                    {/* <Form.Control
                                        placeholder="Search by Serial No."
                                        value={fromSerialSearch}
                                        onChange={(e) => setFromSerialSearch(e.target.value)}
                                        style={{ width: '200px', fontSize: "0.85rem" }}
                                        className="me-3"
                                    />
                                    <Form.Control
                                        placeholder="Search All/Other"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ width: '200px', fontSize: "0.85rem" }}
                                    /> */}
                                </>
                            ) : (
                                <>
                                    {/* <Form.Control
                                        placeholder="From Serial"
                                        value={fromSerialSearch}
                                        onChange={(e) => setFromSerialSearch(e.target.value)}
                                        style={{ width: '150px', fontSize: "0.85rem" }}
                                        className="me-2"
                                    />
                                    <Form.Control
                                        placeholder="To Serial"
                                        value={toSerialSearch}
                                        onChange={(e) => setToSerialSearch(e.target.value)}
                                        style={{ width: '150px', fontSize: "0.85rem" }}
                                        className="me-2"
                                    /> */}

                                    {/* 🔹 New Delete Range button */}
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={handleDeleteRange}
                                        disabled={!fromSerialSearch || !toSerialSearch}
                                    >
                                        <IoTrashOutline className="me-1" /> Delete Range
                                    </Button>
                                </>
                            )}
                        </Col>

                    </div>

                    <div className="table-responsive">
                        {/* Applied classes and styles from the sample table */}
                        <Table className="table-sm align-middle mb-0 table-sm-custom align-middle-custom" style={{ fontSize: "0.85rem" }}>
                            <thead style={headerStyle.tableHeaderRow}>
                                <tr className="table-header-custom">
                                    <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>

                                    {/* Empty header for checkbox column */}
                                    <th style={{ ...headerStyle, width: "40px" }}></th>

                                    <th style={headerStyle}>Serial No</th>
                                    <th style={headerStyle}>Tested By</th>
                                    <th style={{ ...headerStyle, width: "150px" }}>Status</th>
                                    <th style={headerStyle}>Remarks</th>
                                    <th style={{ ...headerStyle, width: "70px", textAlign: "center" }}>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredProducts.length === 0 &&
                                    (searchTerm !== "" || fromSerialSearch !== "" || toSerialSearch !== "") ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            No products found matching the criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedProducts.map((row, i) => (
                                        <tr key={i} className="align-middle">
                                            {/* Serial No */}
                                            <td className="text-center">{(currentPage - 1) * itemsPerPage + i + 1}</td>

                                            <td className="text-center custom-checkbox-color">
                                                {(fromSerialSearch && toSerialSearch) ? (
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={!!checkedForDelete[row.serial_no]}
                                                        onChange={() => {
                                                            setCheckedForDelete(prev => ({
                                                                ...prev,
                                                                [row.serial_no]: !prev[row.serial_no],
                                                            }));
                                                        }}
                                                    />
                                                ) : null}
                                            </td>


                                            {/* Serial Number */}
                                            <td className="text-center">{row.serial_no}</td>

                                            {/* Tested By */}
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={row.tested_by}
                                                    onChange={(e) => handleRowChange(i, "tested_by", e.target.value)}
                                                />
                                            </td>

                                            {/* Status Checkboxes */}
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Form.Check
                                                        inline
                                                        label="Pass"
                                                        type="checkbox"
                                                        id={`pass-${i}`}
                                                        className="custom-checkbox-color"
                                                        checked={row.tested_status.includes("PASS")}
                                                        onChange={(e) =>
                                                            handleRowChange(i, "tested_status", e.target.checked ? "PASS" : "")
                                                        }
                                                    />
                                                    <Form.Check
                                                        inline
                                                        label="Fail"
                                                        type="checkbox"
                                                        id={`fail-${i}`}
                                                        className="custom-checkbox-color"
                                                        checked={row.tested_status.includes("FAIL")}
                                                        onChange={(e) =>
                                                            handleRowChange(i, "tested_status", e.target.checked ? "FAIL" : "")
                                                        }
                                                    />
                                                </div>
                                            </td>

                                            {/* Test Remarks */}
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={row.test_remarks}
                                                    onChange={(e) => handleRowChange(i, "test_remarks", e.target.value)}
                                                />
                                            </td>

                                            {/* Delete Button */}
                                            <td className="text-center">
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(products.findIndex(p => p.serial_no === row.serial_no))}
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
                    <Button
                        variant="secondary"
                        className="me-2"
                        onClick={() => {

                        }}
                    >
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleSubmit}>
                        Save
                    </Button>
                </div>
            )}

            <QrScannerPage show={showQrScanner} onClose={() => setShowQrScanner(false)} onScanSuccess={handleScan} />
        </Container>
    );
}