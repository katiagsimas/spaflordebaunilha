// Shim mínimo da API `xlsx` (apenas o subset usado pelo app, todo de export).
// Usa `exceljs` por baixo — a biblioteca `xlsx` foi removida por vulnerabilidades
// (Prototype Pollution / ReDoS) sem fix gratuito.
import ExcelJS from "exceljs";

type SheetData =
  | { __kind: "json"; rows: Record<string, any>[] }
  | { __kind: "aoa"; rows: any[][] };

interface ShimWorkbook {
  sheets: { name: string; data: SheetData }[];
}

function downloadBuffer(buf: ArrayBuffer, filename: string) {
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const utils = {
  json_to_sheet(rows: Record<string, any>[]): SheetData {
    return { __kind: "json", rows: rows ?? [] };
  },
  aoa_to_sheet(rows: any[][]): SheetData {
    return { __kind: "aoa", rows: rows ?? [] };
  },
  book_new(): ShimWorkbook {
    return { sheets: [] };
  },
  book_append_sheet(wb: ShimWorkbook, sheet: SheetData, name: string) {
    wb.sheets.push({ name: (name ?? "Sheet1").slice(0, 31), data: sheet });
  },
};

export function writeFile(wb: ShimWorkbook, filename: string): void {
  // Construção e download assíncronos; chamadores existentes não usam await.
  (async () => {
    const ebook = new ExcelJS.Workbook();
    for (const { name, data } of wb.sheets) {
      const ws = ebook.addWorksheet(name);
      if (data.__kind === "json") {
        const rows = data.rows;
        if (rows.length > 0) {
          const headers = Array.from(
            rows.reduce<Set<string>>((acc, r) => {
              Object.keys(r ?? {}).forEach((k) => acc.add(k));
              return acc;
            }, new Set<string>()),
          );
          ws.addRow(headers);
          for (const r of rows) {
            ws.addRow(headers.map((h) => (r?.[h] ?? "") as any));
          }
        }
      } else {
        for (const r of data.rows) ws.addRow(r);
      }
    }
    const buf = await ebook.xlsx.writeBuffer();
    downloadBuffer(buf as ArrayBuffer, filename);
  })().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[xlsxShim] writeFile failed:", err);
  });
}

export default { utils, writeFile };
