// import { Sale } from "../models/sales.model.js";
// import { Inventory } from "../models/inventory.model.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/apiError.js";
// import { ApiResponse } from "../utils/apiSuccess.js";

// /* ===========================
//    HELPER: FLATTEN SALE
// =========================== */
// const formatSale = (sale) => {
//   const firstItem = sale.items?.[0] || {};

//   return {
//     _id: sale._id,
//     invoiceNumber: sale.invoiceNumber,

//     // ✅ FLATTENED FIELDS (FOR FRONTEND)
//     productName: firstItem.productName || "N/A",
//     unitPrice: firstItem.unitPrice || 0,
//     quantity: firstItem.quantity || 0,
//     totalAmount: sale.subtotal || 0,

//     // ORIGINAL
//     items: sale.items,
//     subtotal: sale.subtotal,
//     discount: sale.discount,
//     tax: sale.tax,
//     grandTotal: sale.grandTotal,
//     paymentMethod: sale.paymentMethod,
//     customerName: sale.customerName,
//     customerPhone: sale.customerPhone,
//     sellerId: sale.sellerId,
//     createdAt: sale.createdAt,
//   };
// };

// /* ===========================
//    GET ALL SALES
// =========================== */
// export const getSales = asyncHandler(async (req, res) => {
//   const sales = await Sale.find()
//     .populate("sellerId", "fullName email")
//     .populate({
//       path: "items.inventoryId",
//       select: "name category",
//     })
//     .sort({ createdAt: -1 })
//     .lean();

//   const formattedSales = sales.map(formatSale);

//   res
//     .status(200)
//     .json(new ApiResponse(200, formattedSales, "Sales fetched"));
// });

// /* ===========================
//    ADD SALE
// =========================== */
// export const addSale = asyncHandler(async (req, res) => {
//   let {
//     productId,
//     quantity,
//     unitPrice,
//     productName,
//     items,
//     discount = 0,
//     tax = 0,
//     paymentMethod = "Cash",
//     customerName = "Walk-in Customer",
//     customerPhone,
//   } = req.body;

//   let saleItems = [];

//   // MULTI PRODUCT
//   if (Array.isArray(items) && items.length > 0) {
//     saleItems = items.map((item) => ({
//       inventoryId: item.inventoryId || item.productId,
//       productName: item.productName || "Product",
//       quantity: Number(item.quantity || 1),
//       unitPrice: Number(item.unitPrice || 0),
//       total: Number(item.quantity || 1) * Number(item.unitPrice || 0),
//     }));
//   }

//   // SINGLE PRODUCT
//   else if (productId) {
//     saleItems = [
//       {
//         inventoryId: productId,
//         productName: productName || "Product",
//         quantity: Number(quantity || 1),
//         unitPrice: Number(unitPrice || 0),
//         total: Number(quantity || 1) * Number(unitPrice || 0),
//       },
//     ];
//   } else {
//     throw new ApiError(400, "productId or items[] required");
//   }

//  let subtotal = 0;
// const processedItems = [];

// for (const item of saleItems) {
//   const inventory = await Inventory.findById(item.inventoryId);

//   if (!inventory)
//     throw new ApiError(404, "Product not found");

//   if (inventory.stock < item.quantity)
//     throw new ApiError(400, `Insufficient stock for ${inventory.name}`);

//   // Use actual inventory name if missing
//   if (!item.productName || item.productName === "Product") {
//     item.productName = inventory.name;
//   }

//   const total = Number(item.unitPrice) * Number(item.quantity);
//   subtotal += total;

//   processedItems.push({
//     inventoryId: inventory._id,
//     productName: item.productName,
//     quantity: item.quantity,
//     unitPrice: item.unitPrice,
//     total,
//   });

//   // Reduce stock
//   inventory.stock -= item.quantity;
//   await inventory.save();
// }

// // Use processedItems for creating sale
// saleItems = processedItems;


//   const discountAmount = (subtotal * discount) / 100;
//   const taxAmount = ((subtotal - discountAmount) * tax) / 100;
//   const grandTotal = subtotal - discountAmount + taxAmount;

//   const sale = await Sale.create({
//     invoiceNumber: `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
//     items: saleItems,
//     subtotal,
//     discount,
//     tax,
//     grandTotal,
//     paymentMethod,
//     customerName,
//     customerPhone,
//     sellerId: req.user._id,
//   });

//   const populatedSale = await Sale.findById(sale._id)
//     .populate("sellerId", "fullName email")
//     .populate({ path: "items.inventoryId", select: "name category" })
//     .lean();

//   const formattedSale = formatSale(populatedSale);

