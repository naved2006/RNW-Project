const mongoose = require("mongoose");

// "978-0-13-235088-4" aur "9780132350884" ko ek hi ISBN maana jaye
const cleanIsbn = (value) => (typeof value === "string" ? value.replace(/[-\s]/g, "").toUpperCase() : value);

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    author: { type: String, required: [true, "Author is required"], trim: true },
    isbn: { type: String, required: [true, "ISBN is required"], unique: true, trim: true, set: cleanIsbn },
    genre: { type: String, trim: true, default: "General" },
    description: { type: String, trim: true },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    stock: { type: Number, default: 0, min: [0, "Stock cannot be negative"] },
    coverImage: { type: String },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
  }
);

// Extra field in response: true jab stock bacha ho
bookSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

// Filters (genre / author) tez chalein
bookSchema.index({ genre: 1 });
bookSchema.index({ author: 1 });

module.exports = mongoose.model("Book", bookSchema);
