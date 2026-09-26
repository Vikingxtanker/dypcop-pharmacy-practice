import {
  clinicalToneClass,
  resultStatusClass,
  type LaboratoryResultRow,
} from "@/lib/reports/patient-report-data";

interface ReportLaboratoryResultsProps {
  results: LaboratoryResultRow[];
  watermarkSrc: string;
}

/**
 * Rows built by the report builders always carry a clinical tone. A row handed
 * in from elsewhere may only have the legacy status, so that is used as a
 * fallback rather than dropping the row to the neutral colour.
 */
const toneClassFor = (row: LaboratoryResultRow): string =>
  row.tone ? clinicalToneClass(row.tone) : resultStatusClass(row.status);

/**
 * Screen-reader text for a result cell: the value, then the full clinical
 * sentence from the centralized classifier, so the meaning of the colour is
 * always available without seeing it.
 */
const resultAriaLabel = (row: LaboratoryResultRow): string => {
  const value = row.result || "not recorded";
  if (row.basis) return `${row.test} result ${value}. ${row.basis}`;
  if (row.interpretation) return `${row.test} result ${value}, ${row.interpretation}`;
  return `${row.test} result ${value}`;
};

export default function ReportLaboratoryResults({ results, watermarkSrc }: ReportLaboratoryResultsProps) {
  return (
    <div className="rp-lab-wrap">
      <img className="rp-watermark" src={watermarkSrc} alt="" aria-hidden="true" />
      <table className="rp-lab-table">
        <colgroup>
          <col className="rp-col-test" />
          <col className="rp-col-result" />
          <col className="rp-col-range" />
        </colgroup>
        <thead>
          <tr>
            <th>Test</th>
            <th className="rp-th-center">Result</th>
            <th>Reference / Interpretation</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 ? (
            <tr>
              <td className="rp-lab-empty" colSpan={3}>
                No laboratory test results were recorded for this screening.
              </td>
            </tr>
          ) : (
            results.map((row) => (
              <tr key={row.test}>
                <td>{row.test}</td>
                <td
                  className={`rp-result ${toneClassFor(row)}`}
                  aria-label={resultAriaLabel(row)}
                >
                  {row.result || "\u2014"}
                </td>
                <td className="rp-range">{row.normalRange || <span className="rp-dash">{"\u2014"}</span>}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
