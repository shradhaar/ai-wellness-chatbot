
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/analyze', async (req, res) => {
  const { message } = req.body;
  try {
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: message }] }],
      }
    );

    const reply = geminiResponse.data.candidates[0].content.parts[0].text;
    res.json({ reply: reply.trim(), mood: 'happy' });
  } catch (e) {
    res.status(500).json({ reply: 'Sorry, something went wrong.', mood: 'neutral' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
