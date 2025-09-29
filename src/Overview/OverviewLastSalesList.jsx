import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Spinner } from "react-bootstrap";
import { API_BASE_URL } from "../api"; // ✅ corrected path
import "./LastSalesList.css";

const LastSalesList = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLastSales();
  }, []);

  const fetchLastSales = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sales`);

      const sales = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
        : [];

      if (sales.length === 0) {
        setSalesData([]);
        return;
      }

      // Sort by latest shipment date
      const sorted = [...sales].sort(
        (a, b) => new Date(b.shipment_date) - new Date(a.shipment_date)
      );

      // Take the latest 10
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
                      <td>{item.customer_name}</td>
                      <td>{new Date(item.shipment_date).toLocaleDateString()}</td>
                      <td>{item.category_name}</td>
                      <td>{item.quantity}</td>
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
