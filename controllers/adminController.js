const Order = require('../models/Order');

// GET /api/admin/logistics
const getLogisticsOverview = async (req, res) => {
  try {
    const hubs = ['Addis Ababa', 'Adama', 'Hawassa', 'Bahir Dar', 'Dire Dawa'];

    const overview = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Shipped', 'Arrived at Hub'] },
          pickupHub: { $in: hubs },
        },
      },
      {
        $group: {
          _id: { hub: '$pickupHub', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = hubs.reduce((acc, hub) => {
      acc[hub] = { Shipped: 0, 'Arrived at Hub': 0 };
      return acc;
    }, {});

    overview.forEach((row) => {
      const hub = row._id.hub;
      const status = row._id.status;
      result[hub][status] = row.count;
    });

    return res.json({ hubs: result });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch logistics overview', error: err.message });
  }
};

module.exports = { getLogisticsOverview };
