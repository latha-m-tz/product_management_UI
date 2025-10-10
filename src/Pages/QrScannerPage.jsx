import React, { useEffect, useRef, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

const qrCodeConfig = {
  fps: 20, // higher FPS
  qrbox: { width: 300, height: 300 }, 
  formatsToSupport: [
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODABAR,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
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


// src/components/BarcodeScanner.jsx
// import React, { useRef, useEffect, useState } from 'react';
// import Webcam from 'react-webcam';
// import { BrowserMultiFormatReader } from '@zxing/library';

// const codeReader = new BrowserMultiFormatReader();

// const QrScannerPage = () => {
//   const webcamRef = useRef(null);
//   const [scannedResult, setScannedResult] = useState('');
//   const [isScanning, setIsScanning] = useState(true);

//   useEffect(() => {
//     if (webcamRef.current) {
//       codeReader.decodeFromVideoDevice(null, webcamRef.current.video, (result, err) => {
//         if (result && isScanning) {
//           console.log('Scanned barcode:', result.getText());
//           setScannedResult(result.getText());
//           setIsScanning(false); // Stop scanning after a successful read
//         }
//         if (err && !(err instanceof NotFoundException)) {
//           console.error(err);
//         }
//       });
//     }
//     return () => {
//       codeReader.reset();
//     };
//   }, [isScanning]);

//   return (
//     <div>
//       <Webcam
//         audio={false}
//         ref={webcamRef}
//         screenshotFormat="image/jpeg"
//         videoConstraints={{ facingMode: 'environment' }} // Use the back camera
//       />
//       {scannedResult && (
//         <div>
//           <p>Scanned Serial Number: <strong>{scannedResult}</strong></p>
//           <button onClick={() => setIsScanning(true)}>Scan Again</button>
//         </div>
//       )}
//       {!scannedResult && <p>Point your camera at a barcode to scan...</p>}
//     </div>
//   );
// };

// export default QrScannerPage;

