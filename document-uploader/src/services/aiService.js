import axios from "axios";

// You'll need to install axios: npm install axios

const API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY; // Store API key in .env file
// Try these alternative endpoints one by one
// const API_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";
// const API_ENDPOINT = "https://api.deepseek.ai/v1/chat/completions";
// const API_ENDPOINT = "https://api.deepseek.ai/chat/completions";
const API_ENDPOINT = "https://api.deepseek.com/chat/completions";

// Add this debugging code at the top of your file
console.log("API Key format check:", {
  length: API_KEY ? API_KEY.length : 0,
  startsWithPrefix: API_KEY ? API_KEY.startsWith("sk-") : false,
  // Don't log the full key for security reasons
  firstFiveChars: API_KEY ? API_KEY.substring(0, 5) : "none",
  lastFiveChars: API_KEY ? API_KEY.substring(API_KEY.length - 5) : "none",
});

// Function to get the server port
export const getServerPort = async () => {
  // Start with informative logging
  console.log("Starting server port discovery process...");

  // Track attempted methods for better error reporting
  const attemptedMethods = [];

  try {
    // SIMPLIFIED PORT DETERMINATION with clear priority:
    // 1. Try port-info.json (most reliable, includes timestamp)
    // 2. Try server-port.txt
    // 3. Check localStorage for saved port
    // 4. Try default port (64970)
    // 5. Try common ports as last resort

    // Step 1: Try port-info.json first (most reliable source with metadata)
    attemptedMethods.push("port-info.json");
    try {
      console.log("Fetching port from port-info.json...");
      const infoResponse = await axios.get("/port-info.json", {
        timeout: 2000,
        // Add cache busting to avoid browser caching an old version
        params: { _t: new Date().getTime() },
      });

      if (infoResponse.data && infoResponse.data.port) {
        const port = infoResponse.data.port.toString();
        const timestamp = new Date(infoResponse.data.timestamp);
        const ageMinutes = Math.floor(
          (Date.now() - timestamp.getTime()) / 60000
        );

        console.log(
          `Found port ${port} from port-info.json (${ageMinutes} minutes old)`
        );

        // Only use if less than 2 hours old
        if (ageMinutes < 120) {
          // Verify this port works
          try {
            await axios.get(`http://localhost:${port}/api/test`, {
              timeout: 2000,
            });
            console.log(`✅ Verified port ${port} is working`);
            localStorage.setItem("serverPort", port);
            return port;
          } catch (e) {
            console.log(
              `❌ Port ${port} from port-info.json is not responding: ${e.message}`
            );
          }
        } else {
          console.log(
            `❌ Port info is too old (${ageMinutes} minutes), skipping`
          );
        }
      } else {
        console.log("❌ port-info.json found but has invalid format");
      }
    } catch (e) {
      console.log(`❌ Could not read port-info.json: ${e.message}`);
    }

    // Step 2: Try to read from the server-port.txt file
    attemptedMethods.push("server-port.txt");
    try {
      console.log("Fetching port from server-port.txt...");
      const portResponse = await axios.get("/server-port.txt", {
        responseType: "text",
        timeout: 2000,
        // Add cache busting to avoid browser caching an old version
        params: { _t: new Date().getTime() },
      });

      if (portResponse.data && portResponse.data.trim()) {
        const port = portResponse.data.trim();
        console.log("Found port from file:", port);

        // Verify this port works
        try {
          await axios.get(`http://localhost:${port}/api/test`, {
            timeout: 2000,
          });
          console.log(`✅ Verified port ${port} from file is working`);
          localStorage.setItem("serverPort", port);
          return port;
        } catch (e) {
          console.log(`❌ Port ${port} from file doesn't work: ${e.message}`);
        }
      } else {
        console.log("❌ server-port.txt is empty or has invalid format");
      }
    } catch (e) {
      console.log(`❌ Could not read port file: ${e.message}`);
    }

    // Step 3: Check localStorage for cached port
    attemptedMethods.push("localStorage");
    const savedPort = localStorage.getItem("serverPort");
    if (savedPort) {
      console.log("Using saved port from localStorage:", savedPort);
      try {
        const response = await axios.get(
          `http://localhost:${savedPort}/api/test`,
          {
            timeout: 2000,
          }
        );
        if (
          response.data &&
          response.data.message === "Server is running correctly"
        ) {
          console.log("✅ Saved port is working:", savedPort);
          return savedPort;
        } else {
          console.log("❌ Unexpected response from saved port");
          localStorage.removeItem("serverPort");
        }
      } catch (e) {
        console.log(`❌ Saved port doesn't work: ${e.message}`);
        // Clear invalid saved port
        localStorage.removeItem("serverPort");
      }
    } else {
      console.log("❌ No port saved in localStorage");
    }

    // Step 4: Try default port 64970
    attemptedMethods.push("default port 64970");
    console.log("Trying default port 64970...");
    try {
      const response = await axios.get("http://localhost:64970/api/test", {
        timeout: 2000,
      });
      if (
        response.data &&
        response.data.message === "Server is running correctly"
      ) {
        console.log("✅ Server confirmed on default port 64970");
        localStorage.setItem("serverPort", "64970");
        return "64970";
      } else {
        console.log("❌ Unexpected response from default port");
      }
    } catch (e) {
      console.log(`❌ Default port 64970 not responding: ${e.message}`);
    }

    // Step 5: Try common ports as last resort
    attemptedMethods.push("common ports");
    console.log("Trying common ports as last resort...");
    const commonPorts = [5000, 3000, 8080, 4000, 5001, 3001];
    for (const port of commonPorts) {
      try {
        console.log(`Trying port ${port}...`);
        const response = await axios.get(`http://localhost:${port}/api/test`, {
          timeout: 1500,
        });
        if (
          response.data &&
          response.data.message === "Server is running correctly"
        ) {
          console.log(`✅ Server found on port ${port}`);
          // Save working port to localStorage
          localStorage.setItem("serverPort", port.toString());
          return port;
        }
      } catch (e) {
        // Continue to next port
        console.log(`❌ Port ${port} not working`);
      }
    }

    throw new Error(
      `Could not find server on any port. Tried: ${attemptedMethods.join(", ")}`
    );
  } catch (error) {
    console.error(
      `Server port detection failed after trying: ${attemptedMethods.join(
        ", "
      )}`
    );
    console.error("Error details:", error.message);
    throw error; // Let the calling code handle the failure
  }
};

