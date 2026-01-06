import connectDB from "./DB/index.js";
import dotenv from "dotenv";
import app from "./app.js";;

dotenv.config();

connectDB()
  .then(() => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
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
