
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Customer = require("../models/customer.model");

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

module.exports = {
  getDashboardOverview,
};
