const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

async function notifyForStagnantOrder(order) {
  const hubManagers = await User.find({ role: 'hub_manager', hubAssignment: order.pickupHub }).select('_id');
  const admins = await User.find({ role: 'admin' }).select('_id');

  const hubMessage = `URGENT: Order ${order._id} has been at your hub for 2 days. Please confirm delivery or update status.`;
  const adminMessage = `ATTENTION: Hub ${order.pickupHub} has a delayed delivery for Order ${order._id}. Seller is waiting for payout.`;

  for (const manager of hubManagers) {
    try {
      await createNotification({
        recipient: manager._id,
        type: 'Arrival',
        message: hubMessage,
        orderId: order._id,
      });
    } catch (err) {
      // ignore per-recipient errors
    }
  }

  for (const admin of admins) {
    try {
      await createNotification({
        recipient: admin._id,
        type: 'Arrival',
        message: adminMessage,
        orderId: order._id,
      });
    } catch (err) {
      // ignore per-recipient errors
    }
  }
}

function startEscrowAlertJob() {
  cron.schedule('0 */6 * * *', async () => {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    try {
      const stagnantOrders = await Order.find({
        status: 'Arrived at Hub',
        updatedAt: { $lt: cutoff },
      }).select('_id pickupHub updatedAt');

      for (const order of stagnantOrders) {
        await notifyForStagnantOrder(order);
      }
    } catch (err) {
      // noop
    }
  });
}

module.exports = { startEscrowAlertJob };
