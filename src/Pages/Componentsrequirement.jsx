import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Spinner, Form, Button, Dropdown } from "react-bootstrap";
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
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const commonPartNames = [
    "Bolt",
    "End Plate",
    "Mahle Sticker",
    "Nut",
    "OBD Connector",
    "Enclosure",
    "Rubber Case",
    "White Panel",
  ];

  useEffect(() => {
    fetchAllSeries();
    fetchProductTypes();
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

  const fetchProductTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/product-types`);
      setProductTypes(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch product types!");
    }
  };

  const combinedData = useMemo(() => {
    if (selectedProducts.length === 0 || data.length === 0) return null;

    const commonPartsMap = {};
    const seriesPartsMap = {};

    let foundAnyParts = false;

    selectedProducts.forEach((prodType) => {
      const [prodId, typeId] = prodType.split("|");
      const pt = productTypes.find(
        (p) => p.product.id.toString() === prodId && p.id.toString() === typeId
      );
      if (!pt) return;

      const normalize = (str) => (str || "").toLowerCase().replace(/[\s-]/g, "");
      let seriesNameToFetch = pt.product.name;

      if (pt.name.toLowerCase() === "vci") {
        const vciSeriesData = data.find(
          (item) => item.spare_parts?.some((part) => part.type === "vci")
        );
        if (vciSeriesData) {
          seriesNameToFetch = vciSeriesData.series;
        }
      }

      const seriesData = data.find(
        (item) => normalize(item.series) === normalize(seriesNameToFetch)
      );

      if (!seriesData || !seriesData.spare_parts || seriesData.spare_parts.length === 0) {
        return;
      }

      foundAnyParts = true;

      seriesData.spare_parts.forEach((part) => {
        if (commonPartNames.includes(part.name)) {
          if (!commonPartsMap[part.name]) {
            commonPartsMap[part.name] = { ...part };
          } else {
            commonPartsMap[part.name].available_quantity += part.available_quantity;
            commonPartsMap[part.name].required_per_vci = Math.max(
              commonPartsMap[part.name].required_per_vci,
              part.required_per_vci
            );
          }
        } else {
          // Map by series
          if (!seriesPartsMap[seriesData.series]) seriesPartsMap[seriesData.series] = [];
          seriesPartsMap[seriesData.series].push(part);
        }
      });
    });

    if (!foundAnyParts) {
      return {
        commonParts: [],
        seriesPartsMap: {},
      };
    }

    return {
      commonParts: Object.values(commonPartsMap),
      seriesPartsMap,
    };
  }, [selectedProducts, productTypes, data]);
  const maxVCIsPossible = useMemo(() => {
    if (!combinedData) return 0;
    let minVCIs = Infinity;

    // Common parts
    combinedData.commonParts.forEach(part => {
      const possible = Math.floor((part.available_quantity || 0) / (part.required_per_vci || 1));
      if (possible < minVCIs) minVCIs = possible;
    });

    // Series-specific parts
    Object.values(combinedData.seriesPartsMap).forEach(parts => {
      parts.forEach(part => {
        const possible = Math.floor((part.available_quantity || 0) / (part.required_per_vci || 1));
        if (possible < minVCIs) minVCIs = possible;
      });
    });

    return minVCIs === Infinity ? 0 : minVCIs;
  }, [combinedData]);


  const filterParts = (parts) => {
    if (!parts || parts.length === 0) return [];
    if (!search) return parts;
    const lower = search.toLowerCase();
    return parts.filter(
      (part) =>
        part.name.toLowerCase().includes(lower) ||
        part.available_quantity.toString().includes(lower) ||
        part.required_per_vci.toString().includes(lower)
    );
  };

  const filteredCommonParts = useMemo(
    () => filterParts(combinedData?.commonParts),
    [combinedData, search]
  );

  const filteredSeriesPartsMap = useMemo(() => {
    if (!combinedData?.seriesPartsMap) return {};
    const map = {};
    Object.keys(combinedData.seriesPartsMap).forEach((seriesName) => {
      map[seriesName] = filterParts(combinedData.seriesPartsMap[seriesName]);
    });
    return map;
  }, [combinedData, search]);

  useEffect(() => {
    if (commonTableRef.current && filteredCommonParts.length > 0) {
      if ($.fn.DataTable.isDataTable(commonTableRef.current))
        $(commonTableRef.current).DataTable().destroy();
      $(commonTableRef.current).DataTable({
        paging: true,
        searching: false,
        info: false,
        ordering: true,
        autoWidth: false,
        pageLength: 10,
        order: [],
      });
    }

    Object.keys(filteredSeriesPartsMap).forEach((seriesName) => {
      if (!seriesTableRefs.current[seriesName]) return;
      const ref = seriesTableRefs.current[seriesName];
      const parts = filteredSeriesPartsMap[seriesName];
      if (!ref.current || !parts || parts.length === 0) return;
      if ($.fn.DataTable.isDataTable(ref.current)) $(ref.current).DataTable().destroy();
      $(ref.current).DataTable({
        paging: true,
        searching: false,
        info: false,
        ordering: true,
        autoWidth: false,
        pageLength: 10,
        order: [],
      });
    });
  }, [filteredCommonParts, filteredSeriesPartsMap]);

  const handleCheckboxChange = (value) => {
    if (selectedProducts.includes(value)) {
      setSelectedProducts(selectedProducts.filter((v) => v !== value));
    } else {
      setSelectedProducts([...selectedProducts, value]);
    }
  };

  Object.keys(filteredSeriesPartsMap).forEach((seriesName) => {
    if (!seriesTableRefs.current[seriesName]) {
      seriesTableRefs.current[seriesName] = React.createRef();
    }
  });

  // Fix: Only show "No spare parts available" if none of the selected products have any spare parts
  const noPartsAvailable =
    selectedProducts.length > 0 &&
    (!combinedData ||
      (
        (!combinedData.commonParts || combinedData.commonParts.length === 0) &&
        (!combinedData.seriesPartsMap ||
          Object.values(combinedData.seriesPartsMap).every((arr) => arr.length === 0)
        )
      )
    );

  // Add style directly to <tr> inside <thead> for table header row
  return (
    <div className="p-4" style={{ fontSize: "0.85rem" }}>
      <BreadCrumb title="Spare Parts Requirement" />

      <Card className="border-0 shadow-sm rounded-3 bg-white p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-end justify-content-between">
          <div className="d-flex flex-wrap gap-3 align-items-end">
            <Form.Group style={{ minWidth: "300px" }}>
              <Form.Label className="fw-bold">Select Products/Series</Form.Label>
              <Dropdown show={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)}>
                <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start">
                  {selectedProducts.length === 0
                    ? "-- Select Products --"
                    : `${selectedProducts.length} selected`}
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {productTypes.map((pt) => {
                    const value = `${pt.product.id}|${pt.id}`;
                    return (
                      <Form.Check
                        key={pt.id}
                        type="checkbox"
                        label={`${pt.name} (${pt.product.name})`}
                        checked={selectedProducts.includes(value)}
                        onChange={() => handleCheckboxChange(value)}
                        className="ms-2"
                      />
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown>
            </Form.Group>

            <Form.Group style={{ minWidth: "200px" }}>
              <Form.Label className="fw-bold">How many prodcut will make?</Form.Label>
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
          </div>

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
      ) : selectedProducts.length === 0 ? (
        <p className="text-muted mt-4">
          Please select at least one product/series to view spare parts requirement.
        </p>
      ) : noPartsAvailable ? (
        <p className="text-muted mt-4">No spare parts available for selected product type(s).</p>
      ) : (
        <>
          {/* Common Parts Table */}
          {filteredCommonParts.length > 0 && (
            <Card className="border-0 shadow-sm rounded-3 bg-white p-3 px-4 mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0">Common Spare Parts</h6>
                {maxVCIsPossible > 0 && (
                  <span className="badge  text-dark">
                    Max VCIs Possible: {maxVCIsPossible}
                  </span>
                )}
              </div>
              <div className="table-responsive"></div>
              <table
                ref={commonTableRef}
                className="table table-sm align-middle mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th>S.NO</th>
                    <th>Spare Part Name</th>
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
            </Card>
          )}

          {/* Series-specific parts */}
          {Object.keys(filteredSeriesPartsMap).map((seriesName) => {
            const seriesParts = filteredSeriesPartsMap[seriesName];
            if (!seriesParts || seriesParts.length === 0) return null;

            const ref = seriesTableRefs.current[seriesName];

            return (
              <Card key={seriesName} className="border-0 shadow-sm rounded-3 bg-white p-3 px-4 mt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">{seriesName}  Spare Parts</h6>
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
