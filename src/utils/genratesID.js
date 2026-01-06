export const generateUniqueId = async (Model, prefix) => {
  const count = await Model.countDocuments();
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};
