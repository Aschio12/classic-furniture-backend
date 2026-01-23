const Notification = require('../models/Notification');

// GET /api/notifications?page=1&limit=20
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments({ recipient: userId }),
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderId', 'status totalAmount pickupHub'),
    ]);

    return res.json({
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

// PATCH /api/notifications/:id/read
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark notification as read', error: err.message });
  }
};

module.exports = { getNotifications, markNotificationAsRead };
