import { Purchase } from "../models/purchase.model.js";
import { Sale } from "../models/sales.model.js";
import { Inventory } from "../models/inventory.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

// Get sales summary report
const getSalesSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, category, sellerId } = req.query;
  
  const query = {};
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }
  
  if (sellerId) {
    query.sellerId = sellerId;
  }
  
  const sales = await Sale.find(query)
    .populate('sellerId', 'fullName userName email')
    .populate('items.inventoryId', 'name category');
  
  // Calculate summary
  let totalSales = 0;
  let totalItems = 0;
  let totalTransactions = sales.length;
  const categoryWise = {};
  const dailySales = {};
  
  sales.forEach(sale => {
    totalSales += sale.grandTotal || 0;
    totalItems += sale.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Category wise sales
    sale.items.forEach(item => {
      if (item.inventoryId && item.inventoryId.category) {
        const category = item.inventoryId.category;
        categoryWise[category] = (categoryWise[category] || 0) + (item.total || 0);
      }
    });
    
    // Daily sales
    const date = sale.createdAt.toISOString().split('T')[0];
    dailySales[date] = (dailySales[date] || 0) + (sale.grandTotal || 0);
  });
  
  // Top selling products
  const topProducts = await Sale.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productName',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' },
        avgPrice: { $avg: '$items.unitPrice' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 }
  ]);
  
  // Payment method distribution
  const paymentMethods = await Sale.aggregate([
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$grandTotal' }
      }
    }
  ]);
  
  res.status(200).json(
    new ApiResponse(200, {
      summary: {
        totalSales,
        totalItems,
        totalTransactions,
        averageTransactionValue: totalTransactions > 0 ? totalSales / totalTransactions : 0
      },
      categoryWise,
      dailySales: Object.entries(dailySales).map(([date, amount]) => ({ date, amount })),
      topProducts,
      paymentMethods,
      recentSales: sales.slice(0, 10)
    }, "Sales summary report generated successfully")
  );
});

// Get inventory summary report
const getInventorySummary = asyncHandler(async (req, res) => {
  const { category, lowStock, expiringSoon } = req.query;
  
  const query = {};
  
  if (category) {
    query.category = category;
  }
  
  const inventory = await Inventory.find(query);
  
  // Calculate summary
  let totalValue = 0;
  let totalItems = 0;
  let totalStock = 0;
  const categoryWise = {};
  const lowStockItems = [];
  const expiringItems = [];
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  inventory.forEach(item => {
    const itemValue = (item.stock || 0) * (item.costPrice || 0);
    totalValue += itemValue;
    totalItems++;
    totalStock += item.stock || 0;
    
    // Category wise
    categoryWise[item.category] = categoryWise[item.category] || {
      count: 0,
      stock: 0,
      value: 0
    };
    categoryWise[item.category].count++;
    categoryWise[item.category].stock += item.stock || 0;
    categoryWise[item.category].value += itemValue;
    
    // Low stock items
    if ((item.stock || 0) < 20) {
      lowStockItems.push({
        id: item._id,
        name: item.name,
        stock: item.stock,
        minStock: 20
      });
    }
    
    // Expiring soon items
    if (item.expiry && item.expiry <= thirtyDaysFromNow && item.expiry > today) {
      const daysUntilExpiry = Math.ceil((item.expiry - today) / (1000 * 60 * 60 * 24));
      expiringItems.push({
        id: item._id,
        name: item.name,
        expiry: item.expiry,
        stock: item.stock,
        daysUntilExpiry
      });
    }
  });
  
  // Expired items
  const expiredItems = inventory
    .filter(item => item.expiry && item.expiry <= today)
    .map(item => ({
      id: item._id,
      name: item.name,
      expiry: item.expiry,
      stock: item.stock
    }));
  
  // Stock value by category
  const stockValueByCategory = Object.entries(categoryWise).map(([category, data]) => ({
    category,
    count: data.count,
    stock: data.stock,
    value: data.value
  }));
  
  // Fast moving vs slow moving items (based on sales data)
  const salesData = await Sale.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productName',
        totalSold: { $sum: '$items.quantity' }
      }
    }
  ]);
  
  const productSalesMap = {};
  salesData.forEach(sale => {
    productSalesMap[sale._id] = sale.totalSold;
  });
  
  const performanceMetrics = inventory.map(item => {
    const sold = productSalesMap[item.name] || 0;
    const stockTurnover = sold > 0 ? sold / (item.stock || 1) : 0;
    const profitMargin = ((item.salePrice - item.costPrice) / item.costPrice) * 100;
    
    return {
      id: item._id,
      name: item.name,
      category: item.category,
      stock: item.stock,
      sold,
      stockTurnover,
      profitMargin,
      totalValue: item.stock * item.costPrice,
      status: item.stock === 0 ? 'Out of Stock' : 
              item.stock < 20 ? 'Low Stock' : 
              stockTurnover > 1 ? 'Fast Moving' : 'Slow Moving'
    };
  });
  
  res.status(200).json(
    new ApiResponse(200, {
      summary: {
        totalItems,
        totalStock,
        totalValue,
        averageStockValue: totalItems > 0 ? totalValue / totalItems : 0
      },
      stockValueByCategory,
      lowStockItems: lowStock === 'true' ? lowStockItems : [],
      expiringItems: expiringSoon === 'true' ? expiringItems : [],
      expiredItems,
      performanceMetrics,
      topValuedItems: inventory
        .sort((a, b) => (b.stock * b.costPrice) - (a.stock * a.costPrice))
        .slice(0, 10)
        .map(item => ({
          name: item.name,
          category: item.category,
          stock: item.stock,
          costPrice: item.costPrice,
          salePrice: item.salePrice,
          totalValue: item.stock * item.costPrice
        }))
    }, "Inventory summary report generated successfully")
  );
});

