// controllers/purchase.controllers.js
import { Purchase } from "../models/purchase.model.js";
import { Inventory } from "../models/inventory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiSuccess.js";

// export const getPurchases = asyncHandler(async (req, res) => {
//   console.log("=== GET PURCHASES CALLED ===");
  
//   try {
//     const { page = 1, limit = 10, status, supplier, startDate, endDate } = req.query;
    
//     const query = {};
    
//     if (status) query.status = status;
//     if (supplier) query.supplierName = { $regex: supplier, $options: 'i' };
//     if (startDate || endDate) {
//       query.purchaseDate = {};
//       if (startDate) query.purchaseDate.$gte = new Date(startDate);
//       if (endDate) query.purchaseDate.$lte = new Date(endDate);
//     }
    
//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);
//     const skip = (pageNum - 1) * limitNum;
    
//     const purchases = await Purchase.find(query)
//       .populate('items.productId', 'name category')
//       .populate('receivedBy', 'fullName email')
//       .sort({ purchaseDate: -1 })
//       .skip(skip)
//       .limit(limitNum);
    
//     const total = await Purchase.countDocuments(query);
    
//     res.status(200).json(
//       new ApiResponse(200, {
//         purchases,
//         pagination: {
//           page: pageNum,
//           limit: limitNum,
//           total,
//           totalPages: Math.ceil(total / limitNum)
//         }
//       }, "Purchases fetched successfully")
//     );
//   } catch (error) {
//     console.error("Error in getPurchases:", error);
//     throw new ApiError(500, "Failed to fetch purchases");
//   }
// });
export const getPurchases = asyncHandler(async (req, res) => {
  console.log("=== GET PURCHASES CALLED ===");
  
  try {
    // Extract query parameters
    const { 
      page = 1, 
      limit = 10, 
      search,
      status,
      sortBy = 'purchaseDate',
      sortOrder = 'desc'
    } = req.query;
    
    console.log("Query params:", req.query);
    
    // Build query object
    const query = {};
    
    // Status filter
    if (status && status !== 'all' && status !== '') {
      query.status = status;
    }
    
    // Search filter
    if (search && search.trim() !== '') {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log("MongoDB Query:", JSON.stringify(query, null, 2));
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Set sort field and direction
    let sortField = 'purchaseDate'; // Default
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    // Map sortBy to actual database fields
    const sortMap = {
      'date': 'purchaseDate',
      'total': 'grandTotal',
      'supplier': 'supplierName',
      'invoice': 'invoiceNumber',
      'status': 'status'
    };
    
    if (sortMap[sortBy]) {
      sortField = sortMap[sortBy];
    }
    
    const sort = { [sortField]: sortDirection };
    console.log("Sort:", sort);
    
    // First, let's just fetch without population to see if it works
    const purchases = await Purchase.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    console.log(`Found ${purchases.length} purchases`);
    
    const total = await Purchase.countDocuments(query);
    
    // Get unique statuses
    const statuses = await Purchase.distinct('status');
    
    res.status(200).json(
      new ApiResponse(200, {
        purchases,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        filters: {
          statuses: statuses.filter(s => s)
        }
      }, "Purchases fetched successfully")
    );
    
  } catch (error) {
    console.error("Detailed Error in getPurchases:", error);
    console.error("Error stack:", error.stack);
    
    // Send more detailed error information
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export const getPurchaseLengthLast30Days = asyncHandler(async (req, res) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);

  const count = await Purchase.countDocuments({
    purchaseDate: { $gte: fromDate }
  });

  res.status(200).json(
    new ApiResponse(200, {
      count
    }, "Last 30 days purchase count fetched successfully")
  );
});

export const addPurchase = asyncHandler(async (req, res) => {
  console.log("=== ADD PURCHASE CALLED ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      supplierName,
      supplierContact,
      items,
      tax = 0,
      shippingCost = 0,
      otherCharges = 0,
      paymentMethod = "Cash",
      paymentStatus = "Paid",
      expectedDelivery,
      notes,
      status = "Received",
    } = req.body;

    // Validate input
    if (!supplierName || supplierName.trim() === '') {
      throw new ApiError(400, "Supplier name is required");
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "At least one item is required");
    }

    let subtotal = 0;
    let totalQuantity = 0;
    const purchaseItems = [];

    // Process each item
    for (const item of items) {
      if (!item.productName || !item.quantity || !item.unitCost) {
        throw new ApiError(400, "Each item must have productName, quantity, and unitCost");
      }

      // Validate expiry is provided since Inventory model requires it
      if (!item.expiryDate) {
        throw new ApiError(400, `Expiry date is required for product: ${item.productName}`);
      }

      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);
      
      if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than 0");
      if (unitCost <= 0) throw new ApiError(400, "Unit cost must be greater than 0");

      const itemTotal = quantity * unitCost;
      subtotal += itemTotal;
      totalQuantity += quantity;

      const purchaseItem = {
        productName: item.productName.trim(),
        quantity,
        unitCost,
        totalCost: itemTotal,
        expiryDate: new Date(item.expiryDate), // Convert to Date object
        batchNumber: item.batchNumber || `BATCH-${Date.now().toString(36).slice(-6).toUpperCase()}`,
      };

      if (item.productId) {
        purchaseItem.productId = item.productId;
      }

      purchaseItems.push(purchaseItem);
    }

    // Calculate totals
    const taxAmount = (subtotal * Number(tax)) / 100;
    const grandTotal = subtotal + taxAmount + Number(shippingCost) + Number(otherCharges);

    // Create purchase
    const purchaseData = {
      supplierName: supplierName.trim(),
      supplierContact: supplierContact?.trim() || '',
      items: purchaseItems,
      totalQuantity,
      subtotal,
      tax: Number(tax),
      taxAmount,
      shippingCost: Number(shippingCost),
      otherCharges: Number(otherCharges),
      grandTotal,
      paymentMethod: paymentMethod || "Cash",
      paymentStatus: paymentStatus || "Paid",
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
      notes: notes?.trim() || '',
      receivedBy: req.user?._id,
      status: status || "Received",
    };

    console.log("Creating purchase with data:", purchaseData);

    const purchase = await Purchase.create(purchaseData);
    console.log("Purchase created successfully, ID:", purchase._id);

    // Update inventory if received
    if (status === 'Received') {
      console.log("Updating inventory...");
      
      for (const item of purchaseItems) {
        if (item.productId) {
          // Update existing product
          const product = await Inventory.findById(item.productId);
          if (product) {
            product.stock += item.quantity;
            product.costPrice = item.unitCost;
            product.expiry = item.expiryDate; // Update expiry
            await product.save();
            console.log(`Updated existing inventory: ${product._id}, new stock: ${product.stock}`);
          }
        } else {
          // Create new product in inventory
          await Inventory.create({
            name: item.productName,
            category: "General",
            batchNumber: item.batchNumber,
            expiry: item.expiryDate, // Required field
            stock: item.quantity,
            costPrice: item.unitCost,
            salePrice: item.unitCost * 1.5,
            minStock: 10,
            supplier: supplierName.trim(),
          });
          console.log(`Created new inventory item: ${item.productName}`);
        }
      }
    }

    // Populate and return
    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('items.productId', 'name category')
      .populate('receivedBy', 'fullName email');

    console.log("Purchase completed successfully!");
    
    res.status(201).json(
      new ApiResponse(201, populatedPurchase, "Purchase recorded successfully")
    );
  } catch (error) {
    console.error("Error in addPurchase:", error);
    throw new ApiError(error.statusCode || 500, error.message || "Failed to create purchase");
  }
});

