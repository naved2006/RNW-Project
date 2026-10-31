require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const bookRoutes = require("./routes/bookRoutes");

const app = express();

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to book store" });
});

app.use(bookRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ---------- error handling ----------
// Har known error ke liye (status, message) ek jagah likha hai
const knownErrors = [
  {
    match: (err) => err.name === "MulterError" || err.message === "Only image files are allowed",
    reply: (err) => [400, err.message],
  },
  { match: (err) => err.name === "ValidationError", reply: (err) => [400, err.message] },
  { match: (err) => err.name === "CastError", reply: () => [400, "Invalid book id"] },
  { match: (err) => err.code === 11000, reply: () => [409, "A book with this ISBN already exists"] },
  { match: (err) => err.type === "entity.parse.failed", reply: () => [400, "Request body is not valid JSON"] },
];

app.use((err, req, res, next) => {
  const known = knownErrors.find((item) => item.match(err));
  const [status, message] = known ? known.reply(err) : [500, err.message || "Something went wrong"];
  res.status(status).json({ message });
});

// ---------- start ----------
const port = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(port, () => console.log(`Server running on port ${port}`));
});