// Get purchases summary report
const getPurchasesSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, supplier, status } = req.query;
  
  const query = {};
  
  if (startDate || endDate) {
    query.purchaseDate = {};
    if (startDate) {
      query.purchaseDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.purchaseDate.$lte = new Date(endDate);
    }
  }
  
  if (supplier) {
    query.supplierName = { $regex: supplier, $options: 'i' };
  }
  
  if (status) {
    query.status = status;
  }
  
  const purchases = await Purchase.find(query)
    .populate('receivedBy', 'fullName userName')
    .populate('items.productId', 'name category');
  
  // Calculate summary
  let totalSpent = 0;
  let totalItems = 0;
  let totalPurchases = purchases.length;
  const monthlySpending = {};
  const supplierWise = {};
  const categoryWise = {};
  
  purchases.forEach(purchase => {
    totalSpent += purchase.grandTotal || 0;
    totalItems += purchase.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Monthly spending
    const monthYear = purchase.purchaseDate 
      ? `${purchase.purchaseDate.getFullYear()}-${String(purchase.purchaseDate.getMonth() + 1).padStart(2, '0')}`
      : 'Unknown';
    monthlySpending[monthYear] = (monthlySpending[monthYear] || 0) + (purchase.grandTotal || 0);
    
    // Supplier wise
    if (purchase.supplierName) {
      supplierWise[purchase.supplierName] = supplierWise[purchase.supplierName] || {
        totalSpent: 0,
        purchases: 0,
        items: 0
      };
      supplierWise[purchase.supplierName].totalSpent += purchase.grandTotal || 0;
      supplierWise[purchase.supplierName].purchases++;
      supplierWise[purchase.supplierName].items += purchase.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    // Category wise
    purchase.items.forEach(item => {
      if (item.productId && item.productId.category) {
        const category = item.productId.category;
        categoryWise[category] = categoryWise[category] || {
          totalSpent: 0,
          items: 0
        };
        categoryWise[category].totalSpent += item.totalCost || 0;
        categoryWise[category].items += item.quantity;
      }
    });
  });
  
  // Payment status distribution
  const paymentStatus = await Purchase.aggregate([
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$grandTotal' },
        avgAmount: { $avg: '$grandTotal' }
      }
    }
  ]);
  
  // Top purchased products
  const topProducts = await Purchase.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productName',
        totalQuantity: { $sum: '$items.quantity' },
        totalCost: { $sum: '$items.totalCost' },
        avgUnitCost: { $avg: '$items.unitCost' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 }
  ]);
  
  res.status(200).json(
    new ApiResponse(200, {
      summary: {
        totalSpent,
        totalItems,
        totalPurchases,
        averagePurchaseValue: totalPurchases > 0 ? totalSpent / totalPurchases : 0,
        itemsPerPurchase: totalPurchases > 0 ? totalItems / totalPurchases : 0
      },
      monthlySpending: Object.entries(monthlySpending).map(([month, amount]) => ({ month, amount })),
      supplierWise: Object.entries(supplierWise).map(([supplier, data]) => ({
        supplier,
        ...data
      })),
      categoryWise: Object.entries(categoryWise).map(([category, data]) => ({
        category,
        ...data
      })),
      paymentStatus,
      topProducts,
      recentPurchases: purchases.slice(0, 10),
      statusDistribution: {
        pending: purchases.filter(p => p.status === 'Pending').length,
        received: purchases.filter(p => p.status === 'Received').length,
        cancelled: purchases.filter(p => p.status === 'Cancelled').length,
        partial: purchases.filter(p => p.status === 'Partial').length
      }
    }, "Purchases summary report generated successfully")
  );
});

