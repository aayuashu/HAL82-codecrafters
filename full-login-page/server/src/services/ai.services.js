const fetch = require("node-fetch");
require("dotenv").config();

/**
 * Analyze a startup using Hugging Face models
 * @param {Object} startup
 */
async function analyzeStartup(startup) {
  try {
    // Better prompt engineering for FLAN-T5
    const prompt = `Startup Analysis:

Name: ${startup.name}
Description: ${startup.description}
Market: ${startup.market}
Revenue: ${startup.revenueModel}
Funding: ${startup.funding}
Team: ${startup.teamExp}

Provide analysis in this exact format:
SUMMARY: [2-3 sentence summary]
STRENGTHS: [list 2-3 strengths separated by commas]
RISKS: [list 2-3 risks separated by commas]
RECOMMENDATION: [Invest/Consider/Pass]

Analysis:`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-large", // Better than small
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.3, // Lower for more consistent output
            do_sample: false, // Deterministic output
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle different response formats
    let generatedText = "";
    if (Array.isArray(data) && data[0]?.generated_text) {
      generatedText = data[0].generated_text;
    } else if (data.generated_text) {
      generatedText = data.generated_text;
    } else {
      generatedText = data[0] || "";
    }

    // Parse the generated text
    const analysis = parseHuggingFaceOutput(generatedText, startup);
    return analysis;
  } catch (error) {
    console.error("Hugging Face API error:", error.message);
    return generateSmartFallback(startup);
  }
}

/**
 * Parse the generated text into structured data
 */
function parseHuggingFaceOutput(text, startup) {
  try {
    const result = {
      summary: "",
      strengths: [],
      risks: [],
      riskScore: 5, // Default
      growthScore: 5, // Default
      recommendation: "Consider",
    };

    // Extract summary
    const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?=STRENGTHS:|$)/is);
    if (summaryMatch) {
      result.summary = summaryMatch[1].trim();
    } else {
      // Fallback: use first sentence
      result.summary = text.split("\n")[0] || `Analysis of ${startup.name}`;
    }

    // Extract strengths
    const strengthsMatch = text.match(/STRENGTHS:\s*(.+?)(?=RISKS:|$)/is);
    if (strengthsMatch) {
      result.strengths = strengthsMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 4);
    }

    // Extract risks
    const risksMatch = text.match(/RISKS:\s*(.+?)(?=RECOMMENDATION:|$)/is);
    if (risksMatch) {
      result.risks = risksMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 4);
    }

    // Extract recommendation
    const recMatch = text.match(/RECOMMENDATION:\s*(.+?)(?=\n|$)/is);
    if (recMatch) {
      const rec = recMatch[1].trim().toLowerCase();
      if (rec.includes("invest")) result.recommendation = "Invest";
      else if (rec.includes("pass")) result.recommendation = "Pass";
      else result.recommendation = "Consider";
    }

    // Calculate scores based on extracted data
    result.riskScore = calculateRiskScore(result.risks, startup);
    result.growthScore = calculateGrowthScore(result.strengths, startup);

    return result;
  } catch (error) {
    console.error("Parsing error:", error.message);
    return generateSmartFallback(startup);
  }
}

/**
 * Calculate risk score based on risks and startup data
 */
function calculateRiskScore(risks, startup) {
  let score = 5; // Base score

  // Adjust based on identified risks
  if (risks.length > 3) score += 2;
  else if (risks.length > 1) score += 1;

  // Adjust based on funding
  if (startup.funding?.toLowerCase().includes("seed")) score += 1;
  if (startup.funding?.toLowerCase().includes("none")) score += 2;

  // Adjust based on team experience
  if (startup.teamExp?.toLowerCase().includes("senior")) score -= 1;
  if (startup.teamExp?.toLowerCase().includes("experienced")) score -= 1;

  return Math.min(10, Math.max(0, score));
}

/**
 * Calculate growth score based on strengths and startup data
 */
function calculateGrowthScore(strengths, startup) {
  let score = 5; // Base score

  // Adjust based on identified strengths
  if (strengths.length > 3) score += 2;
  else if (strengths.length > 1) score += 1;

  // Adjust based on market
  if (startup.market?.toLowerCase().includes("tech")) score += 1;
  if (startup.market?.toLowerCase().includes("growing")) score += 1;

  return Math.min(10, Math.max(0, score));
}

/**
 * Smart fallback when API fails
 */
function generateSmartFallback(startup) {
  // Simple rule-based analysis
  const strengths = [];
  const risks = [];

  // Team analysis
  if (
    startup.teamExp?.toLowerCase().includes("senior") ||
    startup.teamExp?.toLowerCase().includes("ex-")
  ) {
    strengths.push("Experienced team");
  } else {
    risks.push("Team experience unknown");
  }

  // Market analysis
  if (
    startup.market?.toLowerCase().includes("growing") ||
    startup.market?.toLowerCase().includes("large")
  ) {
    strengths.push("Growing market");
  } else {
    risks.push("Market validation needed");
  }

  // Funding analysis
  if (startup.funding?.toLowerCase().includes("seed")) {
    risks.push("Early stage funding");
  } else if (startup.funding?.toLowerCase().includes("series")) {
    strengths.push("Well-funded");
  }

  // Generate summary
  const summary = `${startup.name} operates in ${startup.market}. ${startup.description?.substring(0, 100)}...`;

  // Calculate scores
  const riskScore = Math.min(10, risks.length * 2 + 3);
  const growthScore = Math.min(10, strengths.length * 2 + 4);

  let recommendation = "Consider";
  if (riskScore > 7) recommendation = "Pass";
  if (growthScore > 8 && riskScore < 5) recommendation = "Invest";

  return {
    summary,
    strengths: strengths.slice(0, 4),
    risks: risks.slice(0, 4),
    riskScore,
    growthScore,
    recommendation,
  };
}

module.exports = {
  analyzeStartup,
};
