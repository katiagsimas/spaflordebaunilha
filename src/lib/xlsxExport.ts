import ExcelJS from "exceljs";

function saveBlob(buf: ArrayBuffer, filename: string) {
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

/**
 * Exporta um array de objetos JSON para .xlsx (substitui xlsx.utils.json_to_sheet).
 * Cabeçalhos são inferidos a partir das chaves do primeiro objeto.
 */
export async function exportJsonToXlsx(
  rows: Record<string, any>[],
  sheetName: string,
  filename: string,
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.slice(0, 31));
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    ws.addRow(headers);
    for (const r of rows) {
      ws.addRow(headers.map((h) => r[h] ?? ""));
    }
  }
  const buf = await wb.xlsx.writeBuffer();
  saveBlob(buf as ArrayBuffer, filename);
}

/**
 * Exporta um array de arrays (linhas) para .xlsx (substitui xlsx.utils.aoa_to_sheet).
 * A primeira linha é usada como cabeçalho.
 */
export async function exportAoaToXlsx(
  rows: any[][],
  sheetName: string,
  filename: string,
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.slice(0, 31));
  for (const r of rows) ws.addRow(r);
  const buf = await wb.xlsx.writeBuffer();
  saveBlob(buf as ArrayBuffer, filename);
}
