/**
 * PDF Template Generator for Invoices and Payment Receipts
 * Uses HTML/CSS for professional document layouts
 */

interface InvoiceItem {
  ProductID?: number;
  SaleQty?: number;
  Price?: number;
  TaxableValue?: number;
  CGST?: number;
  SGST?: number;
  IGST?: number;
  NetTotal?: number;
  Discount?: number;
  name?: string;
  quantity?: string | number;
  price?: number;
  total?: number;
}

interface CustomerInfo {
  name?: string;
  address?: string;
  mobile?: string;
}

interface InvoiceData {
  id: string;
  date: string;
  details: {
    invoiceNo?: string;
    invoiceId?: number;
    saleAmount?: number;
    balanceAmount?: number;
    obAmount?: number;
    upiAmount?: number;
    cashAmount?: number;
    chequeAmount?: number;
    subtotal?: number;
    tax?: number;
    total?: number;
    customerInfo?: CustomerInfo;
  };
}

interface PaymentData {
  id: string;
  amount: number;
  date: string;
  details: {
    paymentMethod?: string;
    transactionId?: string;
    paidBy?: string;
    paymentDate?: string;
    bankReference?: string;
    status?: string;
    upiAmount?: number;
    cashAmount?: number;
    chequeAmount?: number;
  };
}

// Company branding details - customize as needed
const COMPANY_INFO = {
  name: "Ceren Production Company",
  address: "Industrial Area, Phase 2, Bengaluru, Karnataka 560001",
  gst: "29AABCC1234D1Z5",
  phone: "+91 80 1234 5678",
  email: "info@cerenproduction.com",
};

// Module-level helpers (shared by generators)
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`;
};

/**
 * Generate Invoice PDF HTML
 */
export const generateInvoicePDF = (
  invoice: InvoiceData,
  items: InvoiceItem[] = [],
  customerInfo: CustomerInfo = {},
  customerName: string = "Customer"
): string => {

  const invoiceItems = items.length > 0 
    ? items.map((item, index) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
            ${item.name || `Product #${item.ProductID || 'N/A'}`}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${item.SaleQty || item.quantity || '-'}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${formatCurrency(item.Price || item.price || 0)}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${formatCurrency(item.NetTotal || item.total || 0)}
          </td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="5" style="padding: 24px; text-align: center; color: #6b7280;">
            No items available
          </td>
        </tr>
      `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #111827;
          padding: 40px;
          background: white;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          border-bottom: 3px solid #15803D;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #15803D;
          margin-bottom: 8px;
        }
        .company-details {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.8;
        }
        .invoice-title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 30px 0 20px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-box {
          flex: 1;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
          margin: 0 10px;
        }
        .info-box:first-child {
          margin-left: 0;
        }
        .info-box:last-child {
          margin-right: 0;
        }
        .info-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .table thead {
          background: #f3f4f6;
        }
        .table th {
          padding: 12px 8px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .table th:first-child {
          text-align: center;
        }
        .table th:last-child,
        .table th:nth-last-child(2) {
          text-align: right;
        }
        .totals {
          margin-top: 20px;
          padding: 20px;
          background: #f0fdf4;
          border-radius: 8px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        .total-row.grand-total {
          border-top: 2px solid #15803D;
          margin-top: 10px;
          padding-top: 15px;
          font-size: 18px;
          font-weight: bold;
          color: #15803D;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }
        .customer-section {
          margin-bottom: 30px;
          padding: 15px;
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          border-radius: 4px;
        }
        .customer-title {
          font-size: 12px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .customer-info {
          font-size: 13px;
          color: #374151;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Company Header -->
        <div class="header">
          <div class="company-name">${COMPANY_INFO.name}</div>
          <div class="company-details">
            ${COMPANY_INFO.address}<br>
            GST: ${COMPANY_INFO.gst} | Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}
          </div>
        </div>

        <!-- Invoice Title -->
        <div class="invoice-title">Tax Invoice</div>

        <!-- Customer Information -->
        <div class="customer-section">
          <div class="customer-title">Bill To:</div>
          <div class="customer-info">
            <strong>${customerInfo.name || customerName}</strong><br>
            ${customerInfo.address || 'Address not available'}<br>
            ${customerInfo.mobile ? `Mobile: ${customerInfo.mobile}` : ''}
          </div>
        </div>

        <!-- Invoice Information -->
        <div class="info-section">
          <div class="info-box">
            <div class="info-label">Invoice Number</div>
            <div class="info-value">${invoice.details.invoiceNo || invoice.id}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Invoice Date</div>
            <div class="info-value">${formatDate(invoice.date)}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Balance Due</div>
            <div class="info-value">${formatCurrency(invoice.details.balanceAmount || 0)}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Description</th>
              <th style="width: 100px; text-align: center;">Qty</th>
              <th style="width: 120px; text-align: right;">Rate</th>
              <th style="width: 120px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceItems}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(invoice.details.subtotal || invoice.details.saleAmount || 0)}</span>
          </div>
          <div class="total-row">
            <span>Tax (CGST + SGST):</span>
            <span>${formatCurrency(invoice.details.tax || 0)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>${formatCurrency(invoice.details.total || invoice.details.saleAmount || 0)}</span>
          </div>
          ${invoice.details.upiAmount || invoice.details.cashAmount || invoice.details.chequeAmount ? `
            <div class="total-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #bbf7d0;">
              <span style="font-weight: 600;">Payments Received:</span>
              <span></span>
            </div>
            ${invoice.details.upiAmount ? `
              <div class="total-row">
                <span style="padding-left: 20px;">UPI Payment:</span>
                <span>-${formatCurrency(invoice.details.upiAmount)}</span>
              </div>
            ` : ''}
            ${invoice.details.cashAmount ? `
              <div class="total-row">
                <span style="padding-left: 20px;">Cash Payment:</span>
                <span>-${formatCurrency(invoice.details.cashAmount)}</span>
              </div>
            ` : ''}
            ${invoice.details.chequeAmount ? `
              <div class="total-row">
                <span style="padding-left: 20px;">Cheque Payment:</span>
                <span>-${formatCurrency(invoice.details.chequeAmount)}</span>
              </div>
            ` : ''}
            <div class="total-row" style="font-weight: 600; color: #dc2626;">
              <span>Balance Amount:</span>
              <span>${formatCurrency(invoice.details.balanceAmount || 0)}</span>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Thank you for your business!</p>
          <p style="margin-top: 10px;">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate Payment Receipt PDF HTML
 */
