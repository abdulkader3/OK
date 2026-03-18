import { Sale, SaleItem } from "@/services/salesApi";

export interface SalesPDFTranslations {
  "sales.pdf.title": string;
  "sales.pdf.dateRange": string;
  "sales.pdf.totalSales": string;
  "sales.pdf.transactions": string;
  "sales.pdf.paidSales": string;
  "sales.pdf.creditSales": string;
  "sales.pdf.generatedOn": string;
  "sales.pdf.items": string;
  "sales.pdf.quantity": string;
  "sales.pdf.price": string;
  "sales.pdf.subtotal": string;
  "sales.pdf.paymentStatus": string;
  "sales.pdf.paid": string;
  "sales.pdf.notPaid": string;
  "sales.pdf.customer": string;
  "sales.pdf.allTime": string;
  "common.date": string;
  "common.amount": string;
  "sales.pdf.cash": string;
  "sales.pdf.card": string;
}

export interface SalesSummaryData {
  dateRange: {
    from: string | null;
    to: string | null;
  };
  totalAmount: number;
  totalTransactions: number;
  paidTransactions: number;
  unpaidTransactions: number;
  paidAmount: number;
  unpaidAmount: number;
}

function formatCurrency(amount: number, symbol: string = "৳"): string {
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function calculateSalesSummary(sales: Sale[]): SalesSummaryData {
  const totalAmount = sales.reduce(
    (sum, s) => sum + (s.totalAmount || s.total || 0),
    0,
  );
  const creditSales = sales.filter((s) => s.paymentStatus === "not_paid");
  const cashSales = sales.filter((s) => s.paymentStatus === "paid");

  return {
    dateRange: {
      from:
        sales.length > 0
          ? sales[sales.length - 1].createdAt.split("T")[0]
          : null,
      to: sales.length > 0 ? sales[0].createdAt.split("T")[0] : null,
    },
    totalAmount,
    totalTransactions: sales.length,
    paidTransactions: cashSales.length,
    unpaidTransactions: creditSales.length,
    paidAmount: cashSales.reduce(
      (sum, s) => sum + (s.totalAmount || s.total || 0),
      0,
    ),
    unpaidAmount: creditSales.reduce(
      (sum, s) => sum + (s.totalAmount || s.total || 0),
      0,
    ),
  };
}

export function generateSalesPDFHtml(
  sales: Sale[],
  summary: SalesSummaryData,
  translations: SalesPDFTranslations,
  currency: string = 'BDT',
  dateFrom?: string,
  dateTo?: string,
): string {
  const dateRangeText =
    dateFrom && dateTo
      ? `${formatDate(dateFrom)} - ${formatDate(dateTo)}`
      : dateFrom
        ? `${formatDate(dateFrom)} - ${translations["sales.pdf.allTime"] || "Present"}`
        : "All Time";

  const salesRows = sales
    .map(
      (sale) => `
    <tr>
      <td style="font-weight:500">${formatDateTime(sale.createdAt)}</td>
      <td>
        ${sale.items.map((item) => `<div>${item.name || item.productName || "Item"} x${item.quantity}</div>`).join("")}
      </td>
      <td style="text-align:right">${formatCurrency(sale.totalAmount || sale.total || 0, currency)}</td>
      <td>
        <span style="padding:4px 8px;border-radius:4px;font-size:11px;background:${sale.paymentStatus === "not_paid" ? "#fee2e2" : "#dcfce7"};color:${sale.paymentStatus === "not_paid" ? "#dc2626" : "#16a34a"}">
          ${sale.paymentStatus === "not_paid" 
            ? translations["sales.pdf.notPaid"] 
            : `${translations["sales.pdf.paid"]} (${sale.paymentMethod === 'cash' ? translations["sales.pdf.cash"] : translations["sales.pdf.card"]})`
          }
        </span>
      </td>
      <td>${sale.ledgerName || "-"}</td>
    </tr>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${translations["sales.pdf.title"]}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1f2937; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; }
        .header h1 { color: #1e40af; font-size: 24px; margin-bottom: 4px; }
        .header .date-range { color: #6b7280; font-size: 14px; }
        
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-card { background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; }
        .summary-card .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .summary-card .value { font-size: 20px; font-weight: bold; color: #1f2937; }
        .summary-card.highlight { background: #dbeafe; }
        .summary-card.highlight .value { color: #2563eb; }
        .summary-card.credit { background: #fef2f2; }
        .summary-card.credit .value { color: #dc2626; }
        
        .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        th { background: #f9fafb; padding: 10px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        
        .items-table { font-size: 11px; margin-top: 4px; }
        .items-table td { padding: 4px 8px; border: none; }
        
        .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${translations["sales.pdf.title"]}</h1>
        <div class="date-range">${translations["sales.pdf.dateRange"]}: ${dateRangeText}</div>
      </div>
      
      <div class="summary-grid">
        <div class="summary-card highlight">
          <div class="label">${translations["sales.pdf.totalSales"]}</div>
          <div class="value">${formatCurrency(summary.totalAmount, currency)}</div>
        </div>
        <div class="summary-card">
          <div class="label">${translations["sales.pdf.transactions"]}</div>
          <div class="value">${summary.totalTransactions}</div>
        </div>
        <div class="summary-card">
          <div class="label">${translations["sales.pdf.paidSales"]}</div>
          <div class="value">${summary.paidTransactions}</div>
        </div>
        <div class="summary-card credit">
          <div class="label">${translations["sales.pdf.creditSales"]}</div>
          <div class="value">${summary.unpaidTransactions}</div>
        </div>
      </div>
      
      <div class="section-title">${translations["sales.pdf.transactions"]}</div>
      <table>
        <thead>
          <tr>
            <th>${translations["common.date"]}</th>
            <th>${translations["sales.pdf.items"]}</th>
            <th style="text-align:right">${translations["common.amount"]}</th>
            <th>${translations["sales.pdf.paymentStatus"]}</th>
            <th>${translations["sales.pdf.customer"]}</th>
          </tr>
        </thead>
        <tbody>
          ${salesRows}
        </tbody>
      </table>
      
      <div class="footer">
        ${translations["sales.pdf.generatedOn"]}: ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;
}

export interface SingleSalePDFTranslations {
  "sales.receipt": string;
  "sales.pdf.total": string;
  "sales.pdf.items": string;
  "sales.pdf.quantity": string;
  "sales.pdf.price": string;
  "sales.pdf.subtotal": string;
  "sales.pdf.paymentMethod": string;
  "sales.pdf.cash": string;
  "sales.pdf.card": string;
  "sales.pdf.customer": string;
  "common.date": string;
}

export function generateSingleSalePDFHtml(
  sale: Sale,
  translations: SingleSalePDFTranslations,
  symbol: string = "৳"
): string {
  const itemsRows = sale.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:16px;color:#1f2937;">${item.productName || item.name || "Item"}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;width:50px;font-size:16px;color:#6b7280;">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;width:90px;font-size:16px;color:#6b7280;">${formatCurrency(item.productPrice || item.price || 0, symbol)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;width:90px;font-size:16px;font-weight:500;color:#1f2937;">${formatCurrency(item.subtotal, symbol)}</td>
      </tr>
    `
    )
    .join("");

  const paymentMethodLabel =
    !sale.ledgerId && sale.paymentMethod === "cash"
      ? translations["sales.pdf.cash"]
      : !sale.ledgerId && sale.paymentMethod === "card"
        ? translations["sales.pdf.card"]
        : null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${translations["sales.receipt"]}</title>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
        
        .card {
          background: #ffffff;
          border-radius: 16px;
          padding: 40px;
          border: 1px solid #e5e7eb;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .header { text-align: center; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; gap: 12px; }
        .header .icon { font-size: 36px; color: #000000; }
        .header h1 { font-size: 28px; font-weight: 700; color: #1f2937; margin: 0; }
        .date { font-size: 18px; color: #6b7280; text-align: center; margin-bottom: 16px; }
        
        .customer-section { background: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .customer-label { font-size: 18px; color: #6b7280; }
        .customer-name { font-size: 18px; font-weight: 600; color: #1f2937; }
        
        .payment-section { background: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .payment-label { font-size: 18px; color: #6b7280; }
        .payment-value { font-size: 18px; font-weight: 600; color: #1f2937; }
        
        .divider { height: 1px; background: #e5e7eb; margin: 16px 0; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th { padding: 14px 8px; font-weight: 600; color: #6b7280; font-size: 16px; border-bottom: 1px solid #e5e7eb; }
        th:nth-child(1) { text-align: left; }
        th:nth-child(2) { text-align: center; }
        th:nth-child(3) { text-align: right; }
        th:nth-child(4) { text-align: right; }
        
        .total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; }
        .total-label { font-size: 26px; font-weight: 700; color: #1f2937; }
        .total-amount { font-size: 42px; font-weight: 700; color: #1f2937; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="icon material-icons">receipt_long</span>
          <h1>Sales Received</h1>
        </div>
        
        <div class="date">${formatDateTime(sale.createdAt)}</div>
        
        ${sale.ledgerName ? `
          <div class="customer-section">
            <span class="customer-label">${translations["sales.pdf.customer"]}:</span>
            <span class="customer-name">${sale.ledgerName}</span>
          </div>
        ` : ""}
        
        ${paymentMethodLabel ? `
          <div class="payment-section">
            <span class="payment-label">${translations["sales.pdf.paymentMethod"]}:</span>
            <span class="payment-value">${paymentMethodLabel}</span>
          </div>
        ` : ""}
        
        <div class="divider"></div>
        
        <table>
          <thead>
            <tr>
              <th>${translations["sales.pdf.items"]}</th>
              <th>${translations["sales.pdf.quantity"]}</th>
              <th style="text-align:right">${translations["sales.pdf.price"]}</th>
              <th style="text-align:right">${translations["sales.pdf.subtotal"]}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div class="total-row">
          <span class="total-label">${translations["sales.pdf.total"]}</span>
          <span class="total-amount">${formatCurrency(sale.totalAmount || sale.total || 0, symbol)}</span>
        </div>
      </div>
    </body>
    </html>
  `;
}
