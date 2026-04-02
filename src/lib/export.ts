// ==================== مكتبة التصدير ====================
import { formatCurrency } from '@/store';

// ==================== أنواع البيانات ====================
export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: 'number' | 'currency' | 'percent' | 'date';
}

export interface ExportData {
  columns: ExportColumn[];
  rows: Record<string, any>[];
  title?: string;
  subtitle?: string;
  metadata?: Record<string, string>;
}

// ==================== CSV Export ====================
export function exportToCSV(data: ExportData): string {
  const headers = data.columns.map(col => col.label).join(',');
  
  const rows = data.rows.map(row => {
    return data.columns.map(col => {
      let value = row[col.key];
      
      // Format value
      if (value === null || value === undefined) {
        value = '';
      } else if (col.format === 'currency') {
        value = typeof value === 'number' ? value.toFixed(2) : value;
      } else if (col.format === 'percent') {
        value = typeof value === 'number' ? `${value.toFixed(1)}%` : value;
      } else if (col.format === 'date' && value) {
        value = new Date(value).toLocaleDateString('ar-SA');
      } else if (typeof value === 'string' && value.includes(',')) {
        value = `"${value}"`;
      }
      
      return value;
    }).join(',');
  });

  // Add metadata as comments
  const metadata = data.metadata 
    ? Object.entries(data.metadata).map(([k, v]) => `# ${k}: ${v}`).join('\n')
    : '';
  
  const content = metadata 
    ? `${metadata}\n${headers}\n${rows.join('\n')}`
    : `${headers}\n${rows.join('\n')}`;

  return content;
}

// ==================== TSV Export ====================
export function exportToTSV(data: ExportData): string {
  const headers = data.columns.map(col => col.label).join('\t');
  
  const rows = data.rows.map(row => {
    return data.columns.map(col => {
      let value = row[col.key];
      
      if (value === null || value === undefined) {
        value = '';
      } else if (col.format === 'currency') {
        value = typeof value === 'number' ? value.toFixed(2) : value;
      } else if (col.format === 'percent') {
        value = typeof value === 'number' ? `${value.toFixed(1)}%` : value;
      } else if (col.format === 'date' && value) {
        value = new Date(value).toLocaleDateString('ar-SA');
      }
      
      return value;
    }).join('\t');
  });

  return `${headers}\n${rows.join('\n')}`;
}

// ==================== JSON Export ====================
export function exportToJSON(data: ExportData): string {
  const formattedRows = data.rows.map(row => {
    const formattedRow: Record<string, any> = {};
    data.columns.forEach(col => {
      let value = row[col.key];
      if (col.format === 'date' && value) {
        value = new Date(value).toISOString();
      }
      formattedRow[col.label] = value;
    });
    return formattedRow;
  });

  return JSON.stringify({
    title: data.title,
    subtitle: data.subtitle,
    metadata: data.metadata,
    data: formattedRows,
  }, null, 2);
}

