const axios = require("axios");
require("dotenv").config();

// Log all environment variables to debug
console.log("Environment variables:", {
  NODE_ENV: process.env.NODE_ENV,
  DEEPSEEK_API_KEY_EXISTS: !!process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_API_KEY_LENGTH: process.env.DEEPSEEK_API_KEY
    ? process.env.DEEPSEEK_API_KEY.length
    : 0,
  DEEPSEEK_API_KEY_PREFIX: process.env.DEEPSEEK_API_KEY
    ? process.env.DEEPSEEK_API_KEY.substring(0, 5)
    : "none",
});

// Use the API key from the environment variable
const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_ENDPOINT = "https://api.deepseek.com/chat/completions";

// Add this to disable SSL verification (for testing only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testDeepseekAPI() {
  try {
    console.log("Testing Deepseek API...");
    console.log(
      "API Key:",
      API_KEY
        ? `${API_KEY.substring(0, 5)}...${API_KEY.substring(
            API_KEY.length - 5
          )}`
        : "Not available"
    );
    console.log("API Endpoint:", API_ENDPOINT);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
    };

    console.log("Using headers:", {
      contentType: headers["Content-Type"],
      authPrefix: headers.Authorization.substring(0, 12),
      accept: headers.Accept,
    });

    const response = await axios.post(
      API_ENDPOINT,
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello!" },
        ],
        stream: false,
      },
      {
        headers: headers,
        timeout: 30000,
        httpsAgent: new (require("https").Agent)({
          rejectUnauthorized: false,
        }),
      }
    );

    console.log("API Test Response Status:", response.status);
    console.log(
      "API Test Response Data:",
      JSON.stringify(response.data, null, 2)
    );
    console.log("Test successful!");
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
  }
}

testDeepseekAPI();
