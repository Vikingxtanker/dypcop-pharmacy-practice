/**
 * Centralized clinical classification for report laboratory results.
 *
 * Every tone used anywhere in the report (React table, online report,
 * print/PDF, station preview) is produced here, so one value can never be
 * coloured one way in the app and another way in the PDF. Nothing in this
 * file knows about CSS, React or the DOM: it returns plain data.
 *
 * Tones
 * -----
 * `normal`         GREEN  - inside the reference interval for this patient.
 * `mild-moderate`  AMBER  - a published *intermediate* category only:
 *                         prediabetes / impaired glucose tolerance, stage 1
 *                         hypertension, mild anemia. There is deliberately no
 *                         "within x% of the limit" rule anywhere in this file.
 * `abnormal`       RED    - outside the reference interval where no accepted
 *                         intermediate category exists, or a published severe
 *                         category (moderate/severe anemia, osteoporosis,
 *                         stage 2 / severe hypertension).
 * `neutral`        BLUE   - cannot be classified safely: no context, no
 *                         published threshold in this application, or a value
 *                         the analysing method could not plausibly report.
 *
 * Safety
 * ------
 * - Colour is decoration. Every row also renders the short plain-text `label`
 *   ("Stage 1 hypertension"), and `basis` carries the full sentence to
 *   assistive technology, so the report is fully readable in grayscale and
 *   by a screen reader.
 * - Nothing here is a diagnosis. Reference intervals and decision thresholds
 *   vary by laboratory, analyser method, population and clinical context;
 *   this classification is a screening aid for the reviewing pharmacist or
 *   physician. See CLINICAL_INTERPRETATION_NOTE for the report footnote.
 * - Demographic vitals (Temperature, SpO2) are never classified: they are
 *   reported as plain readings in Demographics, not as laboratory results.
 *
 * Sources for the thresholds applied below
 * ----------------------------------------
 * - Diabetes / prediabetes decision limits: American Diabetes Association,
 *   "Diagnosis and Classification of Diabetes", Diabetes Care 2025;
 *   48(Suppl 1):S27-S49 (Table 2.1 diagnostic criteria, Table 2.2
 *   prediabetes). Fasting >=126 mg/dL, 2-hour >=200 mg/dL, HbA1c >=6.5%,
 *   random >=200 mg/dL *and* classic hyperglycemic symptoms or a
 *   hyperglycemic crisis.
 * - Blood pressure categories: 2017 ACC/AHA High Blood Pressure in Adults
 *   guideline (Whelton et al., Hypertension 2018;71:e13-e115), Table 6 - normal
 *   <120 and <80, elevated 120-129 and <80, stage 1 130-139 or 80-89, stage 2
 *   >=140 or >=90 mmHg - with the American Heart Association "rainbow" patient
 *   chart for the crisis boundary, which reads "higher than 180 and/or higher
 *   than 120". These are categories for a single screening reading; a
 *   hypertension diagnosis requires the repeat, averaged readings the guideline
 *   describes. ACC/AHA defines no hypotension category.
 * - Hemoglobin reference interval and severity grading: World Health
 *   Organization, "Haemoglobin concentrations for the diagnosis of anaemia and
 *   assessment of severity" (WHO/NMH/NHD/MNM/11.1, 2011), Table 1 at sea level.
 *   Non-pregnant women: >=120 g/L not anaemic, mild 110-119, moderate 80-109,
 *   severe <80. Men 15 years and above: >=130 g/L not anaemic, mild 110-129,
 *   moderate 80-109, severe <80. Divided by ten these are the g/dL bands used
 *   below. WHO sets no upper limit for hemoglobin, so a raised value is graded
 *   only against the reference interval this application already prints.
 * - Bone mineral density T-score categories: International Society for
 *   Clinical Densitometry, Official Positions (Adult) - normal >= -1.0,
 *   low bone mass / osteopenia between -1.0 and -2.5, osteoporosis <= -2.5.
 *   The single point T = -2.5 is reported as osteopenia here, which is the
 *   behaviour this report already had and which the report requirement fixes.
 * - Resting adult heart rate: National Heart, Lung, and Blood Institute
 *   (NIH), "Arrhythmias - Types": most adults have a resting heart rate of
 *   60-100 bpm; <60 bpm is bradycardia and >100 bpm is tachycardia. No
 *   guideline severity bands exist for a single screening pulse, so this
 *   test has no amber tier.
 *
 * Population scope
 * ----------------
 * Adult screening. Verified against the station database: all 174 patients
 * have a date of birth, and their ages on the screening date span 19-71 years
 * (82 Male, 92 Female, none recorded as any other value), with no paediatric
 * records. The same adult haemoglobin bands are applied above age 65 as a
 * screening approximation, because the WHO cut-offs are specified for
 * non-pregnant adults aged 15 and above and nothing in this application
 * records the context needed to grade a haemoglobin differently.
 */

