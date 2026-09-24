import type { ReportTestOption } from "@/lib/reports/patient-report-data";

interface ReportTestsPickerProps {
  options: ReportTestOption[];
  selectedIds: readonly string[];
  disabled?: boolean;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export default function ReportTestsPicker({
  options,
  selectedIds,
  disabled,
  onToggle,
  onSelectAll,
  onClearAll,
}: ReportTestsPickerProps) {
  return (
    <div className={disabled ? "rp-test-picker rp-test-picker--busy" : "rp-test-picker"}>
      <div className="row g-2 mb-2">
        {options.map((option) => {
          const fieldId = `rp-test-${option.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
          return (
            <div className="col-md-6" key={option.id}>
              <div className="form-check ms-3 mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={fieldId}
                  checked={selectedIds.includes(option.id)}
                  onChange={() => onToggle(option.id)}
                  disabled={disabled}
                />
                <label className="form-check-label" htmlFor={fieldId}>
                  {option.label}
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <div className="d-flex align-items-center gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onSelectAll} disabled={disabled}>
          Select All
        </button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClearAll} disabled={disabled}>
          Clear All
        </button>
      </div>
    </div>
  );
}