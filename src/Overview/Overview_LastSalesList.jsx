import React from "react";
import "./LastSalesList.css"; 

const salesData = [
  { customer: "MAHLE", date: "10/05/2025", batch: "Batch 1", product: "7 series", quantity: 400 },
  { customer: "MAHLE", date: "05/05/2025", batch: "Batch 2", product: "7 series", quantity: 300 },
  { customer: "MAHLE", date: "04/04/2025", batch: "Batch 3", product: "7 series", quantity: 400 },
  { customer: "MAHLE", date: "03/03/2025", batch: "Batch 4", product: "7 series", quantity: 500 },
//   { customer: "MAHLE", date: "03/03/2025", batch: "Batch 4", product: "7 series", quantity: 500 },
//   { customer: "MAHLE", date: "03/03/2025", batch: "Batch 4", product: "7 series", quantity: 500 },
];

const LastSalesList = () => {
  return (
    <div className="sales-card">
      <h5 className="sales-title">Last Sales List</h5>
      <div className="sales-table-wrapper">
        <table className="sales-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Customer</th>
              <th>Shipment Date</th>
              <th>Batch</th>
              <th>Product</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.customer}</td>
                <td>{item.date}</td>
                <td>{item.batch}</td>
                <td>{item.product}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LastSalesList;