export const deletePurchases = asyncHandler(async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "Please provide purchase IDs to delete");
    }
    
    // Get purchases to reverse inventory
    const purchases = await Purchase.find({ _id: { $in: ids } });
    
    // Reverse inventory for received purchases
    for (const purchase of purchases) {
      if (purchase.status === 'Received') {
        for (const item of purchase.items) {
          if (item.productId) {
            const product = await Inventory.findById(item.productId);
            if (product) {
              product.stock -= item.quantity;
              if (product.stock < 0) product.stock = 0;
              await product.save();
            }
          }
        }
      }
    }
    
    // Delete purchases
    const result = await Purchase.deleteMany({ _id: { $in: ids } });
    
    res.status(200).json(
      new ApiResponse(200, { deletedCount: result.deletedCount }, "Purchases deleted successfully")
    );
  } catch (error) {
    throw new ApiError(500, `Failed to delete purchases: ${error.message}`);
  }
});

export const getPurchase = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchase = await Purchase.findById(id)
      .populate('items.productId', 'name category batchNumber expiry')
      .populate('receivedBy', 'fullName email');
      
    if (!purchase) {
      throw new ApiError(404, "Purchase not found");
    }
    
    res.status(200).json(new ApiResponse(200, purchase, "Purchase fetched successfully"));
  } catch (error) {
    throw new ApiError(500, `Failed to fetch purchase: ${error.message}`);
  }
});

