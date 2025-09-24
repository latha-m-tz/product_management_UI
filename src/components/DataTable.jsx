import React from "react";
import { Table, Spinner, Button } from "react-bootstrap";

export default function DataTable({
  loading,
  data,
  columns,
  page,
  perPage,
  headerStyle,
  onEdit,
  onDelete,
  emptyMessage = "No records found",
}) {
  return (
    <div className="table-responsive">
      <Table className="table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
        <thead
          style={{
            backgroundColor: "#2E3A59",
            color: "white",
            fontSize: "0.82rem",
            height: "40px",
            verticalAlign: "middle",
          }}
        >
          <tr>
            <th style={{ ...headerStyle, width: "60px", textAlign: "center" }}>S.No</th>
            {columns.map((col, idx) => (
              <th key={idx} style={headerStyle}>
                {col.header}
              </th>
            ))}
            <th style={{ ...headerStyle, width: "130px", textAlign: "center" }}>Action</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + 2} className="text-center py-4">
                <Spinner animation="border" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 2} className="text-center py-4 text-muted">
                <img
                  src="/empty-box.png"
                  alt={emptyMessage}
                  style={{ width: "80px", opacity: 0.6 }}
                />
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={row.id}>
                <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                {columns.map((col, idx) => (
                  <td key={idx} style={col.style || {}}>
                    {typeof col.accessor === "function"
                      ? col.accessor(row)
                      : row[col.accessor]}
                  </td>
                ))}
                <td className="text-center">
                  {onEdit && (
                    <Button
                      variant=""
                      size="sm"
                      className="me-1"
                      onClick={() => onEdit(row)}
                      style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onDelete(row)}
                      style={{
                        borderColor: "#2E3A59",
                        color: "#2E3A59",
                        backgroundColor: "transparent",
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
