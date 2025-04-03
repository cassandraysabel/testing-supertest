const mongoose = require("mongoose");
const config = require("config");


async function connect() {
  const dbUri = config.get("dbUri");
  console.log(`🛠️ Connecting to MongoDB at: ${dbUri}`);

  try {
    await mongoose.connect(dbUri);
    console.log("DB connected");
  } catch (error) {
    console.error("Could not connect to db");
    process.exit(1);
  }
}

module.exports = connect; 
