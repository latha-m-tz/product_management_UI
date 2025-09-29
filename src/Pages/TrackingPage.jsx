import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Spinner, Alert, Container } from "react-bootstrap";
// NOTE: Assuming API_BASE_URL is defined somewhere accessible, 
// using a placeholder for standalone use.
const API_BASE_URL = "http://127.0.0.1:8000/api"; 

// --- START: Embedded CSS Styles ---
const styles = {
    pageTitle: {
        fontWeight: 700,
        marginBottom: '30px',
        paddingLeft: '20px',
    },
    searchContainer: {
        width: '440px',
        maxWidth: '400px',
        margin: '0 auto 50px ',
        padding: '1px',
        borderRadius: '1px',
    },
    searchInputGroup: {
        position: 'relative',
        flexGrow: 1,
        maxWidth: '500px',
        marginRight: '1px',
    },
    searchIcon: {
        position: 'absolute',
        top: '50%',
        left: '15px',
        transform: 'translateY(-50%)',
        color: '#2E3A5930',
        fontSize: '1.1rem',
        zIndex: 10,
    },
    searchInput: {
        paddingLeft: '40px',
        borderRadius: '10px',
        border: '1px solid #ced4da',
        height: '40px',
    },
    searchButton: {
        backgroundColor: '#2E3A5930',
        borderColor: '#2E3A5930',
        borderRadius: '10px',
        height: '40px',
        padding: '0 25px',
        fontWeight: 500,
    },
    timelineContainer: {
        width: '100%',
        overflowX: 'auto',
        paddingBottom: '20px',
    },
    timelineTrack: {
        display: 'flex',
        justifyContent: 'flex-start', // allow vertical stacking if needed
        flexWrap: 'wrap', // wrap stages to next line if too long
        position: 'relative',
        padding: '0 20px',
    },
    timelineStage: {
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        margin: '0 10px 30px 10px', // spacing between cards
    },
    stageHeader: {
        height: '40px',
        width: '100%',
        maxWidth: '240px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '4px',
        zIndex: 2,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#3F51B5',
    },
    connector: {
        position: 'absolute',
        top: '20px',
        left: '50%',
        width: 'calc(100% + 20px)',
        height: 0,
        transform: 'translateX(-50%)',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1,
        pointerEvents: 'none',
    },
    connectorDashLine: {
        borderTop: '2px dashed #3F51B5',
        width: '50%',
    },
    stageVerticalLine: {
        width: '2px',
        height: '30px',
        backgroundImage: 'repeating-linear-gradient(to bottom, #777, #777 5px, transparent 5px, transparent 10px)',
        zIndex: 1,
        marginTop: '5px',
    },
    stageContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '10px',
        width: '100%',
    },
    dataCard: {
        width: '240px',
        height: '262px',
        backgroundColor: '#2EA64F',
        color: '#FFFFFF',
        borderColor: '#2EA64F',
        border: '1px solid',
        borderRadius: '7px',
        padding: '10px',
        marginBottom: '15px',
        textAlign: 'left',
        fontSize: '0.85rem',
        lineHeight: 1.2,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    dataCardText: {
        marginBottom: '4px',
    },
    stageDate: {
        fontSize: '0.75rem',
        color: '#607D8B',
        borderTop: '1px dashed #cfd8dc',
        paddingTop: '5px',
        marginTop: '5px',
        textAlign: 'right',
    },
    numberBox: {
        position: 'absolute',
        top: '-50px',
        right: '-130px',
        backgroundColor: 'white',
        color: '#3F51B5',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #3F51B5',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 10,
    }
};
// --- END: Embedded CSS Styles ---

