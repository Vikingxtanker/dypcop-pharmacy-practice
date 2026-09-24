import QRCode from "qrcode";

export interface ReportQrOptions {
  url: string;
  width?: number;
}

export async function createReportQrDataUri({ url, width = 256 }: ReportQrOptions): Promise<string> {
  return QRCode.toDataURL(url, {
    width,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#5c0b12ff", light: "#ffffffff" },
  });
}