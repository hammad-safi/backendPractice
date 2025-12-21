import express from "express";
import connectDB from "./DB/index.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 4000, () => {
      console.log(`🚀 Server is running on port 3000 ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ Error starting server:", err.message);
  });


// import mongoose from "mongoose";
// import { DB_NAME } from "../constant";
// import express from "express"
//  const app = express()
// const connectDB = async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
//     console.log("MongoDB Connected");
//     app.on("error",(error) => {
//             console.log("Error:",error);
//             throw error
            
//     }

// )
//     app.listen(process.env.PORT,() => {
//         console.log(`server is listing on port${process.env.PORT} `);
        
//     } )
//   } catch (err) {
//     console.log("MongoDB Connection Error:", err);
//   }
// };

// connectDB();