//   // ✅ If printInvoice is true, send a special flag
//   res.status(201).json(
//     new ApiResponse(
//       201,
//       formattedSale,
//       "Sale completed successfully",
//       { printInvoice } // optional field in response
//     )
//   );
// });

// /* ===========================
//    DELETE SALES
// =========================== */
// export const deleteSales = asyncHandler(async (req, res) => {
//   const { ids } = req.body;

//   if (!Array.isArray(ids) || ids.length === 0)
//     throw new ApiError(400, "Sale IDs required");

//   const sales = await Sale.find({ _id: { $in: ids } });

//   for (const sale of sales) {
//     for (const item of sale.items) {
//       const inventory = await Inventory.findById(item.inventoryId);
//       if (inventory) {
//         inventory.stock += item.quantity;
//         await inventory.save();
//       }
//     }
//   }

//   await Sale.deleteMany({ _id: { $in: ids } });

//   res
//     .status(200)
//     .json(new ApiResponse(200, null, "Sales deleted"));
// });

// /* ===========================
//    GET INVOICE
// =========================== */
// export const getInvoice = asyncHandler(async (req, res) => {
//   const sale = await Sale.findById(req.params.id)
//     .populate("sellerId", "fullName email")
//     .populate({
//       path: "items.inventoryId",
//       select: "name category",
//     })
//     .lean();

//   if (!sale) throw new ApiError(404, "Invoice not found");

//   res
//     .status(200)
//     .json(new ApiResponse(200, formatSale(sale), "Invoice fetched"));
// });


// import { Sale } from "../models/sales.model.js";
// import { Inventory } from "../models/inventory.model.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/apiError.js";
// import { ApiResponse } from "../utils/apiSuccess.js";

import { Sale } from "../models/sales.model.js";
import { Inventory } from "../models/inventory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiSuccess.js";

/* ===========================
   HELPER: FLATTEN SALE
=========================== */
const formatSale = (sale) => {
  const firstItem = sale.items?.[0] || {};

  return {
    _id: sale._id,
    invoiceNumber: sale.invoiceNumber,
    
    // ✅ INVOICE FIELDS
    productName: firstItem.productName || "N/A",
    unitPrice: firstItem.unitPrice || 0,
    quantity: firstItem.quantity || 0,
    totalAmount: sale.subtotal || 0,
    
    // ✅ CALCULATED FIELDS
    discountAmount: (sale.subtotal * sale.discount) / 100,
    taxAmount: ((sale.subtotal - ((sale.subtotal * sale.discount) / 100)) * sale.tax) / 100,
    
    // ORIGINAL FIELDS
    items: sale.items,
    subtotal: sale.subtotal,
    discount: sale.discount,
    tax: sale.tax,
    grandTotal: sale.grandTotal,
    paymentMethod: sale.paymentMethod,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    sellerId: sale.sellerId,
    createdAt: sale.createdAt,
  };
};

