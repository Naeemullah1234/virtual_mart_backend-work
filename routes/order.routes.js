const express = require("express");
const router = express.Router();

const { protect,authorize} = require("../middleware/auth.middleware");

const { createOrder, getMyOrders,getMyOrderById,cancelMyOrder,downloadMyInvoice,getAllOrders,updateOrderStatus} = require("../controllers/order.controller");

router.post("/", protect, createOrder);

router.get("/", protect, getMyOrders);

router.get("/admin/all", protect, authorize("admin"), getAllOrders);

router.patch( "/admin/:id/status",protect,authorize("admin"),updateOrderStatus);

router.patch("/:id/cancel", protect, cancelMyOrder);

router.get("/:id", protect, getMyOrderById);

 router.get("/:id/invoice", protect, downloadMyInvoice);


module.exports = router;