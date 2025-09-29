import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Row, Col } from "react-bootstrap";


export default function SerialSelectionModal({
  show,
  onClose,
  availableSerials = [],
  selectedSerials = [],
  onConfirm,
}) {
  const [localSelected, setLocalSelected] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [unselectStart, setUnselectStart] = useState("");
  const [unselectEnd, setUnselectEnd] = useState("");

  const cleanAvailableSerials = [...new Set(availableSerials.filter(Boolean))];
// --- inside component state ---
const [currentPage, setCurrentPage] = useState(1);
const pageSize = 10; // number of serials per page

// derived values
const totalPages = Math.ceil(
  (cleanAvailableSerials.length + localSelected.filter((s) => !cleanAvailableSerials.includes(s)).length) / pageSize
);

const paginatedSerials = cleanAvailableSerials.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);

const manualSerials = localSelected.filter((s) => !cleanAvailableSerials.includes(s));
const paginatedManuals = manualSerials.slice(
  Math.max(0, (currentPage - 1) * pageSize - cleanAvailableSerials.length),
  Math.max(0, currentPage * pageSize - cleanAvailableSerials.length)
);


  useEffect(() => {
    if (show) {
      const cleanSelected = [...new Set((selectedSerials || []).filter(Boolean))];
      setLocalSelected(cleanSelected);
      setManualInput("");
      setUnselectStart("");
      setUnselectEnd("");
    }
  }, [show, selectedSerials]);

  const toggleSerial = (serial) => {
    setLocalSelected((prev) =>
      prev.includes(serial) ? prev.filter((s) => s !== serial) : [...prev, serial]
    );
  };

const handleManualAdd = () => {
  if (!manualInput.trim()) return;

  const manualSerials = manualInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Check for duplicates
  const duplicates = manualSerials.filter((s) => localSelected.includes(s));
  if (duplicates.length > 0) {
    alert(`Duplicate serial(s) not allowed: ${duplicates.join(", ")}`);
    return;
  }

  setLocalSelected((prev) => [...new Set([...prev, ...manualSerials])]);
  setManualInput("");
};


  
const handleConfirm = () => {
  // Check for duplicates in localSelected
  const allSelected = [...localSelected];
  const duplicates = allSelected.filter((item, index) => allSelected.indexOf(item) !== index);

  if (duplicates.length > 0) {
    alert(`Duplicate serial(s) not allowed: ${[...new Set(duplicates)].join(", ")}`);
    return;
  }

  onConfirm(localSelected);
};

  const handleSelectAll = () => setLocalSelected([...cleanAvailableSerials]);
  const handleDeselectAll = () => setLocalSelected([]);

  const handleBulkUnselect = (from, to) => {
    const parseSerial = (serial) => {
      const match = serial.trim().match(/^(.*?)(\d+)$/);
      if (!match) return null;
      return { prefix: match[1].replace(/[\s\-]/g, "").toUpperCase(), num: parseInt(match[2], 10) };
    };

    const compareSerials = (s, from, to) => {
      const ps = parseSerial(s);
      const pf = parseSerial(from);
      const pt = parseSerial(to);
      if (!ps || !pf || !pt) return false;
      if (ps.prefix !== pf.prefix || ps.prefix !== pt.prefix) return false;
      return ps.num >= pf.num && ps.num <= pt.num;
    };

    const toRemove = cleanAvailableSerials.filter((s) => compareSerials(s, from, to));
    setLocalSelected((prev) => prev.filter((s) => !toRemove.includes(s)));
    setUnselectStart("");
    setUnselectEnd("");
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Select Serial Numbers</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {cleanAvailableSerials.length === 0 ? (
          <p>No serials available.</p>
        ) : (
          <>
            {/* Select / Deselect All */}
            <Row className="mb-3">
              <Col>
                <Button size="sm" variant="success" onClick={handleSelectAll}>
                  Select All
                </Button>{" "}
                <Button size="sm" variant="secondary" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </Col>
            </Row>

            {/* Manual add */}
            <Row className="mb-3">
              <Col>
                <Form className="d-flex">
                  <Form.Control
                    size="sm"
                    placeholder="Add serials (comma separated)"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                  />
                  <Button size="sm" variant="secondary" className="ms-2" onClick={handleManualAdd}>
                    Add
                  </Button>
                </Form>
              </Col>
            </Row>

            {/* Bulk deselect From→To */}
            <Row className="mb-3">
              <Col>
                <Form.Select
                  size="sm"
                  value={unselectStart}
                  onChange={(e) => setUnselectStart(e.target.value)}
                >
                  <option value="">Unselect From</option>
                  {cleanAvailableSerials.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col>
                <Form.Select
                  size="sm"
                  value={unselectEnd}
                  onChange={(e) => setUnselectEnd(e.target.value)}
                  disabled={!unselectStart}
                >
                  <option value="">To</option>
                  {cleanAvailableSerials.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs="auto">
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleBulkUnselect(unselectStart, unselectEnd)}
                  disabled={!unselectStart || !unselectEnd}
                >
                  X
                </Button>
              </Col>
            </Row>

            {/* Table */}
            {/* Table */}
<Table striped bordered hover size="sm">
  <thead>
    <tr>
      <th>#</th>
      <th>Serial Number</th>
      <th>Select</th>
    </tr>
  </thead>
  <tbody>
    {paginatedSerials.map((s, idx) => (
      <tr key={s}>
        <td>{(currentPage - 1) * pageSize + idx + 1}</td>
        <td>{s}</td>
        <td>
          <Form.Check
            type="checkbox"
            checked={localSelected.includes(s)}
            onChange={() => toggleSerial(s)}
          />
        </td>
      </tr>
    ))}
    {paginatedManuals.map((s, idx) => (
      <tr key={`manual-${s}`}>
        <td>{cleanAvailableSerials.length + (currentPage - 1) * pageSize + idx + 1}</td>
        <td>{s}</td>
        <td>
          <Form.Check
            type="checkbox"
            checked={localSelected.includes(s)}
            onChange={() => toggleSerial(s)}
          />
        </td>
      </tr>
    ))}
  </tbody>
</Table>

{/* Pagination controls */}
{totalPages > 1 && (
  <div className="d-flex justify-content-between align-items-center mt-2">
    <Button
      size="sm"
      variant="outline-secondary"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
    >
      Previous
    </Button>
    <span>
      Page {currentPage} of {totalPages}
    </span>
    <Button
      size="sm"
      variant="outline-secondary"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
    >
      Next
    </Button>
  </div>
)}
</>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
  <Button variant="primary" onClick={handleConfirm}>
  Confirm
</Button>

      </Modal.Footer>
    </Modal>
  );
}
