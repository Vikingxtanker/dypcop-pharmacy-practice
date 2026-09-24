import type {
  CanvasElement,
  Content,
  ContentCanvas,
  ContentStack,
  ContentTable,
  CustomTableLayout,
  TDocumentDefinitions,
  TableCell,
} from "pdfmake/interfaces";
import { ensureReportFonts, pdfMakeInstance } from "./pdfmake-fonts";
import {
  resultStatusTone,
  type LaboratoryResultRow,
  type PatientHealthScreeningReportData,
  type ReportVisualTone,
} from "./patient-report-data";
import type { ReportAssets } from "./report-assets";

/** Millimetres -> PDF points. */
const MM = 2.834645669;
/** CSS pixels -> PDF points. */
const PX = 0.75;
const mm = (value: number) => value * MM;
const px = (value: number) => value * PX;

const PAGE_WIDTH = 595.276;
const PAGE_HEIGHT = 841.89;

const C = {
  maroon: "#741019",
  maroonDark: "#5c0b12",
  blue: "#244664",
  background: "#fffdfb",
  softPink: "#fdf1f0",
  border: "#d8b8b9",
  muted: "#5f6871",
  white: "#ffffff",
  demoUnderline: "#b7aeb0",
  demoValue: "#243d55",
  tableBorder: "#dac7c8",
  tableWrapBorder: "#8f7a7b",
  tableRowFill: "#fffcfb",
  rangeText: "#334a61",
  statusNormal: "#16803c",
  statusLow: "#b77900",
  statusHigh: "#c62828",
  statusNeutral: "#244664",
  counselingText: "#2d4359",
  counselingFill: "#fff9f8",
  headingLine: "#8d3a40",
  waveMid: "#d8a4a7",
  waveFront: "#fbefed",
} as const;

const STATUS_COLOR: Record<ReportVisualTone, string> = {
  normal: C.statusNormal,
  low: C.statusLow,
  high: C.statusHigh,
  neutral: C.statusNeutral,
};

const DASH = "\u2014";

/* ------------------------------------------------------------------ */
/* Geometry (mirrors components/reports/report.css tokens)             */
/* ------------------------------------------------------------------ */

const HEADER_MARGIN_TOP = mm(5);
const HEADER_MARGIN_X = mm(3.5);
const HEADER_HEIGHT = mm(36);
const HEADER_RADIUS = mm(8);
const HEADER_BORDER = px(2);
const LOGO_COL = mm(34);
const SLOGAN_COL = mm(33);
const LOGO_SIZE = mm(26);
const LOGO_PANEL_RADIUS = mm(3.5);
const LOGO_PANEL_BORDER = px(1.4);

const TITLE_MARGIN_TOP = mm(2.5);
const TITLE_MARGIN_X = mm(3.7);
const TITLE_HEIGHT = mm(11);
const TITLE_RADIUS = mm(5.5);

const CONTENT_PAD_X = mm(6.3);
const CONTENT_GAP = mm(3.5);
const SECTION_GAP = mm(4);

/** First-page flowing content starts below the absolutely drawn header + title. */
const CONTENT_TOP =
  HEADER_MARGIN_TOP + HEADER_HEIGHT + TITLE_MARGIN_TOP + TITLE_HEIGHT + CONTENT_GAP;

/* ------------------------------------------------------------------ */
/* Small builders                                                      */
/* ------------------------------------------------------------------ */

type IconKind = "user" | "flask" | "chat";

