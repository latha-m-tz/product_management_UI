import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Table } from "react-bootstrap";

export default function PCBSerials() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serials, setSerials] = useState([]);
  const [sparepart, setSparepart] = useState(null);

  useEffect(() => {
    if (location.state?.sparepart) {
      const sp = location.state.sparepart;
      setSparepart(sp);

      const fromNum = parseInt(sp.from_serial, 10);
      const toNum = parseInt(sp.to_serial, 10);
      const serialList = [];

      if (!isNaN(fromNum) && !isNaN(toNum) && fromNum <= toNum) {
        for (let i = fromNum; i <= toNum; i++) {
          serialList.push({
            serial: i.toString().padStart(sp.from_serial.length, "0"),
            product_name: sp.product_name || "N/A", // pass product_name from form
          });
        }
      }

      setSerials(serialList);
    }
  }, [location.state]);

  return (
    <div className="container mt-3">
      <Button variant="secondary" className="mb-3" onClick={() => navigate(-1)}>
        Back
      </Button>

      <h4>PCB Serial Numbers {sparepart?.sparepart_id && `for Sparepart ID: ${sparepart.sparepart_id}`}</h4>

      {serials.length ? (
        <Table bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Product Name</th>
              <th>Serial Number</th>
            </tr>
          </thead>
          <tbody>
            {serials.map((s, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{s.product_name}</td>
                <td>{s.serial}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>No serial numbers found in the range.</p>
      )}
    </div>
  );
}
