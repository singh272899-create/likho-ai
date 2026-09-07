const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = process.env.ANTHROPIC_API_KEY;

app.post("/api/generate", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "API key set nahi hai server par." });
    }

    const { contentType, tone, length, topic, language } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "Topic zaroori hai." });
    }

    const lengthGuide =
      length === "short" ? "under 100 words" : length === "long" ? "500-800 words" : "200-350 words";

    const prompt = `Write a ${contentType} about: "${topic}".
Tone: ${tone}.
Length: ${lengthGuide}.
Language: ${language}.
Only return the finished content. No preamble, no explanations.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(500).json({ error: "AI se response nahi mila." });
    }

    const data = await response.json();
    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    res.json({ text: text.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. Dobara try karo." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chal raha hai: http://localhost:${PORT}`));
