import React from "react";
import { Spinner } from "react-bootstrap";
import "./GlobalLoader.css";

export default function GlobalLoader({ show }) {
  if (!show) return null;

  return (
    <div className="global-loader">
      <Spinner animation="border" variant="light" />
      <p className="mt-2">Please wait...</p>
    </div>
  );
}
