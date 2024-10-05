const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");

// Initialize GoogleGenerativeAI with the API key
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Configure the generative model
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Configure the generation settings
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// POST endpoint to handle chat messages (for standard responses)
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    // Start a chat session with the generation config
    const chatSession = model.startChat({
      generationConfig,
      history: [], // You can implement history management as needed
    });

    // Send the user's message to the chat session
    const result = await chatSession.sendMessage(message);

    // Send the generated response back to the client
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error("Error generating response from Gemini API:", error);
    res.status(500).json({ error: "Error generating response from Gemini API" });
  }
});

app.post('/chat/stream', async (req, res) => {
  const { message } = req.body;

  try {
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessageStream(message);

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response in chunks
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${chunkText}\n\n`); // Send each chunk with 'data:' prefix
    }

    res.end(); // End the stream when done
  } catch (error) {
    console.error("Error streaming response from Gemini API:", error.message);
    res.status(500).json({ error: 'Error streaming response from Gemini API' });
  }
});




// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
