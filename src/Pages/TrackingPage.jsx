import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, Button, Spinner, Alert, Container } from "react-bootstrap";
import { API_BASE_URL } from "../api";

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
    fontSize: '0.75rem',
    color: 'white',
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
};

const TrackingPage = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const defaultTimelineStructure = [
    { stage: "SPARE PARTS", items: [] },
    { stage: "INVENTORY", items: [] },
    { stage: "SALE", items: [] },
    { stage: "SERVICE", items: [] },
  ];

  const getStageColor = (stage) => "#2E3A59";

  const fetchTimeline = async () => {
    if (!serialNumber) { setTimeline([]); return; }
    setLoading(true); setError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/tracking-timeline/${serialNumber}`);
      const data = response.data;

      const saleItems = data.sale
        ? data.sale.flatMap((sale) => sale.items.map((item) => ({
          ...item,
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
        { stage: "SPARE PARTS", items: data.spare_parts?.map(i => ({ ...i, serial_number: serialNumber })) || [] },
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

  const handleMoreDetails = (stage, item) => {
    switch (stage) {
      case "SPARE PARTS":
        navigate(`/spare-partsPurchase`);
        break;
      case "INVENTORY":
        navigate(`/assemble`);
        break;
      case "SALE":
        navigate(`/sales-order`);
        break;
      case "SERVICE":
        navigate(`/service-product`);
        break;
      default:
        navigate(`/details/${item.serial_number}`);
    }
  };

  const renderCardContent = (stage, item) => {
    const defaultDate = item.created_at || "N/A";

    return (
      <>
        {stage === "SPARE PARTS" && (
          <>
            <p style={styles.dataCardText}><b>Spare Parts</b></p>
            <p className="small"><b>Challan No:</b> {item.challan_no}</p>
            <p className="small"><b>Challan Date:</b> {item.challan_date}</p>
            <p className="small"><b>Vendor:</b> {item.vendor_name}</p>
            <p className="small"><b>Product:</b> {item.product_name}</p>
          </>
        )}

        {stage === "INVENTORY" && (
          <>
            <p style={styles.dataCardText}><b>Assembly</b></p>
            <p className="small"><b>Product Type:</b> {item.product_type || "N/A"}</p>
            <p className="small"><b>Product:</b> {item.product_name || "N/A"}</p>
            <p className="small"><b>Firmware Version:</b> {item.firmware_version || "N/A"}</p>
          </>
        )}

        {stage === "SALE" && (
          <>
            <p style={styles.dataCardText}><b>Sale Record</b></p>
            <p className="small"><b>Challan No:</b> {item.challan_no || "N/A"}</p>
            <p className="small"><b>Challan Date:</b> {item.challan_date || "N/A"}</p>
            <p className="small"><b>Customer:</b> {item.customer || "N/A"}</p>
            <p className="small"><b>Product:</b> {item.product || "N/A"}</p>
          </>
        )}

        {stage === "SERVICE" && (
          <>
            <p style={styles.dataCardText}><b>Service Request</b></p>
            <p className="small"><b>Challan No:</b> {item.challan_no}</p>
            <p className="small"><b>Challan Date:</b> {item.challan_date || "N/A"}</p>
            <p className="small"><b>From:</b> {item.from_place || "N/A"}</p>
            <p className="small"><b>To:</b> {item.to_place || "N/A"}</p>
            <p className="small"><b>Courier:</b> {item.courier_name || "N/A"}</p>
          </>
        )}

        <p style={styles.stageDate}>{defaultDate}</p>
        <Button
          size="sm"
          style={{ backgroundColor: '#2E3A59', color: 'white', border: 'none' }}
          onClick={() => handleMoreDetails(stage, item)}
        >
          More Details
        </Button>      </>
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
                // Allow only digits and limit to 6 characters
                if (/^\d{0,6}$/.test(value)) {
                  setSerialNumber(value);
                }
              }}
              style={styles.searchInput}
              maxLength={6} // extra safety
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
                          {renderCardContent(step.stage, item)}
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
