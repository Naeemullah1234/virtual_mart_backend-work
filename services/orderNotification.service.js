
const cron = require("node-cron");
const Order = require("../models/order.model");
const OrderNotification = require("../models/orderNotification.model");
const { sendOrderStatusEmail } = require("../utils/sendEmail");

const MAX_ATTEMPTS = 5;
const RETRY_BATCH_SIZE = 50;
const LOCK_MINUTES = 10;

const retryFailedOrderNotifications = async () => {
  try {
    for (let i = 0; i < RETRY_BATCH_SIZE; i++) {
      const now = new Date();

      console.log("Current time:", now);

      const testRecord = await OrderNotification.findOne({
  sent: false,
  attempts: 0,
});

console.log(
  "Test notification:",
  testRecord
    ? {
        id: testRecord._id,
        sent: testRecord.sent,
        attempts: testRecord.attempts,
        nextRetryAt: testRecord.nextRetryAt,
        lockedUntil: testRecord.lockedUntil,
      }
    : "Not found"
);

const eligibleCount = await OrderNotification.countDocuments({
  sent: false,
  attempts: { $lt: MAX_ATTEMPTS },
  nextRetryAt: { $lte: now },
  $or: [
    { lockedUntil: null },
    { lockedUntil: { $exists: false } },
    { lockedUntil: { $lte: now } },
  ],
});

console.log("Eligible notifications:", eligibleCount);

const debugNotifications = await OrderNotification.find({
  sent: false,
}).select("sent attempts nextRetryAt lockedUntil");

console.log("Pending notification records:", debugNotifications);

      // Atomically claim one eligible notification.
      const notification = await OrderNotification.findOneAndUpdate(
        {
          sent: false,
          attempts: { $lt: MAX_ATTEMPTS },
          nextRetryAt: { $lte: now },
          $or: [
            { lockedUntil: null },
            { lockedUntil: { $exists: false } },
            { lockedUntil: { $lte: now } },
          ],
        },
        {
          $set: {
            lockedUntil: new Date(
              now.getTime() + LOCK_MINUTES * 60 * 1000
            ),
            lastAttemptAt: now,
          },
          $inc: { attempts: 1 },
        },
        {
  returnDocument: "after",
  sort: { nextRetryAt: 1 },
}
      );

     if (!notification) {
  console.log("No eligible notifications found for retry.");
  break;
}

console.log("Retrying notification:", notification._id);
console.log("Attempt number:", notification.attempts);

      try {
        const orderId =
  notification.order?._id || notification.order;

  console.log("Notification order value:", notification.order);
console.log("Notification order type:", typeof notification.order);
console.log(
  "Notification order ID:",
  notification.order?._id || notification.order
);

const order = await Order.findById(orderId);

        if (!order) {
          throw new Error("Related order not found.");
        }

       const notificationOrder = {
  orderNumber: order.orderNumber,
  shippingAddress: {
    fullName: order.shippingAddress?.fullName || "Customer",
  },
  grandTotal: order.grandTotal,
  orderStatus: notification.status,
};

await sendOrderStatusEmail(
  notification.email,
  notificationOrder,
  notification.status
);

        await OrderNotification.updateOne(
          { _id: notification._id },
          {
            $set: {
              sent: true,
              sentAt: new Date(),
              lastError: "",
              lockedUntil: null,
            },
          }
        );
      } catch (error) {
        const attempts = notification.attempts;
        const delayMinutes = Math.min(5 * 2 ** (attempts - 1), 60);

        await OrderNotification.updateOne(
          { _id: notification._id },
          {
            $set: {
              lastError: error.message || "Email sending failed.",
              nextRetryAt: new Date(
                Date.now() + delayMinutes * 60 * 1000
              ),
              lockedUntil: null,
            },
          }
        );

        console.error(
          `Order notification retry failed (${notification._id}):`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("ORDER NOTIFICATION RETRY ERROR:", error);
  }
};

let retryJobRunning = false;

const startOrderNotificationRetry = () => {
  cron.schedule(
    "*/5 * * * *",
    async () => {
      if (retryJobRunning) return;

      retryJobRunning = true;

      try {
        await retryFailedOrderNotifications();
      } finally {
        retryJobRunning = false;
      }
    },
    { timezone: "Asia/Karachi" }
  );

  console.log("Order notification retry job scheduled every 5 minutes.");
};

module.exports = {
  startOrderNotificationRetry,
  retryFailedOrderNotifications,
};
