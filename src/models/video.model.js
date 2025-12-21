import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: String,
      required: [true, "Video file URL is required"],
      trim: true,
    },

    thumbnail: {
      type: String,
      required: [true, "Thumbnail URL is required"],
      trim: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      index: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    duration: {
      type: Number,
      required: [true, "Duration is required"],
    },

    views: {
      type: Number,
      default: 0,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Video owner is required"],
      index: true,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate)
// Optional indexes
// videoSchema.index({ title: 1, views: -1 });

export const Video = mongoose.model("Video", videoSchema);
