const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const { createOrder, getMyOrders,getMyOrderById,cancelMyOrder,downloadMyInvoice} = require("../controllers/order.controller");

router.post("/", protect, createOrder);

router.get("/", protect, getMyOrders);

router.patch("/:id/cancel", protect, cancelMyOrder);

router.get("/:id", protect, getMyOrderById);

 router.get("/:id/invoice", protect, downloadMyInvoice);


module.exports = router;