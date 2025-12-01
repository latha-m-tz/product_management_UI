// import React, { useEffect, useState } from "react";
// import { FaArrowUp, FaArrowDown, FaBell } from "react-icons/fa";
// import axios from "axios";
// import { API_BASE_URL } from "../api"; // ✅ corrected path
// import "./Componentstock.css";

// // Skeleton Loader
// const SkeletonCard = () => (
//   <div className="five-col mb-3">
//     <div className="d-flex">
//       <div
//         className="bg-light rounded me-2 mt-1"
//         style={{ width: 50, height: 50 }}
//       ></div>
//       <div
//         className="d-flex flex-column justify-content-center"
//         style={{ width: "100px" }}
//       >
//         <div
//           className="bg-light rounded mb-1"
//           style={{ height: "12px", width: "70%" }}
//         ></div>
//         <div
//           className="bg-light rounded mb-1"
//           style={{ height: "16px", width: "50%" }}
//         ></div>
//         <div
//           className="bg-light rounded"
//           style={{ height: "10px", width: "60%" }}
//         ></div>
//       </div>
//     </div>
//   </div>
// );

// const DashboardStats = () => {
//   const [pcbData, setPcbData] = useState(null);
//   const [serviceData, setServiceData] = useState([]);
//   const [loadingPcb, setLoadingPcb] = useState(true);
//   const [loadingService, setLoadingService] = useState(true);
//   const [pcbMessage, setPcbMessage] = useState(null);

//   useEffect(() => {
//     axios
//       .get(`${API_BASE_URL}/pcb/unconverted-count`)
//       .then((res) => {
//         if (res.data?.success) {
//           setPcbData(res.data);

//           if (res.data.unconverted_count > 0) {
//             setPcbMessage(
//               `There are ${res.data.unconverted_count} PCB boards purchased but not yet converted into products.`
//             );
//           } else {
//             setPcbMessage("All purchased PCB boards are already converted.");
//           }
//         } else {
//           setPcbData(null);
//           setPcbMessage(null);
//         }
//       })
//       .catch(() => {
//         setPcbData(null);
//         setPcbMessage(null);
//       })      
//       .finally(() => setLoadingPcb(false));
//   }, []);

//   useEffect(() => {
//     axios
//       .get(`${API_BASE_URL}/service/place-counts`)
//       .then((res) => {
//         if (res.data?.data) {
//           setServiceData(res.data.data);
//         } else {
//           setServiceData([]);
//         }
//       })
//       .catch(() => {
//         setServiceData([]);
//       })
//       .finally(() => setLoadingService(false));
//   }, []);

//   return (
//     <div className="row">
//       {/* Left Side → PCB Conversion */}
//       <div className="col-md-6">
//         <div className="card p-3 border-0 shadow-sm h-100">
//           <div className="d-flex justify-content-between align-items-center mb-2">
//             <div>
//               <h5 className="fw-semibold mb-1">Purchase to Assemble</h5>
//               <small className="text-muted d-block">Purchase vs Conversion</small>
//             </div>
//             {pcbMessage && (
//               <div
//                 className="d-flex align-items-center"
//                 style={{ maxWidth: "350px", textAlign: "right" }}
//               >
//                 <FaBell className="me-2" style={{ color: "#28a745" }} />
//                 <small
//                   className="fw-semibold"
//                   style={{ lineHeight: "1.2", color: "#28a745" }}
//                 >
//                   {pcbMessage}
//                 </small>
//               </div>
//             )}
//           </div>

