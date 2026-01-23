const Notification = require('../models/Notification');

const createNotification = async ({ recipient, sender = 'System', type, message, orderId }) => {
  if (!recipient || !type || !message) {
    throw new Error('recipient, type, and message are required');
  }

  return Notification.create({
    recipient,
    sender,
    type,
    message,
    orderId,
  });
};

module.exports = { createNotification };
