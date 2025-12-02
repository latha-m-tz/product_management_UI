import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import api, { setAuthToken } from "../api";
import { Table, Button, Form, Card, Row, Col, Container } from "react-bootstrap";
import { IoArrowBack, IoTrashOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import '../index.css';
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
        // productType: "",
        product_id: "",
        firmwareVersion: "",
        testedBy: "",
        // quantity: "",
        fromSerial: "",
        toSerial: "",
        testedDate: "",
    });

    const [allProducts, setAllProducts] = useState([]);
    const [errors, setErrors] = useState({});
    const [productTypes, setProductTypes] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const navigate = useNavigate();
    const [checkedForDelete, setCheckedForDelete] = useState({});
    const [users, setUsers] = useState([]);



    const MySwal = withReactContent(Swal);

    const RequiredLabel = ({ children }) => (
        <Form.Label>
            {children}
            <span style={{ color: "red" }}> *</span>
        </Form.Label>
    );
    const [serialSearchType, setSerialSearchType] = useState('single');
    const [fromSerialSearch, setFromSerialSearch] = useState('');
    const [toSerialSearch, setToSerialSearch] = useState('');
    const [isAddDisabled, setIsAddDisabled] = useState(false);
    useEffect(() => {
        const loggedInName = localStorage.getItem("authName");
        if (loggedInName) {
            setForm(prev => ({ ...prev, testedBy: loggedInName }));
        }
    }, []);
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (token) {
            setAuthToken(token);
        }
    }, []);

    useEffect(() => {
        api.get("/product")
            .then(res => setAllProducts(res.data))
            .catch(err => console.error("Error fetching products:", err));
    }, []);
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get("/users");
                setUsers(res.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get("/users");
                setUsers(res.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        setForm((prev) => ({
            ...prev,
            testedDate: prev.testedDate || today,
        }));
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
        api.get("/product-types")
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



    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "testedDate") {
            const year = value.split("-")[0];
            if (year.length > 4) {
                return;
            }
        }
        if (name === "product_id") {
            const [productId] = value.split("|");
            setForm((prev) => ({
                ...prev,
                product_id: productId || "",
            }));
            setErrors((prev) => ({ ...prev, product_id: null }));
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }));
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
        setIsAddDisabled(false);
    };
    // const duplicateSerials = serialsToAdd.filter(s => 
    //     products.some(p => p.serial_no === s)
    // );

    // if (duplicateSerials.length > 0) {
    //     toast.error(`Serial(s) ${duplicateSerials.join(", ")} already exists in the list.`);
    //     return;
    // }


    const handleAddProduct = async () => {
        const { fromSerial, toSerial, testedBy, product_id } = form;
        let newErrors = {};

        if (!product_id) newErrors.product_id = "Product is required.";
        if (!fromSerial) newErrors.fromSerial = "From Serial is required.";
        if (!toSerial) newErrors.toSerial = "To Serial is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const selectedProduct = productOptions.find(
            (p) => p.id === parseInt(product_id)
        ) || {};

        const prefix = selectedProduct.serial_prefix || "";
        let serialsToAdd = [];
        const isRange = toSerial && fromSerial !== toSerial;

        // 🔹 Build serial range
        if (isRange) {
            const fromDigits = fromSerial.replace(prefix, "").replace(/\D/g, "");
            const toDigits = toSerial.replace(prefix, "").replace(/\D/g, "");

            const startNum = parseInt(fromDigits, 10);
            const endNum = parseInt(toDigits, 10);

            if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
                toast.error("Invalid serial range! 'From Serial' must be <= 'To Serial'.");
                return;
            }

            for (let i = startNum; i <= endNum; i++) {
                serialsToAdd.push(`${prefix}${i.toString().padStart(6, "0")}`);
            }
        } else {
            serialsToAdd.push(fromSerial.trim().toUpperCase());
        }

        // 🔹 Local duplicates
        const duplicateSerials = serialsToAdd.filter(s =>
            products.some(p => p.serial_no === s)
        );

        if (duplicateSerials.length > 0) {
            toast.error(`Serial(s) ${duplicateSerials.join(", ")} already exists in the list.`);
            serialsToAdd = serialsToAdd.filter(s => !duplicateSerials.includes(s));
            if (serialsToAdd.length === 0) return;
        }

        try {
            const checkRes = await api.post("/check-serials-purchased", {
                product_id: parseInt(product_id),
                serials: serialsToAdd,
            });

            // ✅ SHOW SHORTAGES FIRST
            const shortages = checkRes.data.sparepart_shortages || [];

            if (shortages.length > 0) {
                let msg = "❌ Cannot add products due to sparepart shortages:\n";

                shortages.forEach(s => {
                    msg += `\n⚠ ${s.sparepart_name}\n   Required: ${s.required}\n   Available: ${s.available}\n   Short by: ${s.shortage}\n`;
                });

                toast.error(msg, {
                    autoClose: 9000,
                    style: { whiteSpace: "pre-line" }
                });

                return;  // ⛔ STOP processing
            }


            // 🔥 2. SERIAL VALIDATION
            const validation = checkRes.data.serial_validation || {};
            const purchasedSerials = validation.purchased || [];
            const notPurchasedSerials = validation.not_purchased || [];
            const items = validation.items || [];

            const existsSerials = items
                .filter(i => i.status === "exists")
                .map(i => i.serial_no);

            if (existsSerials.length > 0) {
                toast.info(`Serial(s) ${existsSerials.join(", ")} already exist in inventory.`);
            }

            if (notPurchasedSerials.length > 0) {
                toast.error(`Serial(s) ${notPurchasedSerials.join(", ")} are not purchased.`);
            }

            const validSerials = purchasedSerials.filter(
                s => !existsSerials.includes(s)
            );

            if (validSerials.length === 0) return;

            // 🔥 3. ADD TO TABLE
            const newProducts = validSerials.map(s => ({
                serial_no: s,
                tested_by: testedBy,
                tested_status: ["PASS"],
                test_remarks: "",
                from_serial: fromSerial,
                to_serial: toSerial || s,
            }));

            setProducts([...products, ...newProducts]);
            setForm(prev => ({ ...prev, fromSerial: "", toSerial: "" }));
            toast.success(`${newProducts.length} serial(s) added.`);

        } catch (error) {
            console.error("Error checking serials:", error);
            toast.error(error.response?.data?.message || "Error checking serials.");
        }
    };


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

                // 🔹 Remove the serial
                const updated = products.filter((_, i) => i !== globalIndex);
                setProducts(updated);

                // 🔹 DO NOT MODIFY fromSerial / toSerial AT ALL
                setForm(prev => ({
                    ...prev,
                    // leave fromSerial & toSerial untouched
                }));

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

            // Prepare payload to check purchase status first
            const serialsToCheck = products.map(p => p.serial_no);

            const checkPayload = {
                product_id: parseInt(form.product_id, 10),
                serials: serialsToCheck,
            };

            // ✅ Call API to check if serials are purchased
            const checkRes = await api.post("/check-serials-purchased", checkPayload);

