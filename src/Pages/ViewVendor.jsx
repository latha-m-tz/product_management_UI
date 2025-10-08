import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Button, Spinner } from "react-bootstrap";
import { API_BASE_URL } from "../api";

export default function ViewVendor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  setLoading(true);
  fetch(`${API_BASE_URL}/vendors/get/${id}`)
    .then(res => res.json())
.then(data => {
  setVendor({
    ...data,
    contact_persons: data.contact_persons ?? []
  });
})

    .catch(err => {
      console.error("Error fetching vendor:", err);
      setVendor(null);
    })
    .finally(() => setLoading(false));
}, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!vendor || Object.keys(vendor).length === 0) {
    return (
      <div className="container p-4">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <p className="text-muted mt-4">Vendor not found.</p>
      </div>
    );
  }

  const firstContact = vendor.contact_persons[0] ?? null;
  const otherContacts = vendor.contact_persons.slice(1);

  const InfoRow = ({ label, value }) => (
    <Row className="mb-2">
      <Col xs={5} md={4} style={{ color: "#6c757d", fontSize: "0.9rem" }}>
        {label}
      </Col>
      <Col xs={7} md={8} style={{ color: "#222", fontSize: "0.95rem" }}>
        {value || "-"}
      </Col>
    </Row>
  );

  const SectionCard = ({ title, children }) => (
    <Card className="mb-3 border-0">
      <Card.Body style={{ background: "#f6f7f9", borderRadius: "6px" }}>
        <h6 style={{ fontWeight: 600, marginBottom: "12px", color: "#222" }}>
          {title}
        </h6>
        {children}
      </Card.Body>
    </Card>
  );

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Overview</h5>
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </div>

      {/* Company Details */}
      <SectionCard title="Company Details">
        <Row>
          <Col md={6}>
            <InfoRow label="Company Name" value={vendor.vendor} />
            <InfoRow label="GST No" value={vendor.gst_no} />
            <InfoRow label="Email ID" value={vendor.email} />
            <InfoRow label="Pincode" value={vendor.pincode} />
            <InfoRow label="City" value={vendor.city} />
            <InfoRow label="State" value={vendor.state} />
          </Col>
          <Col md={6}>
            <InfoRow label="District" value={vendor.district} />
            <InfoRow label="Mobile no" value={vendor.mobile_no} />
            <InfoRow label="Address" value={vendor.address} />
          </Col>
        </Row>
      </SectionCard>

      {/* First Contact Person */}
      {firstContact && (
        <SectionCard title="Contact Person Details">
          <Row>
            <Col md={6}>
            <InfoRow 
  label="Name" 
  value={`${firstContact.name}${firstContact.is_main ? " (Main person)" : ""}`} 
/>

              <InfoRow label="Designation" value={firstContact.designation} />
              <InfoRow
                label="Status"
                value={
                  firstContact.status ? (
                    <span
                      style={{
                        color:
                          firstContact.status === "Active"
                            ? "green"
                            : "red",
                      }}
                    >
                      {firstContact.status}
                    </span>
                  ) : (
                    "-"
                  )
                }
              />
            </Col>
            <Col md={6}>
              <InfoRow label="Email ID" value={firstContact.email} />
              <InfoRow label="Mobile No" value={firstContact.mobile_no} />
              {/* <InfoRow label="Alt Mobile No" value={firstContact.alt_mobile_no} /> */}
            </Col>
          </Row>
        </SectionCard>
      )}

      {/* Other Contact Persons */}
      {otherContacts.length > 0 &&
        otherContacts.map((person, idx) => (
          <SectionCard key={idx} title={`Contact Person (${idx + 1})`}>
            <Row>
              <Col md={6}>
            <InfoRow 
  label="Name" 
 value={`${person.name}${(person.is_main || person.isMain) ? " (Main person)" : ""}`}

/>

                <InfoRow label="Designation" value={person.designation} />
                <InfoRow
                  label="Status"
                  value={
                    person.status ? (
                      <span
                        style={{
                          color: person.status === "Active" ? "green" : "red",
                        }}
                      >
                        {person.status}
                      </span>
                    ) : (
                      "-"
                    )
                  }
                />
              </Col>
              <Col md={6}>
                <InfoRow label="Email ID" value={person.email} />
                <InfoRow label="Mobile No" value={person.mobile_no} />
                {/* <InfoRow label="Alt Mobile No" value={person.alt_mobile_no} /> */}
              </Col>
            </Row>
          </SectionCard>
        ))}
    </div>
  );
}
