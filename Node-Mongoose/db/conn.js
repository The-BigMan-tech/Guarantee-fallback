import mongoose from "mongoose";


const dbConnection = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/");
    console.log("Database connected successfully");
    return mongoose.connection;
  } catch (error) {
    console.log("Error while connecting to database", error);
  }
};

export default dbConnection;