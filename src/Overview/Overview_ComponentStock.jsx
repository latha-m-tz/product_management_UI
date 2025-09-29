import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import "./ComponentStock.css";

const dummyData = [
  { name: "Nut", qty: 3000, usedVCI: 750, up: true },
  { name: "Boalt", qty: 200, usedVCI: 50, up: false },
  { name: "End Panels", qty: 100, usedVCI: 50, up: false },
  { name: "Tech_Pro Pouch", qty: 200, usedVCI: 200, up: false },
  { name: "Side Sticker", qty: 3000, usedVCI: 1500, up: true },
  { name: "C_Type Cable", qty: 400, usedVCI: 400, up: true },
  { name: "End Plats", qty: 100, usedVCI: 100, up: false },
  { name: "OBD", qty: 500, usedVCI: 500, up: true },
  { name: "Mahle Sticker", qty: 1000, usedVCI: 100, up: true },
];

const ComponentStock = () => {
  return (
    <div className="card p-3 border-0 shadow-sm">
      <h5 className="fw-semibold mb-1">Components Stock</h5>
      <small className="text-muted d-block mb-4">Spare parts</small>
      <div className="stock-scroll-wrapper">
        <div className="d-flex flex-wrap scroll-container">
            {dummyData.map((item, index) => (
            <div key={index} className="five-col mb-3">
                <div className="d-flex">
                <div
                    className="bg-light rounded me-2 mt-1"
                    style={{ width: 50, height: 50 }}
                ></div>

                <div className="d-flex flex-column justify-content-center">
                    <small className="custom-small-text">{item.name}</small>
                    <div className="fw-bold fs-5">{item.qty} Qty</div>
                    <small className="text-muted d-block">
                    Using {item.usedVCI} VCI's
                    </small>
                    <small className={item.up ? "text-success" : "text-danger"}>
                    {item.up ? (
                        <FaArrowUp style={{ fontSize: "10px" }} />
                    ) : (
                        <FaArrowDown style={{ fontSize: "10px" }} />
                    )}
                    </small>
                </div>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ComponentStock;