const purchasedSerials =
    checkRes.data.serial_validation?.purchased || [];

const notPurchasedSerials =
    checkRes.data.serial_validation?.not_purchased || [];

            if (notPurchasedSerials.length > 0) {
                toast.error(
                    `Serial(s) ${notPurchasedSerials.join(", ")} are not purchased. Only purchased serials can be added.`,
                    { autoClose: 8000 }
                );
            }

            if (purchasedSerials.length === 0) {
                toast.error("No purchased serials to save.");
                return;
            }

            // Filter products to only include purchased serials
            const productsToSave = products.filter(p => purchasedSerials.includes(p.serial_no));

            const payload = {
                product_id: parseInt(form.product_id, 10),
                firmware_version: form.firmwareVersion,
                tested_date: form.testedDate,
                items: productsToSave.map(p => ({
                    serial_no: p.serial_no,
                    tested_by: p.tested_by || null,
                    tested_status: Array.isArray(p.tested_status)
                        ? p.tested_status.join(",")
                        : p.tested_status || "PASS",
                    test_remarks: p.test_remarks || "",
                    from_serial: p.from_serial,
                    to_serial: p.to_serial,
                    tested_date: form.testedDate,
                })),
            };

            // ✅ Save purchased serials to inventory
            const response = await api.post("/inventory", payload);

            toast.success(response.data.message || "Inventory saved successfully!");
            navigate("/assemble");

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error saving inventory. Please try again.");
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
            <Row className="align-items-center mb-3">
                <Col>
                    <h4>Add New Assemble</h4>
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
                {/* <div className="qr-scanner-button" onClick={() => setShowQrScanner(true)}>
                    <div className="qr-scanner-icon-container">
                        <FaQrcode />
                    </div>
                    <span className="qr-scanner-text">QR code scanner</span>
                </div> */}
                <Row className="mb-3 g-3">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Select Product  <span style={{ color: "red" }}>*</span>
                            </Form.Label>
                            <Form.Select
                                name="product_id"
                                value={form.product_id || ""}
                                onChange={handleChange}
                                isInvalid={!!errors.product_id}
                            >
                                <option value="">Select Product</option>
                                {allProducts.map((p) => (
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
                            <RequiredLabel>From Serial</RequiredLabel>
                            <Form.Control
                                name="fromSerial"
                                value={form.fromSerial}
                                placeholder="Enter Serial"
                                onChange={(e) => {
                                    let value = e.target.value.toUpperCase();

                                    if (prefix && value.startsWith(prefix)) {
                                        let digits = value.slice(prefix.length).replace(/\D/g, "").slice(0, 6);
                                        value = prefix + digits;
                                    } else if (prefix) {
                                        if (value.length > 0 && !value.startsWith(prefix)) {
                                            toast.error(`Serial must start with "${prefix}"`);
                                        }
                                        value = value.slice(0, prefix.length);
                                    } else {
                                        value = value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
                                    }

                                    setForm(prev => ({
                                        ...prev,
                                        fromSerial: value,
                                        toSerial: (!prev.toSerial || prev.toSerial === prev.fromSerial) ? value : prev.toSerial
                                    }));
                                    setErrors(prev => ({ ...prev, fromSerial: null }));
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
                                placeholder="Enter Serial"
                                onChange={(e) => {
                                    let value = e.target.value.toUpperCase();

                                    if (prefix && value.startsWith(prefix)) {
                                        let digits = value.slice(prefix.length).replace(/\D/g, "").slice(0, 6);
                                        value = prefix + digits;
                                    } else if (prefix) {
                                        if (value.length > 0 && !value.startsWith(prefix)) {
                                            toast.error(`Serial must start with "${prefix}"`);
                                        }
                                        value = value.slice(0, prefix.length);
                                    } else {
                                        value = value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
                                    }

                                    setForm(prev => ({ ...prev, toSerial: value }));
                                }}
                            // isInvalid={!!errors.toSerial}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.toSerial}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>


                <Row className="mb-3 g-3">
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
                            <RequiredLabel>Tested By</RequiredLabel>
                            <Form.Select
                                name="testedBy"
                                value={form.testedBy}
                                onChange={(e) => setForm({ ...form, testedBy: e.target.value })}
                            >
                                <option value="">Select tester</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.username}>
                                        {user.username}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                    </Col>

                </Row>

                <Row className="mb-3">
                    <Col md={2}>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleAddProduct}
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
                            <Col className="w-100">
                                <div className="search-input-wrapper w-100">
                                    <Form.Control
                                        className="w-100"
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

                            {/* <Col md={3}>
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
                            </Col> */}
                            {/* <Col md={3}>
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
                            </Col> */}
                            <Col md={2}>
                                {/* <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={handleDeleteRange}
                                    disabled={!fromSerialSearch || !toSerialSearch}
                                >
                                    <IoTrashOutline />
                                </Button> */}
                            </Col>
                        </Row>
                        <Col md={9} className="d-flex justify-content-end align-items-center">
                            {serialSearchType === 'single' ? (
                                <></>
                            ) : (
                                <>

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
                                                <Form.Select
                                                    size="sm"
                                                    value={row.tested_by}
                                                    onChange={(e) => handleRowChange(i, "tested_by", e.target.value)}
                                                >
                                                    <option value="">Select tester</option>
                                                    {users.map((user) => (
                                                        <option key={user.id} value={user.username}>
                                                            {user.username}
                                                        </option>
                                                    ))}
                                                </Form.Select>
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
                        }}
                    >
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleSubmit}>
                        Save
                    </Button>
                </div>
            )}
            {/* <QrScannerPage show={showQrScanner} onClose={() => setShowQrScanner(false)} onScanSuccess={handleScan} /> */}
        </Container>
    );
}


