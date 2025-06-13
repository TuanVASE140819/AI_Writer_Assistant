const express = require("express");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;

const API_KEY = "AIzaSyCtT6bscVkTW8tzxo9TX_a0qO3iZwpOwwA";
const genAI = new GoogleGenerativeAI(API_KEY);

app.use(bodyParser.json({ limit: "100mb" }));
app.use(express.static(__dirname)); // phục vụ file tĩnh

app.post("/chat", async (req, res) => {
  try {
    const prompt = req.body.message;
    const imageBase64 = req.body.image;

    // Đúng cấu trúc Gemini 2.5 Flash
    const parts = [];
    if (prompt) parts.push({ text: prompt });
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/png", // hoặc "image/jpeg"
          data: imageBase64,
        },
      });
    }

    const contents = [{ role: "user", parts }];

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash-preview-05-20",
    });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();
    res.json({ reply: text });
  } catch (err) {
    res.status(500).json({ reply: "Lỗi: " + err.message });
  }
});

// Endpoint sinh 5 câu hỏi gợi ý dựa trên chủ đề
app.post("/suggest-questions", async (req, res) => {
  try {
    const topic = req.body.topic;
    if (!topic) return res.status(400).json({ error: "Thiếu chủ đề" });
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash-preview-05-20",
    });
    const prompt = `Hãy tạo 5 câu hỏi gợi ý giúp người dùng cung cấp thông tin để viết một bài về chủ đề: '${topic}'. Trả về danh sách câu hỏi, không giải thích thêm.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    // Tách câu hỏi thành mảng
    const questions = text
      .split(/\n|\r/)
      .map((q) => q.replace(/^\d+\.?\s*/, "").trim())
      .filter((q) => q.length > 0);
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: "Lỗi: " + err.message });
  }
});

// Endpoint tạo bài viết hoàn chỉnh từ chủ đề và 5 câu trả lời
app.post("/generate-article", async (req, res) => {
  try {
    const { topic, answers, tone } = req.body;
    if (!topic || !answers || answers.length < 5)
      return res.status(400).json({ error: "Thiếu thông tin đầu vào" });
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash-preview-05-20",
    });
    // Tạo prompt tổng hợp
    const prompt = `Viết một bài hoàn chỉnh về chủ đề: '${topic}'. Dưới đây là các thông tin người dùng cung cấp:\n1. ${answers[0]}\n2. ${answers[1]}\n3. ${answers[2]}\n4. ${answers[3]}\n5. ${answers[4]}\nHãy viết bài dưới dạng HTML hoàn chỉnh (có thể có tiêu đề, đoạn, danh sách, hashtag...), trình bày đẹp, dễ đọc, không giải thích thêm.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    res.json({ article: text });
  } catch (err) {
    res.status(500).json({ error: "Lỗi: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
