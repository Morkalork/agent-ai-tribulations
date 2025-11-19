import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

async function runFAQAgent(question) {
  const llm = new ChatOpenAI({ apiKey: process.env.OPEN_API_KEY });

  // Load FAQ data
  const faqData = JSON.parse(fs.readFileSync("faq.json", "utf8"));

  // Create system prompt with FAQ data
  const systemPrompt = `You are a helpful assistant for ${
    faqData.en.companyName
  }. 
You have access to the following information about the company:

Company Information:
- Company Name: ${faqData.en.companyName}
- Founder: ${faqData.en.founder}
- Co-founders: ${faqData.en["co-founders"].join(", ")}
- Mission Statement: ${faqData.en.missionStatement}
- Tagline: ${faqData.en.tagline}
- Story: ${faqData.en.story}

Employees:
${faqData.en.employees
  .map((emp) => `- ${emp.name}, ${emp.role} (${emp.area})`)
  .join("\n")}

Mission Areas:
${faqData.en.mission.map((m) => `- ${m.title}: ${m.text}`).join("\n")}

Why Choose Us:
${faqData.en.whyChooseUs.join(", ")}

Contact Information:
- Email: ${faqData.en.contact.email}
- Phone: ${faqData.en.contact.phone}
- Address: ${faqData.en.hq.address}

Answer questions about the company based on this information. Be helpful and accurate.`;

  const agent = createAgent({
    model: llm,
    tools: [],
    systemPrompt: systemPrompt,
  });

  const response = await agent.invoke({
    messages: [{ role: "user", content: question }],
  });

  // Extract the answer from the response
  // The response contains a messages array with BaseMessage objects
  // Get the last message which should be the AI's response
  if (response.messages && response.messages.length > 0) {
    const lastMessage = response.messages[response.messages.length - 1];
    // BaseMessage objects have a content property
    const answer =
      lastMessage.content || lastMessage.text || String(lastMessage);
    return answer;
  } else {
    // Fallback: return the entire response if structure is unexpected
    return JSON.stringify(response, null, 2);
  }
}

// Export for use in server
export { runFAQAgent };

// CLI mode: if run directly (not imported), accept command-line arguments
if (process.argv[1] && process.argv[1].endsWith("agent.js")) {
  const question = process.argv.slice(2).join(" ");

  if (!question) {
    console.error("Usage: node agent.js <question>");
    console.error('Example: node agent.js "What is the company\'s mission?"');
    process.exit(1);
  }

  runFAQAgent(question)
    .then((answer) => console.log(answer))
    .catch((error) => {
      console.error("Error:", error.message);
      process.exit(1);
    });
}
