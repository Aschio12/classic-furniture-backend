const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

function getArrivalAt(order) {
  let arrival = null;
  for (const h of order.history) {
    if (h.status === 'Arrived at Hub') {
      if (!arrival || new Date(h.at) > new Date(arrival)) arrival = h.at;
    }
  }
  return arrival;
}

async function notifyStakeholders(order) {
  const admins = await User.find({ role: 'admin' }).select('_id');
  const managers = await User.find({ role: 'hub_manager', hubAssignment: order.pickupHub }).select('_id');
  const recipients = [...admins, ...managers];

  const message = `Order ${order._id} has remained at ${order.pickupHub} for over 3 days without pickup.`;

  for (const r of recipients) {
    try {
      await createNotification({ recipient: r._id, type: 'Arrival', message, orderId: order._id });
    } catch (e) {
      // swallow errors per-recipient
    }
  }
}

function startOrderCleanupJob() {
  cron.schedule('0 0 * * *', async () => {
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    try {
      const orders = await Order.find({ status: 'Arrived at Hub' }).select('pickupHub history status');
      for (const order of orders) {
        const arrivalAt = getArrivalAt(order);
        if (arrivalAt && new Date(arrivalAt) <= cutoff) {
          await notifyStakeholders(order);
        }
      }
    } catch (err) {
      // noop
    }
  });
}

module.exports = { startOrderCleanupJob };
