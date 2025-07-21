const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

let employees = [
  { id: 1, name: "Alice", role: "Engineer" },
  { id: 2, name: "Bob", role: "Manager" }
];

router.get("/", auth, (req, res) => {
  res.json(employees);
});

router.post("/", auth, (req, res) => {
  const newEmp = req.body;
  newEmp.id = employees.length + 1;
  employees.push(newEmp);
  res.status(201).json(newEmp);
});

module.exports = router;