/** Section marker: maroon disc with a simple white glyph (lucide stand-in). */
function sectionIcon(kind: IconKind): ContentCanvas {
  const r = mm(3.6);
  const cx = r;
  const cy = r;
  const shapes: CanvasElement[] = [
    { type: "ellipse", x: cx, y: cy, r1: r, r2: r, color: C.maroon },
  ];

  if (kind === "user") {
    shapes.push({ type: "ellipse", x: cx, y: cy - mm(1), r1: mm(1), r2: mm(1), color: C.white });
    shapes.push({ type: "ellipse", x: cx, y: cy + mm(1.2), r1: mm(1.8), r2: mm(1.3), color: C.white });
  } else if (kind === "flask") {
    shapes.push({
      type: "polyline",
      closePath: true,
      color: C.white,
      points: [
        { x: cx - mm(0.5), y: cy - mm(1.6) },
        { x: cx + mm(0.5), y: cy - mm(1.6) },
        { x: cx + mm(1.6), y: cy + mm(1.6) },
        { x: cx - mm(1.6), y: cy + mm(1.6) },
      ],
    });
  } else {
    shapes.push({
      type: "rect",
      x: cx - mm(1.8),
      y: cy - mm(1.5),
      w: mm(3.6),
      h: mm(2.6),
      r: mm(0.5),
      color: C.white,
    });
    shapes.push({
      type: "polyline",
      closePath: true,
      color: C.white,
      points: [
        { x: cx - mm(0.8), y: cy + mm(1.1) },
        { x: cx + mm(0.8), y: cy + mm(1.1) },
        { x: cx - mm(0.2), y: cy + mm(2.2) },
      ],
    });
  }

  return { canvas: shapes };
}

function sectionHeading(label: string, icon: IconKind): ContentTable {
  return {
    table: {
      widths: [mm(7.2), "auto", "*"],
      body: [[sectionIcon(icon), { text: label, style: "sectionHeading", margin: [mm(3), 0, mm(3), 0] }, { text: "" }]],
    },
    layout: {
      hLineWidth: (rowIndex, node) => (rowIndex === node.table.body.length ? px(1.2) : 0),
      hLineColor: () => C.headingLine,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => mm(1.6),
    },
    margin: [0, 0, 0, mm(2)],
  };
}

function demoValueCell(value?: string): TableCell {
  if (!value) {
    return { text: DASH, color: C.muted, style: "demoValue" };
  }
  return { text: value, style: "demoValue" };
}

function demoField(label: string, value?: string): ContentTable {
  const valueCell: ContentTable = {
    table: {
      heights: [mm(4.6)],
      widths: ["*"],
      body: [[demoValueCell(value)]],
    },
    layout: {
      hLineWidth: (rowIndex, node) => (rowIndex === node.table.body.length ? px(1) : 0),
      hLineColor: () => C.demoUnderline,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => mm(0.3),
    },
  };

  return {
    table: {
      widths: [mm(28), "*"],
      body: [[{ text: label, style: "demoLabel" }, valueCell]],
    },
    layout: "noBorders",
  };
}