//           <div className="stock-scroll-wrapper mt-3">
//             <div className="d-flex flex-wrap scroll-container">
//               {loadingPcb ? (
//                 <>
//                   {[...Array(3)].map((_, i) => (
//                     <SkeletonCard key={i} />
//                   ))}
//                 </>
//               ) : pcbData ? (
//                 <>
//                   {/* Total Purchased */}
//                   <div className="five-col mb-3">
//                     <div className="d-flex">
//                       <div
//                         className="bg-light rounded me-2 mt-1"
//                         style={{ width: 50, height: 50 }}
//                       ></div>
//                       <div className="d-flex flex-column justify-content-center">
//                         <small className="custom-small-text">Total Purchased</small>
//                         <div className="fw-bold fs-5">
//                           {pcbData.total_purchased} Boards
//                         </div>
//                         <small className="text-muted d-block">All boards bought</small>
//                         <FaArrowUp style={{ fontSize: "10px", color: "#313633ff" }} />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Converted */}
//                   <div className="five-col mb-3">
//                     <div className="d-flex">
//                       <div
//                         className="bg-light rounded me-2 mt-1"
//                         style={{ width: 50, height: 50 }}
//                       ></div>
//                       <div className="d-flex flex-column justify-content-center">
//                         <small className="custom-small-text">Converted</small>
//                         <div className="fw-bold fs-5">
//                           {pcbData.converted_count} Boards
//                         </div>
//                         <small className="text-muted d-block">Converted into products</small>
//                         <FaArrowUp style={{ fontSize: "10px", color: "#28a745" }} />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Unconverted */}
//                   <div className="five-col mb-3">
//                     <div className="d-flex">
//                       <div
//                         className="bg-light rounded me-2 mt-1"
//                         style={{ width: 50, height: 50 }}
//                       ></div>
//                       <div className="d-flex flex-column justify-content-center">
//                         <small className="custom-small-text">Unconverted</small>
//                         <div className="fw-bold fs-5">
//                           {pcbData.unconverted_count} Boards
//                         </div>
//                         <small
//                           className={`d-block ${
//                             pcbData.unconverted_count > 0
//                               ? "text-danger fw-semibold"
//                               : "text-muted"
//                           }`}
//                         >
//                           {pcbData.unconverted_count > 0
//                             ? "Still pending"
//                             : "All converted"}
//                         </small>
//                         {pcbData.unconverted_count > 0 ? (
//                           <FaArrowDown style={{ fontSize: "10px", color: "red" }} />
//                         ) : (
//                           <FaArrowUp style={{ fontSize: "10px", color: "#28a745" }} />
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </>
//               ) : (
//                 <div className="text-center w-100 py-4">
//                   <img
//                     src="/empty-box.png"
//                     alt="No data"
//                     style={{ width: "80px", height: "100px", opacity: 0.6 }}
//                   />
//                   <div className="text-muted mt-2">No PCB data available</div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right Side → Service VCI Counts */}
//       <div className="col-md-6">
//         <div className="card p-3 border-0 shadow-sm h-100">
//           <div className="d-flex justify-content-between align-items-center mb-2">
//             <div>
//               <h5 className="fw-semibold mb-1">Service VCI Counts</h5>
//               <small className="text-muted d-block">From → To Places</small>
//             </div>
//           </div>

//           <div className="stock-scroll-wrapper mt-3">
//             <div className="d-flex flex-wrap scroll-container">
//               {loadingService ? (
//                 <>
//                   {[...Array(4)].map((_, i) => (
//                     <SkeletonCard key={i} />
//                   ))}
//                 </>
//               ) : serviceData.length > 0 ? (
//                 serviceData.map((item, index) => (
//                   <div key={index} className="five-col mb-3">
//                     <div className="d-flex">
//                       <div
//                         className="bg-light rounded me-2 mt-1"
//                         style={{ width: 50, height: 50 }}
//                       ></div>
//                       <div className="d-flex flex-column justify-content-center">
//                         <small className="custom-small-text">
//                           {item.from_place} → {item.to_place}
//                         </small>
//                         <div className="fw-bold fs-5">{item.total} VCIs</div>
//                         <small className="text-muted d-block">Service count</small>
//                         <FaArrowUp style={{ fontSize: "10px", color: "#28a745" }} />
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-center w-100 py-4">
//                   <img
//                     src="/empty-box.png"
//                     alt="No service data"
//                     style={{ width: "80px", height: "100px", opacity: 0.6 }}
//                   />
//                   <div className="text-muted mt-2">No service records found</div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashboardStats;
