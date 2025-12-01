import React, { useEffect, useState } from "react";
import { Card, Spinner } from "react-bootstrap";
import api, { setAuthToken } from "../api";   // ✅ FIXED: use global API instance
import "./LastSalesList.css";

const LastSalesList = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token); // ✅ Set token globally

    fetchLastSales();
  }, []);

  const fetchLastSales = async () => {
    try {
      const res = await api.get("/sales"); // ✅ Token included automatically

      const sales = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];

      if (sales.length === 0) {
        setSalesData([]);
        return;
      }

      // 🟢 Correct sorting applied to result itself
      const sorted = [...sales].sort(
        (a, b) => new Date(b.shipment_date) - new Date(a.shipment_date)
      );

      setSalesData(sorted.slice(0, 10)); 
    } catch (error) {
      console.error("Error fetching sales:", error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <h5 className="fw-semibold text-dark mb-4">Last Sales List</h5>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <div className="sales-table-wrapper">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Customer</th>
                  <th>Shipment Date</th>
                  <th>Product</th>
                  <th>Quantity</th>
                </tr>
              </thead>

              <tbody>
                {salesData.length > 0 ? (
                  salesData.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.customer?.customer ?? "N/A"}</td>
                      <td>{new Date(item.shipment_date).toLocaleDateString()}</td>
                      <td>{item.product?.product ?? "N/A"}</td>
                      <td>{item.quantity ?? 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      <img
                        src="/empty-box.png"
                        alt="No data"
                        style={{ width: "80px", height: "100px", opacity: 0.6 }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default LastSalesList;
