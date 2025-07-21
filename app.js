const express = require("express");
const morgan = require("morgan");
require("dotenv").config();

const employeeRoutes = require("./routes/employee");
const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Enterprise API" });
});

app.use("/api/employees", employeeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
