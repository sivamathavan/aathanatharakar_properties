import { BRAND } from "@/lib/brand";
// CSV and PDF exports for tracker tables. Libraries load only when used.
export const exportToCSV = async (data: any[], filename: string) => {
  if (data.length === 0) return;
  const Papa = (await import("papaparse")).default;
  const blob = new Blob([Papa.unparse(data)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = async (
  title: string,
  headers: string[],
  rows: any[][],
  filename: string,
  accentColor: [number, number, number] = [12, 43, 41]
) => {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(12, 43, 41);
  doc.text(BRAND.name, 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 110);
  doc.text(title, 14, 25);
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 31);
  doc.setDrawColor(220, 220, 230);
  doc.line(14, 35, 196, 35);
  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: accentColor, textColor: [227, 150, 20], fontSize: 10, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 60] },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    margin: { left: 14, right: 14 },
    styles: { overflow: "linebreak", cellPadding: 4 },
  });
  doc.save(`${filename}.pdf`);
};
