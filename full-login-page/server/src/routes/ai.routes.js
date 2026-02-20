const express = require("express");
const {
  analyzeStartupController,
} = require("../controllers/ai.controllers.js");

const router = express.Router();

router.post("/analyze", analyzeStartupController);

module.exports = router;
