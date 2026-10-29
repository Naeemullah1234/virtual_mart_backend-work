
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Customer = require("../models/customer.model");
const ProductVariant = require("../models/productVariant.model");

const getDashboardOverview = async (req, res) => {
  try {
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      salesResult,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments(),
      Product.countDocuments(),

      Order.aggregate([
        {
          $match: {
            orderStatus: { $ne: "cancelled" },
            paymentStatus: { $in: ["paid", "completed"] },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$grandTotal" },
          },
        },
      ]),

      Order.countDocuments({ orderStatus: "pending" }),
      Order.countDocuments({ orderStatus: "delivered" }),
      Order.countDocuments({ orderStatus: "cancelled" }),
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        totalOrders,
        totalCustomers,
        totalProducts,
        totalSales: salesResult[0]?.totalSales || 0,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getSalesReport = async (req, res) => {
  try {
    const { period = "day", startDate, endDate } = req.query;

    const formats = {
      day: "%Y-%m-%d",
      week: "%G-W%V",
      month: "%Y-%m",
    };

    if (!formats[period]) {
      return res.status(400).json({
        success: false,
        message: "Period must be day, week, or month.",
      });
    }

    const match = {
      orderStatus: "delivered",
    };

    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00+05:00`);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate.",
          });
        }

        match.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999+05:00`);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate.",
          });
        }

        match.createdAt.$lte = end;
      }

      if (
        match.createdAt.$gte &&
        match.createdAt.$lte &&
        match.createdAt.$gte > match.createdAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "startDate must be before endDate.",
        });
      }
    }

    const report = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format: formats[period],
              date: "$createdAt",
              timezone: "Asia/Karachi",
            },
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
          totalItemsSold: {
            $sum: {
              $sum: "$items.quantity",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalOrders: 1,
          totalRevenue: 1,
          totalItemsSold: 1,
        },
      },
    ]);

    const summary = report.reduce(
      (result, item) => {
        result.totalOrders += item.totalOrders;
        result.totalRevenue += item.totalRevenue;
        result.totalItemsSold += item.totalItemsSold;
        return result;
      },
      {
        totalOrders: 0,
        totalRevenue: 0,
        totalItemsSold: 0,
      }
    );

    return res.status(200).json({
      success: true,
      period,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary,
      report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: "pending" })
      .populate("customer", "name email")
      .select("customer createdAt grandTotal paymentMethod paymentStatus orderStatus")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalPendingOrders: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getCancelledOrders = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: "cancelled" })
      .populate("customer", "name email")
      .select(
        "customer createdAt grandTotal paymentMethod paymentStatus orderStatus"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalCancelledOrders: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getLowStockProducts = async (req, res) => {
  try {
    const variants = await ProductVariant.find({ stock: { $lte: 5 } })
      .populate("product", "name")
      .select("product sku attributes stock price salePrice")
      .sort({ stock: 1 });

    return res.status(200).json({
      success: true,
      lowStockThreshold: 5,
      totalLowStockVariants: variants.length,
      variants,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate} = req.query;
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Limit must be an integer between 1 and 100.",
      });
    }

    
const match = {
  orderStatus: "delivered",
};

if (startDate || endDate) {
  match.createdAt = {};

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00+05:00`);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate.",
      });
    }

    match.createdAt.$gte = start;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999+05:00`);

    if (Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDate.",
      });
    }

    match.createdAt.$lte = end;
  }

  if (
    match.createdAt.$gte &&
    match.createdAt.$lte &&
    match.createdAt.$gte > match.createdAt.$lte
  ) {
    return res.status(400).json({
      success: false,
      message: "startDate must be before endDate.",
    });
  }
}

const products = await Order.aggregate([
  {
    $match: match,
  },

      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.itemTotal" },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: {
          totalQuantitySold: -1,
          totalRevenue: -1,
        },
      },
      {
        $limit: parsedLimit,
      },
      {
        $project: {
          _id: 0,
          product: "$_id",
          productName: 1,
          totalQuantitySold: 1,
          totalRevenue: 1,
          totalOrders: 1,
        },
      },
    ]);

    return res.status(200).json({
  success: true,
  filters: {
    startDate: startDate || null,
    endDate: endDate || null,
  },
  totalProducts: products.length,
  products,
});
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getOrderStatusReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const statuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    const match = {};

    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00+05:00`);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate.",
          });
        }

        match.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999+05:00`);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate.",
          });
        }

        match.createdAt.$lte = end;
      }

      if (
        match.createdAt.$gte &&
        match.createdAt.$lte &&
        match.createdAt.$gte > match.createdAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "startDate must be before endDate.",
        });
      }
    }

    const counts = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$orderStatus",
          total: { $sum: 1 },
        },
      },
    ]);

    const report = statuses.map((status) => ({
      status,
      totalOrders:
        counts.find((item) => item._id === status)?.total || 0,
    }));

    return res.status(200).json({
      success: true,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      totalOrders: report.reduce(
        (total, item) => total + item.totalOrders,
        0
      ),
      report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};








module.exports = {getDashboardOverview,getSalesReport,getPendingOrders,getCancelledOrders,getLowStockProducts,getTopSellingProducts,getOrderStatusReport};