export const updatePurchaseStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Pending', 'Received', 'Partial', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status value. Must be one of: Pending, Received, Partial, Cancelled");
    }
    
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      throw new ApiError(404, "Purchase not found");
    }
    
    const oldStatus = purchase.status;
    
    if (oldStatus === status) {
      return res.status(200).json(
        new ApiResponse(200, purchase, "Status is already " + status)
      );
    }
    
    purchase.status = status;
    
    // Handle inventory updates
    if (oldStatus !== 'Received' && status === 'Received') {
      // Add stock to inventory
      for (const item of purchase.items) {
        if (item.productId) {
          const product = await Inventory.findById(item.productId);
          if (product) {
            product.stock += item.quantity;
            product.costPrice = item.unitCost;
            product.expiry = item.expiryDate; // Update expiry
            await product.save();
          }
        } else {
          // Create new inventory item - expiry is required!
          await Inventory.create({
            name: item.productName,
            category: "General",
            batchNumber: item.batchNumber,
            expiry: item.expiryDate, // Required field
            stock: item.quantity,
            costPrice: item.unitCost,
            salePrice: item.unitCost * 1.5,
            minStock: 10,
            supplier: purchase.supplierName,
          });
        }
      }
    } else if (oldStatus === 'Received' && status !== 'Received') {
      // Remove stock from inventory
      for (const item of purchase.items) {
        if (item.productId) {
          const product = await Inventory.findById(item.productId);
          if (product) {
            product.stock -= item.quantity;
            if (product.stock < 0) product.stock = 0;
            await product.save();
          }
        }
      }
    }
    
    await purchase.save();
    
    const updatedPurchase = await Purchase.findById(id)
      .populate('items.productId', 'name category')
      .populate('receivedBy', 'fullName email');
    
    res.status(200).json(
      new ApiResponse(200, updatedPurchase, "Purchase status updated successfully")
    );
  } catch (error) {
    throw new ApiError(500, `Failed to update purchase status: ${error.message}`);
  }
});

// Optional: Remove if not needed
export const getPurchaseStats = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Monthly total
    const monthlyResult = await Purchase.aggregate([
      {
        $match: {
          purchaseDate: { $gte: startOfMonth },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Yearly total
    const yearlyResult = await Purchase.aggregate([
      {
        $match: {
          purchaseDate: { $gte: startOfYear },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Top suppliers
    const topSuppliers = await Purchase.aggregate([
      {
        $match: { status: { $ne: 'Cancelled' } }
      },
      {
        $group: {
          _id: '$supplierName',
          totalSpent: { $sum: '$grandTotal' },
          purchaseCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    res.status(200).json(
      new ApiResponse(200, {
        monthly: monthlyResult[0] || { total: 0, count: 0 },
        yearly: yearlyResult[0] || { total: 0, count: 0 },
        topSuppliers,
      }, "Purchase statistics fetched")
    );
  } catch (error) {
    throw new ApiError(500, `Failed to fetch purchase stats: ${error.message}`);
  }
});