import "dotenv/config";
import mongoose from "mongoose";
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfull");
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
