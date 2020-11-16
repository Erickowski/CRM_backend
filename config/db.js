const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
      useCreateIndex: true,
    });
    console.log("DB conectada");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = conectarDB;
