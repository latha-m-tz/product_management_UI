import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Spinner, Form, Button, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios";
import BreadCrumb from "../components/BreadCrumb";
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import { API_BASE_URL } from "../api";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ComponentsRequirement() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vciCount, setVciCount] = useState("");
  const [search, setSearch] = useState("");
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchSeriesList();
  }, []);

  useEffect(() => {
    if (selectedSeries) fetchSeriesData(selectedSeries);
  }, [selectedSeries]);

  const fetchSeriesList = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/product-types`);
      const seriesNames = res.data.map((item) => {
        const typeName = item.name || "";
        const productName = item.product?.name || "";
        return `${typeName}(${productName})`;
      });
      setSeriesList(seriesNames);
      if (seriesNames.length > 0) setSelectedSeries(seriesNames[0]);
    } catch (err) {
      toast.error("Failed to fetch series list!");
    }
  };

  const fetchSeriesData = async (series) => {
    if (!series) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/counts/${series}`);
      setData([res.data]);
    } catch (err) {
      toast.error("Failed to fetch spare parts data!");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filterParts = (parts) => {
    if (!parts) return [];
    const lower = search.toLowerCase();
    return parts.filter(
      (part) =>
        part.name.toLowerCase().includes(lower) ||
        part.available_quantity.toString().includes(lower) ||
        part.required_per_vci.toString().includes(lower)
    );
  };

  const combinedData = useMemo(() => {
    if (!data.length) return { commonParts: [], seriesPartsMap: {} };

    const commonPartsMap = {};
    const seriesPartsMap = {};

    data.forEach((seriesData) => {
      const seriesName = seriesData.series?.trim().toLowerCase() || "unknown";
      if (!seriesPartsMap[seriesName]) seriesPartsMap[seriesName] = [];

      seriesData.spare_parts.forEach((part) => {
        if (part.sparepart_usages === "common") {
          if (!commonPartsMap[part.name.toLowerCase()]) {
            commonPartsMap[part.name.toLowerCase()] = { ...part };
          } else {
            const existing = commonPartsMap[part.name.toLowerCase()];
            existing.purchased_quantity += part.purchased_quantity || 0;
            existing.used_quantity += part.used_quantity || 0;
            existing.available_quantity += part.available_quantity || 0;
          }
        } else {
          seriesPartsMap[seriesName].push(part);
        }
      });
    });

    return {
      commonParts: Object.values(commonPartsMap),
      seriesPartsMap,
    };
  }, [data]);

  const computePerVCI = (part) => part.required_per_vci || 0;
  const computeTotalRequired = (part) => (vciCount || 0) * computePerVCI(part);
  const computeShortage = (part) =>
    computeTotalRequired(part) - (part.available_quantity || 0);

  const maxVCIsPossible = useMemo(() => {
    let minVCIs = Infinity;
    combinedData.commonParts.forEach((part) => {
      const possible = Math.floor(
        (part.available_quantity || 0) / (part.required_per_vci || 1)
      );
      if (possible < minVCIs) minVCIs = possible;
    });
    Object.values(combinedData.seriesPartsMap).forEach((parts) =>
      parts.forEach((part) => {
        const possible = Math.floor(
          (part.available_quantity || 0) / (part.required_per_vci || 1)
        );
        if (possible < minVCIs) minVCIs = possible;
      })
    );
    return minVCIs === Infinity ? 0 : minVCIs;
  }, [combinedData]);

  const filteredCommonParts = useMemo(
    () => filterParts(combinedData.commonParts),
    [combinedData, search]
  );

  const filteredSeriesPartsMap = useMemo(() => {
    if (!combinedData.seriesPartsMap) return {};
    const map = {};
    Object.keys(combinedData.seriesPartsMap).forEach((seriesName) => {
      if (selectedSeries && seriesName !== selectedSeries.toLowerCase()) return;
      map[seriesName] = filterParts(combinedData.seriesPartsMap[seriesName]);
    });
    return map;
  }, [combinedData, search, selectedSeries]);

  const handleSort = (field) => {
    if (sortField === field)
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortParts = (parts) => {
    if (!sortField) return parts;
    return [...parts].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
    fontSize: "0.82rem",
    height: "40px",
    verticalAlign: "middle",
    cursor: "pointer",
  };

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="Spare Parts Requirement" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
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
                onClick={() => fetchSeriesData(selectedSeries)}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => navigate("/spare-parts")}
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
                + Add Spare Part
              </Button>
            </div>

            <div className="d-flex justify-content-end align-items-center">
              <Search
                search={search}
                setSearch={setSearch}
                perPage={perPage}
                setPerPage={setPerPage}
                setPage={setPage}
              />
            </div>
          </div>
        </div>

        {/* Input Filters */}
        <div className="row mb-3">
          <div className="col-md-4">
            <Form.Group>
              <Form.Label className="fw-semibold">How many products to make?</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g. 400"
                value={vciCount}
                onChange={(e) =>
                  setVciCount(e.target.value ? parseInt(e.target.value, 10) : "")
                }
              />
            </Form.Group>
          </div>
          <div className="col-md-4">
            <Form.Group>
              <Form.Label className="fw-semibold">Select Series</Form.Label>
              <Form.Select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
              >
                {seriesList.map((series, idx) => (
                  <option key={idx} value={series}>
                    {series}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          {maxVCIsPossible > 0 && (
            <div className="col-md-4 d-flex align-items-end justify-content-end">
              <span
                className="badge text-dark"
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  backgroundColor: "#f8f9fa",
                }}
              >
                Max VCIs Possible: {maxVCIsPossible}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <>
            {/* COMMON PARTS */}
            <div className="table-responsive mb-4">
              <h6 className="fw-bold mb-2 mt-3">Common Spare Parts</h6>
              <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th style={headerStyle}>S.No</th>
                    <th style={headerStyle} onClick={() => handleSort("name")}>
                      Spare Part Name{" "}
                      {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                    <th style={headerStyle}>Purchased Qty</th>
                    <th style={headerStyle}>Used Qty</th>
                    <th style={headerStyle}>Available Qty</th>
                    <th style={headerStyle}>Required / VCI</th>
                    <th style={headerStyle}>Total Required</th>
                    <th style={headerStyle}>Shortage</th>
                  </tr>
                </thead>
                <tbody>
                  {sortParts(filteredCommonParts)
                    .slice((page - 1) * perPage, page * perPage)
                    .map((part, idx) => (
                      <tr key={idx}>
                        <td>{(page - 1) * perPage + idx + 1}</td>
                        <td style={{ fontSize: "0.90rem" }}>{part.name}</td>
                        <td style={{ fontSize: "0.90rem" }}>{part.purchased_quantity}</td>
                        <td style={{ fontSize: "0.90rem" }}>{part.used_quantity}</td>
                        <td style={{ fontSize: "0.90rem" }}>{part.available_quantity}</td>
                        <td style={{ fontSize: "0.90rem" }}>{computePerVCI(part)}</td>
                        <td style={{ fontSize: "0.90rem" }}>{computeTotalRequired(part)}</td>
                        <td style={{ color: computeShortage(part) > 0 ? "red" : "green" }}>
                          {computeShortage(part) > 0 ? computeShortage(part) : "OK"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
              <Pagination
                page={page}
                setPage={setPage}
                perPage={perPage}
                totalEntries={filteredCommonParts.length}
              />
            </div>

            {/* SERIES PARTS */}
            {Object.keys(filteredSeriesPartsMap).map((seriesName) => {
              const parts = filteredSeriesPartsMap[seriesName];
              if (!parts.length) return null;

              return (
                <div key={seriesName} className="table-responsive mb-4">
                  <h6 className="fw-bold mb-2 mt-3 text-uppercase">
                    {seriesName} Spare Parts
                  </h6>
                  <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th style={headerStyle}>S.No</th>
                        <th style={headerStyle}>Spare Part Name</th>
                        <th style={headerStyle}>Purchased Qty</th>
                        <th style={headerStyle}>Used Qty</th>
                        <th style={headerStyle}>Available Qty</th>
                        <th style={headerStyle}>Required / VCI</th>
                        <th style={headerStyle}>Total Required</th>
                        <th style={headerStyle}>Shortage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortParts(parts)
                        .slice((page - 1) * perPage, page * perPage)
                        .map((part, idx) => (
                          <tr key={idx}>
                            <td>{(page - 1) * perPage + idx + 1}</td>
                            <td style={{ fontSize: "0.90rem" }}>{part.name}</td>
                            <td style={{ fontSize: "0.90rem" }}>{part.purchased_quantity}</td>
                            <td style={{ fontSize: "0.90rem" }}>{part.used_quantity}</td>
                            <td style={{ fontSize: "0.90rem" }}>{part.available_quantity}</td>
                            <td style={{ fontSize: "0.90rem" }}>{computePerVCI(part)}</td>
                            <td style={{ fontSize: "0.90rem" }}>{computeTotalRequired(part)}</td>
                            <td
                              style={{
                                color: computeShortage(part) > 0 ? "red" : "green",
                              }}
                            >
                              {computeShortage(part) > 0 ? computeShortage(part) : "OK"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                  <Pagination
                    page={page}
                    setPage={setPage}
                    perPage={perPage}
                    totalEntries={parts.length}
                  />
                </div>
              );
            })}
          </>
        )}
      </Card>
    </div>
  );
}