export const generatePaymentReceiptPDF = (
  payment: PaymentData,
  customerInfo: CustomerInfo = {},
  customerName: string = "Customer"
): string => {
  

  const paymentMethods: Array<{ type: string; amount: number }> = [];
  if (payment.details.upiAmount && payment.details.upiAmount > 0) {
    paymentMethods.push({ type: 'UPI', amount: payment.details.upiAmount });
  }
  if (payment.details.cashAmount && payment.details.cashAmount > 0) {
    paymentMethods.push({ type: 'Cash', amount: payment.details.cashAmount });
  }
  if (payment.details.chequeAmount && payment.details.chequeAmount > 0) {
    paymentMethods.push({ type: 'Cheque', amount: payment.details.chequeAmount });
  }

  const paymentBreakdown = paymentMethods.length > 0
    ? paymentMethods.map(method => `
        <div class="payment-method-row">
          <span class="method-badge">${method.type}</span>
          <span class="method-amount">${formatCurrency(method.amount)}</span>
        </div>
      `).join('')
    : `
        <div class="payment-method-row">
          <span class="method-badge">${payment.details.paymentMethod || 'Unknown'}</span>
          <span class="method-amount">${formatCurrency(payment.amount)}</span>
        </div>
      `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #111827;
          padding: 40px;
          background: white;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          border: 2px solid #15803D;
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #15803D 0%, #16A34A 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .receipt-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .receipt-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        .company-info {
          background: #f0fdf4;
          padding: 20px 30px;
          border-bottom: 1px solid #bbf7d0;
        }
        .company-name {
          font-size: 20px;
          font-weight: bold;
          color: #15803D;
          margin-bottom: 5px;
        }
        .company-details {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.8;
        }
        .content {
          padding: 30px;
        }
        .amount-section {
          text-align: center;
          padding: 30px;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .amount-label {
          font-size: 14px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .amount-value {
          font-size: 48px;
          font-weight: bold;
          color: #15803D;
        }
        .status-badge {
          display: inline-block;
          margin-top: 15px;
          padding: 8px 20px;
          background: ${payment.details.status === 'Success' ? '#BBF7D0' : '#FECACA'};
          color: ${payment.details.status === 'Success' ? '#15803D' : '#DC2626'};
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .payment-methods {
          background: #eff6ff;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .payment-methods-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .payment-method-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          background: white;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        .payment-method-row:last-child {
          margin-bottom: 0;
        }
        .method-badge {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        .method-amount {
          font-size: 16px;
          font-weight: bold;
          color: #15803D;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .detail-item {
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 3px solid #15803D;
        }
        .detail-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          word-break: break-all;
        }
        .customer-section {
          padding: 20px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
          margin-bottom: 30px;
        }
        .customer-title {
          font-size: 12px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .customer-info {
          font-size: 13px;
          color: #374151;
          line-height: 1.6;
        }
        .footer {
          padding: 20px 30px;
          background: #f3f4f6;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="receipt-title">Payment Receipt</div>
          <div class="receipt-subtitle">Receipt ID: ${payment.id}</div>
        </div>

        <!-- Company Info -->
        <div class="company-info">
          <div class="company-name">${COMPANY_INFO.name}</div>
          <div class="company-details">
            ${COMPANY_INFO.address}<br>
            GST: ${COMPANY_INFO.gst} | Phone: ${COMPANY_INFO.phone}
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Amount Section -->
          <div class="amount-section">
            <div class="amount-label">Amount Received</div>
            <div class="amount-value">${formatCurrency(payment.amount)}</div>
            <div class="status-badge">${payment.details.status || 'Completed'}</div>
          </div>

          <!-- Customer Section -->
          <div class="customer-section">
            <div class="customer-title">Received From:</div>
            <div class="customer-info">
              <strong>${customerInfo.name || payment.details.paidBy || customerName}</strong><br>
              ${customerInfo.address || ''}<br>
              ${customerInfo.mobile ? `Mobile: ${customerInfo.mobile}` : ''}
            </div>
          </div>

          <!-- Payment Methods Breakdown -->
          <div class="payment-methods">
            <div class="payment-methods-title">Payment Method Breakdown</div>
            ${paymentBreakdown}
          </div>

          <!-- Transaction Details -->
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Transaction ID</div>
              <div class="detail-value">${payment.details.transactionId || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Date</div>
              <div class="detail-value">${formatDate(payment.details.paymentDate || payment.date)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Bank Reference</div>
              <div class="detail-value">${payment.details.bankReference || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Paid By</div>
              <div class="detail-value">${payment.details.paidBy || customerName}</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Thank you for your payment!</p>
          <p style="margin-top: 8px;">This is a computer-generated receipt and does not require a signature.</p>
          <p style="margin-top: 8px;">For any queries, please contact us at ${COMPANY_INFO.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