/** Legacy report status vocabulary, kept for backwards compatibility with tokens and callers. */
export type ReportStatus = "normal" | "high" | "low" | "info";

/** Clinically meaningful tone for a result. This is what colour is derived from. */
export type ClinicalTone = "normal" | "mild-moderate" | "abnormal" | "neutral";

/** Sex is only used where a test genuinely needs it (hemoglobin); never guessed from a name. */
export type ClinicalSex = "female" | "male" | "unknown";

export interface ClinicalContext {
  sex?: ClinicalSex;
  /** Age in whole years derived from DOB on the screening date; null when DOB is unknown. */
  ageYears?: number | null;
}

export interface ClinicalClassification {
  /** Clinically meaningful tone; the only thing colour is allowed to depend on. */
  tone: ClinicalTone;
  /** Legacy status derived from the tone, so existing status consumers keep working. */
  status: ReportStatus;
  /** Short plain-text interpretation rendered under the value (never colour alone). */
  label: string;
  /** Full clinical sentence: what was decided, and on what basis. */
  basis: string;
}

export interface ClinicalResultRequest extends ClinicalContext {
  /** Canonical test id, matching the station test type (e.g. "FBS", "Hemoglobin", "BP"). */
  testId: string;
  /** Numeric result; null/undefined/NaN means "not measured". */
  value: number | null | undefined;
  /** Diastolic pressure, for the composite Blood Pressure row only. */
  secondaryValue?: number | null;
}

/** Standing note shown under the laboratory table. */
/**
 * Single-line footnote printed under the laboratory table. It is kept to one
 * printed line on purpose: the table already sits at the limit of one A4 page,
 * and a second line pushed the densest real reports onto a second page. The
 * full per-result reasoning stays in each row's accessible label.
 */
export const CLINICAL_INTERPRETATION_NOTE =
  "Colours follow published screening thresholds, not a diagnosis; " +
  "limits vary by lab, method and patient \u2014 confirm with a clinician.";
/**
 * Legacy status <-> clinical tone bridge. "low" was always the amber
 * "not normal, not urgent" tone and "high" the red one, so the mapping keeps
 * every existing consumer (tokens, editor, older callers) visually identical.
 */
const TONE_TO_STATUS: Record<ClinicalTone, ReportStatus> = {
  normal: "normal",
  "mild-moderate": "low",
  abnormal: "high",
  neutral: "info",
};

const STATUS_TO_TONE: Record<ReportStatus, ClinicalTone> = {
  normal: "normal",
  low: "mild-moderate",
  high: "abnormal",
  info: "neutral",
};

/** CSS class per clinical tone. Colors live in report.css (print-color-adjust: exact). */
const TONE_CLASS: Record<ClinicalTone, string> = {
  normal: "rp-result--normal",
  "mild-moderate": "rp-result--mild-moderate",
  abnormal: "rp-result--abnormal",
  neutral: "rp-result--neutral",
};

/** Screen-reader phrase per clinical tone. */
const TONE_LABEL: Record<ClinicalTone, string> = {
  normal: "within the reference interval",
  "mild-moderate": "in an intermediate clinical range",
  abnormal: "abnormal",
  neutral: "not classified",
};

const classify = (tone: ClinicalTone, label: string, basis: string): ClinicalClassification => ({
  tone,
  status: TONE_TO_STATUS[tone],
  label,
  basis,
});

/** Maps the stored gender string to a usable clinical sex; anything unknown is "unknown". */
export const toClinicalSex = (gender?: string | null): ClinicalSex => {
  const g = (gender || "").trim().toLowerCase();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  return "unknown";
};

