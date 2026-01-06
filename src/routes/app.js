// // app.js - UPDATED VERSION
// import express from "express";
// import cors from "cors";
// import multer from "multer";

// // ✅ IMPORT ROUTES CORRECTLY
// import dashboardRoutes from "./routes/dashboard.routes.js";
// import userRoutes from "./routes/user.routes.js";
// import inventoryRoutes from "./routes/inventry.routes.js"; // Check this filename!
// import purchaseRoutes from "./routes/purchase.routes.js";
// import salesRoutes from "./routes/sales.routes.js";
// import supplierRoutes from "./routes/supplier.routes.js";

// import { errorHandler } from "./utils/errorHandler.js";

// const app = express();

// /* =======================
//    ✅ CORS
// ======================= */
// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN || "*",
//     credentials: true,
//   })
// );

// /* =======================
//    ✅ BODY PARSERS
// ======================= */
// app.use(express.json({ limit: "16kb" }));
// app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(express.static("public"));

// /* =======================
//    ✅ HEALTH CHECK (Test this first)
// ======================= */
// app.get("/api/v1/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Server is running",
//     timestamp: new Date().toISOString()
//   });
// });

// /* =======================
//    ✅ ROUTES (Fix this section!)
// ======================= */
// // ✅ IMPORTANT: Check the base paths
// app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/inventory", inventoryRoutes); // This should work
// app.use("/api/v1/purchases", purchaseRoutes); // Changed from /purchase
// app.use("/api/v1/sales", salesRoutes);
// app.use("/api/v1/suppliers", supplierRoutes); // Changed from /supplier
// app.use("/api/v1/dashboard", dashboardRoutes);
// // Add this BEFORE the 404 handler in app.js
// app.get("/api/v1/debug/routes", (req, res) => {
//   const routes = [];
  
//   app._router.stack.forEach((middleware) => {
//     if (middleware.route) {
//       // Routes registered directly on app
//       routes.push({
//         path: middleware.route.path,
//         methods: Object.keys(middleware.route.methods)
//       });
//     } else if (middleware.name === 'router') {
//       // Router middleware
//       middleware.handle.stack.forEach((handler) => {
//         if (handler.route) {
//           routes.push({
//             path: handler.route.path,
//             methods: Object.keys(handler.route.methods)
//           });
//         }
//       });
//     }
//   });
  
//   res.json({
//     success: true,
//     totalRoutes: routes.length,
//     routes: routes
//   });
// });
// /* =======================
//    ❌ 404 HANDLER
// ======================= */
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.originalUrl}`,
//     availableRoutes: [
//       "/api/v1/health",
//       "/api/v1/users/login",
//       "/api/v1/users/register",
//       "/api/v1/inventory",
//       "/api/v1/purchases",
//       "/api/v1/sales",
//       "/api/v1/suppliers",
//       "/api/v1/dashboard"
//     ]
//   });
// });

// /* =======================
//    ❌ GLOBAL ERROR HANDLER
// ======================= */
// app.use(errorHandler);

// export default app;

// app.js - UPDATED VERSION
import express from "express";
import cors from "cors";
import multer from "multer";
// import profileRoutes from './routes/profile.routes.js';
// ✅ IMPORT ROUTES CORRECTLY
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";
import inventoryRoutes from "./routes/inventry.routes.js"; // Check this filename!
import purchaseRoutes from "./routes/purchase.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import notificationRoutes from './routes/notification.routes.js';
import "../jobs/notification.jobs.js"; // Import cron jobs

import { errorHandler } from "./utils/errorHandler.js";
import profileRoutes from './routes/profile.routes.js';


const app = express();

/* =======================
   ✅ CORS
======================= */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

/* =======================
   ✅ BODY PARSERS
======================= */
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

/* =======================
   ✅ HEALTH CHECK (Test this first)
======================= */
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

/* =======================
   ✅ DEBUG ROUTE (Add this BEFORE other routes!)
======================= */
app.get("/api/v1/debug/routes", (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const route = handler.route;
          routes.push({
            path: route.path,
            methods: Object.keys(route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    totalRoutes: routes.length,
    routes: routes
  });
});

/* =======================
   ✅ MAIN ROUTES
======================= */
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/purchases", purchaseRoutes);
app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
// Add after other routes
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
/* =======================
   ❌ 404 HANDLER
======================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    availableRoutes: [
      "/api/v1/health",
      "/api/v1/debug/routes",
      "/api/v1/users/login",
      "/api/v1/users/register",
      "/api/v1/inventory",
      "/api/v1/purchases",
      "/api/v1/sales",
      "/api/v1/suppliers",
      "/api/v1/dashboard"
    ]
  });
});

/* =======================
   ❌ GLOBAL ERROR HANDLER
======================= */
app.use(errorHandler);

export default app;