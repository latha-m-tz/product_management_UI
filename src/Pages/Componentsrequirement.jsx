import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Card, Row, Col, Table, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import BreadCrumb from "../components/BreadCrumb";
import Search from "../components/Search";
import api, { setAuthToken } from "../api";
import "bootstrap/dist/css/bootstrap.min.css";
import { downloadShortageExcel } from "../Pages/downloadShortageExcel";

export default function ComponentsRequirement() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [vciCounts, setVciCounts] = useState({});

  const [labelToSeriesMap, setLabelToSeriesMap] = useState({});

  const calculatedSeriesData = useMemo(() => {
    const remainingMap = {};

    return data.map((seriesData) => {
      const updatedParts = seriesData.spare_parts.map((part) => {
        const partKey = part.name.toLowerCase();
        const availableQty = remainingMap[partKey] ?? part.available_quantity ?? 0;

        const totalRequired =
          (vciCounts[seriesData.series] || 0) * (part.required_per_vci || 1);
        const shortage = totalRequired > availableQty ? totalRequired - availableQty : 0;
        const remaining = Math.max(availableQty - totalRequired, 0);

        remainingMap[partKey] = remaining;

        return {
          ...part,
          totalRequired,
          shortage,
          effectiveAvailable: availableQty,
        };
      });

      return { ...seriesData, spare_parts: updatedParts };
    });
  }, [data, vciCounts]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
    fetchSeriesList();
  }, []);

  const fetchSeriesList = async () => {
    try {
      const res = await api.get("/product");
      const labelMap = {};
      const seriesNames = res.data.map((item) => {
        const label = `${item.name}`;
        labelMap[label] = item.name;
        return label;
      });
      setSeriesList(seriesNames);
      setLabelToSeriesMap(labelMap);
    } catch (err) {
      toast.error("Failed to fetch series list!");
    }
  };

  const fetchMultipleSeriesData = async (seriesArray) => {
    setLoading(true);
    try {
      const responses = await Promise.all(
        seriesArray.map((seriesLabel) =>
          api.get(`/products/series/${labelToSeriesMap[seriesLabel]}`)
        )
      );
      const combined = responses.map((res) => res.data);
      setData(combined);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch spare parts for selected series!");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSeries.length > 0) {
      fetchMultipleSeriesData(selectedSeries);
    } else {
      setData([]);
    }
  }, [selectedSeries]);

  const filterParts = (parts) => {
    if (!parts) return [];
    const lower = search.toLowerCase();
    return parts.filter(
      (part) =>
        part.name.toLowerCase().includes(lower) ||
        part.available_quantity?.toString().includes(lower) ||
        part.required_per_vci?.toString().includes(lower)
    );
  };
  const shortageOverview = useMemo(() => {
    const shortageMap = {};

    calculatedSeriesData.forEach((series) => {
      series.spare_parts.forEach((part) => {
        if (part.shortage > 0) {
          const key = part.name.toLowerCase();
          if (!shortageMap[key]) {
            shortageMap[key] = {
              name: part.name,
              totalShortage: 0,
            };
          }
          shortageMap[key].totalShortage += part.shortage;
        }
      });
    });

    return Object.values(shortageMap);
  }, [calculatedSeriesData]);

  // const filteredParts = useMemo(
  //   () => filterParts(data.flatMap((d) => d.spare_parts || [])),
  //   [data, search]
  // );

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
        {/* Filters */}
        <div className="row mb-3">
          <div className="col-md-6">
            <Form.Group>
              <Form.Label className="fw-semibold">
                How many products to make? (Per selected product)
              </Form.Label>
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  padding: "8px",
                  backgroundColor: "#fff",
                }}
              >
                {seriesList.map((label, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-center justify-content-between mb-1"
                  >
                    <Form.Check
                      type="checkbox"
                      label={label}
                      value={label}
                      checked={selectedSeries.includes(label)}
                      onChange={(e) => {
                        const seriesLabel = e.target.value;
                        if (e.target.checked) {
                          setSelectedSeries((prev) => [...prev, seriesLabel]);
                          // ✅ Default quantity 1 when selected
                          setVciCounts((prev) => ({
                            ...prev,
                            [labelToSeriesMap[seriesLabel]]: 1,
                          }));
                        } else {
                          setSelectedSeries((prev) =>
                            prev.filter((s) => s !== seriesLabel)
                          );
                          setVciCounts((prev) => {
                            const newCounts = { ...prev };
                            delete newCounts[labelToSeriesMap[seriesLabel]];
                            return newCounts;
                          });
                        }
                      }}
                    />

                    {selectedSeries.includes(label) && (
                      <Form.Control
                        type="number"
                        min="1"
                        size="sm"
                        value={
                          vciCounts[labelToSeriesMap[label]] !== undefined
                            ? vciCounts[labelToSeriesMap[label]]
                            : 1
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setVciCounts((prev) => ({
                            ...prev,
                            [labelToSeriesMap[label]]: val === "" ? "" : Math.max(Number(val), 1),
                          }));
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          // If left blank on blur, revert to 1
                          if (val === "" || Number(val) < 1) {
                            setVciCounts((prev) => ({
                              ...prev,
                              [labelToSeriesMap[label]]: 1,
                            }));
                          }
                        }}
                        style={{
                          width: "80px",
                          fontSize: "0.8rem",
                          marginLeft: "10px",
                        }}
                        placeholder="Qty"
                      />

                    )}
                    {/* 
            {selectedSeries.includes(label) && (
              <Form.Control
                type="number"
                min="0"
                size="sm"
                value={
                  vciCounts[labelToSeriesMap[label]] !== undefined
                    ? vciCounts[labelToSeriesMap[label]]
                    : ""
                }
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setVciCounts((prev) => ({
                    ...prev,
                    [labelToSeriesMap[label]]: isNaN(val) ? 0 : val,
                  }));
                }}
                style={{
                  width: "80px",
                  fontSize: "0.8rem",
                  marginLeft: "10px",
                }}
                placeholder="Qty"
              />
            )} */}
                  </div>
                ))}
              </div>
            </Form.Group>
          </div>

      <div className="col-md-6 d-flex flex-column align-items-end">

  {/* Top buttons */}
  <div className="d-flex gap-2 mb-2">
    <Button
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

    <Button
      variant="outline-secondary"
      size="sm"
      onClick={() => fetchMultipleSeriesData(selectedSeries)}
    >
      <i className="bi bi-arrow-clockwise"></i>
    </Button>
  </div>

  {/* Search box */}
  <div className="w-100 mb-2">
    <Search search={search} setSearch={setSearch} />
  </div>

  {/* Download Button */}
  <div className="w-100 d-flex justify-content-end">
    <Button
      variant="success"
      size="sm"
      onClick={() => downloadShortageExcel(shortageOverview)}
      style={{ minWidth: "130px" }}
    >
      Download shortage list
    </Button>
  </div>

