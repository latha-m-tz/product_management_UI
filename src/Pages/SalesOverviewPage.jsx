import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Spinner, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { ArrowClockwise } from "react-bootstrap-icons";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import { API_BASE_URL } from "../api";
import BreadCrumb from "../components/BreadCrumb"; // Added from ProductPage
import Pagination from "../components/Pagination";
import Search from "../components/Search";
import DataTable from "../components/DataTable";

export default function SalesOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    fetchSale();
  }, [id]);

  const fetchSale = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/sales/${id}`);
      setSale(res.data);
    } catch (error) {
      console.error("Failed to fetch sale:", error);
      toast.error("Failed to fetch sale details!");
      setSale(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!sale) {
    return <div className="text-center mt-4 text-muted">Sale not found!</div>;
  }

  const allRows = (sale.items || []).map((item, index) => ({
    sno: index + 1,
    challan_no: sale.challan_no,
    customer: sale.customer?.customer || "N/A",
    challan_date: sale.challan_date,
    shipment_date: sale.shipment_date,
    serial_no: item.serial_no,
    product: item.product,
    quantity: item.quantity,
  }));

  const columns = [
    // { header: "S.No", accessor: (row) => row.sno },
    { header: "Challan No", accessor: (row) => row.challan_no },
    { header: "Customer", accessor: (row) => row.customer },
    { header: "Challan Date", accessor: (row) => row.challan_date },
    { header: "Shipment Date", accessor: (row) => row.shipment_date },
    { header: "Serial No", accessor: (row) => row.serial_no },
    { header: "Product", accessor: (row) => row.product },
    // { header: "Quantity", accessor: (row) => row.quantity },
  ];

  const filteredRows = allRows.filter(
    (row) =>
      row.challan_no?.toLowerCase().includes(search.toLowerCase()) ||
      row.customer?.toLowerCase().includes(search.toLowerCase()) ||
      row.serial_no?.toLowerCase().includes(search.toLowerCase()) ||
      row.product?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedRows = filteredRows.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const headerStyle = {
    backgroundColor: "#2E3A59",
    color: "white",
  };

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <BreadCrumb title="Sale Overview" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2">
          {/* Left Controls */}
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

          {/* Right Controls */}
          <div className="col-md-6 text-md-end" style={{ fontSize: "0.8rem" }}>
            <div className="mt-2 d-inline-block mb-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={fetchSale}
              >
                <ArrowClockwise />
              </Button>
  {/* <h5 className="mb-0">Sale Overview</h5> */}
  <Button
    variant="outline-secondary"
    size="sm"
    onClick={() => navigate(-1)} // Go back to previous page
  >
    ← Back
  </Button>

            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <Search
                search={search}
                setSearch={setSearch}
                perPage={perPage}
                setPerPage={setPerPage}
                setPage={setPage}
                style={{ fontSize: "0.8rem" }}
              />
            </div>
          </div>
        </div>

        <DataTable
          loading={loading}
          data={paginatedRows}
          columns={columns}
          page={page}
          perPage={perPage}
          headerStyle={headerStyle}
          emptyMessage="No sale details found"
        />

        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={filteredRows.length}
        />
      </Card>
    </div>
  );
}
