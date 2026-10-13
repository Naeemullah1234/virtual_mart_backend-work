const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoicePDF = (order, customer) =>
  new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(__dirname, "../uploads/invoices");
      const logoPath = path.join(__dirname, "../uploads/virtual-mart-logo.jpeg");
      const stampPath = path.join(__dirname, "../uploads/check-mart-stamp.png");

      fs.mkdirSync(invoiceDir, { recursive: true });

      const fileName = `invoice-${order.orderNumber}.pdf`;
      const filePath = path.join(invoiceDir, fileName);

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 10, bottom: 20, left: 35, right: 35 },
        bufferPages: true,
      });

      const stream = fs.createWriteStream(filePath);
      stream.on("error", reject);
      doc.on("error", reject);
      doc.pipe(stream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const left = 35;
      const right = pageWidth - 35;
      const width = right - left;

      const orange = "#037321";
      const dark = "#252525";
      const gray = "#666666";
      const border = "#d8d8d8";
      const pale = "#fafafa";

      const money = (value) =>
        `Rs. ${Number(value || 0).toLocaleString("en-PK", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

      const txt = (value) =>
        value === undefined || value === null ? "" : String(value);

      const address = order.shippingAddress || {};

      // WATERMARK
      if (fs.existsSync(logoPath)) {
        doc.save();
        doc.opacity(0.055);
        doc.image(logoPath, pageWidth / 2 - 100, pageHeight / 2 - 75, {
          fit: [200, 150],
          align: "center",
          valign: "center",
        });
        doc.restore();
      }

      // HEADER: LOGO | VIRTUAL MART | INVOICE
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, left, 10, {
          fit: [85, 58],
          align: "left",
          valign: "center",
        });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(dark)
        .text("CHECK MART", 155, 20, {
          width: 285,
          align: "center",
          lineBreak: false,
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(orange)
        .text("Thank you for shopping with Check Mart!", 155, 41, {
          width: 285,
          align: "center",
          lineBreak: false,
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(dark)
        .text("INVOICE", 455, 20, {
          width: 120,
          align: "right",
          lineBreak: false,
        });

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(gray)
        .text("This is a computer-generated invoice.", 425, 45, {
          width: 150,
          align: "right",
        });

      doc
        .moveTo(left, 76)
        .lineTo(right, 76)
        .lineWidth(1.4)
        .strokeColor(orange)
        .stroke();

      // CUSTOMER AND ORDER BOXES
      const boxTop = 85;
      const boxHeight = 126;
      const gap = 10;
      const boxWidth = (width - gap) / 2;
      const rightBoxX = left + boxWidth + gap;

      // LEFT BOX
      doc
        .roundedRect(left, boxTop, boxWidth, boxHeight, 5)
        .lineWidth(0.8)
        .fillColor(pale)
        .strokeColor(border)
        .fillAndStroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(orange)
        .text("CUSTOMER & SHIPPING DETAILS", left + 10, boxTop + 9);

      let y = boxTop + 26;
      const lineWidth = boxWidth - 20;

      const customerDetails = [
        ["Name", address.fullName],
        ["E-mail", address.email || customer?.email || ""],
        ["Ph", address.phone],
      ];

      customerDetails.forEach(([label, value]) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(7.2)
          .fillColor(dark)
          .text(`${label}:`, left + 10, y, { width: 65, lineBreak: false });

        doc
          .font("Helvetica")
          .fontSize(7.2)
          .fillColor(dark)
          .text(txt(value), left + 75, y, {
            width: lineWidth - 65,
            lineBreak: false,
          });

        y += 12;
      });

      y += 2;

      doc
        .moveTo(left + 10, y)
        .lineTo(left + boxWidth - 10, y)
        .lineWidth(0.5)
        .strokeColor(border)
        .stroke();

      y += 7;

      const fullAddress = [
        address.addressLine1,
        address.addressLine2,
        address.landmark,
        address.postalCode,
        address.city,
        address.state,
        address.country,
      ]
        .filter(Boolean)
        .join(", ");

      doc
        .font("Helvetica-Bold")
        .fontSize(7.2)
        .fillColor(dark)
        .text("Address:", left + 10, y, { width: 65 });

      doc
        .font("Helvetica")
        .fontSize(7.2)
        .fillColor(dark)
        .text(fullAddress, left + 75, y, {
          width: lineWidth - 65,
          height: 48,
        });

      // RIGHT BOX
      doc
        .roundedRect(rightBoxX, boxTop, boxWidth, boxHeight, 5)
        .lineWidth(0.8)
        .fillColor(pale)
        .strokeColor(border)
        .fillAndStroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(orange)
        .text("ORDER DETAILS", rightBoxX + 10, boxTop + 9);

      const orderDate = new Date(order.createdAt || Date.now()).toLocaleString(
        "en-PK",
        {
          timeZone: "Asia/Karachi",
          dateStyle: "medium",
          timeStyle: "short",
        }
      );

      const orderDetails = [
        ["Order No.", order.orderNumber],
        ["Order Date", orderDate],
        ["Payment Method", txt(order.paymentMethod).toUpperCase()],
        ["Payment Status", txt(order.paymentStatus).toUpperCase()],
        ["Delivery Time", "Up to 5 Working Days"],
      ];

      y = boxTop + 26;

      orderDetails.forEach(([label, value]) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(7.1)
          .fillColor(dark)
          .text(`${label}:`, rightBoxX + 10, y, {
            width: 88,
            lineBreak: false,
          });

        doc
          .font("Helvetica")
          .fontSize(7.1)
          .fillColor(dark)
          .text(txt(value), rightBoxX + 100, y, {
            width: boxWidth - 110,
            lineBreak: false,
          });

        y += 12;
      });

      // ITEMS TABLE
      const tableTop = boxTop + boxHeight + 12;
      const headerHeight = 23;

      // All columns are calculated within the printable page width.
      const columns = [
        { title: "PRODUCT", key: "product", width: 145 },
        { title: "VARIANT", key: "variant", width: 105 },
        { title: "QTY", key: "qty", width: 32 },
        { title: "PRICE", key: "price", width: 68 },
        { title: "DISCOUNT", key: "discount", width: 80 },
        { title: "TOTAL", key: "total", width: 95 },
      ];

      // Scale widths to the available printable width.
      const totalColumnWidth = columns.reduce((sum, c) => sum + c.width, 0);
      let currentX = left;

      columns.forEach((column) => {
        column.x = currentX;
        column.width = (column.width / totalColumnWidth) * width;
        currentX += column.width;
      });

      doc.rect(left, tableTop, width, headerHeight).fillColor(orange).fill();

      columns.forEach((column) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor("#ffffff")
          .text(column.title, column.x + 3, tableTop + 7, {
            width: column.width - 6,
            align:
              ["qty", "price", "discount", "total"].includes(column.key)
                ? "right"
                : "left",
            lineBreak: false,
          });
      });

      let rowY = tableTop + headerHeight;
      const items = order.items || [];

      items.forEach((item, index) => {
        const attributes = Array.isArray(item.attributes)
          ? item.attributes
              .map((attribute) => `${attribute.key}: ${attribute.value}`)
              .join(", ")
          : "";

        const rowHeight = 29;

        if (index % 2 === 0) {
          doc.rect(left, rowY, width, rowHeight).fillColor("#fafafa").fill();
        }

        doc
          .rect(left, rowY, width, rowHeight)
          .lineWidth(0.45)
          .strokeColor(border)
          .stroke();

        const productColumn = columns.find((c) => c.key === "product");
        const variantColumn = columns.find((c) => c.key === "variant");
        const qtyColumn = columns.find((c) => c.key === "qty");
        const priceColumn = columns.find((c) => c.key === "price");
        const discountColumn = columns.find((c) => c.key === "discount");
        const totalColumn = columns.find((c) => c.key === "total");

        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(dark)
          .text(txt(item.productName), productColumn.x + 4, rowY + 10, {
            width: productColumn.width - 8,
            height: 10,
            ellipsis: true,
            lineBreak: false,
          });

        doc
          .font("Helvetica")
          .fontSize(6.5)
          .fillColor(gray)
          .text(attributes, variantColumn.x + 3, rowY + 10, {
            width: variantColumn.width - 6,
            height: 10,
            ellipsis: true,
            lineBreak: false,
          });

        doc
          .font("Helvetica")
          .fontSize(6.8)
          .fillColor(dark)
          .text(String(item.quantity), qtyColumn.x + 2, rowY + 10, {
            width: qtyColumn.width - 4,
            align: "right",
            lineBreak: false,
          });

        doc.text(money(item.price), priceColumn.x + 2, rowY + 10, {
          width: priceColumn.width - 5,
          align: "right",
          lineBreak: false,
        });

        const itemDiscount =
          Math.max(
            0,
            Number(item.price || 0) - Number(item.salePrice || 0)
          ) * Number(item.quantity || 0);

        doc
          .fillColor(itemDiscount > 0 ? "#c00000" : dark)
          .text(itemDiscount > 0 ? `-${money(itemDiscount)}` : money(0), discountColumn.x + 2, rowY + 10, {
            width: discountColumn.width - 5,
            align: "right",
            lineBreak: false,
          });

        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(dark)
          .text(money(item.itemTotal), totalColumn.x + 2, rowY + 10, {
            width: totalColumn.width - 5,
            align: "right",
            lineBreak: false,
          });

        rowY += rowHeight;
      });

      // TOTALS
      rowY += 9;

      const summaryWidth = 225;
      const summaryHeight = 78;
      const summaryX = right - summaryWidth;
      const summaryTop = rowY;

      doc
        .roundedRect(summaryX, summaryTop, summaryWidth, summaryHeight, 5)
        .lineWidth(0.8)
        .fillColor(pale)
        .strokeColor(border)
        .fillAndStroke();

      let totalY = summaryTop + 11;

      [
        ["Subtotal", money(order.subtotal)],
        ["Shipping Charges", money(order.shipping)],
      ].forEach(([label, value]) => {
        doc
          .font("Helvetica")
          .fontSize(7.8)
          .fillColor(dark)
          .text(label, summaryX + 10, totalY, { width: 115 });

        doc
          .font("Helvetica-Bold")
          .fontSize(7.8)
          .fillColor(dark)
          .text(value, summaryX + 120, totalY, {
            width: summaryWidth - 130,
            align: "right",
          });

        totalY += 19;
      });

      doc
        .moveTo(summaryX + 10, totalY)
        .lineTo(summaryX + summaryWidth - 10, totalY)
        .lineWidth(1)
        .strokeColor(orange)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(orange)
        .text("GRAND TOTAL", summaryX + 10, totalY + 8, { width: 110 });

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(dark)
        .text(money(order.grandTotal), summaryX + 120, totalY + 8, {
          width: summaryWidth - 130,
          align: "right",
        });

      // STAMP - LEFT SIDE OF TOTALS BOX
const stampWidth = 145;
const stampHeight = 100;

const stampX = left + 10;
const stampY = summaryTop + (summaryHeight - stampHeight) / 2 + 6;

if (fs.existsSync(stampPath)) {
doc.image(stampPath, stampX, stampY, {
  fit: [stampWidth, stampHeight],
  align: "center",
  valign: "center",
});
}

const footerY = Math.max(
  pageHeight - 78,
  summaryTop + summaryHeight + 18
);

      // FOOTER
      doc
        .moveTo(left, footerY)
        .lineTo(right, footerY)
        .lineWidth(0.7)
        .strokeColor(border)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(7.8)
        .fillColor(orange)
        .text("RETURN POLICY", left, footerY + 7);

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(dark)
        .text("Please report within 24 hours of delivery.", left, footerY + 20);

      doc.text(
        "No returns or exchanges are accepted once an order is delivered,",
        left,
        footerY + 31
      );

      doc.text(
        "except for defective or incorrect items.",
        left,
        footerY + 41
      );

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(orange)
        .text("CUSTOMER SUPPORT", right - 180, footerY + 7, {
          width: 180,
          align: "right",
        });

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(dark)
        .text("Email: checkmart@gmail.com", right - 220, footerY + 20, {
          width: 220,
          align: "right",
        });

      doc.text("Phone: +923309999999", right - 220, footerY + 31, {
        width: 220,
        align: "right",
      });

      doc.text(
        "Office No. 104, Bolton Market, Karachi, Pakistan",
        right - 280,
        footerY + 42,
        {
          width: 280,
          align: "right",
        }
      );

      doc.end();

      stream.on("finish", () => resolve({ filePath, fileName }));
    } catch (error) {
      reject(error);
    }
  });

module.exports = { generateInvoicePDF };