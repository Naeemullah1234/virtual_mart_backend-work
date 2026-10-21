
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
          new: true,
          sort: { nextRetryAt: 1 },
        }
      );

      if (!notification) break;

      try {
        const order = await Order.findById(notification.order);

        if (!order) {
          throw new Error("Related order not found.");
        }

        const notificationOrder = {
          ...order.toObject(),
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