/** Clinical tone for a legacy status (or undefined -> neutral). */
export const resultStatusTone = (status?: ReportStatus): ClinicalTone =>
  status ? STATUS_TO_TONE[status] : "neutral";

/** Semantic CSS class for a legacy status; identical to the class for its tone. */
export const resultStatusClass = (status?: ReportStatus): string => TONE_CLASS[resultStatusTone(status)];

/** Semantic CSS class for a clinical tone. */
export const clinicalToneClass = (tone?: ClinicalTone): string => TONE_CLASS[tone || "neutral"];

/** Accessible plain-text phrase for a legacy status. */
export const resultStatusLabel = (status?: ReportStatus): string => TONE_LABEL[resultStatusTone(status)];

/** Accessible plain-text phrase for a clinical tone. */
export const clinicalToneLabel = (tone?: ClinicalTone): string => TONE_LABEL[tone || "neutral"];

const isMeasured = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const round = (value: number, digits = 1): string => String(Math.round(value * 10 ** digits) / 10 ** digits);

/* ------------------------------------------------------------------ *
 * Hemoglobin - WHO reference interval + WHO severity grading
 * ------------------------------------------------------------------ */

interface HemoglobinBands {
  /** Lower reference limit, which is also the WHO anemia cut-off. */
  low: number;
  /** Upper reference limit of the interval this application already displays. */
  high: number;
  word: string;
}

const HEMOGLOBIN_FEMALE: HemoglobinBands = { low: 12, high: 16, word: "female" };
const HEMOGLOBIN_MALE: HemoglobinBands = { low: 13, high: 18, word: "male" };
/** The interval this application already displays for children (its pregnancy line is not used: see below). */
const HEMOGLOBIN_CHILD: HemoglobinBands = { low: 11, high: 14, word: "child" };

/** WHO 2011 severity bands shared by non-pregnant adults of either sex. */
const ANEMIA_MODERATE_BELOW = 11; // 8.0-10.9 g/dL
const ANEMIA_SEVERE_BELOW = 8;

export const classifyHemoglobin = (
  value: number | null | undefined,
  context: ClinicalContext = {},
): ClinicalClassification => {
  if (!isMeasured(value)) return classify("neutral", "Not classified", "No numeric hemoglobin result was recorded.");

  // Paediatric band: this application has no graded paediatric severity, so a child
  // is only reported as inside/outside the interval rather than being given an
  // adult anemia grade.
  if (context.ageYears !== undefined && context.ageYears !== null && context.ageYears < 18) {
    return referenceIntervalOnly(value, HEMOGLOBIN_CHILD, "g/dL", "this application does not grade anemia severity by age");
  }

  const bands =
    context.sex === "male" ? HEMOGLOBIN_MALE : context.sex === "female" ? HEMOGLOBIN_FEMALE : null;
  const unit = "g/dL";

  // Sex is unknown: only the bands that WHO applies identically to men and women
  // may be used. Where the two sexes disagree the result stays neutral rather
  // than borrowing the other sex's reference interval.
  if (!bands) {
    if (value >= 13 && value <= 16) {
      return classify(
        "normal",
        "Within reference interval",
        `Hemoglobin ${round(value)} g/dL is inside 13-16 g/dL, the part of the adult male and female reference intervals that both sexes share.`,
      );
    }
    if (value >= 11 && value < 12) {
      return classify(
        "mild-moderate",
        "Mild anemia",
        `Hemoglobin ${round(value)} g/dL is in the WHO mild-anemia band of 11.0-11.9 g/dL, which applies to both adult sexes.`,
      );
    }
    if (value >= 8 && value < 11) {
      return classify(
        "abnormal",
        "Moderate anemia",
        `Hemoglobin ${round(value)} g/dL is in the WHO moderate-anemia band of 8.0-10.9 g/dL, which applies to both adult sexes.`,
      );
    }
    if (value < 8) {
      return classify(
        "abnormal",
        "Severe anemia",
        `Hemoglobin ${round(value)} g/dL is in the WHO severe-anemia band below 8.0 g/dL. This needs prompt clinical review.`,
      );
    }
    // Above the higher of the two upper limits, so outside the reference interval
    // whichever adult sex is recorded. Below that (16.1-18 g/dL) the sexes still
    // disagree about the upper limit, so no interval can be applied.
    if (value > HEMOGLOBIN_MALE.high) {
      return classify(
        "abnormal",
        "Above reference interval",
        `Hemoglobin ${round(value)} g/dL is above the ${HEMOGLOBIN_MALE.high} g/dL upper limit of the adult male reference interval, and so above it for either sex. WHO does not grade a raised hemoglobin, so this is reported as outside the reference interval.`,
      );
    }
    return classify(
      "neutral",
      "Not classified",
      `Hemoglobin ${round(value)} g/dL falls in a part of the adult reference interval that differs by sex, and the patient's sex was not recorded, so no single interval can be applied.`,
    );
  }

  if (value > bands.high) {
    return classify(
      "abnormal",
      "Above reference interval",
      `Hemoglobin ${round(value)} g/dL is above the ${bands.word} adult reference interval of ${bands.low}-${bands.high} g/dL. WHO does not grade a raised hemoglobin, so this is reported as outside the reference interval.`,
    );
  }
  if (value >= bands.low) {
    return classify(
      "normal",
      "Within reference interval",
      `Hemoglobin ${round(value)} ${unit} is within the ${bands.word} adult reference interval of ${bands.low}-${bands.high} g/dL.`,
    );
  }
  if (value >= ANEMIA_MODERATE_BELOW) {
    return classify(
      "mild-moderate",
      "Mild anemia",
      `Hemoglobin ${round(value)} ${unit} is below the WHO anemia cut-off of ${bands.low} g/dL for ${bands.word} adults and sits in the WHO mild-anemia band (11.0 to just below ${bands.low} g/dL).`,
    );
  }
  if (value >= ANEMIA_SEVERE_BELOW) {
    return classify(
      "abnormal",
      "Moderate anemia",
      `Hemoglobin ${round(value)} ${unit} is in the WHO moderate-anemia band of 8.0-10.9 g/dL. This needs clinical review.`,
    );
  }
  return classify(
    "abnormal",
    "Severe anemia",
    `Hemoglobin ${round(value)} ${unit} is in the WHO severe-anemia band below 8.0 g/dL. This needs prompt clinical review.`,
  );
};

