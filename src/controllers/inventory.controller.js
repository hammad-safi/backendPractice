import { Inventory } from "../models/inventory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiSuccess.js";

export const getInventory = asyncHandler(async (req, res) => {
  const items = await Inventory.find();
  res.status(200).json(new ApiResponse(200, items, "Inventory fetched successfully"));
});

export const addInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.create(req.body);
  res.status(201).json(new ApiResponse(201, item, "Product added"));
});

export const updateInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) throw new ApiError(404, "Product not found");
  res.status(200).json(new ApiResponse(200, item, "Product updated"));
});

export const deleteInventory = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await Inventory.deleteMany({ _id: { $in: ids } });
  res.status(200).json(new ApiResponse(200, null, "Products deleted"));
});
