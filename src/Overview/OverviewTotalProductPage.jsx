// import React, { useEffect, useState } from "react";
// import { Card } from "react-bootstrap";
// import { FaChevronUp, FaChevronDown } from "react-icons/fa";
// import api, { setAuthToken } from "../api";
// import "./TotalProduct.css";

// function TotalProductPage() {
//   const [stockData, setStockData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem("authToken");
//     if (token) setAuthToken(token);

//     fetchStockData();
//   }, []);

//   const fetchStockData = async () => {
//     try {
//       const res = await api.get("/products/stock/all");

//       if (res.data?.success) {
//         const mapped = res.data.products.map((p) => ({
//           series: p.name,               
//           label: "Available Units",       
//           change: p.possible_to_build,
//         }));

//         setStockData(mapped);
//       }
//     } catch (err) {
//       console.error("Failed to load product stock:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const SkeletonRow = () => (
//     <div className="mb-4">
//       <div className="d-flex align-items-center ms-5">
//         <div
//           style={{
//             minWidth: "100px",
//             height: "14px",
//             backgroundColor: "#e9ecef",
//             borderRadius: "4px",
//           }}
//         ></div>
//         <div className="flex-grow-1 mx-3">
//           <div
//             style={{
//               height: "6px",
//               backgroundColor: "#e9ecef",
//               borderRadius: "4px",
//               width: "100%",
//             }}
//           ></div>
//         </div>
//         <div
//           style={{
//             width: "40px",
//             height: "14px",
//             backgroundColor: "#e9ecef",
//             borderRadius: "4px",
//           }}
//         ></div>
//       </div>
//       <div
//         className="ms-5"
//         style={{
//           width: "60px",
//           height: "10px",
//           backgroundColor: "#e9ecef",
//           borderRadius: "4px",
//           marginTop: "4px",
//         }}
//       ></div>
//     </div>
//   );

//   return (
//     <div>
//       <Card className="border-0 shadow-sm h-100">
//         <Card.Body>
//           <h6 className="mt-4 mb-3 fw-semibold">Current Product Stock</h6>

//           {loading ? (
//             <div style={{ maxHeight: "278px", overflowY: "hidden" }}>
//               {[...Array(4)].map((_, i) => (
//                 <SkeletonRow key={i} />
//               ))}
//             </div>
//           ) : (
//             <div className="total-product-scroll">
//               {stockData.map((item, idx) => {
//                 const isUp = item.change > 0;
//                 const barWidth = Math.min(item.change * 5, 100);

//                 return (
//                   <div key={idx} className="mb-4">
//                     <div className="d-flex align-items-center ms-5">
//                       <div style={{ minWidth: "140px" }}>
//                         <div className="fw-semibold">{item.series}</div>
//                       </div>

//                       <div className="flex-grow-1 mx-3">
//                         <div
//                           className="progress"
//                           style={{ height: "6px", backgroundColor: "#e9ecef" }}
//                         >
//                           <div
//                             className={`progress-bar ${
//                               isUp ? "bg-success" : "bg-danger"
//                             }`}
//                             style={{
//                               width: `${barWidth}%`,
//                               transition: "width 0.6s ease",
//                             }}
//                           ></div>
//                         </div>
//                       </div>

//                       <div
//                         className={`d-flex align-items-center gap-1 me-5 ${
//                           isUp ? "text-success" : "text-danger"
//                         }`}
//                         style={{
//                           fontSize: "14px",
//                           fontWeight: 600,
//                           minWidth: "60px",
//                           justifyContent: "flex-end",
//                         }}
//                       >
//                         {isUp ? (
//                           <FaChevronUp size={12} />
//                         ) : (
//                           <FaChevronDown size={12} />
//                         )}
//                         <span>{item.change}</span>
//                       </div>
//                     </div>

//                     <div
//                       className="text-muted ms-5"
//                       style={{
//                         fontSize: "13px",
//                         marginTop: "2px",
//                       }}
//                     >
//                       {item.label}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </Card.Body>
//       </Card>
//     </div>
//   );
// }

// export default TotalProductPage;