// Get financial summary report
const getFinancialSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.$gte = startDate ? new Date(startDate) : null;
    dateFilter.$lte = endDate ? new Date(endDate) : null;
  }
  
  // Get sales data
  const salesQuery = dateFilter.$gte ? { createdAt: dateFilter } : {};
  const sales = await Sale.find(salesQuery);
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
  
  // Get purchases data
  const purchasesQuery = dateFilter.$gte ? { purchaseDate: dateFilter } : {};
  const purchases = await Purchase.find(purchasesQuery);
  const totalCost = purchases.reduce((sum, purchase) => sum + (purchase.grandTotal || 0), 0);
  
  // Get inventory value
  const inventory = await Inventory.find();
  const inventoryValue = inventory.reduce((sum, item) => 
    sum + ((item.stock || 0) * (item.costPrice || 0)), 0);
  
  // Calculate gross profit
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  
  // Monthly trends
  const monthlyData = await Sale.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$grandTotal' },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ]);
  
  const monthlyTrends = monthlyData.map(month => ({
    month: `${month._id.year}-${String(month._id.month).padStart(2, '0')}`,
    revenue: month.revenue,
    transactions: month.transactions
  }));
  
  // Cash flow analysis
  const today = new Date();
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const recentSales = await Sale.find({ 
    createdAt: { $gte: last30Days } 
  });
  const recentRevenue = recentSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
  
  const recentPurchases = await Purchase.find({ 
    purchaseDate: { $gte: last30Days } 
  });
  const recentCost = recentPurchases.reduce((sum, purchase) => sum + (purchase.grandTotal || 0), 0);
  
  // Key performance indicators
  const kpis = {
    revenueGrowth: calculateGrowth(sales, 'grandTotal', last90Days, last30Days),
    averageTransactionValue: sales.length > 0 ? totalRevenue / sales.length : 0,
    inventoryTurnover: calculateInventoryTurnover(sales, inventory),
    daysSalesOutstanding: calculateDSO(sales),
    returnOnInvestment: calculateROI(totalRevenue, totalCost, inventoryValue)
  };
  
  res.status(200).json(
    new ApiResponse(200, {
      summary: {
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        inventoryValue,
        netCashFlow: grossProfit
      },
      monthlyTrends,
      cashFlow: {
        last30Days: {
          revenue: recentRevenue,
          cost: recentCost,
          netCash: recentRevenue - recentCost
        }
      },
      keyMetrics: {
        totalTransactions: sales.length,
        totalItemsSold: sales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
        averageItemsPerTransaction: sales.length > 0 ? 
          sales.reduce((sum, sale) => sum + sale.items.length, 0) / sales.length : 0
      },
      kpis
    }, "Financial summary report generated successfully")
  );
});