function demographicsSection(patient: PatientHealthScreeningReportData["patient"]): ContentStack {
  const name = patient.name || undefined;
  const age = patient.age !== undefined && patient.age !== "" ? `${patient.age} years` : undefined;
  const phone = patient.phone || undefined;
  const gender = patient.gender || undefined;
  const patientId = patient.patientId || undefined;
  const bmi = patient.bmi ? `${patient.bmi} kg/m\u00b2` : undefined;
  const date = patient.date || undefined;
  const address = patient.address || undefined;

  const grid: ContentTable = {
    table: {
      widths: ["*", "*"],
      body: [
        [demoField("Patient Name:", name), demoField("Age:", age)],
        [demoField("Phone:", phone), demoField("Gender:", gender)],
        [demoField("Patient ID:", patientId), demoField("BMI:", bmi)],
        [demoField("Date:", date), { text: "" }],
        [{ colSpan: 2, ...demoField("Address:", address) } as TableCell, {} as TableCell],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: (columnIndex) => (columnIndex === 1 ? mm(13) : 0),
      paddingRight: () => 0,
      paddingTop: () => mm(0.4),
      paddingBottom: () => mm(0.4),
    },
  };

  const box: ContentTable = {
    table: { widths: ["*"], body: [[grid]] },
    layout: {
      hLineWidth: () => px(1.2),
      vLineWidth: () => px(1.2),
      hLineColor: () => C.border,
      vLineColor: () => C.border,
      fillColor: () => C.softPink,
      paddingLeft: () => mm(5.5),
      paddingRight: () => mm(5.5),
      paddingTop: () => mm(2.8),
      paddingBottom: () => mm(2.8),
    },
    margin: [0, mm(2), 0, 0],
  };

  return { stack: [sectionHeading("Demographics:", "user"), box] };
}

function labTable(results: LaboratoryResultRow[]): ContentTable {
  const header: TableCell[] = [
    { text: "Test", style: "tableHeader" },
    { text: "Result", style: "tableHeader", alignment: "center" },
    { text: "Normal Range", style: "tableHeader" },
  ];

  const body: TableCell[][] = [header];
  if (results.length === 0) {
    body.push([
      {
        colSpan: 3,
        text: "No laboratory test results were recorded for this screening.",
        style: "labEmpty",
        margin: [0, mm(2), 0, mm(2)],
      } as TableCell,
      {} as TableCell,
      {} as TableCell,
    ]);
  } else {
    for (const row of results) {
      const tone = resultStatusTone(row.status);
      body.push([
        { text: row.test, style: "table" },
        { text: row.result || DASH, style: "result", color: STATUS_COLOR[tone] },
        { text: row.normalRange || DASH, style: "range" },
      ]);
    }
  }

  const layout: CustomTableLayout = {
    fillColor: (rowIndex) => (rowIndex === 0 ? C.maroon : C.tableRowFill),
    hLineWidth: (rowIndex, node) =>
      rowIndex === 0 || rowIndex === node.table.body.length ? px(1.1) : px(1),
    hLineColor: (rowIndex, node) =>
      rowIndex === 0 || rowIndex === node.table.body.length ? C.tableWrapBorder : C.tableBorder,
    vLineWidth: (columnIndex, node) =>
      columnIndex === 0 || columnIndex === (node.table.widths?.length ?? 3) ? px(1.1) : px(1),
    vLineColor: (columnIndex, node) =>
      columnIndex === 0 || columnIndex === (node.table.widths?.length ?? 3)
        ? C.tableWrapBorder
        : C.tableBorder,
    paddingLeft: (columnIndex) => (columnIndex === 1 ? mm(3) : mm(4.3)),
    paddingRight: () => mm(4.3),
    paddingTop: () => mm(2.2),
    paddingBottom: () => mm(2.2),
  };

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: ["33%", "27%", "40%"],
      body,
    },
    layout,
    margin: [0, mm(2.5), 0, 0],
  };
}

function labSection(results: LaboratoryResultRow[]): ContentStack {
  // The wrap border is drawn by the table layout's outer lines; the watermark
  // is placed by the caller as an absolutely positioned element.
  return { stack: [sectionHeading("Laboratory Test Result:", "flask"), labTable(results)] };
}

function counselingSection(points: string[]): ContentStack {
  const body: TableCell[][] =
    points.length === 0
      ? [
          [
            {
              colSpan: 2,
              text: "No counseling points were recorded for this screening.",
              style: "counseling",
              color: C.muted,
              italics: true,
            } as TableCell,
            {} as TableCell,
          ],
        ]
      : points.map((point, index) => [
          { text: `${index + 1}.`, style: "counseling" },
          { text: point, style: "counseling" },
        ]);

  const box: ContentTable = {
    table: { widths: [mm(8), "*"], dontBreakRows: true, body },
    layout: {
      hLineWidth: (rowIndex, node) => (rowIndex === 0 || rowIndex === node.table.body.length ? px(1.2) : 0),
      hLineColor: () => C.border,
      vLineWidth: (columnIndex, node) =>
        columnIndex === 0 || columnIndex === (node.table.widths?.length ?? 2) ? px(1.2) : 0,
      vLineColor: () => C.border,
      fillColor: () => C.counselingFill,
      paddingLeft: (columnIndex) => (columnIndex === 0 ? mm(4.5) : mm(2)),
      paddingRight: () => mm(4.5),
      paddingTop: () => mm(1.6),
      paddingBottom: () => mm(1.6),
    },
    margin: [0, mm(2.5), 0, 0],
  };

  return { stack: [sectionHeading("Patient Counseling Points:", "chat"), box] };
}

