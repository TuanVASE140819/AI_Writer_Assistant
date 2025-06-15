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

// Endpoint phân tích tin bất động sản
app.post("/analyze-real-estate", async (req, res) => {
  console.log("Received /analyze-real-estate request", req.body);
  const { content } = req.body;
  if (!content) return res.json({ error: "No content" });

  const prompt = `
Bạn là chuyên gia marketing bất động sản. Hãy phân tích nội dung sau và trả về kết quả dưới dạng JSON với các trường:
- title: Tiêu đề nổi bật, ngắn gọn, thu hút, phù hợp đăng TikTok nhà đất, có thể dùng icon, in hoa, có số, có từ khóa hot.
- trend: Xu hướng TikTok liên quan đến loại bất động sản này, gợi ý cách đặt tiêu đề dễ lên xu hướng/trending.
- nearby: Các tiện ích xung quanh (chợ, trường học, bệnh viện, siêu thị, công viên...) dựa trên địa chỉ nếu có.
- area: Diện tích đất (ghi rõ số liệu, đơn vị).
- structure: Kết cấu nhà (số tầng, phòng, WC, sân thượng...).
- price: Giá bán (ghi rõ số, đơn vị, thương lượng nếu có).
- contact: Thông tin liên hệ (số điện thoại, tên, v.v.).
- hashtag: Gợi ý hashtag phù hợp đăng TikTok, Facebook.
- tiktok_script: Gợi ý kịch bản quay video TikTok ngắn (3-5 câu, có thể dùng emoji, kêu gọi hành động).

Nội dung tin:
"""${content}"""

Trả về đúng định dạng JSON, không giải thích thêm.
`;

  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash-preview-05-20",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Tìm đoạn JSON trong text trả về
    let jsonStr = text;
    const match = text.match(/\{[\s\S]+\}/);
    if (match) jsonStr = match[0];
    let resultObj = {};
    try {
      resultObj = JSON.parse(jsonStr);
    } catch (e) {
      // Nếu lỗi parse, trả về text thô
      return res.json({ result: { raw: text } });
    }
    res.json({ result: resultObj });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Xóa hoặc comment đoạn này:
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

// Thay bằng:
module.exports = app;