// Get comprehensive dashboard report
const getDashboardSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  
  // Today's sales
  const todaySales = await Sale.find({ 
    createdAt: { $gte: startOfDay } 
  });
  const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
  const todayTransactions = todaySales.length;
  
  // This month's sales
  const monthSales = await Sale.find({ 
    createdAt: { $gte: startOfMonth } 
  });
  const monthRevenue = monthSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
  
  // This year's sales
  const yearSales = await Sale.find({ 
    createdAt: { $gte: startOfYear } 
  });
  const yearRevenue = yearSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
  
  // Recent purchases
  const recentPurchases = await Purchase.find()
    .sort({ purchaseDate: -1 })
    .limit(5)
    .populate('receivedBy', 'fullName');
  
  // Low stock items
  const lowStockItems = await Inventory.find({ 
    stock: { $lt: 20 } 
  }).limit(5);
  
  // Expiring soon items
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringItems = await Inventory.find({
    expiry: { 
      $gte: today,
      $lte: thirtyDaysFromNow
    }
  }).sort({ expiry: 1 }).limit(5);
  
  // Recent sales
  const recentSales = await Sale.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('sellerId', 'fullName');
  
  // Top selling products this month
  const topProducts = await Sale.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productName',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }
  ]);
  
  // Sales by category this month
  const salesByCategory = await Sale.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'inventories',
        localField: 'items.inventoryId',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $group: {
        _id: '$productInfo.category',
        totalRevenue: { $sum: '$items.total' },
        totalSold: { $sum: '$items.quantity' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);
  
  // Inventory summary
  const totalInventoryItems = await Inventory.countDocuments();
  const totalInventoryValue = await Inventory.aggregate([
    {
      $group: {
        _id: null,
        totalValue: { 
          $sum: { $multiply: ['$stock', '$costPrice'] } 
        }
      }
    }
  ]);
  
  // Sales trend for last 7 days
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dailySalesTrend = await Sale.aggregate([
    { $match: { createdAt: { $gte: last7Days } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
        },
        revenue: { $sum: '$grandTotal' },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
  
  res.status(200).json(
    new ApiResponse(200, {
      quickStats: {
        todayRevenue,
        todayTransactions,
        monthRevenue,
        yearRevenue,
        lowStockCount: lowStockItems.length,
        expiringCount: expiringItems.length
      },
      recentPurchases,
      lowStockItems,
      expiringItems,
      recentSales,
      topProducts,
      salesByCategory,
      inventorySummary: {
        totalItems: totalInventoryItems,
        totalValue: totalInventoryValue[0]?.totalValue || 0
      },
      dailySalesTrend,
      alerts: [
        ...lowStockItems.map(item => ({
          type: 'low_stock',
          message: `${item.name} is low on stock (${item.stock} units)`,
          priority: item.stock < 10 ? 'high' : 'medium'
        })),
        ...expiringItems.map(item => ({
          type: 'expiring_soon',
          message: `${item.name} expires on ${item.expiry.toLocaleDateString()}`,
          priority: 'medium'
        }))
      ]
    }, "Dashboard summary generated successfully")
  );
});

// Helper functions
function calculateGrowth(data, field, olderPeriod, newerPeriod) {
  const olderData = data.filter(item => 
    item.createdAt >= olderPeriod && item.createdAt < newerPeriod
  );
  const newerData = data.filter(item => item.createdAt >= newerPeriod);
  
  const olderTotal = olderData.reduce((sum, item) => sum + (item[field] || 0), 0);
  const newerTotal = newerData.reduce((sum, item) => sum + (item[field] || 0), 0);
  
  if (olderTotal === 0) return 0;
  return ((newerTotal - olderTotal) / olderTotal) * 100;
}

function calculateInventoryTurnover(sales, inventory) {
  const costOfGoodsSold = sales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => 
      itemSum + (item.total || 0), 0), 0);
  
  const avgInventoryValue = inventory.reduce((sum, item) => 
    sum + ((item.stock || 0) * (item.costPrice || 0)), 0) / 2;
  
  if (avgInventoryValue === 0) return 0;
  return costOfGoodsSold / avgInventoryValue;
}

function calculateDSO(sales) {
  const totalReceivables = sales.filter(s => 
    s.paymentMethod === 'Credit'
  ).reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
  
  const totalCreditSales = sales.filter(s => 
    s.paymentMethod === 'Credit'
  ).reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
  
  if (totalCreditSales === 0) return 0;
  return (totalReceivables / totalCreditSales) * 30; // Days
}

function calculateROI(revenue, cost, investment) {
  const netProfit = revenue - cost;
  if (investment === 0) return 0;
  return (netProfit / investment) * 100;
}

export {
  getSalesSummary,
  getInventorySummary,
  getPurchasesSummary,
  getFinancialSummary,
  getDashboardSummary
};