</div>

        </div>
        {/* Tables Section */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : selectedSeries.length > 0 ? (
          <Row>
            {/* LEFT COLUMN – Series Wise Tables */}
            <Col md={8}>
              {calculatedSeriesData.map((seriesData, idx) => {
                const filtered = filterParts(seriesData.spare_parts);
                return (
                  <div key={idx} className="mb-4">
                    <h6 className="fw-bold mb-2 mt-3 text-primary">
                      {seriesData.series}
                    </h6>
                    <Table
                      className="table-sm align-middle mb-0"
                      style={{ fontSize: "0.85rem" }}
                      bordered
                    >
                      <thead>
                        <tr>
                          <th style={headerStyle}>S.No</th>
                          <th style={headerStyle}>Spare Part Name</th>
                          <th style={headerStyle}>Available Qty</th>
                          <th style={headerStyle}>Required For One</th>
                          <th style={headerStyle}>Total Required</th>
                          <th style={headerStyle}>Shortage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length > 0 ? (
                          filtered.map((part, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{part.name}</td>
                              <td>{part.effectiveAvailable}</td>
                              <td>{part.required_per_vci}</td>
                              <td>{part.totalRequired}</td>
                              <td style={{ color: part.shortage > 0 ? "red" : "green" }}>
                                {part.shortage > 0 ? part.shortage : "OK"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-3">
                              No spare parts found for this series.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                );
              })}
            </Col>

            {/* RIGHT COLUMN – Shortage Overview */}
            <Col md={4}>
              {shortageOverview.length > 0 ? (
                <div className="mt-3">
                  <h6 className="fw-bold mb-2 text-danger text-center fs-6">
                    Shortage Overview
                  </h6>
                  <Table bordered hover size="sm" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th style={headerStyle}>S.No</th>
                        <th style={headerStyle}>Spare Part</th>
                        <th style={headerStyle}>Total Shortage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortageOverview.map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{item.name}</td>
                          <td style={{ color: "red", fontWeight: "600" }}>
                            {item.totalShortage}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted mt-5">
                  <em>No shortages found.</em>
                </div>
              )}
            </Col>
          </Row>
        ) : (
          <div className="text-center py-5 text-muted">
            <em>
              Please select at least one series and enter a quantity to view spare
              parts requirement.
            </em>
          </div>
        )}

      </Card>
    </div>
  );
}
