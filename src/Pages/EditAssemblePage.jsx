import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Card,
  Row,
  Col,
  Container,
  Spinner,
} from "react-bootstrap";
import {
  IoArrowBack,
  IoTrashOutline,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaQrcode } from "react-icons/fa";
import "../index.css";
import { API_BASE_URL } from "../api";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";
import DatePicker from "../components/DatePicker";
import QrScannerPage from "./QrScannerPage";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";


export default function EditAssemblePage() {
  const { fromSerial: routeFromSerial, toSerial: routeToSerial } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    // productType: "",
    product_id: "",
    firmwareVersion: "",
    testedBy: "",
    quantity: "",
    fromSerial: "",
    toSerial: "",
    testedDate: "",
  });

  // const [productTypes, setProductTypes] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);

  const itemsPerPage = 10;
  const MySwal = withReactContent(Swal);
  const [editingSerials, setEditingSerials] = useState({});
  const getProductPrefix = (productName) => {
    const match = productName.match(/^(\d+)/);
    return match ? match[1] : "";
  };
  const [serialSearchType, setSerialSearchType] = useState('single'); // 'single' or 'range'

  const validateSerialMatchesProduct = (serial, productName) => {
    const prefix = getProductPrefix(productName);
    return serial.startsWith(prefix);
  };


  const [searchTerm, setSearchTerm] = useState("");
  const [deleteFrom, setDeleteFrom] = useState("");
  const [deleteTo, setDeleteTo] = useState("");
  const filteredProducts = products.filter((p) => {
    const serialNum = parseInt(String(p.serial_no || "").match(/\d+/)?.[0] ?? 0, 10);

    const fromNum = deleteFrom ? parseInt(deleteFrom.match(/\d+/)?.[0], 10) : null;
    const toNum = deleteTo ? parseInt(deleteTo.match(/\d+/)?.[0], 10) : null;
    const selectedProduct = allProducts.find(p => p.id === parseInt(form.product_id)) || {};
    const prefix = selectedProduct.serial_prefix || "";

    const matchesSerialRange =
      (fromNum === null || serialNum >= fromNum) &&
      (toNum === null || serialNum <= toNum);

    const matchesSearchTerm = searchTerm
      ? String(p.serial_no || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(p.tested_by || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      : true;

    return matchesSerialRange && matchesSearchTerm;
  });



  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirst, indexOfLast);
  const [selectedSerials, setSelectedSerials] = useState({});

  // Delete range


  const [showQrScanner, setShowQrScanner] = useState(false);
  const [errors, setErrors] = useState({});
  const headerStyle = {
    headerBackground: "#f8f9fa",
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
  const handleDeleteBySerial = (serial_no) => {
    MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = products.filter((p) => p.serial_no !== serial_no);

        // Recalculate range
        if (updated.length > 0) {
          const serials = updated.map((p) => p.serial_no).sort();
          setForm((prev) => ({
            ...prev,
            fromSerial: serials[0],
            toSerial: serials[serials.length - 1],
            quantity: updated.length,
          }));
        } else {
          setForm((prev) => ({ ...prev, fromSerial: "", toSerial: "", quantity: 0 }));
        }

        setProducts(updated);
        toast.success(`Serial ${serial_no} deleted successfully!`);
      }
    });
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, productsRes, rangeRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/product-types`),
          axios.get(`${API_BASE_URL}/product`),
          axios.get(`${API_BASE_URL}/inventory/serialrange/${routeFromSerial}/${routeToSerial}`),
        ]);

        // setProductTypes(typesRes.data);
        setAllProducts(productsRes.data);

        const data = rangeRes.data;

        // Check if serials match product
        const productName = data.product?.name || "";
        if (!validateSerialMatchesProduct(data.from_serial, productName) ||
          !validateSerialMatchesProduct(data.to_serial, productName)) {
          toast.warning(`Serial numbers do not match the product series (${productName})!`);
        }

        // Continue as usual
        const formattedDate =
          data.tested_date
            ? new Date(data.tested_date).toISOString().split("T")[0]
            : data.items[0]?.tested_date
              ? new Date(data.items[0].tested_date).toISOString().split("T")[0]
              : "";

        setForm({
          // productType: data.product_type?.id || "",
          product_id: data.product?.id || "",
          firmwareVersion: data.firmware_version || "",
          testedBy: data.tested_by || data.items[0]?.tested_by || "",
          quantity: data.quantity || "",
          fromSerial: data.from_serial,
          toSerial: data.to_serial,
          testedDate: formattedDate,
        });

        const itemsWithRange = data.items.map((item) => ({
          ...item,
          from_serial: data.from_serial,
          to_serial: data.to_serial,
          quantity: 1,
          tested_status: item.tested_status ? [item.tested_status] : ["PENDING"],
        }));

        setProducts(itemsWithRange);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load inventory range!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeFromSerial, routeToSerial]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users`);
        setUsers(res.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    setSelectedSerials((prev) => {
      let changed = false;
      const updated = { ...prev };
      filteredProducts.forEach(p => {
        if (updated[p.serial_no] === undefined) {
          updated[p.serial_no] = true;   // 👈 this forces selection
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [filteredProducts]);


  const handleChange = (e) => {
    setErrors({ ...errors, [e.target.name]: "" });
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "testedBy") {
      const updated = products.map((p) => ({ ...p, tested_by: value }));
      setProducts(updated);
    }
  };
  const handleRowChange = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };





  const handleDeleteRange = () => {
    if (!deleteFrom || !deleteTo) {
      toast.error("Please provide both From and To serials for deletion.");
      return;
    }

    const prefixStart = deleteFrom.match(/[^\d]+/)?.[0] || "";
    const prefixEnd = deleteTo.match(/[^\d]+/)?.[0] || "";
    const startNum = parseInt(deleteFrom.match(/\d+/)?.[0], 10);
    const endNum = parseInt(deleteTo.match(/\d+/)?.[0], 10);

    if (prefixStart !== prefixEnd || isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
      toast.error("Invalid serial range for deletion.");
      return;
    }

    // Only consider currently filtered products
    const filteredSerialsToDelete = filteredProducts.filter((p) => {
      const num = parseInt(p.serial_no.match(/\d+/)?.[0], 10);
      return p.serial_no.startsWith(prefixStart) && num >= startNum && num <= endNum;
    }).map(p => p.serial_no);

    if (filteredSerialsToDelete.length === 0) {
      toast.info("No matching serials in the current filtered list.");
      return;
    }

    const updated = products.filter((p) => !filteredSerialsToDelete.includes(p.serial_no));

    setProducts(updated);
    toast.success(`Deleted serial numbers from ${deleteFrom} to ${deleteTo} (filtered list).`);
  };


  const handleAddProduct = () => {
    const { fromSerial, toSerial, testedBy } = form;


    if (!fromSerial) {
      toast.error("Please enter a Serial Number or Range.");
      return;
    }

    const prefix = fromSerial.match(/[^\d]+/)?.[0] || "";
    const fromNum = parseInt(fromSerial.match(/\d+/)?.[0], 10);
    const toNum = toSerial ? parseInt(toSerial.match(/\d+/)?.[0], 10) : fromNum;

    if (isNaN(fromNum) || isNaN(toNum)) {
      toast.error("Invalid serial number(s). Must end with digits.");
      return;
    }

    if (fromSerial.slice(prefix.length).length !== 6 || (toSerial && toSerial.slice(prefix.length).length !== 6)) {
      toast.error("Each serial must have exactly 6 digits after the prefix.");
      return;
    }

    if (prefix !== (toSerial?.match(/[^\d]+/)?.[0] || prefix)) {
      toast.error("From and To serials must have the same prefix.");
      return;
    }


    if (toSerial && fromNum > toNum) {
      toast.error("From Serial cannot be greater than To Serial.");
      return;
    }

    const newSerials = [];
    for (let i = fromNum; i <= toNum; i++) {
      const sn = `${prefix}${i.toString().padStart(6, "0")}`;
      newSerials.push(sn);
    }

    const existingSerials = new Set(products.map((p) => p.serial_no));
    const freshSerials = newSerials.filter((sn) => !existingSerials.has(sn));

    if (freshSerials.length === 0) {
      toast.info("All entered serials already exist in the list.");
      return;
    }

    const newProducts = freshSerials.map((sn) => ({
      serial_no: sn,
      tested_by: testedBy,
      tested_status: ["PENDING"],
      test_remarks: "",
      from_serial: fromSerial,
      to_serial: toSerial || fromSerial,
      quantity: 1,
    }));

    const updatedList = [...products, ...newProducts].sort((a, b) =>
      a.serial_no.localeCompare(b.serial_no)
    );

    setProducts(updatedList);
    setForm((prev) => ({
      ...prev,
      fromSerial: updatedList[0].serial_no,
      toSerial: updatedList[updatedList.length - 1].serial_no,
      quantity: updatedList.length,
    }));

    toast.success(`${freshSerials.length} product(s) added successfully!`);
  };

  const handleDeleteSelected = () => {
    const serialsToDelete = currentItems
      .filter(p => selectedSerials[p.serial_no])
      .map(p => p.serial_no);

    if (serialsToDelete.length === 0) {
      toast.info("No serials selected for deletion.");
      return;
    }

    MySwal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${serialsToDelete.length} serial(s)!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete them!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedProducts = products.filter(p => !serialsToDelete.includes(p.serial_no));
        setProducts(updatedProducts);

        const newSelected = { ...selectedSerials };
        serialsToDelete.forEach(sn => delete newSelected[sn]);
        setSelectedSerials(newSelected);

        toast.success(`${serialsToDelete.length} product(s) deleted successfully!`);
      }
    });
  };


  const handleScan = (serialNumber) => {
    setShowQrScanner(false);
    if (!serialNumber) {
      toast.error("Failed to scan QR code.");
      return;
    }

    if (!form.testedBy) {
      setErrors({ ...errors, testedBy: "Tested By is required to add a serial." });
      toast.error("Please fill in the 'Tested By' field first.");
      return;
    }

    const existingProductIndex = products.findIndex((p) => p.serial_no === serialNumber);

    if (existingProductIndex === -1) {
      const newProduct = {
        serial_no: serialNumber,
        tested_by: form.testedBy,
        tested_status: ["PASS"],
        test_remarks: "",
        from_serial: form.fromSerial,
        to_serial: form.toSerial,
        quantity: 1,
      };

      const updatedProducts = [...products, newProduct].sort((a, b) =>
        a.serial_no.localeCompare(b.serial_no)
      );
      setProducts(updatedProducts);

      setForm((prev) => ({
        ...prev,
        fromSerial: updatedProducts[0].serial_no,
        toSerial: updatedProducts[updatedProducts.length - 1].serial_no,
        quantity: updatedProducts.length,
      }));

      toast.success(`Serial number ${serialNumber} added to the list.`);
    } else {
      toast.info(`Serial number ${serialNumber} is already in the list.`);
    }
  };


  const handleSubmit = async () => {
    if (!form.product_id) {
      toast.error("Please select a Product.");
      return;
    }

    if (products.length === 0) {
      toast.error("The product list cannot be empty.");
      return;
    }

    try {
      const payload = {
        product_id: parseInt(form.product_id, 10),
        // product_type_id: parseInt(form.productType, 10),
        firmware_version: form.firmwareVersion || "",
        tested_date: form.testedDate || new Date().toISOString().split("T")[0],
        tested_by: form.testedBy || "",
        items: products.map((p) => ({
          serial_no: String(p.serial_no || ""), // ✅ Force string
          tested_by: p.tested_by || "",
          tested_status:
            Array.isArray(p.tested_status) && p.tested_status.length > 0
              ? p.tested_status[0]
              : "PENDING",
          tested_date:
            p.tested_date || form.testedDate || new Date().toISOString().split("T")[0],
          from_serial: String(form.fromSerial || ""), // ✅ Also ensure strings
          to_serial: String(form.toSerial || ""),
          quantity: p.quantity || 1,
          test_remarks: p.test_remarks || "",
        })),
      };


      const response = await axios.put(
        `${API_BASE_URL}/inventory/serialrange/${routeFromSerial}/${routeToSerial}`,
        payload
      );

      if (response.status === 200) {
        toast.success("Inventory updated successfully!");
        setTimeout(() => {
          navigate("/assemble");
        }, 1000);
      } else {
        toast.error("Failed to update inventory.");
      }

    } catch (err) {
      console.error(err.response?.data || err);
      const errorMessage = err.response?.data?.message || "Error updating inventory.";
      toast.error(errorMessage);
    }
  };


  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="main-container">
      {/* 🧭 Header */}
      <Row className="align-items-center mb-3">
        <Col>
          <h4>Edit New Assemble</h4>
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

      {/* 🧩 Product Details Card */}
      <Card
        className="p-4 mb-3"
        style={{ position: "relative", backgroundColor: "rgb(244, 244, 248)" }}
      >
        <h5 className="mb-4">Product Details</h5>

        {/* QR Scanner */}
        {/* <div className="qr-scanner-button" onClick={() => setShowQrScanner(true)}>
          <div className="qr-scanner-icon-container">
            <FaQrcode />
          </div>
          <span className="qr-scanner-text">QR code scanner</span>
        </div> */}

        {/* Product Type / Product / Firmware */}
        {/* 🧩 Product & Serial Fields */}
        <Row className="mb-3 g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Product</Form.Label>
              <Form.Select
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
              >
                <option value="">Select Product</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}  {/* Only show product name, no type */}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>From Serial</Form.Label>
              <Form.Control
                type="text"
                name="fromSerial"
                value={form.fromSerial}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

                  // Validate: first 6 characters must be digits
                  const firstSix = value.slice(0, 6);
                  const rest = value.slice(6);

                  if (!/^\d{0,6}$/.test(firstSix)) {
                    return; // stop if first six aren't digits
                  }

                  const sanitized = firstSix + rest.replace(/[^A-Z]/g, "");

                  setForm((prev) => ({
                    ...prev,
                    fromSerial: sanitized,
                    toSerial:
                      !prev.toSerial || prev.toSerial === prev.fromSerial
                        ? sanitized
                        : prev.toSerial,
                  }));
                }}
                placeholder="Enter From Serial"
                maxLength={10}
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>To Serial</Form.Label>
              <Form.Control
                type="text"
                name="toSerial"
                value={form.toSerial}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

                  const firstSix = value.slice(0, 6);
                  const rest = value.slice(6);

                  if (!/^\d{0,6}$/.test(firstSix)) {
                    return;
                  }

                  const sanitized = firstSix + rest.replace(/[^A-Z]/g, "");

                  setForm((prev) => ({ ...prev, toSerial: sanitized }));
                }}
                placeholder="Enter To Serial"
                maxLength={10}
              />
            </Form.Group>
          </Col>

        </Row>

        {/* 🧩 Firmware / Tested Date / Tested By */}
        <Row className="mb-3 g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Firmware Version</Form.Label>
              <Form.Control
                name="firmwareVersion"
                value={form.firmwareVersion}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>Tested Date</Form.Label>
              <Form.Control
                type="date"
                name="testedDate"
                value={
                  form.testedDate ||
                  new Date().toISOString().split("T")[0] // default today
                }
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Tested By</Form.Label>
              <Form.Select
                name="testedBy"
                value={form.testedBy || localStorage.getItem("authName") || ""}
                onChange={handleChange}
              >
                <option value="">Select</option>
                {users.map((user) => (
                  <option key={user.id} value={user.name || user.username}>
                    {user.name || user.username}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2} className="d-flex align-items-end">
            <Button variant="success" onClick={handleAddProduct} className="w-100">
              Add product
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Search & Delete Range Controls */}
      <Row className="mb-3">
        <Col md={4}>
          <div className="search-input-wrapper">
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
                {/* {searchTerm && (
               <i
                 className="bi bi-x search-clear-icon"
                 onClick={() => {
                   setSearchTerm("");
                   setCurrentPage(1);
                 }}
               />
             )} */}
              </div>
            </Col>
            {searchTerm && (
              <span
                className="search-clear-icon"
                onClick={() => setSearchTerm('')}
              >
                &times;
              </span>
            )}
          </div>
        </Col>
        <Col md={3}>
          <div className="search-input-wrapper">
            <Form.Control
              placeholder="Delete From Serial"
              value={deleteFrom}
              onChange={(e) => setDeleteFrom(e.target.value)}
            />
            {deleteFrom && (
              <i
                className="bi bi-x search-clear-icon"
                onClick={() => setDeleteFrom("")}
              />
            )}
          </div>
        </Col>

        <Col md={3}>
          <div className="search-input-wrapper">
            <Form.Control
              placeholder="Delete To Serial"
              value={deleteTo}
              onChange={(e) => setDeleteTo(e.target.value)}
            />
            {deleteTo && (
              <i
                className="bi bi-x search-clear-icon"
                onClick={() => setDeleteTo("")}
              />
            )}
          </div>
        </Col>

        <Col md={2}>
          <Button
            variant="danger"
            onClick={handleDeleteSelected}
            className="d-flex justify-content-center align-items-center"
          >
            <IoTrashOutline />
          </Button>

        </Col>
      </Row>


      <Card>
        <Card.Body style={headerStyle.contentArea}>
          <h5 className="mb-3">Product List</h5>
          <Table bordered hover responsive size="sm">
            <thead style={headerStyle.tableHeaderRow}>
              <tr>
                <th>Select</th>

                <th>Serial No</th>
                <th>Tested By</th>
                <th>Test Status</th>
                <th>Test Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((product, idx) => {
                  const absoluteIndex = indexOfFirst + idx; // absolute index in products
                  return (
                    <tr key={product.serial_no}>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={!!selectedSerials[product.serial_no]}
                          className="custom-checkbox-color"

                          onChange={(e) =>
                            setSelectedSerials((prev) => ({
                              ...prev,
                              [product.serial_no]: e.target.checked,
                            }))
                          }
                        />
                      </td>

                      <td>
                        <Form.Control
                          type="text"
                          value={editingSerials[product.serial_no] ?? product.serial_no}
                          onChange={(e) =>
                            setEditingSerials((prev) => ({
                              ...prev,
                              [product.serial_no]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              // Save changes to products array
                              const newSerial = editingSerials[product.serial_no];
                              handleRowChange(absoluteIndex, "serial_no", newSerial);

                              // Optional: clear temporary state
                              setEditingSerials((prev) => {
                                const updated = { ...prev };
                                delete updated[product.serial_no];
                                return updated;
                              });

                              toast.success(`Serial updated to ${newSerial}`);
                            }
                          }}
                        />
                      </td>

                      <td>
                        <Form.Select
                          value={product.tested_by || ""}
                          onChange={(e) =>
                            handleRowChange(absoluteIndex, "tested_by", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.name || user.username}>
                              {user.name || user.username}
                            </option>
                          ))}
                        </Form.Select>
                      </td>


                      <td>
                        <Form.Check
                          inline
                          label="Pass"
                          type="checkbox"
                          checked={product.tested_status?.includes("PASS")}
                          className="custom-checkbox-color"
                          onChange={(e) => {
                            handleRowChange(
                              absoluteIndex,
                              "tested_status",
                              e.target.checked ? ["PASS"] : ["PENDING"]
                            );
                          }}
                        />
                        <Form.Check
                          inline
                          label="Fail"
                          type="checkbox"
                          checked={product.tested_status?.includes("FAIL")}
                          className="custom-checkbox-color"

                          onChange={(e) => {
                            handleRowChange(
                              absoluteIndex,
                              "tested_status",
                              e.target.checked ? ["FAIL"] : ["PENDING"]
                            );
                          }}
                        />
                      </td>

                      <td>
                        <Form.Control
                          type="text"
                          value={product.test_remarks || ""}
                          onChange={(e) =>
                            handleRowChange(absoluteIndex, "test_remarks", e.target.value)
                          }
                        />
                      </td>

                      <td className="text-center">
                        <IoTrashOutline
                          style={headerStyle.actionIcon}
                          onClick={() => handleDeleteBySerial(product.serial_no)}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No products added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <Button variant="outline-black" size="sm" onClick={prevPage} disabled={currentPage === 1}>
              <IoChevronBack /> Prev
            </Button>
            <span>
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline-black"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Next <IoChevronForward />
            </Button>
          </div>
        </Card.Body>
      </Card>

      <div className="text-end mt-3">
        <Button variant="success" onClick={handleSubmit}>
          update
        </Button>
      </div>

      {/* <QrScannerPage
        show={showQrScanner}                // passes the visibility state
        onScanSuccess={handleScan}          // passes your scan handler
        onClose={() => setShowQrScanner(false)} // closes the modal
      /> */}
    </Container>
  );
}