function footerSection(qrSrc: string | null): ContentStack {
  const sideCol = mm(30);
  const centerCol = PAGE_WIDTH - sideCol * 2;
  const usable = centerCol - px(4);
  const diamond = mm(4.6);
  const gap = mm(5);
  const lineWidth = (usable - diamond - gap * 2) / 2;

  const copy: ContentStack = {
    stack: [
      { text: "Thank you for visiting", style: "thankYou" },
      { text: "Dr. D. Y. Patil College of Pharmacy, Akurdi, Pune.", style: "footerCollege" },
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: lineWidth, y2: 0, lineColor: C.maroon, lineWidth: px(1) },
          {
            type: "rect",
            x: lineWidth + gap,
            y: -diamond / 2,
            w: diamond,
            h: diamond,
            r: diamond / 2,
            color: C.maroon,
          },
          {
            type: "line",
            x1: lineWidth + gap + diamond + gap,
            y1: 0,
            x2: usable,
            y2: 0,
            lineColor: C.maroon,
            lineWidth: px(1),
          },
        ],
        margin: [0, mm(3.2), 0, 0],
      },
    ],
    alignment: "center",
  };

  const qr: Content = qrSrc
    ? {
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: [
                  { image: qrSrc, width: mm(18), alignment: "center" },
                  { text: "Scan to view report online", style: "qrLabel" },
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => px(1),
          vLineWidth: () => px(1),
          hLineColor: () => "rgba(116,16,25,0.45)",
          vLineColor: () => "rgba(116,16,25,0.45)",
          fillColor: () => C.white,
          paddingLeft: () => mm(2.5),
          paddingRight: () => mm(2.5),
          paddingTop: () => mm(1.5),
          paddingBottom: () => mm(1.5),
        },
      }
    : { text: "" };

  const footerRow: ContentTable = {
    table: { widths: [sideCol, "*", sideCol], body: [[{ text: "" }, copy, qr]] },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };

  const waveHeight = mm(9);
  const waveRadius = PAGE_WIDTH / 2;
  const waves: ContentCanvas = {
    canvas: [
      { type: "ellipse", x: PAGE_WIDTH / 2, y: waveHeight, r1: waveRadius, r2: mm(5), color: C.maroon },
      { type: "ellipse", x: PAGE_WIDTH / 2, y: waveHeight, r1: waveRadius, r2: mm(3.4), color: C.waveMid },
      { type: "ellipse", x: PAGE_WIDTH / 2, y: waveHeight, r1: waveRadius, r2: mm(2), color: C.waveFront },
    ],
    margin: [0, mm(2), 0, 0],
  };

  const wrap: ContentTable = {
    table: { widths: ["*"], dontBreakRows: true, body: [[{ stack: [footerRow, waves] }]] },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, mm(6), 0, 0],
  };

  return { stack: [wrap] };
}

/* ------------------------------------------------------------------ */
/* Page 1 background: header card + title strip                        */
/* ------------------------------------------------------------------ */

