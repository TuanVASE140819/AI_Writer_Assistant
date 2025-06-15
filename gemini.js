const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const API_KEY = "AIzaSyCtT6bscVkTW8tzxo9TX_a0qO3iZwpOwwA";
const genAI = new GoogleGenerativeAI(API_KEY);
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Endpoint phân tích tin bất động sản
app.post("/analyze-real-estate", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.json({ error: "No content" });

  // Prompt cho Gemini
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
    // Đoạn này sẽ gọi mô hình Gemini thông qua GoogleGenerativeAI
    // Cụ thể là các dòng sau:
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash-preview-04-17",
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

// Nếu file này chỉ chạy thử nghiệm, thêm server.listen
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log("Server running on port", PORT);
  });
}