/**
 * Fallback for tests that this application only has a plain reference
 * interval for: inside -> green, outside -> red, with no invented amber tier.
 */
const referenceIntervalOnly = (
  value: number,
  bands: { low: number; high: number; word: string },
  unit: string,
  caveat: string,
): ClinicalClassification => {
  if (value < bands.low) {
    return classify(
      "abnormal",
      "Below reference interval",
      `${bands.word} reference interval is ${bands.low}-${bands.high} ${unit}; ${round(value)} ${unit} is below it. There is no accepted intermediate category here, so no amber band is used.`,
    );
  }
  if (value > bands.high) {
    return classify(
      "abnormal",
      "Above reference interval",
      `${bands.word} reference interval is ${bands.low}-${bands.high} ${unit}; ${round(value)} ${unit} is above it. There is no accepted intermediate category here, so no amber band is used.`,
    );
  }
  return classify(
    "normal",
    "Within reference interval",
    `${round(value)} ${unit} is within the ${bands.word} reference interval of ${bands.low}-${bands.high} ${unit} (${caveat}).`,
  );
};

/* ------------------------------------------------------------------ *
 * Glucose - ADA 2025 decision limits
 * ------------------------------------------------------------------ */

const GLUCOSE_UNIT = "mg/dL";
const GLUCOSE_LOW_LIMIT = 70;
/**
 * Upper limit of the reference interval the laboratory prints for a random
 * glucose draw (NORMAL_RANGES.RBG). A value above it is still classified on
 * the ADA two-hour decision limits, not on this interval.
 */
const RBG_LAB_UPPER_LIMIT = 110;

