const express = require("express");
const upload = require("../middleware/upload");
const { validateId, validateListQuery, validateNewBook, validateBookUpdate, validateBuy } = require("../middleware/validate");
const { getBooks, getBookById, addBook, updateBook, deleteBook, buyBook } = require("../controllers/bookController");

const router = express.Router();
const cover = upload.single("coverImage");

router.get("/books", validateListQuery, getBooks);
router.post("/addbook", cover, validateNewBook, addBook);

router
  .route("/books/:id")
  .get(validateId, getBookById)
  .put(cover, validateId, validateNewBook, updateBook)
  .patch(cover, validateBookUpdate, updateBook)
  .delete(validateId, deleteBook);

router.post("/books/:id/buy", validateBuy, buyBook);

module.exports = router;