const TrackingPage = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [timeline, setTimeline] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultTimelineStructure = [
    { stage: "SPARE PARTS", items: [] },
    { stage: "INVENTORY", items: [] },
    { stage: "SALE", items: [] },
    { stage: "SERVICE", items: [] },
    { stage: "SERVICE-DELIVERY", items: [] },
  ];

  const getStageColor = (stage) => {
    switch (stage) {
      case "SPARE PARTS":
        return "#2E3A59";
      case "INVENTORY":
        return "#2E3A59";
      case "SALE":
        return "#2E3A59";
      case "SERVICE":
        return "#2E3A59";
      case "SERVICE-DELIVERY":
        return "#2E3A59";
      default:
        return "#2E3A59";
    }
  };

  const fetchTimeline = async () => {
  if (!serialNumber) {
    setTimeline([]);
    return;
  }

  setLoading(true);
  setError("");

  try {
    const response = await axios.get(`${API_BASE_URL}/tracking-timeline/${serialNumber}`);
    const data = response.data;

    // Convert sale object to array for timeline
    const saleItems = data.sale
      ? data.sale.items.map((item) => ({
          ...item,
          challan_no: data.sale.challan_no,
          challan_date: data.sale.challan_date,
          customer: data.sale.customer.customer, // customer name
          created_at: data.sale.created_at,
        }))
      : [];

      const serviceItems = data.service_vci
  ? data.service_vci.map(item => ({
      ...item,
      challan_no: item.challan_no || "N/A",
      challan_date: item.challan_date || "N/A",
      vendor: item.vendor_name || "N/A",   
      product: item.product_name || "N/A",    
      service_type: item.service_type || "N/A", 
      created_at: item.created_at || "N/A",
    }))
  : [];


    const fetchedTimeline = [
      { stage: "SPARE PARTS", items: data.spare_parts || [] },
      { stage: "INVENTORY", items: data.inventory || [] },
      { stage: "SALE", items: saleItems },
      { stage: "SERVICE", items: data.service_vci || [] },
      { stage: "SERVICE-DELIVERY", items: [] },
    ];

    setTimeline(fetchedTimeline);
  } catch (err) {
    console.error(err);
    setError("Failed to fetch tracking timeline. Please try again.");
    setTimeline(defaultTimelineStructure);
  } finally {
    setLoading(false);
  }
};

  const renderCardContent = (stage, item) => {
    const challanNo = item.challan_no || "N/A";
    const defaultDate = item.created_at || "N/A";

    switch (stage) {
      case "SPARE PARTS":
      case "SERVICE-DELIVERY":
        return (
          <>
            <p className="mb-1" style={styles.dataCardText}><b>Spare Parts</b></p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Challan No:</b> {challanNo}</p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Challan Date:</b> {item.challan_date || "N/A"}</p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Vendor:</b> {item.vendor_name || "N/A"}</p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Product:</b> {item.product_name || "N/A"}</p>
            <p className="mb-0 small pt-2" style={styles.stageDate}>{defaultDate}</p>
          </>
        );

      case "INVENTORY":
        return (
          <>
            <p className="mb-1" style={styles.dataCardText}><b>Assembly</b></p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Product Type:</b> {item.product_type || "N/A"}</p>
            <p className="mb-1 small" style={styles.dataCardText}><b>product:</b> {item.product_name || "N/A"}</p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Firmware Version:</b> {item.firmware_version || "N/A"}</p>
            <p className="mb-0 small pt-2" style={styles.stageDate}>{defaultDate}</p>
          </>
        );

      case "SALE":
  return (
    <>
      <p className="mb-1" style={styles.dataCardText}><b>Sale Record</b></p>
      <p className="mb-1 small" style={styles.dataCardText}><b>Challan No:</b> {item.challan_no || "N/A"}</p>
      <p className="mb-1 small" style={styles.dataCardText}><b>Challan Date:</b> {item.challan_date || "N/A"}</p>
      <p className="mb-1 small" style={styles.dataCardText}><b>Customer:</b> {item.customer || "N/A"}</p>
      <p className="mb-1 small" style={styles.dataCardText}><b>Product:</b> {item.product || "N/A"}</p>
      <p className="mb-0 small pt-2" style={styles.stageDate}>{item.created_at || "N/A"}</p>
    </>
  );

      case "SERVICE":
        return (
          <>
            <p className="mb-1" style={styles.dataCardText}><b>Service Request</b></p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Challan No:</b> {item.challanNo}</p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Challan Date:</b> {item.challan_date || "N/A"}</p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Vendor:</b> {item.vendor || "N/A"}</p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Service Type:</b> {item.service_type || "N/A"}</p>
            <p className="mb-1 small" style={styles.dataCardText}><b>Product:</b> {item.product || "N/A"}</p>
            <p className="mb-0 small pt-2" style={styles.stageDate}>{item.created_at || "N/A"}</p>
          </>
        );

      default:
        return <p className="small text-muted mb-0">No data available for this stage.</p>;
    }
  };

  return (
    <Container fluid className="tracking-page pt-4">
      <h4 style={styles.pageTitle}>Tracking Timeline</h4>

      <div style={styles.searchContainer}>
        <Form
          className="d-flex justify-content-center align-items-center"
          onSubmit={(e) => {
            e.preventDefault();
            fetchTimeline();
          }}
        >
          <div style={styles.searchInputGroup}>
            <span style={styles.searchIcon}>Q</span> 
            <Form.Control
              type="text"
              placeholder="Search Product Serial"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <Button variant="primary" style={styles.searchButton} type="submit">
            Search
          </Button>
        </Form>
      </div>
      
      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Loading...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="my-3 mx-auto" style={{maxWidth: '800px'}}>
          {error}
        </Alert>
      )}

      {!loading && timeline.length > 0 && (
        <div style={styles.timelineContainer}>
          <div style={styles.timelineTrack}>
            {timeline.map((step, index) => {
              const stageColor = getStageColor(step.stage);
              const isLast = index === timeline.length - 1;
              const hasContent = step.items.length > 0;

              return (
                <div key={index} style={styles.timelineStage}>
                  <div 
                    style={{ ...styles.stageHeader, backgroundColor: stageColor }}
                  >
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
                    {index === 1 && (
                      <div style={styles.numberBox}>
                        <p className="mb-0">91 x 0</p>
                      </div>
                    )}
                    
                    {hasContent ? (
                      step.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="shadow-sm"
                          style={{ ...styles.dataCard, borderColor: stageColor }}
                        >
                          {renderCardContent(step.stage, item)}
                        </div>
                      ))
                    ) : (
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