export const classifyFastingGlucose = (value: number | null | undefined): ClinicalClassification => {
  if (!isMeasured(value)) return classify("neutral", "Not classified", "No numeric fasting glucose result was recorded.");
  if (value < GLUCOSE_LOW_LIMIT) {
    return classify(
      "abnormal",
      "Below reference interval",
      `Fasting plasma glucose ${round(value)} ${GLUCOSE_UNIT} is below the ${GLUCOSE_LOW_LIMIT} ${GLUCOSE_UNIT} lower reference limit used by this report.`,
    );
  }
  if (value < 100) {
    return classify(
      "normal",
      "Within reference interval",
      `Fasting plasma glucose ${round(value)} ${GLUCOSE_UNIT} is below the ADA diabetes threshold of 126 ${GLUCOSE_UNIT}.`,
    );
  }
  if (value < 126) {
    return classify(
      "mild-moderate",
      "Prediabetes range",
      `Fasting plasma glucose ${round(value)} ${GLUCOSE_UNIT} is in the ADA prediabetes range of 100-125 ${GLUCOSE_UNIT} (impaired fasting glucose). This is not diagnostic of diabetes.`,
    );
  }
  return classify(
    "abnormal",
    "Diabetes range",
    `Fasting plasma glucose ${round(value)} ${GLUCOSE_UNIT} meets the ADA diabetes threshold of >=126 ${GLUCOSE_UNIT}. A single screening reading is not a diagnosis; confirm with repeat testing and clinical review.`,
  );
};

/**
 * Two-hour post-load / post-meal plasma glucose (OGTT 2-hour value, PPBS).
 * The application already documents PPBS with the 2-hour post-load decision
 * limits (<140 normal, up to 180 after a meal), so PPBS and the OGTT 2-hour
 * value are read against the same ADA 2-hour thresholds. A casual value taken
 * at an unrecorded time after eating would need different limits; the station
 * does not record that interval, which is stated in the report reference text.
 */
export const classifyTwoHourGlucose = (
  value: number | null | undefined,
  testName = "Two-hour post-load plasma glucose",
): ClinicalClassification => {
  if (!isMeasured(value)) return classify("neutral", "Not classified", `No numeric ${testName.toLowerCase()} result was recorded.`);
  if (value < GLUCOSE_LOW_LIMIT) {
    return classify(
      "abnormal",
      "Below reference interval",
      `${testName} ${round(value)} ${GLUCOSE_UNIT} is below the ${GLUCOSE_LOW_LIMIT} ${GLUCOSE_UNIT} lower reference limit used by this report.`,
    );
  }
  if (value < 140) {
    return classify(
      "normal",
      "Within reference interval",
      `${testName} ${round(value)} ${GLUCOSE_UNIT} is below the ADA two-hour threshold of 200 ${GLUCOSE_UNIT}.`,
    );
  }
  if (value < 200) {
    return classify(
      "mild-moderate",
      "Impaired glucose tolerance",
      `${testName} ${round(value)} ${GLUCOSE_UNIT} is in the ADA 140-199 ${GLUCOSE_UNIT} range (impaired glucose tolerance / prediabetes). This is not diagnostic of diabetes.`,
    );
  }
  return classify(
    "abnormal",
    "Diabetes range",
    `${testName} ${round(value)} ${GLUCOSE_UNIT} meets the ADA two-hour diabetes threshold of >=200 ${GLUCOSE_UNIT}. Confirm with repeat testing and clinical review.`,
  );
};

/**
 * Random (casual) plasma glucose. A random draw has no reference interval of
 * its own, so it is read against the same two-hour decision limits. ADA only
 * diagnoses diabetes from a random value when classic hyperglycemic symptoms
 * or a hyperglycemic crisis are present, and this application records
 * neither - so a diabetes-range random value is amber with a confirmation
 * label, never a red "diabetes" claim.
 */
