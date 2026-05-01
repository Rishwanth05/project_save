require("dotenv").config();

require("./db");

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Project SAVE backend running at http://localhost:${PORT}`);
});
