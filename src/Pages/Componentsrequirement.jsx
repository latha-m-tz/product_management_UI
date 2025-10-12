import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Spinner, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../api";
import BreadCrumb from "../components/BreadCrumb";
import Search from "../components/Search";
import "bootstrap/dist/css/bootstrap.min.css";
import "datatables.net-dt/css/dataTables.dataTables.css";
import $ from "jquery";
import "datatables.net-dt";

const styles = {
  tableHeaderRow: {
    backgroundColor: "#2E3A59",
    color: "#2E3A59",
    fontSize: "0.82rem",
    height: "40px",
    verticalAlign: "middle",
  },
};

export default function ComponentsRequirement() {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [vciCount, setVciCount] = useState(0);
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");

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

  const selectedSeriesData = useMemo(() => {
    if (!selectedProduct) return null;
    return data.find((item) => item.series === selectedProduct);
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
    return parts;
  }, [selectedSeriesData, search]);

  /** Initialize DataTable */
  useEffect(() => {
    if (!tableRef.current) return;

    // Destroy old DataTable instance if exists
    if ($.fn.DataTable.isDataTable(tableRef.current)) {
      $(tableRef.current).DataTable().destroy();
    }

    // Rebuild DataTable when data changes
    if (getFilteredParts.length > 0) {
      $(tableRef.current).DataTable({
        paging: true,
        searching: false,
        info: false,
        ordering: true,
        autoWidth: false,
        pageLength: 10,
        order: [],
      });
    }
  }, [getFilteredParts]);

  return (
    <div className="p-4" style={{ fontSize: "0.85rem" }}>
      <BreadCrumb title="Spare Parts Requirement" />

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
                <option key={p.id} value={p.name}>
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
                setVciCount(parseInt(e.target.value, 10) || "")
              }
            />
          </Form.Group>

          <Form.Group style={{ minWidth: "250px" }}>
            <Form.Label className="fw-bold">Search Parts</Form.Label>
            <Search
              search={search}
              setSearch={setSearch}
              perPage={10}
              setPerPage={() => {}}
              setPage={() => {}}
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
            <table
              ref={tableRef}
              className="table table-sm align-middle mb-0"
              style={{ fontSize: "0.85rem" }}
            >
              <thead style={styles.tableHeaderRow}>
                <tr>
                  <th style={{ width: "50px", textAlign: "center" }}>S.NO</th>
                  <th>Spare Part Name</th>
                  <th>Available Qty</th>
                  <th>Required</th>
                  <th>Total Required</th>
                  <th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredParts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No parts found
                    </td>
                  </tr>
                ) : (
                  getFilteredParts.map((part, idx) => {
                    const totalRequired =
                      (part.required_per_vci || 0) * (vciCount || 0);
                    const shortage =
                      totalRequired - (part.available_quantity || 0);
                    return (
                      <tr key={idx}>
                        <td className="text-center text-muted">{idx + 1}</td>
                        <td>{part.name}</td>
                        <td>{part.available_quantity}</td>
                        <td>{part.required_per_vci}</td>
                        <td>{totalRequired || "-"}</td>
                        <td
                          style={{
                            color: shortage > 0 ? "red" : "green",
                          }}
                        >
                          {shortage > 0 ? shortage : "OK"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <p className="text-muted mt-4">
          Please select a product to view spare parts requirement.
        </p>
      )}
    </div>
  );
}