export const classifyRandomGlucose = (value: number | null | undefined): ClinicalClassification => {
  if (!isMeasured(value)) return classify("neutral", "Not classified", "No numeric random glucose result was recorded.");
  if (value < GLUCOSE_LOW_LIMIT) {
    return classify(
      "abnormal",
      "Below reference interval",
      `Random plasma glucose ${round(value)} ${GLUCOSE_UNIT} is below the ${GLUCOSE_LOW_LIMIT} ${GLUCOSE_UNIT} lower reference limit used by this report.`,
    );
  }
  if (value <= RBG_LAB_UPPER_LIMIT) {
    return classify(
      "normal",
      "Within reference interval",
      `Random plasma glucose ${round(value)} ${GLUCOSE_UNIT} is inside the ${GLUCOSE_LOW_LIMIT}-${RBG_LAB_UPPER_LIMIT} ${GLUCOSE_UNIT} reference interval printed for this test.`,
    );
  }
  // A random draw has no reference interval of its own: the printed interval is
  // the laboratory's, and ADA sets 140/200 ${GLUCOSE_UNIT} as the two-hour
  // decision limits. A value above the laboratory interval but below 140 is
  // therefore expected after food, which the label states instead of a colour
  // change, so the printed interval and the tone never disagree.
  if (value < 140) {
    return classify(
      "normal",
      "Above lab reference",
      `Random plasma glucose ${round(value)} ${GLUCOSE_UNIT} is above the laboratory's ${GLUCOSE_LOW_LIMIT}-${RBG_LAB_UPPER_LIMIT} ${GLUCOSE_UNIT} reference interval but below 140 ${GLUCOSE_UNIT}, the two-hour decision limit applied to a random draw. A random sample is expected to rise after food, so this is not an abnormal result.`,
    );
  }
  if (value < 200) {
    return classify(
      "mild-moderate",
      "Above expected range",
      `Random plasma glucose ${round(value)} ${GLUCOSE_UNIT} is above the 140 ${GLUCOSE_UNIT} post-load decision limit but below the 200 ${GLUCOSE_UNIT} diabetes threshold.`,
    );
  }
  return classify(
    "mild-moderate",
    "Diabetes-range (confirm)",
    `Random plasma glucose ${round(value)} ${GLUCOSE_UNIT} is at or above the ADA 200 ${GLUCOSE_UNIT} diabetes threshold. ADA requires classic hyperglycemic symptoms or a hyperglycemic crisis (or confirmatory testing) to diagnose diabetes from a random value, and this screening records neither, so this is flagged for confirmatory testing rather than reported as a diagnosis.`,
  );
};

/* ------------------------------------------------------------------ *
 * HbA1c - ADA 2025
 * ------------------------------------------------------------------ */

/**
 * Data-quality guard, not a clinical threshold: NGSP-certified HbA1c
 * reporting is bounded at the low and high end, so a value outside this
 * band is treated as a probable entry/measurement error and is left
 * unclassified instead of being graded.
 */
const A1C_PLAUSIBLE = { low: 2, high: 20 };

export const classifyHba1c = (value: number | null | undefined): ClinicalClassification => {
  if (!isMeasured(value)) return classify("neutral", "Not classified", "No numeric HbA1c result was recorded.");
  if (value < A1C_PLAUSIBLE.low || value > A1C_PLAUSIBLE.high) {
    return classify(
      "neutral",
      "Not classified",
      `HbA1c of ${round(value)}% is outside the ${A1C_PLAUSIBLE.low}-${A1C_PLAUSIBLE.high}% range this laboratory method can report, so it is not clinically interpretable until the result is verified.`,
    );
  }
  if (value < 5.7) {
    return classify(
      "normal",
      "Within reference interval",
      `HbA1c ${round(value)}% is below the ADA prediabetes threshold of 5.7%.`,
    );
  }
  if (value < 6.5) {
    return classify(
      "mild-moderate",
      "Prediabetes range",
      `HbA1c ${round(value)}% is in the ADA prediabetes range of 5.7-6.4%. This is not diagnostic of diabetes.`,
    );
  }
  return classify(
    "abnormal",
    "Diabetes range",
    `HbA1c ${round(value)}% meets the ADA diabetes threshold of >=6.5%. A single screening result is not a diagnosis; confirm with repeat testing and clinical review.`,
  );
};

/* ------------------------------------------------------------------ *
 * Heart rate - NHLBI adult resting range
 * ------------------------------------------------------------------ */

export const classifyHeartRate = (
  value: number | null | undefined,
  context: ClinicalContext = {},
): ClinicalClassification => {
  if (!isMeasured(value)) return classify("neutral", "Not classified", "No numeric heart rate was recorded.");
  if (context.ageYears !== undefined && context.ageYears !== null && context.ageYears < 18) {
    return classify(
      "neutral",
      "Not classified",
      `Heart rate ${round(value)} bpm: the only reference interval in this application is the adult 60-100 bpm range, and this patient is under 18, so no interval is applied.`,
    );
  }
  if (value < 60) {
    return classify(
      "abnormal",
      "Below reference interval",
      `Screening heart rate ${round(value)} bpm is below 60 bpm (bradycardia range). A screening-visit pulse is assumed to be a resting reading.`,
    );
  }
  if (value <= 100) {
    return classify(
      "normal",
      "Within reference interval",
      `Screening heart rate ${round(value)} bpm is within the NHLBI adult resting range of 60-100 bpm.`,
    );
  }
  return classify(
    "abnormal",
    "Above reference interval",
    `Screening heart rate ${round(value)} bpm is above 100 bpm (tachycardia range). A screening-visit pulse is assumed to be a resting reading.`,
  );
};

