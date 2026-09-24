interface ReportCounselingProps {
  points: string[];
}

export default function ReportCounseling({ points }: ReportCounselingProps) {
  return (
    <div className="rp-counseling-box">
      {points.length === 0 ? (
        <p className="rp-counseling-empty">
          No counseling points were recorded for this screening.
        </p>
      ) : (
        <ol className="rp-counseling-list">
          {points.map((point, index) => (
            <li key={`${index}-${point.slice(0, 24)}`}>{point}</li>
          ))}
        </ol>
      )}
    </div>
  );
}