// Function to extract text from PDF
export const extractTextFromPDF = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Get the server port
    let port;
    try {
      port = await getServerPort();
    } catch (e) {
      console.error("Failed to get server port:", e.message);
      throw new Error(
        "Cannot connect to server. Please check if the server is running."
      );
    }

    console.log("Using port:", port);

    // Try multiple extraction methods in sequence
    let response;
    let error;

    // Method 1: Primary PDF extraction
    try {
      console.log("Trying primary PDF extraction...");
      response = await axios.post(
        `http://localhost:${port}/api/extract-pdf-text`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 10000, // 10 second timeout
        }
      );
      console.log("Primary extraction success!");
      return response.data.text;
    } catch (err) {
      console.log("Primary extraction failed, trying alternative...");
      error = err;
    }

    // Method 2: Alternative PDF extraction
    try {
      console.log("Trying alternative PDF extraction...");
      response = await axios.post(
        `http://localhost:${port}/api/extract-pdf-text-alt`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 10000, // 10 second timeout
        }
      );
      console.log("Alternative extraction success!");
      return response.data.text;
    } catch (err) {
      console.log(
        "Alternative extraction failed, falling back to simulation..."
      );
      error = err;
    }

    // Method 3: Simulated extraction as last resort
    try {
      console.log("Using simulated extraction as fallback...");
      response = await axios.post(
        `http://localhost:${port}/api/extract-pdf-text-external`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 5000,
        }
      );
      console.log("Simulated extraction success!");
      return response.data.text;
    } catch (err) {
      console.error("All extraction methods failed:", err);
      throw new Error("Failed to extract text from PDF: All methods failed");
    }
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF: " + error.message);
  }
};

// Simple in-memory cache
const responseCache = new Map();

// Simple rate limiting
const apiCalls = {
  count: 0,
  lastReset: Date.now(),
};

