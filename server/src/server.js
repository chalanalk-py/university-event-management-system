// Load environment variables from env file
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

// Start http server listening for incoming connections
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
