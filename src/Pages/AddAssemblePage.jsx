import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import axios from "axios";
import { Table, Button, Form, Card, Row, Col, Container } from "react-bootstrap";
import { IoArrowBack, IoTrashOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { FaQrcode } from "react-icons/fa";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import '../index.css';
import { API_BASE_URL } from "../api";
import QrScannerPage from "./QrScannerPage";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const headerStyle = {
    headerBackground: "#2E3A59",
    tableBorder: "1px solid #dee2e6",
    tableHeaderRow: {
        backgroundColor: "#2E3A59",
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
    const [technicians, setTechnicians] = useState([]);
    const [checkedForDelete, setCheckedForDelete] = useState({});
    const MySwal = withReactContent(Swal);

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
    const [isAddDisabled, setIsAddDisabled] = useState(false);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/product`)
            .then(res => setAllProducts(res.data))
            .catch(err => console.error("Error fetching products:", err));
    }, []);
    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/technicians`);
                setTechnicians(res.data);
            } catch (error) {
                console.error("Error fetching technicians:", error);
            }
        };
        fetchTechnicians();
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

        const serialsToDelete = products
            .filter(p => {
                if (!p || !p.serial_no) return false;
                const snNum = parseInt(p.serial_no.match(/\d+/)?.[0], 10);
                return !isNaN(snNum) && snNum >= min && snNum <= max;
            })
            .map(p => p.serial_no);

        if (serialsToDelete.length === 0) {
            toast.info("No products found in the specified range.");
            return;
        }

        MySwal.fire({
            title: "Are you sure?",
            html: `You are about to delete <strong>${serialsToDelete.length}</strong> products in the range.<br>${serialsToDelete.join(", ")}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#2FA64F",
            confirmButtonText: "Yes, delete them!",
            width: '600px',
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = products.filter(p => !serialsToDelete.includes(p.serial_no));
                setProducts(updated);
                setCheckedForDelete({});
                setFromSerialSearch("");
                setToSerialSearch("");

                toast.success(`${serialsToDelete.length} products deleted!`);
            }
        });
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
                    if (!p || !p.serial_no) return;
                    const snNum = parseInt(p.serial_no.match(/\d+/)?.[0], 10);
                    if (!isNaN(snNum) && snNum >= min && snNum <= max) {
                        updatedChecks[p.serial_no] = true;
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

    useEffect(() => {
        if (form.productType) {
            const selectedType = productTypes.find(
                (pt) => pt.id === parseInt(form.productType, 10)
            );
            if (selectedType && selectedType.product) {
                setProductOptions([selectedType.product]);
            } else {
                setProductOptions([]);
            }
        } else {
            setProductOptions(allProducts);
        }
    }, [form.productType, productTypes, allProducts]);

    const customStyles = {
        control: (provided) => ({
            ...provided,
            height: "38px",
            minHeight: "38px",
            borderRadius: "0.25rem",
            borderColor: "#ced4da",
        }),
        option: (provided, state) => ({
            ...provided,
            color: state.isFocused ? "#888" : "#000",
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
        const { name, value } = e.target;
        if (name === "testedDate") {
            const year = value.split("-")[0];
            if (year.length > 4) {
                return;
            }
        }
        if (name === "product_id") {
            const [productId, productTypeId] = value.split("|");
            setForm((prev) => ({
                ...prev,
                product_id: productId || "",
                productType: productTypeId || "",
            }));
            setErrors((prev) => ({ ...prev, product_id: null, productType: null }));
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }));
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
        setIsAddDisabled(false);
    };

    const handleScan = (serialNumber) => {
        const newProduct = {
            serial_no: serialNumber || "",
            tested_by: form.testedBy || "",
            tested_status: ["PASS"],
            test_remarks: "",
            from_serial: serialNumber || "",
            to_serial: serialNumber || "",
            quantity: 1,
        };
        setProducts((prevProducts) => {
            const updatedProducts = [...prevProducts, newProduct];
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
        const { fromSerial, toSerial, testedBy, product_id } = form;
        let newErrors = {};

        if (!form.productType) newErrors.productType = "Product Type is required.";
        if (!product_id) newErrors.product_id = "Product is required.";
        if (!fromSerial) newErrors.fromSerial = "From Serial is required.";
        if (!toSerial) newErrors.toSerial = "To Serial is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const selectedProduct = productOptions.find(p => p.id === parseInt(form.product_id)) || {};
        const prefix = selectedProduct.serial_prefix || "";

        // Prefix check
        if (!fromSerial.startsWith(prefix) || !toSerial.startsWith(prefix)) {
            toast.error(`Product does not match the selected serial range prefix "${prefix}"`);
            return;
        }

        // Only allow 6 digits after prefix
        const fromDigits = fromSerial.slice(prefix.length);
        const toDigits = toSerial.slice(prefix.length);
        if (fromDigits.length !== 6 || toDigits.length !== 6) {
            toast.error("Serial numbers must have exactly 6 digits after the prefix.");
            return;
        }

        // Extract numeric parts after prefix
        const startNum = parseInt(fromDigits, 10);
        const endNum = parseInt(toDigits, 10);

        if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
            toast.error("Invalid serial range! 'From Serial' must be less than or equal to 'To Serial'.");
            return;
        }

        // Check duplicates
        const existingSerials = products.map(p => p.serial_no);
        for (let i = startNum; i <= endNum; i++) {
            const serial = `${prefix}${i.toString().padStart(6, "0")}`;
            if (existingSerials.includes(serial)) {
                toast.warn(`Serial ${serial} already added`);
                return;
            }
        }

        // Create new products
        const newProducts = [];
        for (let i = startNum; i <= endNum; i++) {
            const serial = `${prefix}${i.toString().padStart(6, "0")}`;
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

        setForm(prev => ({
            ...prev,
            fromSerial: updatedProducts[0]?.serial_no || fromSerial,
            toSerial: updatedProducts[updatedProducts.length - 1]?.serial_no || toSerial,
            quantity: updatedProducts.length,
        }));

        setErrors({});
        setIsAddDisabled(true);
    };

    const disableAdd = (() => {
        if (!form.fromSerial || !form.toSerial) return true;
        const prefix = form.fromSerial.match(/[^\d]+/)?.[0] || "";
        const start = parseInt(form.fromSerial.match(/\d+/)?.[0], 10);
        const end = parseInt(form.toSerial.match(/\d+/)?.[0], 10);

        for (let i = start; i <= end; i++) {
            const serial = `${prefix}${i.toString().padStart(6, "0")}`;
            if (products.some(p => p.serial_no === serial)) {
                return true;
            }
        }
        return false;
    })();

    const handleRowChange = (index, field, value) => {
        const updated = [...products];
        const globalIndex = products.findIndex(
            (p) => paginatedProducts.length > index && p.serial_no === paginatedProducts[index].serial_no
        );
        if (globalIndex === -1) return;
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
        const serialToDelete = products[globalIndex]?.serial_no;

        MySwal.fire({
            title: "Are you sure?",
            text: `You are about to delete serial ${serialToDelete}. This action cannot be undone!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#2FA64F",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
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

                toast.success(`Serial ${serialToDelete} deleted!`);
                if (paginatedProducts.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            }
        });
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
                    .filter((v, i, a) => a.findIndex(t => t.serial_no === v.serial_no) === i)
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
            if (response.data.items && Array.isArray(response.data.items)) {
                const existsItems = response.data.items.filter(i => i.status === "exists");
                const notPurchasedItems = response.data.items.filter(i => i.status === "not_purchased");

                if (notPurchasedItems.length > 0) {
                    toast.error(
                        <div>
                            <strong>Some serials were not added</strong>
                            <ul className="mb-0 mt-1 small">
                                {notPurchasedItems.map((item, i) => (
                                    <li key={i}>
                                        Serial {item.serial_no}: {item.message}
                                    </li>
                                ))}
                            </ul>
                        </div>,
                        { autoClose: 8000 }
                    );
                } else if (existsItems.length > 0) {
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
        const textMatch =
            serialNo.includes(lowerCaseSearchTerm) ||
            testedBy.includes(lowerCaseSearchTerm) ||
            testedStatus.includes(lowerCaseSearchTerm);
        let serialMatch = true;
        if (fromSerialSearch && toSerialSearch) {
            const startNum = parseInt(fromSerialSearch.replace(/\D/g, ''), 10);
            const endNum = parseInt(toSerialSearch.replace(/\D/g, ''), 10);
            const productNum = parseInt(p.serial_no.replace(/\D/g, ''), 10);
            if (!isNaN(startNum) && !isNaN(endNum)) {
                serialMatch = productNum >= startNum && productNum <= endNum;
            }
        }
        if (searchTerm.trim() !== '' && (fromSerialSearch || toSerialSearch)) {
            return textMatch && serialMatch;
        } else if (searchTerm.trim() !== '') {
            return textMatch;
        } else if (fromSerialSearch || toSerialSearch) {
            return serialMatch;
        }
        return true;
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

    // Get prefix for serial validation
    const selectedProduct = productOptions.find(p => p.id === parseInt(form.product_id)) || {};
    const prefix = selectedProduct.serial_prefix || "";

    return (
        <Container className="main-container">
            <Row className="align-items-center mb-3 fixed-header">
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
                            <Form.Label>Select Product</Form.Label>
                            <Form.Select
                                name="product_id"
                                value={
                                    form.product_id && form.productType
                                        ? `${form.product_id}|${form.productType}`
                                        : ""
                                }
                                onChange={handleChange}
                                isInvalid={!!errors.product_id}
                            >
                                <option value="">Select Product</option>
                                {productTypes.map((pt) => (
                                    <option
                                        key={pt.product.id}
                                        value={`${pt.product.id}|${pt.id}`}
                                    >
                                        {pt.name} ({pt.product.name})
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
                            <Form.Control.Feedback type="invalid">
                                {errors.firmwareVersion}
                            </Form.Control.Feedback>
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
                            <RequiredLabel>From Serial</RequiredLabel>
                            <Form.Control
                                name="fromSerial"
                                value={form.fromSerial}
                                onChange={(e) => {
                                    let value = e.target.value.toUpperCase();

                                    if (prefix && value.startsWith(prefix)) {
                                        let digits = value.slice(prefix.length).replace(/\D/g, "");
                                        digits = digits.slice(0, 6);
                                        value = prefix + digits;
                                    } else if (prefix) {
                                        if (value.length > 0 && !value.startsWith(prefix)) {
                                            toast.error(`From Serial must start with "${prefix}"`);
                                        }
                                        value = value.slice(0, prefix.length);
                                    } else {
                                        value = value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
                                    }

                                    setForm(prev => ({ ...prev, fromSerial: value }));
                                    setErrors(prev => ({ ...prev, fromSerial: null }));
                                }}
                                onBlur={(e) => {
                                    const value = e.target.value; // ✅ use current value
                                    if (prefix && !value.startsWith(prefix)) {
                                        toast.error(`From Serial must start with "${prefix}"`);
                                    }
                                    if (prefix && value.slice(prefix.length).length !== 6) {
                                        toast.error("From Serial must have exactly 6 digits after the prefix.");
                                    }
                                }}
                                isInvalid={!!errors.fromSerial}
                            />


                            <Form.Control.Feedback type="invalid">
                                {errors.fromSerial}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <RequiredLabel>To Serial</RequiredLabel>
                            <Form.Control
                                name="toSerial"
                                value={form.toSerial}
                                onChange={(e) => {
                                    let value = e.target.value.toUpperCase();

                                    if (prefix && value.startsWith(prefix)) {
                                        let digits = value.slice(prefix.length).replace(/\D/g, "");
                                        digits = digits.slice(0, 6);
                                        value = prefix + digits;
                                    } else if (prefix) {
                                        if (value.length > 0 && !value.startsWith(prefix)) {
                                            toast.error(`To Serial must start with "${prefix}"`);
                                        }
                                        value = value.slice(0, prefix.length);
                                    } else {
                                        value = value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
                                    }

                                    setForm(prev => ({ ...prev, toSerial: value }));
                                    setErrors(prev => ({ ...prev, toSerial: null }));
                                }}
                                onBlur={() => {
                                    if (form.toSerial && prefix && !form.toSerial.startsWith(prefix)) {
                                        toast.error(`To Serial must start with "${prefix}"`);
                                    }
                                    if (form.toSerial && prefix && form.toSerial.slice(prefix.length).length !== 6) {
                                        toast.error("To Serial must have exactly 6 digits after the prefix.");
                                    }
                                }}
                                isInvalid={!!errors.toSerial}
                            />

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
                            <Form.Select
                                name="testedBy"
                                value={form.testedBy}
                                onChange={handleChange}
                                isInvalid={!!errors.testedBy}
                            >
                                <option value="">Select Technician</option>
                                {technicians.map((tech) => (
                                    <option key={tech.id} value={tech.name}>
                                        {tech.name}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.testedBy}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleAddProduct}
                            className="w-10"
                            disabled={isAddDisabled}
                        >
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
                        <Col md={9} className="d-flex justify-content-end align-items-center">
                            {serialSearchType === 'single' ? (
                                <></>
                            ) : (
                                <>
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
                        <Table className="table-sm align-middle mb-0 table-sm-custom align-middle-custom" style={{ fontSize: "0.85rem" }}>
                            <thead style={headerStyle.tableHeaderRow}>
                                <tr className="table-header-custom">
                                    <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
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
                                            <td className="text-center">{row.serial_no}</td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={row.tested_by}
                                                    onChange={(e) => handleRowChange(i, "tested_by", e.target.value)}
                                                />
                                            </td>
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
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={row.test_remarks}
                                                    onChange={(e) => handleRowChange(i, "test_remarks", e.target.value)}
                                                />
                                            </td>
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
                                style={{ width: "100px" }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </Form.Select>
                            <div className="d-flex align-items-center ms-3">
                                <span className="mx-2 text-muted small">Showing {paginationRange} of {filteredProducts.length}</span>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="me-1"
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
            {products.length > 0 && (
                <div className="d-flex justify-content-end mt-3 gap-2">
                    <Button
                        variant="secondary"
                        className="me-2"
                        onClick={() => {
                            // Add cancel logic if needed
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
