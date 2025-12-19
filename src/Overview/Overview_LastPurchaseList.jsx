import React from "react";
import "./LastSalesList.css";
import { API_BASE_URL } from "../api";  
import api, { setAuthToken } from "../api";

const salesData = [
  { vendor: "MAHLE", invoiceDate: "10/05/2025", batch: "Batch 1", product: "7 series", quantity: 400 },
  { vendor: "MAHLE", invoiceDate: "05/05/2025", batch: "Batch 2", product: "7 series", quantity: 300 },
  { vendor: "MAHLE", invoiceDate: "04/04/2025", batch: "Batch 3", product: "7 series", quantity: 400 },
  { vendor: "MAHLE", invoiceDate: "03/03/2025", batch: "Batch 4", product: "7 series", quantity: 500 },
];

const LastPurchaseList = () => {
  return (
    <div className="sales-card">
      <h5 className="sales-title">Recent Purchase List</h5>
      <div className="sales-table-wrapper">
        <div className="table-responsive">
          <table className="sales-table table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Vendor</th>
                <th>Invoice Date</th>
                {/* <th>Batch</th> */}
                <th>Product</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.vendor}</td>
                  <td>{item.invoiceDate}</td>
                  <td>{item.batch}</td>
                  <td>{item.product}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LastPurchaseList;
