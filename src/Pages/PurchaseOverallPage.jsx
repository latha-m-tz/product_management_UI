import React, { useEffect, useState } from "react";
import api, { setAuthToken } from "../api";
import { Table, Spinner, Card, Button, Form } from "react-bootstrap";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";

export default function PurchaseOverallPage() {
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const location = useLocation();
  const selectedSparepartName = location.state?.sparepart_name || null;

  const isPCB =
    selectedSparepartName &&
    selectedSparepartName.toLowerCase().includes("pcb");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sparepart-purchases/overall");
      // Expect an array of objects with available_serials and available_quantity
      setStock(res.data || []);
    } catch (err) {
      toast.error("Failed to load overall stock data");
    } finally {
      setLoading(false);
    }
  };

  // Expand serial list to one row per serial number (but use available_serials when provided)
  const expandedStock = stock.flatMap((row) => {
    // if server returned available_serials (preferred)
    if (Array.isArray(row.available_serials) && row.available_serials.length > 0) {
      return row.available_serials.map((serial) => ({
        ...row,
        serial_number: serial,
        // set total_quantity to available count for display in non-PCB mode
        total_quantity: row.available_quantity ?? row.available_serials.length,
      }));
    }

    // fallback: if server returned from/to range (older clients)
    if (row.from_serial && row.to_serial) {
      const start = parseInt(row.from_serial);
      const end = parseInt(row.to_serial);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        let serials = [];
        for (let s = start; s <= end; s++) serials.push(s);
        return serials.map((serial) => ({
          ...row,
          serial_number: serial,
          total_quantity: row.purchased_quantity,
        }));
      }
    }

    // fallback: show one line with '-' serial and use available_quantity/purchased_quantity
    return [{
      ...row,
      serial_number: "-",
      total_quantity: row.available_quantity ?? row.purchased_quantity,
    }];
  });

  // PCB-specific filtering (coming from View Details)
  const filtered = selectedSparepartName
    ? expandedStock.filter(
      (item) => item.sparepart_name === selectedSparepartName
    )
    : expandedStock;

  // Search filter
  const searched = filtered.filter(
    (item) =>
      item.serial_number.toString().toLowerCase().includes(search.toLowerCase()) ||
      item.sparepart_name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const paginatedStock = searched.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
    fontSize: "0.82rem",
    height: "40px",
    verticalAlign: "middle",
  };

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="Overall Inventory Stock Summary" />

      <Card className="border-0 shadow-sm rounded-3 p-3 mt-2 bg-white">
        {/* Top Controls */}
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
                <option key={n}>{n}</option>
              ))}
            </Form.Select>

            <Button
              size="sm"
              className="ms-3"
              style={{ backgroundColor: "#2E3A59", borderColor: "#2E3A59" }}
              onClick={() => window.history.back()}
            >
              ← Back
            </Button>
          </div>

          <div className="col-md-6 text-md-end">
            <Search
              search={search}
              setSearch={setSearch}
              perPage={perPage}
              setPerPage={setPerPage}
              setPage={setPage}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
            <thead style={headerStyle}>
              <tr>
                <th style={{ width: "60px", textAlign: "center",backgroundColor:"#2E3A59" ,color:"white"}}>S.No</th>

                {isPCB ? (
                  <>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>
                      Sparepart
                    </th>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Serial Number</th>
                  </>
                ) : (
                  <>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Sparepart</th>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Total Qty</th>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Serial Number</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedStock.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No records"
                      style={{ width: "80px", opacity: 0.6 }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedStock.map((row, index) => (
                  <tr key={(row.sparepart_id || '') + '-' + index + '-' + row.serial_number}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>

                    {isPCB ? (
                      <>
                        <td>{row.sparepart_name}</td>
                        <td>{row.serial_number}</td>
                      </>
                    ) : (
                      <>
                        <td>{row.sparepart_name}</td>
                        <td>{row.total_quantity}</td>
                        <td>{row.serial_number}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={searched.length}
        />
      </Card>
    </div>
  );
}
