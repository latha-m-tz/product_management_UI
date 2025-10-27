import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Spinner, Form, Button } from "react-bootstrap";
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
    color: "#ffffff",
    fontSize: "0.82rem",
    height: "40px",
    verticalAlign: "middle",
  },
};

export default function ComponentsRequirement() {
  const navigate = useNavigate();
  const commonTableRef = useRef(null);
  const seriesTableRefs = useRef({});

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vciCount, setVciCount] = useState("");
  const [search, setSearch] = useState("");
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState("");

  useEffect(() => {
    async function fetchData() {
      await fetchSeriesList();
    }
    fetchData();
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
      console.error(err);
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
      console.error(err);
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
        part.required_per_vci.toString().includes(lower) ||
        !search
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
            // accumulate quantities if common part repeats
            const existing = commonPartsMap[part.name.toLowerCase()];
            existing.purchased_quantity += part.purchased_quantity || 0;
            existing.used_quantity += part.used_quantity || 0;
            existing.available_quantity += part.available_quantity || 0;
            existing.required_per_vci = Math.max(
              existing.required_per_vci || 0,
              part.required_per_vci || 0
            );
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

  const maxVCIsPossible = useMemo(() => {
    let minVCIs = Infinity;

    combinedData.commonParts.forEach((part) => {
      const possible = Math.floor(
        (part.available_quantity || 0) / (part.required_per_vci || 1)
      );
      if (possible < minVCIs) minVCIs = possible;
    });

    Object.values(combinedData.seriesPartsMap).forEach((parts) => {
      parts.forEach((part) => {
        const possible = Math.floor(
          (part.available_quantity || 0) / (part.required_per_vci || 1)
        );
        if (possible < minVCIs) minVCIs = possible;
      });
    });

    return minVCIs === Infinity ? 0 : minVCIs;
  }, [combinedData]);

  const filteredCommonParts = useMemo(
    () => filterParts(combinedData?.commonParts),
    [combinedData, search]
  );

  const filteredSeriesPartsMap = useMemo(() => {
    if (!combinedData?.seriesPartsMap) return {};
    const map = {};
    Object.keys(combinedData.seriesPartsMap).forEach((seriesName) => {
      if (selectedSeries && seriesName !== selectedSeries.toLowerCase()) return;
      map[seriesName] = filterParts(combinedData.seriesPartsMap[seriesName]);
    });
    return map;
  }, [combinedData, search, selectedSeries]);

  const initializeDataTable = (tableRef, search = false) => {
    if (!tableRef?.current) return;
    if ($.fn.DataTable.isDataTable(tableRef.current)) {
      $(tableRef.current).DataTable().clear().destroy();
    }
    $(tableRef.current).DataTable({
      paging: true,
      searching: search,
      info: false,
      ordering: true,
      autoWidth: false,
      pageLength: 10,
      order: [],
    });
  };

  useEffect(() => initializeDataTable(commonTableRef, false), [filteredCommonParts]);
  useEffect(() => {
    Object.keys(filteredSeriesPartsMap).forEach((seriesName) => {
      if (!seriesTableRefs.current[seriesName])
        seriesTableRefs.current[seriesName] = React.createRef();
      initializeDataTable(seriesTableRefs.current[seriesName], true);
    });
  }, [filteredSeriesPartsMap]);

  const computePerVCI = (part) => part.required_per_vci || 0;
  const computeTotalRequired = (part) => (vciCount || 0) * computePerVCI(part);
  const computeAvailableAfterUsed = (part) =>
    Math.max((part.purchased_quantity || 0) - (part.used_quantity || 0), 0);
  const computeShortage = (part) => computeTotalRequired(part) - (part.available_quantity || 0);

  return (
    <div className="p-4" style={{ fontSize: "0.85rem" }}>
      <BreadCrumb title="Spare Parts Requirement" />
      <Card className="border-0 shadow-sm rounded-3 bg-white p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-end justify-content-between">
          <Form.Group style={{ minWidth: "200px" }}>
            <Form.Label className="fw-bold">How many products will make?</Form.Label>
            <Form.Control
              type="number"
              placeholder="e.g. 400"
              value={vciCount}
              onChange={(e) =>
                setVciCount(e.target.value ? parseInt(e.target.value, 10) : "")
              }
            />
          </Form.Group>

          <Form.Group style={{ minWidth: "250px" }}>
            <Form.Label className="fw-bold">Search Spare Parts</Form.Label>
            <Search search={search} setSearch={setSearch} perPage={10} setPerPage={() => {}} setPage={() => {}} />
          </Form.Group>

          <Form.Group style={{ minWidth: "250px" }}>
            <Form.Label className="fw-bold">Select Series</Form.Label>
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

          <div className="d-flex justify-content-end mt-2 mt-md-0">
            <Button
              variant="outline-success"
              className="fw-semibold"
              onClick={() => navigate("/spare-parts")}
            >
              + Add Spare Part
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {/* Common Parts */}
          {filteredCommonParts.length > 0 && (
            <Card className="border-0 shadow-sm rounded-3 bg-white p-3 px-4 mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0">Common Spare Parts</h6>
                {maxVCIsPossible > 0 && (
                  <span className="badge text-dark">
                    Max VCIs Possible: {maxVCIsPossible}
                  </span>
                )}
              </div>
              <div className="table-responsive">
                <table
                  ref={commonTableRef}
                  className="table table-sm align-middle mb-0"
                  style={{ fontSize: "0.85rem" }}
                >
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th>S.NO</th>
                      <th>Spare Part Name</th>
                      <th>Purchased Qty</th>
                      <th>Used Qty</th>
                      <th>Available Qty</th>
                      <th>Required</th>
                      <th>Total Required</th>
                      <th>Shortage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommonParts.map((part, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td>{part.name}</td>
                        <td>{part.purchased_quantity}</td>
                        <td>{part.used_quantity}</td>
                        <td>{part.available_quantity}</td>
                        <td>{computePerVCI(part)}</td>
                        <td>{computeTotalRequired(part)}</td>
                        <td style={{ color: computeShortage(part) > 0 ? "red" : "green" }}>
                          {computeShortage(part) > 0 ? computeShortage(part) : "OK"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Series-specific Parts */}
          {Object.keys(filteredSeriesPartsMap).map((seriesName) => {
            const parts = filteredSeriesPartsMap[seriesName];
            if (!parts.length) return null;

            return (
              <Card
                key={seriesName}
                className="border-0 shadow-sm rounded-3 bg-white p-3 px-4 mt-3"
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">{seriesName.toUpperCase()} Spare Parts</h6>
                </div>
                <div className="table-responsive">
                  <table
                    ref={(el) => (seriesTableRefs.current[seriesName] = el)}
                    className="table table-sm align-middle mb-0"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th>S.NO</th>
                        <th>Spare Part Name</th>
                        <th>Purchased Qty</th>
                        <th>Used Qty</th>
                        <th>Available Qty</th>
                        <th>Required</th>
                        <th>Total Required</th>
                        <th>Shortage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((part, idx) => (
                        <tr key={idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td>{part.name}</td>
                          <td>{part.purchased_quantity}</td>
                          <td>{part.used_quantity}</td>
                          <td>{part.available_quantity}</td>
                          <td>{computePerVCI(part)}</td>
                          <td>{computeTotalRequired(part)}</td>
                          <td style={{ color: computeShortage(part) > 0 ? "red" : "green" }}>
                            {computeShortage(part) > 0 ? computeShortage(part) : "OK"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
