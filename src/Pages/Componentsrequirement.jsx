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
  const [vciCount, setVciCount] = useState(0);
  const [search, setSearch] = useState("");
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState("");

  useEffect(() => {
    fetchAllSeries();
    fetchSeriesList();
  }, []);

  const fetchAllSeries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/counts`);
      console.log("API Data:", res.data.data);
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch spare parts data!");
    } finally {
      setLoading(false);
    }
  };

  const fetchSeriesList = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/product`);
      // API returns an array directly
      const seriesNames = res.data.map((item) => item.name);
      setSeriesList(seriesNames);
      if (seriesNames.length > 0) setSelectedSeries(seriesNames[0]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch series list!");
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

    const commonPartNames = [
      "Bolt", "End plate", "Mahle sticker", "Nut",
      "Obd connector", "Enclosure", "Rubber case", "White panel",
    ];

    const seriesPartsMap = {};
    const commonPartsMap = {};

    data.forEach((seriesData) => {
      const seriesName = seriesData.series?.trim().toLowerCase(); // normalize
      if (!seriesPartsMap[seriesName]) seriesPartsMap[seriesName] = [];

      seriesData.spare_parts.forEach((part) => {
        const nameLower = part.name?.toLowerCase() || "";
        const isCommon = commonPartNames.some((common) =>
          nameLower.includes(common)
        );

        if (isCommon) {
          if (!commonPartsMap[nameLower]) {
            commonPartsMap[nameLower] = {
              ...part,
              purchased_quantity: part.purchased_quantity || 0,
              used_quantity: part.used_quantity || 0,
              available_quantity: part.available_quantity || 0,
            };
          } else {
            commonPartsMap[nameLower].purchased_quantity += part.purchased_quantity || 0;
            commonPartsMap[nameLower].used_quantity += part.used_quantity || 0;
            commonPartsMap[nameLower].available_quantity += part.available_quantity || 0;
            commonPartsMap[nameLower].required_per_vci = Math.max(
              commonPartsMap[nameLower].required_per_vci || 0,
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
    if (!combinedData) return 0;
    let minVCIs = Infinity;

    combinedData.commonParts.forEach((part) => {
      const possible = Math.floor((part.available_quantity || 0) / (part.required_per_vci || 1));
      if (possible < minVCIs) minVCIs = possible;
    });

    Object.values(combinedData.seriesPartsMap).forEach((parts) => {
      parts.forEach((part) => {
        const possible = Math.floor((part.available_quantity || 0) / (part.required_per_vci || 1));
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
    const lowerSearch = search.toLowerCase();

    Object.keys(combinedData.seriesPartsMap).forEach((seriesName) => {
      if (selectedSeries && seriesName !== selectedSeries) return; // Only selected series
      const filteredParts = filterParts(combinedData.seriesPartsMap[seriesName]);
      map[seriesName] = filteredParts.filter(
        (p) =>
          (p.purchased_quantity || p.used_quantity || p.available_quantity) ||
          (p.required_per_vci > 0) ||
          (p.name.toLowerCase().includes(lowerSearch))
      );
    });
    return map;
  }, [combinedData, search, selectedSeries]);

  // DataTable initialization helper
  const initializeDataTable = (tableRef, options = {}) => {
    if (!tableRef?.current) return;

    if ($.fn.DataTable.isDataTable(tableRef.current)) {
      $(tableRef.current).DataTable().clear().destroy();
    }

    requestAnimationFrame(() => {
      $(tableRef.current).DataTable({
        paging: true,
        searching: options.searching || false,
        info: false,
        ordering: true,
        autoWidth: false,
        pageLength: 10,
        order: [],
      });
    });
  };

  useEffect(() => {
    if (!filteredCommonParts || filteredCommonParts.length === 0) return;

    const tableEl = commonTableRef.current;
    if (!tableEl) return;

    if ($.fn.DataTable.isDataTable(tableEl)) {
      $(tableEl).DataTable().clear().destroy();
    }

    const timer = setTimeout(() => {
      if ($(tableEl).find("tbody tr").length > 0) {
        $(tableEl).DataTable({
          paging: true,
          searching: false,
          info: false,
          ordering: true,
          autoWidth: false,
          pageLength: 10,
          order: [],
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [filteredCommonParts]);

  useEffect(() => {
    Object.keys(filteredSeriesPartsMap).forEach((seriesName) => {
      if (!seriesTableRefs.current[seriesName]) {
        seriesTableRefs.current[seriesName] = React.createRef();
      }

      const ref = seriesTableRefs.current[seriesName];
      if (!ref?.current) return;

      if ($.fn.DataTable.isDataTable(ref.current)) {
        $(ref.current).DataTable().clear().destroy();
      }

      if (filteredSeriesPartsMap[seriesName].length > 0) {
        const timer = setTimeout(() => {
          if ($(ref.current).find("tbody tr").length > 0) {
            $(ref.current).DataTable({
              paging: true,
              searching: true,
              info: false,
              ordering: true,
              autoWidth: false,
              pageLength: 10,
              order: [],
            });
          }
        }, 50);

        return () => clearTimeout(timer);
      }
    });
  }, [filteredSeriesPartsMap]);

  return (
    <div className="p-4" style={{ fontSize: "0.85rem" }}>
      <BreadCrumb title="Spare Parts Requirement" />

      <Card className="border-0 shadow-sm rounded-3 bg-white p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-end justify-content-between">
          <Form.Group style={{ minWidth: "200px" }}>
            <Form.Label className="fw-bold">How many products will make?</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. 400"
              value={vciCount}
              onChange={(e) => setVciCount(parseInt(e.target.value, 10) || "")}
            />
          </Form.Group>

          <Form.Group style={{ minWidth: "250px" }}>
            <Form.Label className="fw-bold">Search Spare Parts</Form.Label>
            <Search
              search={search}
              setSearch={setSearch}
              perPage={10}
              setPerPage={() => { }}
              setPage={() => { }}
            />
          </Form.Group>

          <Form.Group style={{ minWidth: "250px" }}>
            <Form.Label className="fw-bold">Select Series</Form.Label>
            <Form.Select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value.trim().toLowerCase())} // normalize
            >
              {seriesList.map((series, idx) => (
                <option key={idx} value={series.trim().toLowerCase()}>
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
          {/* Common Parts Table */}
          {filteredCommonParts.length > 0 ? (
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
                  <thead style={{ backgroundColor: "#2E3A59", color: "#fff" }}>
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
                    {filteredCommonParts.map((part, idx) => {
                      const totalRequired = (part.required_per_vci || 0) * (vciCount || 0);
                      const shortage = totalRequired - (part.available_quantity || 0);
                      return (
                        <tr key={idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td>{part.name}</td>
                          <td>{part.purchased_quantity}</td>
                          <td>{part.used_quantity}</td>
                          <td>{part.available_quantity}</td>
                          <td>{part.required_per_vci}</td>
                          <td>{totalRequired || "-"}</td>
                          <td style={{ color: shortage > 0 ? "red" : "green" }}>
                            {shortage > 0 ? shortage : "OK"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm rounded-3 bg-white p-3 px-4 mt-3">
              <p className="text-muted mb-0">No common spare parts found.</p>
            </Card>
          )}

          {/* Series-specific Parts */}
          {Object.keys(filteredSeriesPartsMap).map((seriesName) => {
            const seriesParts = filteredSeriesPartsMap[seriesName];
            if (!seriesParts || seriesParts.length === 0) return null;

            const ref = seriesTableRefs.current[seriesName];

            return (
              <Card
                key={seriesName}
                className="border-0 shadow-sm rounded-3 bg-white p-3 px-4 mt-3"
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">{seriesName} Specific Spare Parts</h6>
                </div>
                <div className="table-responsive">
                  <table
                    ref={ref}
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
                      {seriesParts.map((part, idx) => {
                        const totalRequired = (part.required_per_vci || 0) * (vciCount || 0);
                        const shortage = totalRequired - (part.available_quantity || 0);
                        return (
                          <tr key={idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td>{part.name}</td>
                            <td>{part.purchased_quantity}</td>
                            <td>{part.used_quantity}</td>
                            <td>{part.available_quantity}</td>
                            <td>{part.required_per_vci}</td>
                            <td>{totalRequired || "-"}</td>
                            <td style={{ color: shortage > 0 ? "red" : "green" }}>
                              {shortage > 0 ? shortage : "OK"}
                            </td>
                          </tr>
                        );
                      })}
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
