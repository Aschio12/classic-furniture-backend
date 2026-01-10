const multer = require('multer');

// Store in memory so we can upload buffer to Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
