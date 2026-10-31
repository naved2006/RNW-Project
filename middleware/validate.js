const fs = require("fs");
const { body, param, query, validationResult } = require("express-validator");

const checkErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  // validation fail hui to upload hui image bhi hata do
  if (req.file) fs.unlink(req.file.path, () => {});

  res.status(400).json({
    message: "Validation failed",
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

// ---------- reusable rules ----------
const idRule = () => param("id").isMongoId().withMessage("Invalid book id");

const textRule = (field, label, { required = false } = {}) => {
  const rule = body(field);
  if (!required) rule.optional();
  return rule.trim().notEmpty().withMessage(required ? `${label} is required` : `${label} cannot be empty`);
};

const isbnRule = ({ required = false } = {}) => {
  const rule = body("isbn");
  if (!required) return rule.optional().trim().isISBN().withMessage("ISBN is not valid");
  return rule.trim().notEmpty().withMessage("ISBN is required").bail().isISBN().withMessage("ISBN is not valid");
};

const descriptionRule = () =>
  body("description").optional().trim().isLength({ max: 1000 }).withMessage("Description can be at most 1000 characters");

const priceRule = ({ required = false } = {}) => {
  const rule = body("price");
  if (required) rule.notEmpty().withMessage("Price is required").bail();
  else rule.optional();
  return rule.isFloat({ min: 0 }).withMessage("Price must be a positive number");
};

const stockRule = () => body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a whole number, 0 or more");

// ---------- validators ----------
const validateId = [idRule(), checkErrors];

const validateListQuery = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a number greater than 0"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("Minimum price must be a positive number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number")
    .bail()
    .custom((max, { req }) => {
      const min = req.query.minPrice;
      return min === undefined || Number(min) <= Number(max);
    })
    .withMessage("Maximum price cannot be less than minimum price"),
  checkErrors,
];

const validateNewBook = [
  textRule("title", "Title", { required: true }),
  textRule("author", "Author", { required: true }),
  isbnRule({ required: true }),
  textRule("genre", "Genre"),
  descriptionRule(),
  priceRule({ required: true }),
  stockRule(),
  checkErrors,
];

const validateBookUpdate = [
  idRule(),
  textRule("title", "Title"),
  textRule("author", "Author"),
  isbnRule(),
  textRule("genre", "Genre"),
  descriptionRule(),
  priceRule(),
  stockRule(),
  checkErrors,
];

const validateBuy = [
  idRule(),
  body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be a whole number, at least 1"),
  checkErrors,
];

module.exports = { validateId, validateListQuery, validateNewBook, validateBookUpdate, validateBuy };
