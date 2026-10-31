const fs = require("fs");
const path = require("path");
const Book = require("../models/Book");

// ---------- helpers ----------
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const withCover = (req, data) => {
  if (req.file) data.coverImage = `/uploads/${req.file.filename}`;
  return data;
};

const notFound = (res) => res.status(404).json({ message: "Book not found" });

// uploads folder se purani cover image hata do (error aaye to ignore)
const removeCoverFile = (coverImage) => {
  if (!coverImage) return;
  fs.unlink(path.join(__dirname, "..", coverImage), () => {});
};

// request fail ho jaye to jo nayi image upload ho chuki hai use bhi hata do
const discardUpload = (req) => {
  if (req.file) fs.unlink(req.file.path, () => {});
};

// ---------- controllers ----------
const getBooks = async (req, res) => {
  const { genre, author, minPrice, maxPrice } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

  const filter = {};

  // genre: case-insensitive exact match, author: case-insensitive partial match
  if (genre) filter.genre = new RegExp(`^${escapeRegex(genre)}$`, "i");
  if (author) filter.author = new RegExp(escapeRegex(author), "i");

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  const [total, books] = await Promise.all([
    Book.countDocuments(filter),
    Book.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ total, page, pages: Math.ceil(total / limit), books });
};

const getBookById = async (req, res) => {
  const book = await Book.findById(req.params.id);
  return book ? res.json(book) : notFound(res);
};

const addBook = async (req, res) => {
  try {
    const book = await Book.create(withCover(req, { ...req.body }));
    res.status(201).json(book);
  } catch (error) {
    discardUpload(req); // e.g. duplicate ISBN: image orphan na rahe
    throw error;
  }
};

const updateBook = async (req, res) => {
  try {
    const oldBook = await Book.findById(req.params.id);
    if (!oldBook) {
      discardUpload(req);
      return notFound(res);
    }

    const book = await Book.findByIdAndUpdate(req.params.id, withCover(req, { ...req.body }), {
      returnDocument: "after",
      runValidators: true,
    });

    // nayi image aayi hai to purani hata do
    if (req.file) removeCoverFile(oldBook.coverImage);

    res.json(book);
  } catch (error) {
    discardUpload(req);
    throw error;
  }
};

const deleteBook = async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return notFound(res);

  removeCoverFile(book.coverImage);
  res.json({ message: "Book deleted successfully" });
};

const buyBook = async (req, res) => {
  const quantity = parseInt(req.body.quantity, 10) || 1;

  // Atomic update: stock tabhi ghatega jab kam se kam `quantity` copies bachi hon.
  // Isse do log ek saath kharidein to stock negative nahi hoga.
  const book = await Book.findOneAndUpdate(
    { _id: req.params.id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { returnDocument: "after" }
  );

  if (!book) {
    // Update fail hua: ya book hai hi nahi, ya stock kam hai
    const exists = await Book.exists({ _id: req.params.id });
    return exists ? res.status(400).json({ message: "Not enough copies in stock" }) : notFound(res);
  }

  const total = quantity * book.price;
  res.json({
    message: `You bought ${quantity} copy(ies) of ${book.title} for ₹${total}`,
    total,
    book,
  });
};

module.exports = { getBooks, getBookById, addBook, updateBook, deleteBook, buyBook };