// Update to use OpenAI as primary service
export const analyzeDocumentContent = async (
  documentText,
  fileName,
  updateStatus
) => {
  // Force disable mock mode by removing the flag from localStorage
  if (localStorage.getItem("useMockData")) {
    console.log(
      "[MODEL SELECTION] Removing mock data mode flag from localStorage"
    );
    localStorage.removeItem("useMockData");
  }

  // Always use real APIs, ignore any mock data settings
  console.log("[MODEL SELECTION] Using real AI models (mock mode disabled)");

  // Check for cached response
  const cacheKey = `${fileName}-${documentText.substring(0, 100)}`;
  if (responseCache.has(cacheKey)) {
    console.log("[MODEL SELECTION] Using cached response for:", fileName);
    updateStatus && updateStatus("cache", "retrieved");
    return responseCache.get(cacheKey);
  }

  try {
    // Try to use OpenAI first
    try {
      console.log("[MODEL SELECTION] Attempting to use OpenAI for analysis...");
      updateStatus && updateStatus("openai", "connecting");

      const result = await analyzeWithOpenAI(
        documentText,
        fileName,
        updateStatus
      );
      console.log("[MODEL SELECTION] Successfully used OpenAI model");
      updateStatus && updateStatus("openai", "success");
      return result;
    } catch (openaiError) {
      console.error(
        "[MODEL SELECTION] OpenAI analysis failed:",
        openaiError.message
      );
      updateStatus && updateStatus("openai", "failed");

      // Try Deepseek as fallback
      try {
        console.log("[MODEL SELECTION] Falling back to Deepseek...");
        updateStatus && updateStatus("deepseek", "connecting");

        const result = await analyzeWithDeepseek(
          documentText,
          fileName,
          updateStatus
        );
        console.log("[MODEL SELECTION] Successfully used Deepseek model");
        updateStatus && updateStatus("deepseek", "success");
        return result;
      } catch (deepseekError) {
        console.error(
          "[MODEL SELECTION] Deepseek fallback also failed:",
          deepseekError.message
        );
        updateStatus && updateStatus("deepseek", "failed");

        // Only use mock data as absolute last resort if both APIs fail
        console.log(
          "[MODEL SELECTION] Both APIs failed, using mock data as last resort"
        );
        updateStatus && updateStatus("mock", "fallback");
        const mockResponse = generateMockResponse(documentText, fileName);
        responseCache.set(cacheKey, mockResponse);
        return mockResponse;
      }
    }
  } catch (error) {
    console.log(
      "[MODEL SELECTION] Critical error in API calls, using mock data as emergency fallback"
    );
    updateStatus && updateStatus("mock", "emergency");
    const mockResponse = generateMockResponse(documentText, fileName);
    responseCache.set(cacheKey, mockResponse);
    return mockResponse;
  }
};

// Helper function to format and print AI responses for debugging
const logFormattedAIResponse = (source, response) => {
  console.log(`\n========== ${source} RAW RESPONSE ==========`);
  // Check if response is a string
  if (typeof response === "string") {
    // Split by section markers for better readability
    const sections = [
      {
        name: "【标题】",
        content: response.match(/【标题】\s*([\s\S]*?)(?=【正文】|$)/),
      },
      {
        name: "【正文】",
        content: response.match(/【正文】\s*([\s\S]*?)(?=【话题】|$)/),
      },
      {
        name: "【话题】",
        content: response.match(/【话题】\s*([\s\S]*?)(?=【推荐平台】|$)/),
      },
      {
        name: "【推荐平台】",
        content: response.match(/【推荐平台】\s*([\s\S]*?)(?=【图片提示】|$)/),
      },
      {
        name: "【图片提示】",
        content: response.match(/【图片提示】\s*([\s\S]*?)(?=$)/),
      },
    ];

    // Display formatted sections if they exist
    sections.forEach((section) => {
      if (section.content && section.content[1]) {
        console.log(`\n${section.name}:\n${section.content[1].trim()}`);
      } else {
        console.log(`\n${section.name}: [MISSING]`);
      }
    });

    // Check for expected format
    const hasExpectedFormat = sections.every(
      (section) =>
        section.content && section.content[1] && section.content[1].trim()
    );

    if (!hasExpectedFormat) {
      console.warn(
        `\n⚠️ WARNING: ${source} response is missing some expected sections!`
      );
      console.log("\nFull raw response:");
      console.log(response);
    }
  } else {
    console.log("Response is not a string:", response);
  }
  console.log("\n===========================================\n");
};

