import React, { useEffect, useState } from "react";
import { FaArrowUp, FaArrowDown, FaBell } from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../api"; // ✅ corrected path
import "./Componentstock.css";

const SkeletonCard = () => (
  <div className="five-col mb-3">
    <div className="d-flex">
      <div
        className="bg-light rounded me-2 mt-1"
        style={{ width: 50, height: 50 }}
      ></div>
      <div className="d-flex flex-column justify-content-center" style={{ width: "100px" }}>
        <div className="bg-light rounded mb-1" style={{ height: "12px", width: "70%" }}></div>
        <div className="bg-light rounded mb-1" style={{ height: "16px", width: "50%" }}></div>
        <div className="bg-light rounded" style={{ height: "10px", width: "60%" }}></div>
      </div>
    </div>
  </div>
);

const ComponentStock = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/vci-capacity`)
      .then((res) => {
        if (res.data?.success && res.data?.data?.spare_parts) {
          const parts = res.data.data.spare_parts;
          setStockData(parts);

          const unavailablePart = parts.find((p) => p.status === "Unavailable" || p.boards_possible <= 0);
          if (unavailablePart) {
            setIsAvailable(false); 
            setMessage(`Using available parts, we can make ${res.data.data.available_vci_boards_possible} VCI's`);
          } else {
            setIsAvailable(true);
            setMessage(`Using these spare parts, we can make ${res.data.data.max_vci_boards_possible} VCI's`);
          }
        } else {
          setStockData([]);
          setMessage(null);
        }
      })
      .catch(() => {
        setStockData([]);
        setMessage(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card p-3 border-0 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h5 className="fw-semibold mb-1">Components Stock</h5>
          <small className="text-muted d-block">Spare parts</small>
        </div>
          {message && (
            <div
              className="d-flex align-items-center"
              style={{ maxWidth: "350px", textAlign: "right" }}
            >
          <FaBell className="me-2" style={{ color: "#28a745" }}/>
          <small
            className="fw-semibold"
            style={{ lineHeight: "1.2", color: "#28a745" }}
          >
            {message}
          </small>
            </div>
          )}
      </div>

      <div className="stock-scroll-wrapper mt-3">
        <div className="d-flex flex-wrap scroll-container">
          {loading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </>
          ) : stockData.length > 0 ? (
            stockData.map((item, index) => (
              <div key={index} className="five-col mb-3">
                <div className="d-flex">
                  <div
                    className="bg-light rounded me-2 mt-1"
                    style={{ width: 50, height: 50 }}
                  ></div>

                  <div className="d-flex flex-column justify-content-center">
                    <small className="custom-small-text">{item.name}</small>
                    <div className="fw-bold fs-5">{item.total_quantity} Qty</div>
                    <small
                      className={`d-block ${
                        item.boards_possible > 0 ? "text-muted" : "text-danger fw-semibold"
                      }`}
                    >
                      {item.boards_possible > 0
                        ? `Stock supports ${item.boards_possible} VCI's`
                        : "Unavailable"}
                    </small>
                    <small
                      className={item.boards_possible > 0 ? "#28a745" : "text-danger"}
                      style={item.boards_possible > 0 ? { color: "#28a745" } : {}}
                    >
                      {item.boards_possible > 0 ? (
                        <FaArrowUp style={{ fontSize: "10px" }} />
                      ) : (
                        <FaArrowDown style={{ fontSize: "10px" }} />
                      )}
                    </small>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center w-100 py-4">
              <img
                src="/empty-box.png"
                alt="No stock"
                style={{ width: "80px", height: "100px", opacity: 0.6 }}
              />
              <div className="text-muted mt-2">No component stock left</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentStock;
