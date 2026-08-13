import { formatCurrency, formatShortDate } from '../utils/formatters';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 40;
const MARGIN_RIGHT = 572;
const ROW_HEIGHT = 20;
const ROWS_PER_PAGE = 24;
const COL_DATE = 42;
const COL_ITEM = 118;
const COL_AMOUNT = 500;
const DETAILED_LINE_HEIGHT = 11;
const DETAILED_PAGE_BODY_FIRST = 580;
const DETAILED_PAGE_BODY_NEXT = 640;
const DETAILED_FONT = 8;
const DETAILED_ITEM_WRAP = 30;
const DETAILED_COL = {
  date: 40,
  item: 76,
  source: 181,
  customer: 233,
  amount: 281,
  cost: 325,
  profit: 369,
  status: 413,
};
const PDF_FOOTER_LINE = '(c) Copyright 2026 webbiezinfotech.in All Rights Reserved';
const PDF_FOOTER_Y = 24;
const PDF_FOOTER_SIZE = 8;

function pdfSafeText(text) {
  return String(text ?? '')
    .replace(/\u20B9/g, 'Rs.')
    .replace(/[^\t\n\r\x20-\x7E]/g, '');
}

function escapePdfString(value) {
  return pdfSafeText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function truncateText(text, maxLength) {
  const safe = pdfSafeText(text);
  if (safe.length <= maxLength) return safe;
  return `${safe.slice(0, maxLength - 3)}...`;
}

function wrapText(text, maxCharsPerLine) {
  const safe = pdfSafeText(text).trim();
  if (!safe) return [''];
  if (safe.length <= maxCharsPerLine) return [safe];

  const lines = [];
  let remaining = safe;

  while (remaining.length > maxCharsPerLine) {
    let breakAt = remaining.lastIndexOf(' ', maxCharsPerLine);
    if (breakAt <= 0) breakAt = maxCharsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }

  if (remaining) lines.push(remaining);
  return lines;
}

function getDetailedEntryHeight(entry) {
  const itemLines = wrapText(entry.item_name, DETAILED_ITEM_WRAP);
  return Math.max(itemLines.length, 1) * DETAILED_LINE_HEIGHT + 4;
}

function paginateDetailedEntries(entries) {
  if (!entries.length) return [[]];

  const pages = [];
  let currentPage = [];
  let usedHeight = 0;

  entries.forEach((entry) => {
    const entryHeight = getDetailedEntryHeight(entry);
    const pageLimit = pages.length === 0 ? DETAILED_PAGE_BODY_FIRST : DETAILED_PAGE_BODY_NEXT;

    if (currentPage.length > 0 && usedHeight + entryHeight > pageLimit) {
      pages.push(currentPage);
      currentPage = [];
      usedHeight = 0;
    }

    currentPage.push(entry);
    usedHeight += entryHeight;
  });

  if (currentPage.length) pages.push(currentPage);
  return pages;
}

function drawWrappedColumn(commands, x, startY, lines, lineHeight, size, bold = false) {
  lines.forEach((line, index) => {
    drawText(commands, x, startY - index * lineHeight, line, size, bold && index === 0);
  });
}

function formatPdfAmount(amount) {
  return pdfSafeText(formatCurrency(amount));
}

function drawText(commands, x, y, text, size = 11, bold = false) {
  commands.push('BT', `/${bold ? 'F2' : 'F1'} ${size} Tf`, '1 0 0 1', `${x} ${y}`, 'Tm', `(${escapePdfString(text)}) Tj`, 'ET');
}

function drawCenteredText(commands, y, text, size = 11, bold = false) {
  const safeText = pdfSafeText(text);
  const approxWidth = safeText.length * size * 0.48;
  const x = Math.max(MARGIN_LEFT, (PAGE_WIDTH - approxWidth) / 2);
  drawText(commands, x, y, safeText, size, bold);
}

function drawLine(commands, x1, y1, x2, y2) {
  commands.push('0.75 w', '0.82 G', `${x1} ${y1} m`, `${x2} ${y2} l`, 'S');
}

export function isSourceReport(report) {
  return report?.search_type === 'source';
}

/** Name search = simple statement PDF; date/month/range only = full detail PDF */
export function isStatementReport(report) {
  return Boolean(report?.search && String(report.search).trim());
}

function getEntryPdfAmount(entry, report) {
  return isSourceReport(report) ? entry.purchase_cost : entry.customer_amount;
}

function getAmountColumnLabel(report) {
  return isSourceReport(report) ? 'Cost' : 'Amount';
}

function getTotalLabel(report) {
  return isSourceReport(report) ? 'Total Cost' : 'Total Amount';
}

function buildFilterLine(report) {
  if (!report.search) return null;
  if (isSourceReport(report)) {
    return `Source: ${pdfSafeText(report.search)}`;
  }
  if (report.search_type === 'customer') {
    return `Customer: ${pdfSafeText(report.search)}`;
  }
  if (report.search_type === 'item') {
    return `Item: ${pdfSafeText(report.search)}`;
  }
  return `Filter: ${pdfSafeText(report.search)}`;
}
function buildReportFilename(report) {
  const datePart = report.from_date || 'report';
  const searchPart = report.search
    ? `-${String(report.search).trim().replace(/\s+/g, '-').toLowerCase()}`
    : '';
  return `shivay-mobile-${datePart}${searchPart}.pdf`;
}

function drawReportHeader(commands, report, pageIndex, totalPages) {
  let y = PAGE_HEIGHT - 48;

  if (pageIndex === 0) {
    drawText(commands, MARGIN_LEFT, y, 'SHIVAY MOBILE', 20, true);
    y -= 22;
    drawText(commands, MARGIN_LEFT, y, 'Sales  |  Service  |  Accessories', 10);
    y -= 24;
    drawLine(commands, MARGIN_LEFT, y + 8, MARGIN_RIGHT, y + 8);
    y -= 10;

    drawText(commands, MARGIN_LEFT, y, `Period: ${pdfSafeText(report.month_label || '')}`, 11, true);
    y -= 16;

    const filterLine = buildFilterLine(report);
    if (filterLine) {
      drawText(commands, MARGIN_LEFT, y, filterLine, 11);
      y -= 16;
    }

    const generatedOn = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    drawText(commands, MARGIN_LEFT, y, `Generated: ${generatedOn}`, 9);
    y -= 22;
  } else {
    drawText(commands, MARGIN_LEFT, y, 'SHIVAY MOBILE', 12, true);
    y -= 18;
    drawText(commands, MARGIN_LEFT, y, `Report (Page ${pageIndex + 1} of ${totalPages})`, 10);
    y -= 20;
  }

  return y;
}

function formatPdfStatus(status) {
  return status === 'settled' ? 'Sett' : 'Pend';
}

function buildStatementPageContent({ entries, pageIndex, totalPages, report, showTotal, showFooter, totalAmount }) {
  const commands = [];
  let y = drawReportHeader(commands, report, pageIndex, totalPages);

  drawLine(commands, MARGIN_LEFT, y, MARGIN_RIGHT, y);
  y -= 18;

  drawText(commands, COL_DATE, y, 'Date', 10, true);
  drawText(commands, COL_ITEM, y, 'Item / Work', 10, true);
  drawText(commands, COL_AMOUNT, y, getAmountColumnLabel(report), 10, true);
  y -= 8;
  drawLine(commands, MARGIN_LEFT, y, MARGIN_RIGHT, y);
  y -= 14;

  entries.forEach((entry) => {
    drawText(commands, COL_DATE, y, formatShortDate(entry.entry_date), 10);
    drawText(commands, COL_ITEM, y, truncateText(entry.item_name, 42), 10);
    drawText(commands, COL_AMOUNT, y, formatPdfAmount(getEntryPdfAmount(entry, report)), 10, true);
    y -= ROW_HEIGHT;
  });

  y -= 4;
  drawLine(commands, MARGIN_LEFT, y + 10, MARGIN_RIGHT, y + 10);

  if (showTotal) {
    y -= 8;
    drawText(commands, COL_ITEM, y, getTotalLabel(report), 11, true);
    drawText(commands, COL_AMOUNT, y, formatPdfAmount(totalAmount), 11, true);
  }

  if (showFooter) {
    drawCenteredText(commands, PDF_FOOTER_Y, PDF_FOOTER_LINE, PDF_FOOTER_SIZE);
  }

  return commands.join('\n');
}

function buildDetailedPageContent({
  entries,
  pageIndex,
  totalPages,
  report,
  showTotals,
  showFooter,
  totals,
}) {
  const commands = [];
  let y = drawReportHeader(commands, report, pageIndex, totalPages);

  drawLine(commands, MARGIN_LEFT, y, MARGIN_RIGHT, y);
  y -= 16;

  drawText(commands, DETAILED_COL.date, y, 'Date', DETAILED_FONT, true);
  drawText(commands, DETAILED_COL.item, y, 'Item', DETAILED_FONT, true);
  drawText(commands, DETAILED_COL.source, y, 'Source', DETAILED_FONT, true);
  drawText(commands, DETAILED_COL.customer, y, 'Customer', DETAILED_FONT, true);
  drawText(commands, DETAILED_COL.amount, y, 'Amount', DETAILED_FONT, true);
  drawText(commands, DETAILED_COL.cost, y, 'Cost', DETAILED_FONT, true);
  drawText(commands, DETAILED_COL.profit, y, 'Profit', DETAILED_FONT, true);
  drawText(commands, DETAILED_COL.status, y, 'St.', DETAILED_FONT, true);
  y -= 6;
  drawLine(commands, MARGIN_LEFT, y, MARGIN_RIGHT, y);
  y -= 12;

  entries.forEach((entry) => {
    const itemLines = wrapText(entry.item_name, DETAILED_ITEM_WRAP);
    const rowLines = Math.max(itemLines.length, 1);

    drawText(commands, DETAILED_COL.date, y, formatShortDate(entry.entry_date), DETAILED_FONT);
    drawWrappedColumn(commands, DETAILED_COL.item, y, itemLines, DETAILED_LINE_HEIGHT, DETAILED_FONT);
    
    drawText(commands, DETAILED_COL.source, y, truncateText(entry.source_shop, 9), DETAILED_FONT);
    drawText(commands, DETAILED_COL.customer, y, truncateText(entry.customer_name, 10), DETAILED_FONT);
    drawText(commands, DETAILED_COL.amount, y, formatPdfAmount(entry.customer_amount), DETAILED_FONT);
    drawText(commands, DETAILED_COL.cost, y, formatPdfAmount(entry.purchase_cost), DETAILED_FONT);
    drawText(commands, DETAILED_COL.profit, y, formatPdfAmount(entry.profit), DETAILED_FONT);
    drawText(commands, DETAILED_COL.status, y, formatPdfStatus(entry.settlement_status), DETAILED_FONT);

    y -= rowLines * DETAILED_LINE_HEIGHT + 3;
  });

  y -= 4;
  drawLine(commands, MARGIN_LEFT, y + 8, MARGIN_RIGHT, y + 8);

  if (showTotals) {
    y -= 10;
    drawText(commands, DETAILED_COL.item, y, 'Grand Total', DETAILED_FONT, true);
    drawText(commands, DETAILED_COL.amount, y, formatPdfAmount(totals.totalAmount), DETAILED_FONT, true);
    drawText(commands, DETAILED_COL.cost, y, formatPdfAmount(totals.totalCost), DETAILED_FONT, true);
    drawText(commands, DETAILED_COL.profit, y, formatPdfAmount(totals.totalProfit), DETAILED_FONT, true);
    y -= 14;
    drawText(
      commands,
      DETAILED_COL.item,
      y,
      `Entries: ${totals.totalEntries}  |  Settled: ${formatPdfAmount(totals.settledAmount)}  |  Pending: ${formatPdfAmount(totals.pendingAmount)}`,
      DETAILED_FONT
    );
  }

  if (showFooter) {
    drawCenteredText(commands, PDF_FOOTER_Y, PDF_FOOTER_LINE, PDF_FOOTER_SIZE);
  }

  return commands.join('\n');
}

function buildPdfDocument(pageContents) {
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const regularFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const boldFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds = [];

  pageContents.forEach((content) => {
    const stream = content;
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent PAGES_PLACEHOLDER /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  const kids = pageIds.map((id) => `${id} 0 R`).join(' ');
  const pagesId = addObject(`<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>`);

  objects.forEach((object, index) => {
    if (object.includes('PAGES_PLACEHOLDER')) {
      objects[index] = object.replace('PAGES_PLACEHOLDER', `${pagesId} 0 R`);
    }
  });

  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return pdf;
}

function sumEntries(entries, pick) {
  return entries.reduce((sum, entry) => sum + Number(pick(entry) || 0), 0);
}

function buildDetailedTotals(entries) {
  const settledEntries = entries.filter((entry) => entry.settlement_status === 'settled');
  const pendingEntries = entries.filter((entry) => entry.settlement_status === 'pending');

  return {
    totalEntries: entries.length,
    totalCost: sumEntries(entries, (entry) => entry.purchase_cost),
    totalAmount: sumEntries(entries, (entry) => entry.customer_amount),
    totalProfit: sumEntries(entries, (entry) => entry.profit),
    settledAmount: sumEntries(settledEntries, (entry) => entry.customer_amount),
    pendingAmount: sumEntries(pendingEntries, (entry) => entry.customer_amount),
  };
}

function buildStatementReportPdf(report) {
  const allEntries = report.entries || [];
  const totalAmount = sumEntries(allEntries, (entry) => getEntryPdfAmount(entry, report));
  const chunks = [];

  for (let i = 0; i < allEntries.length; i += ROWS_PER_PAGE) {
    chunks.push(allEntries.slice(i, i + ROWS_PER_PAGE));
  }

  if (chunks.length === 0) {
    chunks.push([]);
  }

  const totalPages = chunks.length;
  return chunks.map((entries, pageIndex) =>
    buildStatementPageContent({
      entries,
      pageIndex,
      totalPages,
      report,
      showTotal: pageIndex === totalPages - 1,
      showFooter: pageIndex === totalPages - 1,
      totalAmount,
    })
  );
}

function buildDetailedDateReportPdf(report) {
  const allEntries = report.entries || [];
  const totals = buildDetailedTotals(allEntries);
  const chunks = paginateDetailedEntries(allEntries);

  const totalPages = chunks.length;
  return chunks.map((entries, pageIndex) =>
    buildDetailedPageContent({
      entries,
      pageIndex,
      totalPages,
      report,
      showTotals: pageIndex === totalPages - 1,
      showFooter: pageIndex === totalPages - 1,
      totals,
    })
  );
}

function buildCustomerReportPdf(report) {
  const pageContents = isStatementReport(report)
    ? buildStatementReportPdf(report)
    : buildDetailedDateReportPdf(report);

  return buildPdfDocument(pageContents);
}

function downloadPdfBlob(report, filename) {
  const pdfContent = buildCustomerReportPdf(report);
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadReportPdf(report) {
  const lines = [
    'SHIVAY MOBILE',
    pdfSafeText(report.month_label || ''),
    report.search ? `Filter: ${pdfSafeText(report.search)}` : '',
    '',
    'Date | Item | Amount',
    ...(report.entries || []).map((entry) =>
      pdfSafeText(
        [
          formatShortDate(entry.entry_date),
          entry.item_name,
          formatCurrency(getEntryPdfAmount(entry, report)),
        ].join(' | ')
      )
    ),
  ].filter(Boolean);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `shivay-mobile-${report.from_date || 'report'}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadReportPdfFile(report) {
  downloadPdfBlob(report, buildReportFilename(report));
}

export function buildReportItemSummary(entries = [], searchType = 'all') {
  const usePurchaseCost = searchType === 'source';
  const summaryMap = new Map();

  entries.forEach((entry) => {
    const key = `${entry.item_name}||${entry.source_shop}`;
    const existing = summaryMap.get(key) || {
      item_name: entry.item_name,
      source_shop: entry.source_shop,
      count: 0,
      total_amount: 0,
    };

    const lineAmount = usePurchaseCost
      ? Number(entry.purchase_cost ?? 0)
      : Number(entry.customer_amount ?? 0);

    existing.count += 1;
    existing.total_amount += lineAmount;
    summaryMap.set(key, existing);
  });

  return Array.from(summaryMap.values()).sort((a, b) => b.total_amount - a.total_amount);
}

export function getSourcePurchaseTotal(entries = []) {
  return entries.reduce((sum, entry) => sum + Number(entry.purchase_cost ?? 0), 0);
}

export function getSearchPerspectiveLabel(searchType) {
  if (searchType === 'source') return 'Source Shop';
  if (searchType === 'customer') return 'Customer / Party';
  if (searchType === 'item') return 'Item';
  return 'Name';
}