// For OpenAI
export const analyzeWithOpenAI = async (
  documentText,
  fileName,
  updateStatus
) => {
  try {
    console.log("[OpenAI] Starting OpenAI analysis...");
    // Get the server port for the proxy
    let port;
    try {
      port = await getServerPort();
    } catch (e) {
      console.error("[OpenAI ERROR] Failed to get server port:", e.message);
      throw new Error(
        "Cannot connect to server. Please check if the server is running."
      );
    }

    console.log("[OpenAI] Using port:", port);
    updateStatus && updateStatus("openai", "connecting");

    // Create the enhanced prompt (same as Deepseek for consistency)
    const prompt = `
      请你作为一位专业的时尚产品营销专家，分析以下文档并创作一篇突出产品特点的小红书帖子：
      
      文档名称: ${fileName}
      
      文档内容:
      ${documentText.substring(0, 5000)}...
      
      请创作：
      1. 一个爆款小红书标题（30字以内，使用表情符号，突出产品核心卖点和价值）
      2. 一段详细介绍产品特点的正文内容（800-1200字）
         - 重点突出产品的设计理念、材质、工艺、功能等特点
         - 详细描述产品的独特卖点和优势
         - 加入专业的时尚术语和评价
         - 使用生动的语言描述产品的使用场景和搭配建议
         - 在适当位置加入表情符号增强亲和力
      3. 五个与产品相关的热门话题标签（确保包含产品类型、风格特点和目标人群标签）
      4. 三个最适合此产品推广的社交媒体平台，并详细说明为什么这些平台最适合
      5. 一个详细的产品图片生成提示词（描述产品外观、色彩、材质、场景等元素）
      
      请确保内容：
      - 专业且具有说服力，突出产品的实际特点和价值
      - 符合小红书平台的种草风格（真实、专业、有温度）
      - 能够激发用户的购买欲望
      - 使用行业专业术语提升可信度
      
      请按以下格式回复:
      
      【标题】
      [创意标题]
      
      【正文】
      [详细产品介绍内容]
      
      【话题】
      [话题1] [话题2] [话题3] [话题4] [话题5]
      
      【推荐平台】
      [平台1]：[原因]
      [平台2]：[原因]
      [平台3]：[原因]
      
      【图片提示】
      [详细产品图片描述]
    `;

    console.log("[OpenAI] Preparing API request with model: gpt-3.5-turbo");
    updateStatus && updateStatus("openai", "preparing");

    // Use the OpenAI API with optimized creativity parameters
    try {
      const response = await axios.post(
        `http://localhost:${port}/api/proxy-ai`,
        {
          endpoint: "https://api.openai.com/v1/chat/completions",
          apiKey: process.env.REACT_APP_OPENAI_API_KEY,
          data: {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "你是一位极具创意的小红书内容创作专家，擅长创作爆款内容。你的文案风格活泼生动，充满情感共鸣，总是能引起大量点赞和评论。你深谙各平台算法和用户心理，能够精准把握内容创作的关键点。",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 2000, // 增加最大token数，允许更长更详细的回复
            temperature: 0.95, // 更高的温度参数，大幅提高随机性和创意性
            top_p: 0.95, // 更高的多样性
            presence_penalty: 0.5, // 增强，鼓励模型讨论新话题
            frequency_penalty: 0.5, // 增强，减少重复
          },
        },
        {
          timeout: 60000, // 60 second timeout
        }
      );

      console.log("[OpenAI] API request successful");
      updateStatus && updateStatus("openai", "received");

      if (
        !response.data ||
        !response.data.choices ||
        !response.data.choices[0]
      ) {
        console.error(
          "[OpenAI ERROR] Invalid response structure:",
          response.data
        );
        throw new Error("Invalid API response structure from OpenAI");
      }

      const aiResponse = response.data.choices[0].message.content;
      console.log("[OpenAI] API usage:", {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens,
      });

      // Format and log the raw response for debugging
      logFormattedAIResponse("OpenAI", aiResponse);

      // Check if response contains any content in the expected format
      const hasExpectedFormat =
        aiResponse.includes("【标题】") &&
        aiResponse.includes("【正文】") &&
        aiResponse.includes("【话题】");

      console.log(
        "[OpenAI] Response contains expected format sections:",
        hasExpectedFormat
      );

      if (!hasExpectedFormat) {
        console.warn(
          "[OpenAI WARNING] Response doesn't contain expected Chinese format sections"
        );
      }

      updateStatus && updateStatus("openai", "parsing");
      const result = parseEnhancedAIResponse(aiResponse, fileName);
      console.log("[OpenAI] Parsed result:", result);

      // After getting a successful response
      const cacheKey = `${fileName}-${documentText.substring(0, 100)}`;
      responseCache.set(cacheKey, result);
      updateStatus && updateStatus("openai", "processing");
      updateStatus && updateStatus("openai", "success");
      return result;
    } catch (apiError) {
      console.error("[OpenAI API ERROR]", apiError);
      if (apiError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(
          "[OpenAI API ERROR] Response status:",
          apiError.response.status
        );
        console.error(
          "[OpenAI API ERROR] Response headers:",
          apiError.response.headers
        );
        console.error(
          "[OpenAI API ERROR] Response data:",
          apiError.response.data
        );
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error(
          "[OpenAI API ERROR] No response received:",
          apiError.request
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(
          "[OpenAI API ERROR] Request setup error:",
          apiError.message
        );
      }
      throw apiError;
    }
  } catch (error) {
    console.error("[OpenAI ERROR] Overall analysis error:", error.message);
    return {
      success: false,
      error: error.message || "Unknown error during analysis",
      fileName: fileName,
      title: `Analysis of ${fileName} (Failed)`,
      content: "The analysis process encountered an error: " + error.message,
      hashtags: ["#Error", "#Analysis", "#TryAgain"],
      platforms: ["LinkedIn", "Twitter"],
      imagePrompt: "Error image with appropriate message",
    };
  }
};

// For Deepseek
export const analyzeWithDeepseek = async (
  documentText,
  fileName,
  updateStatus
) => {
  try {
    console.log("[Deepseek] Starting Deepseek analysis...");

    // Get the server port for the proxy
    let port;
    try {
      port = await getServerPort();
    } catch (e) {
      console.error("[Deepseek ERROR] Failed to get server port:", e.message);
      throw new Error(
        "Cannot connect to server. Please check if the server is running."
      );
    }

    console.log("[Deepseek] Using port:", port);
    updateStatus && updateStatus("deepseek", "connecting");

    // Create a more detailed and creative prompt
    const prompt = `
      请你作为一位专业的时尚产品营销专家，分析以下文档并创作一篇突出产品特点的小红书帖子：
      
      文档名称: ${fileName}
      
      文档内容:
      ${documentText.substring(0, 5000)}...
      
      请创作：
      1. 一个爆款小红书标题（30字以内，使用表情符号，突出产品核心卖点和价值）
      2. 一段详细介绍产品特点的正文内容（800-1200字）
         - 重点突出产品的设计理念、材质、工艺、功能等特点
         - 详细描述产品的独特卖点和优势
         - 加入专业的时尚术语和评价
         - 使用生动的语言描述产品的使用场景和搭配建议
         - 在适当位置加入表情符号增强亲和力
      3. 五个与产品相关的热门话题标签（确保包含产品类型、风格特点和目标人群标签）
      4. 三个最适合此产品推广的社交媒体平台，并详细说明为什么这些平台最适合
      5. 一个详细的产品图片生成提示词（描述产品外观、色彩、材质、场景等元素）
      
      请确保内容：
      - 专业且具有说服力，突出产品的实际特点和价值
      - 符合小红书平台的种草风格（真实、专业、有温度）
      - 能够激发用户的购买欲望
      - 使用行业专业术语提升可信度
      
      请按以下格式回复:
      
      【标题】
      [创意标题]
      
      【正文】
      [详细产品介绍内容]
      
      【话题】
      [话题1] [话题2] [话题3] [话题4] [话题5]
      
      【推荐平台】
      [平台1]：[原因]
      [平台2]：[原因]
      [平台3]：[原因]
      
      【图片提示】
      [详细产品图片描述]
    `;

    console.log("[Deepseek] Preparing API request with model: deepseek-chat");
    updateStatus && updateStatus("deepseek", "preparing");

    // Use the proxy endpoint with high creativity parameters
    try {
      const response = await axios.post(
        `http://localhost:${port}/api/proxy-ai`,
        {
          endpoint: API_ENDPOINT,
          apiKey: API_KEY,
          data: {
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content:
                  "你是一位极具创意的小红书内容创作专家，擅长创作爆款内容。你的文案风格活泼生动，充满情感共鸣，总是能引起大量点赞和评论。你深谙各平台算法和用户心理，能够精准把握内容创作的关键点。",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.95, // 更高的温度参数，大幅提高随机性和创意性
            top_p: 0.95, // 更高的多样性
            max_tokens: 2000, // 增加token限制，允许更长更详细的回复
            stream: false,
          },
        },
        {
          timeout: 60000, // 60 second timeout
        }
      );

      console.log("[Deepseek] API request successful");
      updateStatus && updateStatus("deepseek", "received");

      if (
        !response.data ||
        !response.data.choices ||
        !response.data.choices[0]
      ) {
        console.error(
          "[Deepseek ERROR] Invalid response structure:",
          response.data
        );
        throw new Error("Invalid API response structure from Deepseek");
      }

      const aiResponse = response.data.choices[0].message.content;
      console.log("[Deepseek] API usage:", {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens,
      });

      // Format and log the raw response for debugging
      logFormattedAIResponse("Deepseek", aiResponse);

      // Check if response contains any content in the expected format
      const hasExpectedFormat =
        aiResponse.includes("【标题】") &&
        aiResponse.includes("【正文】") &&
        aiResponse.includes("【话题】");

      console.log(
        "[Deepseek] Response contains expected format sections:",
        hasExpectedFormat
      );

      if (!hasExpectedFormat) {
        console.warn(
          "[Deepseek WARNING] Response doesn't contain expected Chinese format sections"
        );
      }

      updateStatus && updateStatus("deepseek", "parsing");
      const result = parseEnhancedAIResponse(aiResponse, fileName);
      console.log("[Deepseek] Parsed result:", result);

      // After getting a successful response
      const cacheKey = `${fileName}-${documentText.substring(0, 100)}`;
      responseCache.set(cacheKey, result);
      updateStatus && updateStatus("deepseek", "processing");
      updateStatus && updateStatus("deepseek", "success");
      return result;
    } catch (apiError) {
      console.error("[Deepseek API ERROR]", apiError);
      if (apiError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(
          "[Deepseek API ERROR] Response status:",
          apiError.response.status
        );
        console.error(
          "[Deepseek API ERROR] Response headers:",
          apiError.response.headers
        );
        console.error(
          "[Deepseek API ERROR] Response data:",
          apiError.response.data
        );
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error(
          "[Deepseek API ERROR] No response received:",
          apiError.request
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(
          "[Deepseek API ERROR] Request setup error:",
          apiError.message
        );
      }
      throw apiError;
    }
  } catch (error) {
    console.error("[Deepseek ERROR] Overall analysis error:", error.message);
    return {
      success: false,
      error: error.message || "Unknown error during analysis",
      fileName: fileName,
      title: `Analysis of ${fileName} (Failed)`,
      content: "The analysis process encountered an error: " + error.message,
      hashtags: ["#Error", "#Analysis", "#TryAgain"],
      platforms: ["LinkedIn", "Twitter"],
      imagePrompt: "Error image with appropriate message",
    };
  }
};

// Enhanced parser for the new response format
const parseEnhancedAIResponse = (aiResponse, fileName) => {
  try {
    // Split the response into sections
    const titleMatch = aiResponse.match(/【标题】\s*([\s\S]*?)(?=【正文】|$)/);
    const contentMatch = aiResponse.match(
      /【正文】\s*([\s\S]*?)(?=【话题】|$)/
    );
    const hashtagsMatch = aiResponse.match(
      /【话题】\s*([\s\S]*?)(?=【推荐平台】|$)/
    );
    const platformsMatch = aiResponse.match(
      /【推荐平台】\s*([\s\S]*?)(?=【图片提示】|$)/
    );
    const imagePromptMatch = aiResponse.match(/【图片提示】\s*([\s\S]*?)(?=$)/);

    // Extract the content from each section
    const title =
      titleMatch && titleMatch[1]
        ? titleMatch[1].trim()
        : `${fileName}产品分析`;
    const content =
      contentMatch && contentMatch[1]
        ? contentMatch[1].trim()
        : `分析了${fileName}文档，但未能提取详细内容。请查看原始文档了解更多信息。`;

    // Extract hashtags - handle both space-separated and line-separated formats
    let hashtags = [];
    if (hashtagsMatch && hashtagsMatch[1]) {
      const hashtagText = hashtagsMatch[1].trim();
      // Try to extract hashtags with # symbol
      const hashtagsWithSymbol = hashtagText.match(/#[^\s#]+/g);
      if (hashtagsWithSymbol && hashtagsWithSymbol.length > 0) {
        hashtags = hashtagsWithSymbol.slice(0, 5); // Take up to 5 hashtags
      } else {
        // If no hashtags with # were found, try to extract words and add # symbol
        hashtags = hashtagText
          .split(/[\s\n]+/)
          .slice(0, 5)
          .map((tag) =>
            tag.startsWith("#") ? tag : `#${tag.replace(/[,，]/g, "")}`
          );
      }
    }

    // Ensure we have at least 3 hashtags
    if (hashtags.length < 3) {
      const defaultTags = [
        "#产品特点",
        "#时尚穿搭",
        "#设计灵感",
        "#新品上市",
        "#时尚趋势",
      ];
      hashtags = [...hashtags, ...defaultTags].slice(0, 5);
    }

    // Extract platforms and their reasons
    let platforms = [];
    if (platformsMatch && platformsMatch[1]) {
      const platformText = platformsMatch[1].trim();
      // Split by new lines and extract platform names
      const platformLines = platformText
        .split("\n")
        .filter((line) => line.trim() !== "");
      platforms = platformLines
        .map((line) => {
          const parts = line.split("：");
          if (parts.length > 0) {
            return parts[0].replace(/[0-9.、]/g, "").trim();
          }
          return line.trim();
        })
        .filter((p) => p !== "")
        .slice(0, 3);
    }

    // Ensure we have at least 3 platforms
    if (platforms.length < 3) {
      const defaultPlatforms = ["小红书", "微博", "抖音", "知乎", "微信"];
      platforms = [...platforms, ...defaultPlatforms].slice(0, 3);
    }

    // Extract image prompt
    const imagePrompt =
      imagePromptMatch && imagePromptMatch[1]
        ? imagePromptMatch[1].trim()
        : `高质量时尚产品图片，展示${fileName}中的服装设计，清晰细节，专业布光，模特展示，时尚杂志风格`;

    return {
      fileName,
      title,
      content,
      hashtags,
      platforms,
      imagePrompt,
    };
  } catch (error) {
    console.error("解析AI响应时出错:", error);
    // Return fallback data if parsing fails
    return {
      fileName,
      title: `${fileName}产品分析`,
      content: `这是关于${fileName}的产品分析。该文档包含了重要的产品信息和特点。`,
      hashtags: [
        "#产品特点",
        "#时尚穿搭",
        "#设计灵感",
        "#新品上市",
        "#时尚趋势",
      ],
      platforms: ["小红书", "微博", "抖音"],
      imagePrompt: `高质量时尚产品图片，展示${fileName}中的服装设计，清晰细节，专业布光，模特展示，时尚杂志风格`,
    };
  }
};

// Update the test function to be more robust
export const testSimulatedEndpoint = async () => {
  try {
    // Try to get the port
    let port;
    try {
      port = await getServerPort();
    } catch (e) {
      console.log("Could not get server port. Server may not be running.");
      throw new Error(
        "Server connection failed. Please ensure the server is running."
      );
    }

    console.log("Testing simulated endpoint on port:", port);

    // Create a simple test file
    const blob = new Blob(["test content"], { type: "application/pdf" });
    const testFile = new File([blob], "Test_Document.pdf", {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("file", testFile);

    // Try multiple ports if the first one fails
    let response;
    let error;

    for (const testPort of [port, 5000, 5001, 3000, 8080]) {
      try {
        console.log(`Trying port ${testPort}...`);
        response = await axios.post(
          `http://localhost:${testPort}/api/extract-pdf-text-external`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 5000, // Add a timeout
          }
        );
        console.log(`Success on port ${testPort}`);
        break; // Exit the loop if successful
      } catch (err) {
        console.log(`Failed on port ${testPort}:`, err.message);
        error = err;
      }
    }

    if (!response) {
      throw new Error(
        "All port attempts failed: " + (error ? error.message : "Unknown error")
      );
    }

    console.log("Simulated endpoint test response:", response.data);
    return response.data.text;
  } catch (error) {
    console.error("Test simulated endpoint failed:", error);
    return {
      success: false,
      error:
        "All port attempts failed: " +
        (error ? error.message : "Unknown error"),
    };
  }
};

// Update the testDeepseekAPI function to try different auth methods
export const testDeepseekAPI = async () => {
  try {
    console.log("Testing Deepseek API directly...");
    console.log("API Key:", API_KEY ? "Available" : "Not available");

    // Try different authentication methods
    const authMethods = [
      { name: "Bearer token", header: `Bearer ${API_KEY}` },
      { name: "API key only", header: API_KEY },
      {
        name: "X-API-Key header",
        headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      },
    ];

    let success = false;
    let lastError = null;

    for (const method of authMethods) {
      try {
        console.log(`Trying auth method: ${method.name}`);

        const headers = method.headers || {
          "Content-Type": "application/json",
          Authorization: method.header,
        };

        const response = await axios.post(
          API_ENDPOINT,
          {
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant.",
              },
              {
                role: "user",
                content:
                  "Hello, can you generate a short social media post about technology?",
              },
            ],
            temperature: 0.7,
            max_tokens: 100,
          },
          { headers }
        );

        console.log(`Auth method ${method.name} succeeded!`);
        console.log("API Test Response:", response.data);
        success = true;
        return `API test successful with ${method.name}! Check console for details.`;
      } catch (error) {
        console.error(`Auth method ${method.name} failed:`, error.message);
        lastError = error;
      }
    }

    throw lastError || new Error("All authentication methods failed");
  } catch (error) {
    console.error("API Test Error:", error);
    return `API test failed: ${error.message}`;
  }
};

// Try different model names
const models = [
  "deepseek-chat",
  "deepseek-llm",
  "deepseek-coder",
  "deepseek-v1",
  "chat",
];

// In your testDeepseekAPI function, add:
for (const model of models) {
  try {
    console.log(`Trying model: ${model}`);
    // ... rest of your code with model as the model name
  } catch (error) {
    console.error(`Model ${model} failed:`, error.message);
  }
}

// Add this note to your code
// Note: Check Deepseek's latest API documentation at:
// https://docs.deepseek.com/api-reference/
// or
// https://platform.deepseek.com/docs

// Example for OpenAI
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export const testOpenAIAPI = async () => {
  try {
    // Get the server port
    let port;
    try {
      port = await getServerPort();
    } catch (e) {
      console.error("Failed to get server port:", e.message);
      throw new Error(
        "Cannot connect to server. Please check if the server is running."
      );
    }

    console.log("Testing OpenAI API...");

    const response = await axios.post(
      `http://localhost:${port}/api/test-openai`,
      {
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      }
    );

    console.log("OpenAI API Test Response:", response.data);
    return "API test successful! Check console for details.";
  } catch (error) {
    console.error("Test OpenAI API failed:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
};

// Update the proxy test function
export const testDeepseekAPIViaProxy = async () => {
  try {
    console.log("Testing Deepseek API via proxy...");

    let port;
    try {
      port = await getServerPort();
    } catch (e) {
      console.error("Failed to get server port:", e.message);
      throw new Error(
        "Cannot connect to server. Please check if the server is running."
      );
    }

    console.log("Using port for proxy test:", port);

    // Add a simple test first to check if the server is reachable
    try {
      const serverTest = await axios.get(`http://localhost:${port}/api/test`, {
        timeout: 5000,
      });
      console.log("Server test response:", serverTest.data);
    } catch (serverError) {
      console.error("Server test failed:", serverError.message);
      return `Server connection failed: ${serverError.message}. Make sure your server is running.`;
    }

    // Now try the proxy
    const response = await axios.post(
      `http://localhost:${port}/api/proxy-ai`,
      {
        endpoint: API_ENDPOINT,
        apiKey: API_KEY,
        data: {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Hello!" },
          ],
          stream: false,
        },
      },
      {
        timeout: 15000, // Increase timeout
      }
    );

    console.log("Proxy API Test Response:", response.data);
    return "API test via proxy successful! Check console for details.";
  } catch (error) {
    console.error("Deepseek proxy test error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
};

// In your API functions
const now = Date.now();
if (now - apiCalls.lastReset > 3600000) {
  // 1 hour
  apiCalls.count = 0;
  apiCalls.lastReset = now;
}

if (apiCalls.count >= 50) {
  // Limit to 50 calls per hour
  throw new Error("API rate limit exceeded. Please try again later.");
}

apiCalls.count++;

// Enhance the mock response generator
export const generateMockResponse = (documentText, fileName) => {
  console.log("Generating enhanced mock response for:", fileName);

  // Extract a small portion of the document text for the mock content
  const textSample = documentText.substring(0, 500).trim();

  // Generate a more realistic title based on the filename
  const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const words = fileNameWithoutExtension
    .split(/[_\-\s.]+/)
    .filter((w) => w.length > 0);

  // Capitalize words for the title
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

  const title =
    capitalizedWords.length > 0
      ? `New Insights from ${capitalizedWords.join(" ")}`
      : `Key Takeaways from ${fileName}`;

  // Generate more realistic content
  const contentStart =
    textSample.length > 100 ? textSample.substring(0, 100).trim() : textSample;

  const content = `Just reviewed "${fileNameWithoutExtension}"! ${contentStart}... Check out the full document for more insights on this topic. #DocumentAnalysis`;

  // Generate realistic hashtags based on the filename and content
  const possibleHashtags = [
    "#Analysis",
    "#Insights",
    "#Research",
    "#Document",
    "#PDF",
    "#DataDriven",
    "#Information",
    "#Knowledge",
    "#Learning",
    "#Professional",
    "#Business",
    "#Innovation",
    "#Strategy",
  ];

  // Select 3 random hashtags from the list
  const shuffled = [...possibleHashtags].sort(() => 0.5 - Math.random());
  const hashtags = shuffled.slice(0, 3);

  // Add a hashtag based on the filename if possible
  if (words.length > 0 && words[0].length > 3) {
    hashtags[0] = `#${
      words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase()
    }`;
  }

  return {
    fileName: fileName,
    title: title,
    content: content,
    hashtags: hashtags,
    platforms: ["LinkedIn", "Twitter", "Facebook"],
    imagePrompt: `Professional business image related to ${fileNameWithoutExtension}, modern style, high quality`,
  };
};
