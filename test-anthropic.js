const Anthropic = require("@anthropic-ai/sdk");

async function test() {
  try {
    const anthropic = new Anthropic.default();
    
    console.log("Testing Anthropic API...");
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Say hello in JSON format: {\"greeting\": \"...\"}"
        }
      ]
    });
    
    console.log("Response:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Full error:", error);
  }
}

test();