function firstPageBackground(data: PatientHealthScreeningReportData, assets: ReportAssets): ContentStack {
  const hx = HEADER_MARGIN_X;
  const hy = HEADER_MARGIN_TOP;
  const hw = PAGE_WIDTH - HEADER_MARGIN_X * 2;
  const hh = HEADER_HEIGHT;

  const institutionWidth = hw - LOGO_COL - SLOGAN_COL;
  const panelX = hx + (LOGO_COL - LOGO_SIZE) / 2;
  const panelY = hy + (hh - LOGO_SIZE) / 2;
  const institutionX = hx + LOGO_COL;
  const institutionTextX = institutionX + mm(6);
  const institutionTop = hy + mm(3.5);
  const sloganX = hx + LOGO_COL + institutionWidth;

  const institution: ContentStack = {
    stack: [
      { text: "DR. D. Y. PATIL\nCOLLEGE OF PHARMACY", style: "collegeName" },
      { text: "Akurdi, Pune", style: "akurdi" },
      {
        text: "D.Y. Patil Educational Complex, Sector, Pradhikaran,\nNigdi, Pune, Maharashtra 412101",
        style: "address",
      },
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: mm(111), y2: 0, lineColor: C.maroon, lineWidth: px(1) }],
        margin: [0, mm(1.2), 0, mm(1)],
      },
      { text: "DEPARTMENT OF PHARMACY PRACTICE", style: "department" },
      { text: "(Pharm.D)", style: "pharmd" },
    ],
    absolutePosition: { x: institutionTextX, y: institutionTop },
  };

  const slogan: ContentTable = {
    table: {
      widths: [SLOGAN_COL],
      body: [[{ text: "Better Health\nfor a Brighter\nTomorrow", style: "slogan" }]],
    },
    layout: "noBorders",
    absolutePosition: { x: sloganX, y: hy + (hh - mm(20)) / 2 },
  };

  const titleX = TITLE_MARGIN_X;
  const titleY = hy + hh + TITLE_MARGIN_TOP;
  const titleW = PAGE_WIDTH - TITLE_MARGIN_X * 2;

  const titleBar: ContentTable = {
    table: {
      heights: [TITLE_HEIGHT],
      widths: [mm(40), "*", mm(40)],
      body: [
        [
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: mm(40), y2: 0, lineColor: C.white, lineWidth: px(1.8) }] },
          { text: "Health Screening Report", style: "title", alignment: "center" },
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: mm(40), y2: 0, lineColor: C.white, lineWidth: px(1.8) }] },
        ],
      ],
    },
    layout: "noBorders",
    absolutePosition: { x: titleX, y: titleY },
  };

  return {
    stack: [
      {
        canvas: [
          {
            type: "rect",
            x: hx,
            y: hy,
            w: hw,
            h: hh,
            r: HEADER_RADIUS,
            color: C.background,
            lineColor: C.maroon,
            lineWidth: HEADER_BORDER,
          },
          {
            type: "rect",
            x: panelX,
            y: panelY,
            w: LOGO_SIZE,
            h: LOGO_SIZE,
            r: LOGO_PANEL_RADIUS,
            color: "#fffaf7",
            lineColor: C.maroon,
            lineWidth: LOGO_PANEL_BORDER,
          },
          {
            type: "line",
            x1: institutionX,
            y1: institutionTop,
            x2: institutionX,
            y2: institutionTop + mm(29),
            lineColor: C.maroon,
            lineWidth: LOGO_PANEL_BORDER,
          },
          {
            type: "rect",
            x: titleX,
            y: titleY,
            w: titleW,
            h: TITLE_HEIGHT,
            r: TITLE_RADIUS,
            color: C.maroon,
          },
        ],
      },
      { image: assets.logoSrc, fit: [mm(23), mm(23)], absolutePosition: { x: panelX + mm(1.5), y: panelY + mm(1.5) } },
      institution,
      slogan,
      titleBar,
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Document definition                                                 */
/* ------------------------------------------------------------------ */

function spacer(height: number): ContentTable {
  return {
    table: { widths: ["*"], heights: [height], body: [[{ text: "" }]] },
    layout: "noBorders",
  };
}

function buildDocument(
  data: PatientHealthScreeningReportData,
  assets: ReportAssets,
): TDocumentDefinitions {
  const watermarkY = mm(175);

  const content: Content[] = [
    spacer(CONTENT_TOP),
    { ...demographicsSection(data.patient), margin: [CONTENT_PAD_X, 0, CONTENT_PAD_X, 0] },
    {
      image: assets.logoSrc,
      width: mm(46),
      opacity: 0.055,
      absolutePosition: { x: mm(82), y: watermarkY },
    },
    { ...labSection(data.laboratoryResults), margin: [CONTENT_PAD_X, SECTION_GAP, CONTENT_PAD_X, 0] },
    { ...counselingSection(data.counselingPoints), margin: [CONTENT_PAD_X, SECTION_GAP, CONTENT_PAD_X, 0] },
    footerSection(assets.qrSrc),
  ];

  return {
    pageSize: "A4",
    pageMargins: 0,
    info: {
      title: "Health Screening Report",
      author: "Dr. D. Y. Patil College of Pharmacy, Akurdi, Pune",
      subject: `Health screening report for ${data.patient.name}`,
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10.5,
      color: C.blue,
      lineHeight: 1.45,
    },
    background: (currentPage) => (currentPage === 1 ? firstPageBackground(data, assets) : null),
    content,
    styles: {
      collegeName: {
        font: "RobotoBlack",
        fontSize: 15,
        color: C.maroonDark,
        lineHeight: 0.95,
        characterSpacing: 0.22,
      },
      akurdi: { font: "RobotoBlack", fontSize: 10, color: C.maroonDark, lineHeight: 1, margin: [0, mm(0.6), 0, 0] },
      address: {
        font: "Roboto",
        bold: true,
        fontSize: 8,
        color: C.maroonDark,
        lineHeight: 1.05,
        margin: [0, mm(1.2), 0, 0],
      },
      department: { font: "RobotoBlack", fontSize: 8.5, color: C.maroonDark, lineHeight: 1.05 },
      pharmd: { font: "RobotoBlack", fontSize: 8, color: C.maroonDark, lineHeight: 1.05, margin: [0, mm(0.2), 0, 0] },
      slogan: {
        font: "Roboto",
        italics: true,
        bold: true,
        fontSize: 11,
        color: C.maroon,
        lineHeight: 1.05,
        alignment: "center",
      },
      title: { font: "RobotoBlack", fontSize: 16, color: C.white, lineHeight: 1 },
      sectionHeading: { font: "RobotoBlack", fontSize: 14, color: C.maroon, lineHeight: 1 },
      demoLabel: { font: "RobotoMedium", fontSize: 10, color: C.blue, lineHeight: 1.2 },
      demoValue: { font: "RobotoMedium", fontSize: 10.5, color: C.demoValue, lineHeight: 1.35 },
      tableHeader: { font: "RobotoBlack", fontSize: 10, color: C.white, lineHeight: 1.2 },
      table: { font: "Roboto", fontSize: 10, color: C.blue, lineHeight: 1.3 },
      result: { font: "RobotoBlack", fontSize: 10.5, lineHeight: 1.3, alignment: "center" },
      range: { font: "Roboto", fontSize: 10, color: C.rangeText, lineHeight: 1.3 },
      labEmpty: { font: "Roboto", italics: true, fontSize: 10, color: C.muted, alignment: "center" },
      counseling: { font: "Roboto", fontSize: 10.5, color: C.counselingText, lineHeight: 1.5 },
      thankYou: {
        font: "Roboto",
        italics: true,
        bold: true,
        fontSize: 11,
        color: C.maroon,
        lineHeight: 1,
        alignment: "center",
      },
      footerCollege: {
        font: "Roboto",
        italics: true,
        bold: true,
        fontSize: 9,
        color: C.maroon,
        lineHeight: 1.05,
        alignment: "center",
        margin: [0, mm(1.2), 0, 0],
      },
      qrLabel: {
        font: "RobotoMedium",
        fontSize: 8.5,
        color: C.maroonDark,
        alignment: "center",
        lineHeight: 1.05,
        margin: [0, mm(0.8), 0, 0],
      },
    },
  };
}

/** Renders the health screening report to a PDF buffer using pdfmake. */
export async function buildHealthScreeningReportPdf(
  data: PatientHealthScreeningReportData,
  assets: ReportAssets,
): Promise<Buffer> {
  ensureReportFonts();
  const document = buildDocument(data, assets);
  const output = await pdfMakeInstance.createPdf(document).getBuffer();
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}

export const REPORT_PAGE_HEIGHT = PAGE_HEIGHT;
