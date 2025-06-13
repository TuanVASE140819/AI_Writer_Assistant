const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyCtT6bscVkTW8tzxo9TX_a0qO3iZwpOwwA";
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
  // Đổi tên model thành Gemini 1.5 Flash
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash-preview-04-17",
  });
  const prompt = "Xin chào, bạn khỏe không?";

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}

run().catch(console.error);
