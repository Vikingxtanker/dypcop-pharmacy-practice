interface ReportFooterProps {
  qrSrc: string | null;
}

export default function ReportFooter({ qrSrc }: ReportFooterProps) {
  return (
    <footer className="rp-footer">
      <div className="rp-wave-back"></div>
      <div className="rp-wave-mid"></div>
      <div className="rp-wave-front"></div>

      <div className="rp-footer-copy">
        <div className="rp-thankyou">Thank you for visiting</div>
        <div className="rp-footer-college">Dr. D. Y. Patil College of Pharmacy, Akurdi, Pune.</div>
      </div>

      {qrSrc && (
        <div className="rp-qr-panel">
          <img src={qrSrc} alt="QR code to view this report online" />
          <div className="rp-qr-label">Scan to view report online</div>
        </div>
      )}
    </footer>
  );
}