/* ===========================
   GET ALL SALES (with filters)
=========================== */
export const getSales = asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    customerName, 
    paymentMethod,
    page = 1,
    limit = 10
  } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  let filter = {};
  
  // Date filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }
  
  // Customer filter
  if (customerName) {
    filter.customerName = { $regex: customerName, $options: 'i' };
  }
  
  // Payment method filter
  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }
  
  const sales = await Sale.find(filter)
    .populate("sellerId", "fullName email")
    .populate({
      path: "items.inventoryId",
      select: "name category",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();
  
  const total = await Sale.countDocuments(filter);
  
  const formattedSales = sales.map(formatSale);
  
  res.status(200).json(
    new ApiResponse(200, {
      sales: formattedSales,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, "Sales fetched successfully")
  );
});

/* ===========================
   ADD SALE (with invoice generation)
=========================== */
export const addSale = asyncHandler(async (req, res) => {
  let {
    items,
    discount = 0,
    tax = 0,
    paymentMethod = "Cash",
    customerName = "Walk-in Customer",
    customerPhone,
    printInvoice = false,
  } = req.body;
  
  // Validate required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "At least one item is required");
  }
  
  let subtotal = 0;
  const processedItems = [];
  
  // Process each item
  for (const item of items) {
    const inventory = await Inventory.findById(item.inventoryId);
    
    if (!inventory) {
      throw new ApiError(404, `Product with ID ${item.inventoryId} not found`);
    }
    
    if (inventory.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${inventory.name}. Available: ${inventory.stock}, Requested: ${item.quantity}`);
    }
    
    const total = Number(item.unitPrice) * Number(item.quantity);
    subtotal += total;
    
    processedItems.push({
      inventoryId: inventory._id,
      productName: item.productName || inventory.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total,
    });
    
    // Reduce stock
    inventory.stock -= item.quantity;
    await inventory.save();
  }
  
  // Calculate totals
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * tax) / 100;
  const grandTotal = subtotal - discountAmount + taxAmount;
  
  // Generate invoice number
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-${year}${month}${day}-${random}`;
  
  // Create sale record
  const sale = await Sale.create({
    invoiceNumber,
    items: processedItems,
    subtotal,
    discount,
    tax,
    discountAmount,
    taxAmount,
    grandTotal,
    paymentMethod,
    customerName,
    customerPhone,
    sellerId: req.user._id,
  });
  
  // Populate the sale with related data
  const populatedSale = await Sale.findById(sale._id)
    .populate("sellerId", "fullName email")
    .populate({ path: "items.inventoryId", select: "name category" })
    .lean();
  
  const formattedSale = formatSale(populatedSale);
  
  // Add invoice details for API response
  const invoiceResponse = {
    ...formattedSale,
    printInvoice,
    invoiceDetails: {
      invoiceNumber: formattedSale.invoiceNumber,
      date: formattedSale.createdAt,
      customer: formattedSale.customerName,
      phone: formattedSale.customerPhone,
      items: formattedSale.items.map(item => ({
        product: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      summary: {
        subtotal: formattedSale.subtotal,
        discount: `${formattedSale.discount}%`,
        discountAmount: formattedSale.discountAmount,
        tax: `${formattedSale.tax}%`,
        taxAmount: formattedSale.taxAmount,
        grandTotal: formattedSale.grandTotal
      },
      payment: formattedSale.paymentMethod
    }
  };
  
  res.status(201).json(
    new ApiResponse(
      201,
      invoiceResponse,
      "Sale completed and invoice generated successfully"
    )
  );
});

/* ===========================
   GET INVOICE BY ID
=========================== */
export const getInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const sale = await Sale.findById(id)
    .populate("sellerId", "fullName email phone")
    .populate({
      path: "items.inventoryId",
      select: "name category barcode manufacturer expiryDate",
    })
    .lean();
  
  if (!sale) {
    throw new ApiError(404, "Invoice not found");
  }
  
  const formattedSale = formatSale(sale);
  
  // Enhanced invoice response
  const invoice = {
    invoiceId: formattedSale._id,
    invoiceNumber: formattedSale.invoiceNumber,
    invoiceDate: formattedSale.createdAt,
    
    // Customer Information
    customer: {
      name: formattedSale.customerName,
      phone: formattedSale.customerPhone,
    },
    
    // Seller Information
    seller: {
      name: sale.sellerId?.fullName || "Staff",
      email: sale.sellerId?.email || "",
      phone: sale.sellerId?.phone || "",
    },
    
    // Items Information
    items: formattedSale.items.map((item, index) => ({
      srNo: index + 1,
      productId: item.inventoryId?._id,
      productName: item.productName,
      category: item.inventoryId?.category || "N/A",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      barcode: item.inventoryId?.barcode,
      manufacturer: item.inventoryId?.manufacturer,
      expiry: item.inventoryId?.expiryDate
    })),
    
    // Invoice Summary
    summary: {
      subtotal: formattedSale.subtotal,
      discount: {
        percentage: formattedSale.discount,
        amount: formattedSale.discountAmount
      },
      tax: {
        percentage: formattedSale.tax,
        amount: formattedSale.taxAmount
      },
      grandTotal: formattedSale.grandTotal
    },
    
    // Payment Information
    payment: {
      method: formattedSale.paymentMethod,
      status: "Paid", // Assuming all sales are paid immediately
    },
    
    // System Information
    systemInfo: {
      created: formattedSale.createdAt,
      lastUpdated: sale.updatedAt,
    }
  };
  
  res.status(200).json(
    new ApiResponse(200, invoice, "Invoice fetched successfully")
  );
});

/* ===========================
   GET INVOICE BY INVOICE NUMBER
=========================== */
export const getInvoiceByNumber = asyncHandler(async (req, res) => {
  const { invoiceNumber } = req.params;
  
  const sale = await Sale.findOne({ invoiceNumber })
    .populate("sellerId", "fullName email phone")
    .populate({
      path: "items.inventoryId",
      select: "name category barcode manufacturer expiryDate",
    })
    .lean();
  
  if (!sale) {
    throw new ApiError(404, `Invoice with number ${invoiceNumber} not found`);
  }
  
  const formattedSale = formatSale(sale);
  
  const invoice = {
    invoiceId: formattedSale._id,
    invoiceNumber: formattedSale.invoiceNumber,
    invoiceDate: formattedSale.createdAt,
    
    customer: {
      name: formattedSale.customerName,
      phone: formattedSale.customerPhone,
    },
    
    seller: {
      name: sale.sellerId?.fullName || "Staff",
      email: sale.sellerId?.email || "",
      phone: sale.sellerId?.phone || "",
    },
    
    items: formattedSale.items.map((item, index) => ({
      srNo: index + 1,
      productName: item.productName,
      category: item.inventoryId?.category || "N/A",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    })),
    
    summary: {
      subtotal: formattedSale.subtotal,
      discount: {
        percentage: formattedSale.discount,
        amount: formattedSale.discountAmount
      },
      tax: {
        percentage: formattedSale.tax,
        amount: formattedSale.taxAmount
      },
      grandTotal: formattedSale.grandTotal
    },
    
    payment: {
      method: formattedSale.paymentMethod,
      status: "Paid",
    }
  };
  
  res.status(200).json(
    new ApiResponse(200, invoice, "Invoice fetched successfully")
  );
});

/* ===========================
   GENERATE PDF INVOICE (Returns PDF buffer)
=========================== */
export const generatePdfInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const sale = await Sale.findById(id)
    .populate("sellerId", "fullName email")
    .populate({
      path: "items.inventoryId",
      select: "name category",
    })
    .lean();
  
  if (!sale) {
    throw new ApiError(404, "Invoice not found");
  }
  
  // For now, return JSON with HTML content that can be converted to PDF
  // In production, you would use a library like puppeteer or pdfkit
  const formattedSale = formatSale(sale);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${formattedSale.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .invoice-header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .total-section { float: right; width: 300px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <h1>INVOICE</h1>
        <h2>${formattedSale.invoiceNumber}</h2>
        <p>Date: ${new Date(formattedSale.createdAt).toLocaleDateString()}</p>
      </div>
      
      <div class="invoice-details">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${formattedSale.customerName}</p>
        <p><strong>Phone:</strong> ${formattedSale.customerPhone || 'N/A'}</p>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${formattedSale.items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>$${item.unitPrice.toFixed(2)}</td>
              <td>$${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <p><strong>Subtotal:</strong> $${formattedSale.subtotal.toFixed(2)}</p>
        <p><strong>Discount (${formattedSale.discount}%):</strong> -$${formattedSale.discountAmount.toFixed(2)}</p>
        <p><strong>Tax (${formattedSale.tax}%):</strong> +$${formattedSale.taxAmount.toFixed(2)}</p>
        <p><strong>Grand Total:</strong> $${formattedSale.grandTotal.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${formattedSale.paymentMethod}</p>
      </div>
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  
  res.status(200).json(
    new ApiResponse(200, {
      invoiceId: formattedSale._id,
      invoiceNumber: formattedSale.invoiceNumber,
      html: htmlContent,
      downloadUrl: `/api/sales/invoice/${id}/pdf-download`
    }, "Invoice HTML generated successfully")
  );
});

/* ===========================
   DELETE SALES
=========================== */
export const deleteSales = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, "Sale IDs required");
  }
  
  const sales = await Sale.find({ _id: { $in: ids } });
  
  // Restore stock for deleted sales
  for (const sale of sales) {
    for (const item of sale.items) {
      const inventory = await Inventory.findById(item.inventoryId);
      if (inventory) {
        inventory.stock += item.quantity;
        await inventory.save();
      }
    }
  }
  
  await Sale.deleteMany({ _id: { $in: ids } });
  
  res.status(200).json(
    new ApiResponse(200, null, `${ids.length} sale(s) deleted successfully`)
  );
});

/* ===========================
   GET SALES STATISTICS
=========================== */
export const getSalesStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filter = {};
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await Sale.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$grandTotal" },
        totalDiscount: { $sum: "$discountAmount" },
        totalTax: { $sum: "$taxAmount" },
        avgSaleValue: { $avg: "$grandTotal" },
        minSaleValue: { $min: "$grandTotal" },
        maxSaleValue: { $max: "$grandTotal" }
      }
    }
  ]);
  
  // Get payment method breakdown
  const paymentStats = await Sale.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        totalAmount: { $sum: "$grandTotal" }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
  
  // Get daily sales
  const dailySales = await Sale.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { 
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
        },
        count: { $sum: 1 },
        totalAmount: { $sum: "$grandTotal" }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 30 }
  ]);
  
  const result = {
    summary: stats[0] || {
      totalSales: 0,
      totalRevenue: 0,
      totalDiscount: 0,
      totalTax: 0,
      avgSaleValue: 0,
      minSaleValue: 0,
      maxSaleValue: 0
    },
    paymentMethods: paymentStats,
    recentSales: dailySales
  };
  
  res.status(200).json(
    new ApiResponse(200, result, "Sales statistics fetched successfully")
  );
});