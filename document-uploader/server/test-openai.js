const axios = require("axios");
require("dotenv").config();

// Log all environment variables to debug
console.log("Environment variables:", {
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
  OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY
    ? process.env.OPENAI_API_KEY.length
    : 0,
  OPENAI_API_KEY_PREFIX: process.env.OPENAI_API_KEY
    ? process.env.OPENAI_API_KEY.substring(0, 5)
    : "none",
});

// Use the API key from the environment variable
const API_KEY = process.env.OPENAI_API_KEY;
const API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

async function testOpenAIAPI() {
  try {
    console.log("Testing OpenAI API...");
    console.log(
      "API Key:",
      API_KEY
        ? `${API_KEY.substring(0, 5)}...${API_KEY.substring(
            API_KEY.length - 5
          )}`
        : "Not available"
    );
    console.log("API Endpoint:", API_ENDPOINT);

    const response = await axios.post(
      API_ENDPOINT,
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello!" },
        ],
        max_tokens: 50,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      }
    );

    console.log("API Test Response Status:", response.status);
    console.log(
      "API Test Response Data:",
      JSON.stringify(response.data, null, 2)
    );
    console.log("Test successful!");
    return response.data;
  } catch (error) {
    console.error("API Test Error:", error.message);

    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received. Request was made but no response.");
    } else {
      console.error("Error setting up the request:", error.message);
    }
    throw error;
  }
}

// Execute the test if this file is run directly
if (require.main === module) {
  testOpenAIAPI()
    .then(() => console.log("Test completed"))
    .catch(() => console.log("Test failed"));
}

// Export the function for use in other files
module.exports = { testOpenAIAPI };
