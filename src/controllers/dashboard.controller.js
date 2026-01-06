import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiSuccess.js";
import { Inventory } from "../models/inventory.model.js";
import { Purchase } from "../models/purchase.model.js";
import { Sale } from "../models/sales.model.js";
import { Supplier } from "../models/supplier.model.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  // Get counts for dashboard
  const [
    totalProducts,
    totalSuppliers,
    totalPurchases,
    totalSales,
    lowStockProducts,
    recentPurchases,
    recentSales
  ] = await Promise.all([
    Inventory.countDocuments(),
    Supplier.countDocuments(),
    Purchase.countDocuments(),
    Sale.countDocuments(),
    Inventory.find({ stock: { $lt: 10 } }).countDocuments(),
    Purchase.find().sort({ createdAt: -1 }).limit(5).populate("productId supplierId"),
    Sale.find().sort({ createdAt: -1 }).limit(5).populate("productId")
  ]);

  // Calculate total inventory value
  const inventoryItems = await Inventory.find();
  const totalInventoryValue = inventoryItems.reduce((sum, item) => {
    return sum + (item.stock * item.costPrice);
  }, 0);

  res.status(200).json(
    new ApiResponse(200, {
      summary: {
        totalProducts,
        totalSuppliers,
        totalPurchases,
        totalSales,
        lowStockCount: lowStockProducts,
        totalInventoryValue
      },
      recentPurchases,
      recentSales
    }, "Dashboard stats fetched successfully")
  );
});