/* ------------------------------------------------------------------ *
 * Blood pressure - 2017 ACC/AHA categories
 * ------------------------------------------------------------------ */

/** Parses a combined "138/86" reading; returns null unless both parts are numbers. */
export const parseBloodPressure = (combined?: string | null): { systolic: number; diastolic: number } | null => {
  if (!combined) return null;
  const [sysRaw, diaRaw] = combined.split("/");
  const systolic = parseFloat(sysRaw);
  const diastolic = parseFloat(diaRaw);
  if (Number.isNaN(systolic) || Number.isNaN(diastolic)) return null;
  return { systolic, diastolic };
};

export const classifyBloodPressure = (
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
): ClinicalClassification => {
  if (!isMeasured(systolic) || !isMeasured(diastolic)) {
    return classify(
      "neutral",
      "Not classified",
      "A blood pressure category needs both a systolic and a diastolic value; this reading is incomplete.",
    );
  }
  const reading = `${round(systolic, 0)}/${round(diastolic, 0)}`;
  // A reading can be extreme in both directions at once (for example 80/130).
  // The high category is the clinically urgent one, so it is evaluated first
  // and the conflicting low value is still reported in the basis text.
  const mixedExtremes =
    (systolic > 180 && diastolic < 60) || (diastolic > 120 && systolic < 90)
      ? " The other value is also below the reference limit, so both numbers need clinical review."
      : "";
  // The higher of the two categories wins when they disagree, as in the AHA chart.
  // The crisis boundary is strictly greater than 180/120, matching the guideline
  // wording ("higher than 180 and/or higher than 120" on the AHA chart; "BP >180
  // and/or DBP >120 mm Hg" in the 2017 ACC/AHA guideline), so exactly 180/120
  // stays in the stage 2 category it is printed under.
  if (systolic > 180 || diastolic > 120) {
    return classify(
      "abnormal",
      "Severe hypertension range",
      `Blood pressure ${reading} mmHg is higher than 180 systolic or 120 diastolic mmHg, the hypertensive-crisis range. This needs urgent clinical review.${mixedExtremes}`,
    );
  }
  if (systolic >= 140 || diastolic >= 90) {
    return classify(
      "abnormal",
      "Stage 2 hypertension range",
      `Blood pressure ${reading} mmHg is in the 2017 ACC/AHA stage 2 category (>=140 systolic or >=90 diastolic). A hypertension diagnosis requires repeat, averaged readings.${mixedExtremes}`,
    );
  }
  if (systolic >= 130 || diastolic >= 80) {
    return classify(
      "mild-moderate",
      "Stage 1 hypertension range",
      `Blood pressure ${reading} mmHg is in the 2017 ACC/AHA stage 1 category (130-139 systolic or 80-89 diastolic). A hypertension diagnosis requires repeat, averaged readings.${mixedExtremes}`,
    );
  }
  if (systolic >= 120) {
    return classify(
      "mild-moderate",
      "Elevated range",
      `Blood pressure ${reading} mmHg is in the 2017 ACC/AHA elevated category (120-129 systolic and <80 diastolic).`,
    );
  }
  // ACC/AHA defines no hypotension category, so a value under the lower
  // reference limit is simply reported as outside the interval.
  if (systolic < 90 || diastolic < 60) {
    return classify(
      "abnormal",
      "Below reference interval",
      `Blood pressure ${reading} mmHg is below the 90/60 mmHg lower reference limit used by this report. ACC/AHA does not define a hypotension category, so no intermediate band is used.`,
    );
  }
  return classify(
    "normal",
    "Within reference interval",
    `Blood pressure ${reading} mmHg is in the 2017 ACC/AHA normal category (<120/<80 mmHg).`,
  );
};

/* ------------------------------------------------------------------ *
 * Bone mineral density (T score) - ISCD 2019
 * ------------------------------------------------------------------ */

