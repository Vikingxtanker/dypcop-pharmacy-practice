import { CLINICAL_INTERPRETATION_NOTE } from "@/lib/reports/patient-report-data";

export default function ReportFooter() {
  return (
    <footer className="rp-footer">
      <div className="rp-wave-back"></div>
      <div className="rp-wave-mid"></div>
      <div className="rp-wave-front"></div>

      <div className="rp-footer-copy">
        <div className="rp-thankyou">Thank you for visiting</div>
        <div className="rp-footer-college">D.Y. Patil College of Pharmacy</div>
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

      {/* Standing safety note for the laboratory result colours. It lives in the
          footer band rather than under the table because that band is a fixed
          box with spare height, whereas a table sibling pushed the densest real
          screening day onto a second A4 page. Each coloured value still carries
          its own interpretation next to it, so the colour-to-meaning link does
          not depend on this line. */}
      <div className="rp-footer-note">{CLINICAL_INTERPRETATION_NOTE}</div>
    </footer>
  );
}