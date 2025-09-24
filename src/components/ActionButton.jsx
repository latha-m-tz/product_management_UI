// src/components/ActionButtons.jsx
import React from "react";
import { Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function ActionButtons({ onPdf, onEdit, onDelete, onReturn, onTrack, onRepair, onUrgent, urgentStatus, onWarranty }) {
  // Define a consistent style for all action buttons
  const buttonStyle = {
    borderColor: "#2E3A59",
    color: "#2E3A59",
    backgroundColor: "transparent",
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  };

  // Define a distinct style for the urgent button
  const urgentButtonStyle = {
    ...buttonStyle, // Start with the base style
    borderColor: urgentStatus === 'yes' ? "#ffc107" : "#6c757d", // Change border color based on status
    color: urgentStatus === 'yes' ? "#ffc107" : "#6c757d",      // Change icon color based on status
  };

  return (
    <>
      {onPdf && (
        <Button
          variant="outline-primary"
          size="sm"
          className="me-1"
          onClick={onPdf}
          style={buttonStyle}
        >
          <i className="bi bi-file-earmark-pdf"></i>
        </Button>
      )}

      {onEdit && (
        <Button
          variant="outline-primary"
          size="sm"
          className="me-1"
          onClick={onEdit}
          style={buttonStyle}
        >
          <i className="bi bi-pencil-square"></i>
        </Button>
      )}

      {onDelete && (
        <Button
          variant="outline-primary"
          size="sm"
          className="me-1"
          onClick={onDelete}
          style={buttonStyle}
        >
          <i className="bi bi-trash"></i>
        </Button>
      )}

      {onReturn && (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={onReturn}
          title="Return Purchase"
          className="me-1"
          style={buttonStyle}
        >
          <i className="bi bi-arrow-return-left"></i>
        </Button>
      )}

      {onTrack && (
        <Button
          size="sm"
          variant="outline-primary"
          title="Track"
          onClick={onTrack}
          className="me-1"
          style={buttonStyle}
        >
          <i className="bi bi-geo-alt"></i>
        </Button>
      )}

      {onRepair && (
        <Button
          size="sm"
          variant="outline-primary"
          title="Repair"
          onClick={onRepair}
          className="me-1"
          style={buttonStyle}
        >
          <i className="bi bi-tools"></i>
        </Button>
      )}
      
      {onUrgent && (
        <Button
          variant="outline-primary"
          size="sm"
          className="me-1"
          onClick={onUrgent}
          title={urgentStatus === 'yes' ? 'Mark as Not Urgent' : 'Mark as Urgent'}
          style={urgentButtonStyle}
        >
          <i className="bi bi-exclamation-circle-fill"></i>
        </Button>
      )}

      {onWarranty && (
        <Button
          size="sm"
          variant="outline-primary"
          title="Warranty"
          onClick={onWarranty}
          className="me-1"
          style={{
            borderColor: "#2E3A59",
            color: "#2E3A59",
            backgroundColor: "transparent",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
        >
          <i className="bi bi-shield-check"></i>
        </Button>
      )}
    </>
  );
}
