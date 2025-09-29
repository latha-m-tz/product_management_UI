import React, { useEffect, useRef, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

const qrCodeConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  formatsToSupport: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.AZTEC,
    Html5QrcodeSupportedFormats.CODABAR,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.MAXICODE,
    Html5QrcodeSupportedFormats.PDF_417,
    Html5QrcodeSupportedFormats.RSS_14,
    Html5QrcodeSupportedFormats.RSS_EXPANDED,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
  ],
};

function QrScannerPage({ show, onClose, onScanSuccess }) {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (show && !isScanning) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        qrCodeConfig,
        false
      );

      const onScanSuccessCallback = (decodedText) => {
        onScanSuccess(decodedText);
        html5QrcodeScanner.clear().then(() => {
          setIsScanning(false);
          onClose();
        });
      };

      const onScanErrorCallback = (errorMessage) => {
        console.warn("Scan error:", errorMessage);
      };

      html5QrcodeScanner.render(onScanSuccessCallback, onScanErrorCallback);
      scannerRef.current = html5QrcodeScanner;
      setIsScanning(true);
    }
  }, [show, isScanning, onClose, onScanSuccess]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        setIsScanning(false);
        onClose();
      });
    } else {
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Scan Code</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div id="qr-reader" style={{ width: "100%" }}></div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel Scan
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default QrScannerPage;