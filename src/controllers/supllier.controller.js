import { Supplier } from "../models/supplier.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiSuccess.js";

export const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find();
  res.status(200).json(new ApiResponse(200, suppliers, "Suppliers fetched"));
});

export const addSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json(new ApiResponse(201, supplier, "Supplier added"));
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!supplier) throw new ApiError(404, "Supplier not found");
  res.status(200).json(new ApiResponse(200, supplier, "Supplier updated"));
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await Supplier.deleteMany({ _id: { $in: ids } });
  res.status(200).json(new ApiResponse(200, null, "Suppliers deleted"));
});
