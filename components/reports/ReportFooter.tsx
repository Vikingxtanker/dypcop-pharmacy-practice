export default function ReportFooter() {
  return (
    <footer className="rp-footer">
      <div className="rp-wave-back"></div>
      <div className="rp-wave-mid"></div>
      <div className="rp-wave-front"></div>

      <div className="rp-footer-copy">
        <div className="rp-thankyou">Thank you for visiting</div>
        <div className="rp-footer-college">Dr. D.Y. Patil College of Pharmacy, Akurdi, Pune.</div>
        {/* Real anchor so the printed PDF carries a working link; the displayed
            text stays plain and selectable. Styling keeps the footer palette. */}
        <a
          className="rp-footer-website"
          href="https://dypcoppharmacypractice.in"
          rel="noopener noreferrer"
        >
          dypcoppharmacypractice.in
        </a>
      </div>
    </footer>
  );
}