import {
  resultStatusClass,
  resultStatusLabel,
  type LaboratoryResultRow,
} from "@/lib/reports/patient-report-data";

interface ReportLaboratoryResultsProps {
  results: LaboratoryResultRow[];
  watermarkSrc: string;
}

const resultAriaLabel = (row: LaboratoryResultRow): string =>
  `${row.test} result ${row.result || "not recorded"}, ${resultStatusLabel(row.status)}`;

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
            <th>Normal Range</th>
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
                  className={`rp-result ${resultStatusClass(row.status)}`}
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