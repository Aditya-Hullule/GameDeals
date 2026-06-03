const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/deals', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query);
    const response = await axios.get(`https://www.cheapshark.com/api/1.0/deals?${params.toString()}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching deals from CheapShark:', error.message);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

router.post('/ai/insights', async (req, res) => {
  const { title } = req.body;
  const key = process.env.GEMINI_KEY;
  if (!key) {
    return res.status(401).json({ error: 'AI Insights engine not configured. Please set GEMINI_KEY in the server environment.' });
  }

  try {
    const prompt = `Analyze the video game "${title}". Provide the response in valid JSON format ONLY, without any markdown formatting like \`\`\`json. Structure the JSON exactly like this:
    {
        "summary": "A concise 3-sentence summary of the game.",
        "pros": ["Pro 1", "Pro 2", "Pro 3"],
        "cons": ["Con 1", "Con 2", "Con 3"],
        "similar": ["Game 1", "Game 2", "Game 3", "Game 4", "Game 5"]
    }`;

    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    let text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Clean up possible markdown code blocks if the model ignored instructions
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(text);
    res.json(parsedData);
  } catch (error) {
    console.error('Error fetching AI insights from Gemini:', error.message);
    res.status(500).json({ error: 'Failed to retrieve AI insights. Please check server logs.' });
  }
});

module.exports = router;
