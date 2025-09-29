import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Spinner } from "react-bootstrap";
import { API_BASE_URL } from "../api"; // ✅ corrected path
import "./LastSalesList.css";

const LastPurchaseList = () => {
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLastPurchases();
  }, []);

  const fetchLastPurchases = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/purchase`);

      const purchases = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
        : [];

      if (purchases.length === 0) {
        setPurchaseData([]);
        return;
      }

      // Sort by latest invoice date
      const sorted = [...purchases].sort(
        (a, b) => new Date(b.invoice_date) - new Date(a.invoice_date)
      );

      // Take the latest 10
      setPurchaseData(sorted.slice(0, 10));
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setPurchaseData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <h5 className="fw-semibold text-dark mb-4">Last Purchase List</h5>

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
                  <th>Vendor</th>
                  <th>Invoice Date</th>
                  <th>Product</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {purchaseData.length > 0 ? (
                  purchaseData.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.vendor}</td>
                      <td>{new Date(item.invoice_date).toLocaleDateString()}</td>
                      <td>{item.category}</td>
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

export default LastPurchaseList;