// ==================== HTML Table Export ====================
export function exportToHTML(data: ExportData): string {
  const styles = `
    <style>
      body { font-family: Arial, sans-serif; direction: rtl; }
      h1 { text-align: center; color: #333; }
      h2 { text-align: center; color: #666; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; text-align: right; }
      td { padding: 8px; border: 1px solid #ddd; }
      tr:nth-child(even) { background: #f9f9f9; }
      .number, .currency { text-align: left; }
      .metadata { margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
      .metadata p { margin: 5px 0; }
      .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
    </style>
  `;

  const metadataHTML = data.metadata 
    ? `<div class="metadata">
        ${Object.entries(data.metadata).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}
       </div>`
    : '';

  const headerRow = data.columns.map(col => 
    `<th style="${col.align ? `text-align: ${col.align}` : ''}">${col.label}</th>`
  ).join('');

  const bodyRows = data.rows.map(row => {
    return `<tr>${data.columns.map(col => {
      let value = row[col.key];
      
      if (value === null || value === undefined) {
        value = '-';
      } else if (col.format === 'currency') {
        value = typeof value === 'number' ? value.toFixed(2) : value;
      } else if (col.format === 'percent') {
        value = typeof value === 'number' ? `${value.toFixed(1)}%` : value;
      } else if (col.format === 'date' && value) {
        value = new Date(value).toLocaleDateString('ar-SA');
      }
      
      return `<td style="${col.align ? `text-align: ${col.align}` : ''}">${value}</td>`;
    }).join('')}</tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title || 'تقرير'}</title>
      ${styles}
    </head>
    <body>
      ${data.title ? `<h1>${data.title}</h1>` : ''}
      ${data.subtitle ? `<h2>${data.subtitle}</h2>` : ''}
      ${metadataHTML}
      <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <div class="footer">
        تم إنشاء هذا التقرير بتاريخ ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}
      </div>
    </body>
    </html>
  `;
}

// ==================== Print-friendly Format ====================
export function generatePrintContent(data: ExportData): string {
  return exportToHTML(data);
}

// ==================== Excel-compatible XML ====================
export function exportToExcelXML(data: ExportData): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>';
  
  const styles = `
    <Styles>
      <Style ss:ID="Header">
        <Font ss:Bold="1"/>
        <Interior ss:Color="#F5F5F5" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="Number">
        <NumberFormat ss:Format="#,##0.00"/>
      </Style>
      <Style ss:ID="Currency">
        <NumberFormat ss:Format="#,##0.00 &quot;ر.س&quot;"/>
      </Style>
      <Style ss:ID="Percent">
        <NumberFormat ss:Format="0.0%"/>
      </Style>
      <Style ss:ID="Date">
        <NumberFormat ss:Format="yyyy-mm-dd"/>
      </Style>
    </Styles>
  `;

  const headerRow = `<Row>${data.columns.map(col => 
    `<Cell ss:StyleID="Header"><Data ss:Type="String">${col.label}</Data></Cell>`
  ).join('')}</Row>`;

  const bodyRows = data.rows.map(row => {
    return `<Row>${data.columns.map(col => {
      let value = row[col.key];
      let type = 'String';
      let style = '';
      
      if (value === null || value === undefined) {
        value = '';
        type = 'String';
      } else if (col.format === 'currency') {
        type = 'Number';
        style = ' ss:StyleID="Currency"';
      } else if (col.format === 'percent') {
        type = 'Number';
        style = ' ss:StyleID="Percent"';
        value = typeof value === 'number' ? value / 100 : value;
      } else if (col.format === 'date' && value) {
        type = 'String';
        style = ' ss:StyleID="Date"';
        value = new Date(value).toISOString().split('T')[0];
      } else if (typeof value === 'number') {
        type = 'Number';
        style = ' ss:StyleID="Number"';
      }
      
      return `<Cell${style}><Data ss:Type="${type}">${value}</Data></Cell>`;
    }).join('')}</Row>`;
  }).join('\n');

  return `${xmlHeader}
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="تقرير">
    ${styles}
    <Table>
      ${headerRow}
      ${bodyRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

// ==================== Download Helper ====================
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==================== Export Functions by Type ====================
export const exporters = {
  csv: (data: ExportData) => ({
    content: exportToCSV(data),
    mimeType: 'text/csv;charset=utf-8',
    extension: 'csv',
  }),
  tsv: (data: ExportData) => ({
    content: exportToTSV(data),
    mimeType: 'text/tab-separated-values;charset=utf-8',
    extension: 'tsv',
  }),
  json: (data: ExportData) => ({
    content: exportToJSON(data),
    mimeType: 'application/json;charset=utf-8',
    extension: 'json',
  }),
  html: (data: ExportData) => ({
    content: exportToHTML(data),
    mimeType: 'text/html;charset=utf-8',
    extension: 'html',
  }),
  excel: (data: ExportData) => ({
    content: exportToExcelXML(data),
    mimeType: 'application/vnd.ms-excel;charset=utf-8',
    extension: 'xls',
  }),
};

export type ExportFormat = keyof typeof exporters;

export function exportReport(
  data: ExportData, 
  format: ExportFormat, 
  filename?: string
): void {
  const exporter = exporters[format];
  const { content, mimeType, extension } = exporter(data);
  const finalFilename = filename || `report_${new Date().toISOString().split('T')[0]}.${extension}`;
  downloadFile(content, finalFilename, mimeType);
}