export type BoneDensityTScoreCategory = "Normal" | "Osteopenia" | "Osteoporosis";

/**
 * ISCD 2019 / WHO T-score categories. Boundaries are inclusive upwards to keep
 * the bands contiguous: Normal at T >= -1.0, Osteopenia between -2.5 and
 * -1.0, Osteoporosis below -2.5. The ISCD wording is "osteoporosis at or
 * below -2.5"; the single point T = -2.5 is reported as osteopenia here so no
 * value can fall between two bands. This classification is unchanged from the
 * existing implementation.
 */
export const classifyBoneDensityTScore = (value: number): BoneDensityTScoreCategory => {
  if (value >= -1) return "Normal";
  if (value >= -2.5) return "Osteopenia";
  return "Osteoporosis";
};

export const classifyBoneDensity = (value: number | null | undefined): ClinicalClassification => {
  if (!isMeasured(value)) return classify("neutral", "Not classified", "No numeric T score was recorded.");
  if (value >= -1) {
    return classify("normal", "Normal", `T score ${round(value, 2)} is in the ISCD normal category (T score at or above -1.0).`);
  }
  if (value >= -2.5) {
    return classify(
      "mild-moderate",
      "Osteopenia",
      `T score ${round(value, 2)} is in the ISCD osteopenia category (between -1.0 and -2.5).`,
    );
  }
  return classify(
    "abnormal",
    "Osteoporosis",
    `T score ${round(value, 2)} is in the ISCD osteoporosis category (below -2.5). This needs clinical review.`,
  );
};

/** Legacy status for the Bone Density row (unchanged behaviour). */
export const boneDensityStatus = (value: number | null | undefined): ReportStatus => {
  if (!isMeasured(value)) return "info";
  return classifyBoneDensity(value).status;
};

/* ------------------------------------------------------------------ *
 * Tests with no defensible threshold
 * ------------------------------------------------------------------ */

/** Explicitly unclassified result: honest NEUTRAL instead of an invented colour. */
export const classifyUnclassifiable = (reason: string): ClinicalClassification =>
  classify("neutral", "Not classified", reason);

export const FEV_CLASSIFICATION_REASON =
  "FEV is stored as a bare volume with no age, sex, height, ethnicity or predicted-value context, so it cannot be graded against a reference interval. The 111 stored values span 8.65-106 in a field labelled L, which no spirometer reports as litres for an adult, so the unit itself is unverified; interpret against a spirometry chart by a clinician.";

export const TARGET_WEIGHT_CLASSIFICATION_REASON =
  "A target weight is set by the treating clinician against the patient's height, age and body composition, and this application has no threshold for it.";

/* ------------------------------------------------------------------ *
 * Dispatcher
 * ------------------------------------------------------------------ */

/**
 * Single entry point used by the report row builder. Every laboratory row the
 * application can render goes through here, so a tone is never decided in a
 * component, in the station, or in the PDF layer.
 */
export const classifyClinicalResult = (request: ClinicalResultRequest): ClinicalClassification => {
  const { testId, value, secondaryValue, sex, ageYears } = request;
  switch (testId) {
    case "Hemoglobin":
      return classifyHemoglobin(value, { sex, ageYears });
    case "FBS":
      return classifyFastingGlucose(value);
    case "OGTT":
      return classifyTwoHourGlucose(value, "Two-hour oral glucose tolerance plasma glucose");
    case "PPBS":
      return classifyTwoHourGlucose(value, "Post-prandial plasma glucose");
    case "RBG":
      return classifyRandomGlucose(value);
    case "HbA1c":
      return classifyHba1c(value);
    case "Heart Rate":
      return classifyHeartRate(value, { sex, ageYears });
    case "BP":
      return classifyBloodPressure(value, secondaryValue);
    case "Bone Density (T Score)":
      return classifyBoneDensity(value);
    case "FEV":
      return classifyUnclassifiable(FEV_CLASSIFICATION_REASON);
    case "Target Weight":
      return classifyUnclassifiable(TARGET_WEIGHT_CLASSIFICATION_REASON);
    default:
      return classifyUnclassifiable(
        `This test has no established reference interval or decision threshold in this application, so no clinical colour is applied to it.`,
      );
  }
};
