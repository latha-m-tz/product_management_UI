import React, { useEffect, useState } from "react";
import api, { setAuthToken } from "../api";
import { Table, Spinner, Card, Button, Form, Col } from "react-bootstrap";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

export default function PurchaseOverallPage() {
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
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
      setStock(res.data || []);
    } catch (err) {
      toast.error("Failed to load overall stock data");
    } finally {
      setLoading(false);
    }
  };
  const expanded = stock.flatMap((row) => {
    if (row.available_serials && row.available_serials.length > 0) {
      return row.available_serials.map((x) => ({
        sparepart_id: row.sparepart_id,
        sparepart_name: row.sparepart_name,
        serial: x.serial,
        in_service: x.in_service,
        isSerialBased: true,
      }));
    }

    // ✅ Quantity-based spareparts
    return [
      {
        sparepart_id: row.sparepart_id,
        sparepart_name: row.sparepart_name,
        isSerialBased: false,
        available_quantity: row.available_quantity,
        service_quantity: row.service_quantity,
      },
    ];
  });



  const filtered = selectedSparepartName
    ? expanded.filter((item) => item.sparepart_name === selectedSparepartName)
    : expanded;

  const searched = filtered.filter((item) => {
    return (
      item.sparepart_name.toLowerCase().includes(search.toLowerCase()) ||
      (item.serial || "").toString().toLowerCase().includes(search.toLowerCase())
    );
  });

  const paginated = searched.slice((page - 1) * perPage, page * perPage);

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
        {/* Controls */}
        <div className="row mb-2">
          {/* LEFT SIDE: Records Per Page */}
          <div className="col-md-6 d-flex align-items-center">
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
          </div>

          {/* RIGHT SIDE: BACK BUTTON + SEARCH */}
          <div className="col-md-6 d-flex justify-content-end align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left"></i> Back
            </Button>

            <Search search={search} setSearch={setSearch} setPage={setPage} />
          </div>
        </div>


        {/* Table */}
        <div className="table-responsive">
          <Table
            className="table-sm align-middle mb-0"
            style={{ fontSize: "0.85rem" }}
          >
            <thead style={headerStyle}>
              <tr>
                <th style={{ width: "60px", textAlign: "center", backgroundColor: "#2E3A59", color: "white" }}>S.No</th>

                {expanded.some(i => i.isSerialBased) ? (
                  <>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Sparepart</th>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Serial Number</th>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Status</th>
                  </>
                ) : (
                  <>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Sparepart</th>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Available Qty</th>
                    <th style={{ backgroundColor: "#2E3A59", color: "white" }}>Qty In Service</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginated.map((row, index) => (
                  <tr key={index}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>

                    {row.isSerialBased ? (
                      <>
                        <td>{row.sparepart_name}</td>
                        <td>{row.serial}</td>
                        <td>
                          {row.in_service ? (
                            <span className="badge bg-warning text-dark">
                              In Service
                            </span>
                          ) : (
                            <span className="badge bg-success">Available</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{row.sparepart_name}</td>
                        <td>{row.available_quantity}</td>
                        <td>{row.service_quantity}</td>
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
