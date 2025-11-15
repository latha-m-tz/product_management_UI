import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api";
import { Form, Button, Spinner, Alert, Container } from "react-bootstrap";

const styles = {
  pageTitle: { fontWeight: 700, marginBottom: '30px', paddingLeft: '20px' },
  searchContainer: { width: '440px', maxWidth: '400px', margin: '0 auto 50px', padding: '1px', borderRadius: '1px' },
  searchInputGroup: { position: 'relative', flexGrow: 1, maxWidth: '500px', marginRight: '1px' },
  searchIcon: { position: 'absolute', top: '50%', left: '15px', transform: 'translateY(-50%)', color: '#2E3A5930', fontSize: '1.1rem', zIndex: 10 },
  searchInput: { paddingLeft: '40px', borderRadius: '10px', border: '1px solid #ced4da', height: '40px' },
  searchButton: { backgroundColor: '#2E3A5930', borderColor: '#2E3A5930', borderRadius: '10px', height: '40px', padding: '0 25px', fontWeight: 500 },
  timelineContainer: { width: '100%', overflowX: 'auto', paddingBottom: '20px' },
  timelineTrack: { display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', position: 'relative', padding: '0 20px' },
  timelineStage: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', margin: '0 10px 30px 10px' },
  stageHeader: { height: '40px', width: '100%', maxWidth: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', borderRadius: '4px', zIndex: 2, boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', backgroundColor: '#3F51B5' },
  connector: { position: 'absolute', top: '20px', left: '50%', width: 'calc(100% + 20px)', height: 0, transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', zIndex: 1, pointerEvents: 'none' },
  connectorDashLine: { borderTop: '2px dashed #3F51B5', width: '50%' },
  stageVerticalLine: { width: '2px', height: '30px', backgroundImage: 'repeating-linear-gradient(to bottom, #777, #777 5px, transparent 5px, transparent 10px)', zIndex: 1, marginTop: '5px' },
  stageContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px', width: '100%' },
  dataCard: { width: '240px', height: '262px', backgroundColor: '#2EA64F', color: '#FFFFFF', borderColor: '#2EA64F', border: '1px solid', borderRadius: '7px', padding: '10px', marginBottom: '15px', textAlign: 'left', fontSize: '0.85rem', lineHeight: 1.2, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  dataCardText: { marginBottom: '4px' },
  stageDate: {
    fontFamily: "Product Sans, sans-serif",
    color: "#2E3A59",
    borderTop: '1px dashed #cfd8dc',
    paddingTop: '5px',
    marginTop: '5px',
    textAlign: 'right',
  },
  moreButton: {
    backgroundColor: '#2E3A59',
    color: 'white',
    border: 'none',
    marginTop: '5px',
  },
  cardTextStyle: {
    fontFamily: "Product Sans, sans-serif",
    fontSize: "0.85rem",
  },
  cardHeading: {
    fontFamily: "Product Sans, sans-serif",
    fontSize: "0.98rem",
    color: "#2E3A59",
    fontWeight: "bold",
    marginBottom: "6px"
  },

};

const TrackingPage = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const defaultTimelineStructure = [
    { stage: "SPARE PARTS PURCHASE", items: [] },
    { stage: "INVENTORY", items: [] },
    { stage: "SALE", items: [] },
    { stage: "SERVICE", items: [] },
  ];
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setAuthToken(token);
  }, []);
  useEffect(() => {
    const savedSerial = localStorage.getItem("lastSerialNumber");
    if (savedSerial) {
      setSerialNumber(savedSerial);
    }
  }, []);

  useEffect(() => {
    if (serialNumber) {
      localStorage.setItem("lastSerialNumber", serialNumber);
    }
  }, [serialNumber]);

  useEffect(() => {
    if (serialNumber) {
      fetchTimeline();
    }
  }, [serialNumber]);

  const getStageColor = (stage) => "#2E3A59";
  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const fetchTimeline = async () => {
    if (!serialNumber) { setTimeline([]); return; }
    setLoading(true); setError("");
    try {
      const response = await api.get(`/tracking-timeline/${serialNumber}`);
      const data = response.data;

      const saleItems = data.sale
        ? data.sale.flatMap((sale) => sale.items.map((item) => ({
          ...item,
          sale_id: sale.id,
          challan_no: sale.challan_no || "N/A",
          challan_date: sale.challan_date || "N/A",
          customer: sale.customer?.customer || "N/A",
          created_at: sale.created_at || "N/A",
          serial_number: serialNumber,
        })))
        : [];

      const serviceItems = data.service_vci
        ? data.service_vci.map((item) => ({
          ...item,
          challan_no: item.challan_no || "N/A",
          challan_date: item.challan_date || "N/A",
          vendor: item.vendor_name || "N/A",
          product: item.product_name || "N/A",
          service_type: item.service_type || "N/A",
          created_at: item.created_at || "N/A",
          serial_number: serialNumber,
        }))
        : [];

      setTimeline([
        { stage: "SPARE PARTS PURCHASE", items: data.spare_parts?.map(i => ({ ...i, serial_number: serialNumber })) || [] },
        { stage: "INVENTORY", items: data.inventory?.map(i => ({ ...i, serial_number: serialNumber })) || [] },
        { stage: "SALE", items: saleItems },
        { stage: "SERVICE", items: serviceItems },
      ]);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch tracking timeline. Please try again.");
      setTimeline(defaultTimelineStructure);
    } finally { setLoading(false); }
  };

  // const handleMoreDetails = (stage, item) => {
  //   switch (stage) {
  //     case "SPARE PARTS PURCHASE":
  //       navigate(`/spare-partsPurchase`);
  //       break;
  //     case "INVENTORY":
  //       navigate(`/assemble`);
  //       break;
  //     case "SALE":
  //       navigate(`/sales-order`);
  //       break;
  //     case "SERVICE":
  //       navigate(`/service-product`);
  //       break;
  //     default:
  //       navigate(`/details/${item.serial_number}`);
  //   }
  // };

  const renderCardContent = (stage, item, idx) => {
    const defaultDate = formatDateTime(item.created_at);
    const goToChallan = () => {
      switch (stage) {
        case "SPARE PARTS PURCHASE":
          if (!item.purchase_id) {
            console.error("purchase_id is missing:", item);
            return;
          }
          navigate(`/spare-partsPurchase/view/${item.purchase_id}`);
          break;

        case "SALE":
          navigate(`/sales-order-overview/${item.sale_id}`);
          break;

        case "SERVICE":
          navigate(`/service_vci/view/${item.service_id}`);
          break;

        default:
          console.warn("No matching route for this stage");
      }
    };

    return (
      <div style={styles.cardTextStyle}>
        {stage === "SPARE PARTS PURCHASE" && (
          <>
            <p style={styles.cardHeading}>Spare Parts Purchase</p>
            <p>
              <b>Challan No:</b>{" "}
              <span style={{ color: "#e81a1aff", cursor: "pointer" }} onClick={goToChallan}>
                {item.challan_no}
              </span>
            </p>
            <p><b>Challan Date:</b> {item.challan_date}</p>
            <p><b>Vendor:</b> {item.vendor_name}</p>
            <p><b>Product:</b> {item.product_name}</p>
          </>
        )}

        {stage === "INVENTORY" && (
          <>
            <p style={styles.cardHeading}>Assemble</p>
            <p><b>Product:</b> {item.product_name || "N/A"}</p>
            <p><b>Tested_by:</b> {item.tested_by || "N/A"}</p>
            <p><b>Tested_Status:</b> {item.tested_status || "N/A"}</p>
            <p><b>Firmware Version:</b> {item.firmware_version || "N/A"}</p>
          </>
        )}

        {stage === "SALE" && (
          <>
            <p style={styles.cardHeading}>Sale Record</p>
            <p>
              <b>Challan No:</b>{" "}
              <span
                style={{ color: "#e81a1aff", cursor: "pointer" }}
                onClick={goToChallan}
              >
                {item.challan_no || "N/A"}
              </span>
            </p>
            <p>
              <b>Challan Date:</b> {item.challan_date || "N/A"}</p>
            <p><b>Customer:</b> {item.customer || "N/A"}</p>
            <p><b>Product:</b> {item.product || "N/A"}</p>
          </>
        )}

        {stage === "SERVICE" && (
          <>
            <p style={styles.cardHeading}>
              {idx === 0 ? "Service Request" : "Service Delivery"}
            </p>            <p><b>Challan No:</b> {item.challan_no}</p>
            <p><b>Challan Date:</b> {item.challan_date || "N/A"}</p>
            <p><b>Tracking NO:</b> {item.tracking_number || "N/A"}</p>
            <p><b>Vendor:</b> {item.vendor || "N/A"}</p>
          </>
        )}

        <p style={styles.stageDate}>{defaultDate}</p>
      </div>
    );
  };

  return (
    <Container fluid className="tracking-page pt-4">
      <h4 style={styles.pageTitle}>Tracking Timeline</h4>

      <div style={styles.searchContainer}>
        <Form className="d-flex justify-content-center align-items-center" onSubmit={(e) => { e.preventDefault(); fetchTimeline(); }}>
          <div style={styles.searchInputGroup}>
            <span style={styles.searchIcon}>Q</span>
            <Form.Control
              type="text"
              placeholder="Search Product Serial"
              value={serialNumber}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,6}$/.test(value)) {
                  setSerialNumber(value);
                }
              }}
              style={styles.searchInput}
              maxLength={6} 
            />

          </div>
          <Button
            type="submit"
            style={{
              backgroundColor: "#2E3A59",
              border: "1px solid #2E3A59",
              borderRadius: "10px",
              height: "40px",
              padding: "0 25px",
              fontWeight: 500,
              color: "white",
            }}
          >
            Search
          </Button>


        </Form>
      </div>

      {loading && <div className="text-center my-5"><Spinner animation="border" /><p className="mt-2 text-muted">Loading...</p></div>}
      {error && <Alert variant="danger" className="my-3 mx-auto" style={{ maxWidth: '800px' }}>{error}</Alert>}

      {!loading && timeline.length > 0 && (
        <div style={styles.timelineContainer}>
          <div style={styles.timelineTrack}>
            {timeline.map((step, index) => {
              const stageColor = getStageColor(step.stage);
              const isLast = index === timeline.length - 1;
              const hasContent = step.items.length > 0;

              return (
                <div key={index} style={styles.timelineStage}>
                  <div style={{ ...styles.stageHeader, backgroundColor: stageColor }}>
                    <p className="mb-0">{step.stage.replace('-', ' ')}</p>
                  </div>

                  {!isLast && (
                    <div style={styles.connector}>
                      <div style={{ ...styles.connectorDashLine, borderTopColor: stageColor }}></div>
                      <div style={{ ...styles.connectorDashLine, borderTopColor: stageColor }}></div>
                    </div>
                  )}

                  <div style={styles.stageVerticalLine}></div>

                  <div style={styles.stageContent}>
                    {hasContent
                      ? step.items.map((item, idx) => (
                        <div key={idx} className="shadow-sm" style={{ ...styles.dataCard, borderColor: stageColor }}>
                          {renderCardContent(step.stage, item, idx)}
                        </div>
                      ))
                      : (
                        <div className="shadow-sm" style={{ ...styles.dataCard, backgroundColor: '#f8f9fa', border: '1px solid #ced4da', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p className="text-center text-muted small mb-0">No records found.</p>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && timeline.length === 0 && !error && (
        <p className="text-muted mt-5 text-center">Enter a serial number above to track the timeline.</p>
      )}
    </Container>
  );
};

export default TrackingPage;
