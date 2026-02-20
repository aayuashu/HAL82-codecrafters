const { analyzeStartup } = require("../services/ai.services.js");

async function analyzeStartupController(req, res) {
  try {
    const result = await analyzeStartup(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI failed" });
  }
}

module.exports = { analyzeStartupController };
