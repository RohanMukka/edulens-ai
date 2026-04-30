
import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

async function test() {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "hi" }],
      model: "llama-3.1-8b-instant",
    });
    console.log("SUCCESS:", completion.choices[0]?.message?.content);
  } catch (e) {
    console.error("FAILURE:", e);
  }
}

test();
