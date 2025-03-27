import React, { useState, useEffect } from "react";
import "./DocumentUploader.css";
import {
  extractTextFromPDF,
  analyzeDocumentContent,
  testSimulatedEndpoint,
  testDeepseekAPI,
  testDeepseekAPIViaProxy,
  getServerPort,
  testOpenAIAPI,
} from "../services/aiService";
import axios from "axios";

function DocumentUploader() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [analyzedContent, setAnalyzedContent] = useState([]);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState({
    maxContentLength: 280,
    platforms: ["LinkedIn", "Twitter", "Facebook", "Instagram"],
    selectedPlatforms: ["LinkedIn", "Twitter"],
    toneOptions: ["Professional", "Casual", "Enthusiastic", "Informative"],
    selectedTone: "Professional",
  });
  const [apiStatus, setApiStatus] = useState({
    available: false,
    lastChecked: null,
    message: "API status unknown",
  });
  const [aiServiceStatus, setAiServiceStatus] = useState("Unknown");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isMockMode, setIsMockMode] = useState(
    localStorage.getItem("useMockData") === "true"
  );
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [testResults, setTestResults] = useState({
    deepseek: { status: "idle", message: "" },
    openai: { status: "idle", message: "" },
    proxy: { status: "idle", message: "" },
  });
  const [serverPort, setServerPort] = useState(64970);
  const [serverStarted, setServerStarted] = useState(false);

  useEffect(() => {
    // Clear mock mode flag if it exists
    const mockFlag = localStorage.getItem("useMockData");
    if (mockFlag === "true") {
      console.log("Mock mode flag found in localStorage, removing it...");
      localStorage.removeItem("useMockData");
      setIsMockMode(false);
      setAiServiceStatus("Unknown");
      setUploadStatus(
        "Mock mode disabled. Using real AI services for document analysis."
      );
    }

    // Auto-check server status on mount
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:${serverPort}/api/status`
        );
        if (response.ok) {
          const data = await response.json();
          setServerStarted(true);

          // Handle different possible response structures
          const deepseekAvailable =
            data.deepseek ||
            (data.apis && data.apis.deepseek && data.apis.deepseek.available) ||
            false;
          const openaiAvailable =
            data.openai ||
            (data.apis && data.apis.openai && data.apis.openai.available) ||
            false;

          setTestResults((prev) => ({
            ...prev,
            proxy: {
              status: "connected",
              message: `Server running on port ${serverPort}`,
            },
            deepseek: {
              status: deepseekAvailable ? "success" : "failed",
              message: deepseekAvailable ? "Connected" : "Not connected",
            },
            openai: {
              status: openaiAvailable ? "success" : "failed",
              message: openaiAvailable ? "Connected" : "Not connected",
            },
          }));

          setAiServiceStatus(
            openaiAvailable
              ? "OpenAI"
              : deepseekAvailable
              ? "DeepSeek"
              : "Unknown"
          );
        }
      } catch (error) {
        console.log("Auto-check server status failed:", error.message);
        // Silent fail is ok here - server status will be shown as not connected
      }
    };

    checkStatus();
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => file.type === "application/pdf");

    if (validFiles.length !== files.length) {
      setUploadStatus("Only PDF files are accepted. Some files were ignored.");
    } else if (validFiles.length === 0) {
      setUploadStatus("Please select at least one PDF file.");
    } else {
      setUploadStatus("");
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus("Please select at least one file first.");
      return;
    }

    setIsUploading(true);
    setIsAnalyzing(false);
    setUploadStatus("Processing files...");
    setProgress(0);
    console.log("Starting upload process with files:", selectedFiles);

    // Clear previous results
    setAnalyzedContent([]);

    try {
      // Process files one by one
      const results = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const currentProgress = Math.round((i / selectedFiles.length) * 100);
        setProgress(currentProgress);
        console.log(
          `Processing file ${i + 1}/${selectedFiles.length}: ${file.name}`
        );

        // Step 1: Extract text from PDF
        setUploadStatus(`Extracting text from ${file.name}...`);
        console.log(`Starting extraction for ${file.name}`);

        let extractedText;
        try {
          extractedText = await extractTextFromPDF(file);
          console.log(
            `Extraction successful for ${file.name}, text length: ${extractedText.length}`
          );
        } catch (extractionError) {
          console.error(`Extraction failed for ${file.name}:`, extractionError);
          setUploadStatus(
            `Extraction failed for ${file.name}: ${extractionError.message}. Using fallback text.`
          );
          // Use fallback text
          extractedText = `Fallback text for ${file.name}. This is used because the extraction process failed.`;
        }

        // Step 2: Analyze content with AI
        setUploadStatus(`Analyzing content of ${file.name}...`);
        console.log(`Starting AI analysis for ${file.name}`);

        try {
          // Use the current status of whether mock mode is enabled
          if (isMockMode) {
            setAiServiceStatus("Mock Generator");
          } else {
            setAiServiceStatus("Connecting...");
          }

          const analysisResult = await analyzeDocumentContent(
            extractedText,
            file.name,
            (service, status) => {
              console.log(`AI service status update: ${service} - ${status}`);
              if (service === "openai" && status === "success") {
                setAiServiceStatus("OpenAI");
              } else if (service === "deepseek" && status === "success") {
                setAiServiceStatus("DeepSeek");
              } else if (service === "mock") {
                setAiServiceStatus("Mock Generator");
              }
            }
          );

          console.log(
            `AI analysis successful for ${file.name}`,
            analysisResult
          );

          // Ensure the result has all required properties with proper types
          const validatedResult = {
            fileName: file.name,
            title: analysisResult.title || `Analysis of ${file.name}`,
            content: analysisResult.content || "No content was generated.",
            hashtags: Array.isArray(analysisResult.hashtags)
              ? analysisResult.hashtags
              : [],
            platforms: Array.isArray(analysisResult.platforms)
              ? analysisResult.platforms
              : ["LinkedIn", "Twitter"],
            imagePrompt:
              analysisResult.imagePrompt ||
              `Professional image related to ${file.name}`,
          };

          results.push(validatedResult);
          console.log(`Results array now has ${results.length} items`);
        } catch (analysisError) {
          setAiServiceStatus("Error");
          console.error(`AI analysis failed for ${file.name}:`, analysisError);
          setUploadStatus(
            `AI analysis failed for ${file.name}: ${analysisError.message}. Using fallback content.`
          );

          // Create fallback result
          const fallbackResult = {
            fileName: file.name,
            title: `Analysis of ${file.name}`,
            content:
              "This is fallback content generated because the AI analysis failed.",
            hashtags: ["#Fallback", "#Analysis", "#Document"],
            platforms: ["LinkedIn", "Twitter"],
            imagePrompt: `Professional image related to document analysis`,
          };

          results.push(fallbackResult);
          console.log(
            `Added fallback result. Results array now has ${results.length} items`
          );
        }

        // Update progress
        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      // All files processed
      console.log(
        `Processing complete. Results array has ${results.length} items:`,
        results
      );

      if (results.length > 0) {
        console.log("Setting analyzed content with results:", results);
        setAnalyzedContent(results);
        setUploadStatus("Analysis complete!");
      } else {
        console.log("No results were generated");

        // Create a default result if none were generated
        const defaultResult = {
          fileName: selectedFiles[0].name,
          title: "Default Analysis Result",
          content:
            "This is a default result generated because no analysis results were produced.",
          hashtags: ["#Default", "#Analysis", "#Document"],
          platforms: ["LinkedIn", "Twitter"],
          imagePrompt: "Professional image related to document analysis",
        };

        setAnalyzedContent([defaultResult]);
        setUploadStatus("Analysis completed with default results.");
      }

      setIsUploading(false);
      setIsAnalyzing(false);
      setProgress(100);
    } catch (error) {
      console.error("Error processing files:", error);
      setUploadStatus(`Process failed: ${error.message}. Please try again.`);
      setIsUploading(false);
      setIsAnalyzing(false);

      // Create an error result
      const errorResult = {
        fileName: "Error Result",
        title: "Error During Analysis",
        content: `An error occurred: ${error.message}. Please try again or contact support.`,
        hashtags: ["#Error", "#TryAgain"],
        platforms: ["LinkedIn"],
        imagePrompt: "Error message with helpful support information",
      };

      setAnalyzedContent([errorResult]);
    }
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setAnalyzedContent([]);
    setUploadStatus("");
    setProgress(0);
    document.getElementById("file-input").value = "";
  };

  const testAnalyzedContent = () => {
    const testResult = {
      fileName: "Test_Document.pdf",
      title: "Test Title: Important Insights",
      content:
        "This is a test content for social media post. It should appear in the results section.",
      hashtags: ["#Test", "#Demo", "#AI"],
      platforms: ["LinkedIn", "Twitter"],
      imagePrompt: "A professional image showing test results and analytics",
    };

    console.log("Setting test result:", testResult);
    setAnalyzedContent([testResult]);
    setUploadStatus("Test analysis complete!");
  };

  const runEndpointTest = async () => {
    try {
      setUploadStatus("Testing simulated endpoint...");
      const text = await testSimulatedEndpoint();
      setUploadStatus(
        `Endpoint test successful! Received ${text.length} characters`
      );
      console.log("Endpoint test text:", text);
    } catch (error) {
      setUploadStatus(`Endpoint test failed: ${error.message}`);
    }
  };

  const generateImage = async (prompt) => {
    // This would connect to an image generation API
    // For now, you could use a placeholder image service
    setUploadStatus(`Generating image for: ${prompt.substring(0, 30)}...`);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Return a placeholder image URL
    return `https://via.placeholder.com/500x300?text=${encodeURIComponent(
      prompt.substring(0, 20)
    )}`;
  };

  const runAPITest = async () => {
    setTestResults((prev) => ({
      ...prev,
      deepseek: {
        status: "testing",
        message: "Testing...",
        timestamp: new Date(),
      },
    }));

    try {
      const result = await testDeepseekAPI();
      setTestResults((prev) => ({
        ...prev,
        deepseek: {
          status:
            typeof result === "string" && result.includes("successful")
              ? "success"
              : "error",
          message: typeof result === "string" ? result : JSON.stringify(result),
          timestamp: new Date(),
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        deepseek: {
          status: "error",
          message: `Test error: ${error.message}`,
          timestamp: new Date(),
        },
      }));
    }
  };

  const runProxyAPITest = async () => {
    setTestResults((prev) => ({
      ...prev,
      proxy: {
        status: "testing",
        message: "Testing...",
        timestamp: new Date(),
      },
    }));

    try {
      const result = await testDeepseekAPIViaProxy();
      setTestResults((prev) => ({
        ...prev,
        proxy: {
          status:
            typeof result === "string" && result.includes("successful")
              ? "success"
              : "error",
          message: typeof result === "string" ? result : JSON.stringify(result),
          timestamp: new Date(),
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        proxy: {
          status: "error",
          message: `Test error: ${error.message}`,
          timestamp: new Date(),
        },
      }));
    }
  };

  const runOpenAITest = async () => {
    setTestResults((prev) => ({
      ...prev,
      openai: {
        status: "testing",
        message: "Testing...",
        timestamp: new Date(),
      },
    }));

    try {
      const result = await testOpenAIAPI();
      setTestResults((prev) => ({
        ...prev,
        openai: {
          status:
            typeof result === "string" && result.includes("successful")
              ? "success"
              : "error",
          message: typeof result === "string" ? result : JSON.stringify(result),
          timestamp: new Date(),
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        openai: {
          status: "error",
          message: `Test error: ${error.message}`,
          timestamp: new Date(),
        },
      }));
    }
  };

  const checkAPIStatus = async () => {
    try {
      // First check if the server is running
      const port = await getServerPort();
      console.log("Using port for status check:", port);

      try {
        // Try to get the server status
        const statusResponse = await axios.get(
          `http://localhost:${port}/api/status`,
          { timeout: 5000 }
        );
        console.log("Server status:", statusResponse.data);

        // Now check the API
        const result = await testDeepseekAPIViaProxy();
        const isAvailable =
          typeof result === "string" && result.includes("successful");

        setApiStatus({
          available: isAvailable,
          lastChecked: new Date(),
          message: isAvailable
            ? "API is available and responding correctly"
            : `API test failed: ${
                typeof result === "string" ? result : JSON.stringify(result)
              }`,
        });
      } catch (serverError) {
        console.error("Server status check failed:", serverError);
        setApiStatus({
          available: false,
          lastChecked: new Date(),
          message: `Server connection failed: ${serverError.message}. Make sure your server is running.`,
        });
      }
    } catch (error) {
      console.error("API status check failed:", error);
      setApiStatus({
        available: false,
        lastChecked: new Date(),
        message: `Status check failed: ${error.message}`,
      });
    }
  };

  const checkServerStatus = async () => {
    try {
      setTestResults((prev) => ({
        ...prev,
        proxy: { status: "connecting", message: "Checking server status..." },
      }));

      const response = await fetch(`http://localhost:${serverPort}/api/status`);
      const data = await response.json();

      // Handle different possible response structures
      const deepseekAvailable =
        data.deepseek ||
        (data.apis && data.apis.deepseek && data.apis.deepseek.available) ||
        false;
      const openaiAvailable =
        data.openai ||
        (data.apis && data.apis.openai && data.apis.openai.available) ||
        false;

      setTestResults((prev) => ({
        ...prev,
        proxy: {
          status: "connected",
          message: `Server running on port ${serverPort}`,
        },
        deepseek: {
          status: deepseekAvailable ? "success" : "failed",
          message: deepseekAvailable ? "Connected" : "Not connected",
        },
        openai: {
          status: openaiAvailable ? "success" : "failed",
          message: openaiAvailable ? "Connected" : "Not connected",
        },
      }));

      setServerStarted(true);
      setAiServiceStatus(
        openaiAvailable ? "OpenAI" : deepseekAvailable ? "DeepSeek" : "Unknown"
      );
    } catch (error) {
      console.error("Error checking server status:", error);
      setServerStarted(false);
      setTestResults((prev) => ({
        ...prev,
        proxy: {
          status: "failed",
          message: `Failed to connect to server on port ${serverPort}`,
        },
      }));
    }
  };

  const startServer = async () => {
    try {
      setTestResults((prev) => ({
        ...prev,
        proxy: { status: "loading", message: "Starting server..." },
      }));

      const response = await fetch(`http://localhost:${serverPort}/api/start`);
      const data = await response.json();

      if (data.success) {
        setServerStarted(true);
        setTestResults((prev) => ({
          ...prev,
          proxy: {
            status: "success",
            message: `Server started on port ${serverPort}`,
          },
        }));
      } else {
        setServerStarted(false);
        setTestResults((prev) => ({
          ...prev,
          proxy: {
            status: "error",
            message: data.message || "Failed to start server",
          },
        }));
      }
    } catch (error) {
      console.error("Error starting server:", error);
      setServerStarted(false);
      setTestResults((prev) => ({
        ...prev,
        proxy: {
          status: "error",
          message: `Failed to start server on port ${serverPort}`,
        },
      }));
    }
  };

  const checkPort64970 = async () => {
    try {
      setTestResults((prev) => ({
        ...prev,
        proxy: { status: "connecting", message: "Checking port 64970..." },
      }));

      const response = await fetch("http://localhost:64970/api/status");
      const data = await response.json();

      // Handle different possible response structures
      const deepseekAvailable =
        data.deepseek ||
        (data.apis && data.apis.deepseek && data.apis.deepseek.available) ||
        false;
      const openaiAvailable =
        data.openai ||
        (data.apis && data.apis.openai && data.apis.openai.available) ||
        false;

      setServerPort(64970);
      setServerStarted(true);
      setTestResults((prev) => ({
        ...prev,
        proxy: { status: "connected", message: "Connected to port 64970" },
        deepseek: {
          status: deepseekAvailable ? "success" : "failed",
          message: deepseekAvailable ? "Connected" : "Not connected",
        },
        openai: {
          status: openaiAvailable ? "success" : "failed",
          message: openaiAvailable ? "Connected" : "Not connected",
        },
      }));

      setAiServiceStatus(
        openaiAvailable ? "OpenAI" : deepseekAvailable ? "DeepSeek" : "Unknown"
      );
    } catch (error) {
      console.error("Error checking port 64970:", error);
      setTestResults((prev) => ({
        ...prev,
        proxy: { status: "failed", message: "Failed to connect to port 64970" },
      }));
    }
  };

  const testOpenAIDirectly = async () => {
    try {
      setUploadStatus("Testing OpenAI API directly...");

      // Get the API key from the environment
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

      if (!apiKey) {
        setUploadStatus("No OpenAI API key found in environment variables");
        return;
      }

      // Make a direct request to OpenAI
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Hello, write a short greeting." },
          ],
          max_tokens: 50,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (
        response.data &&
        response.data.choices &&
        response.data.choices.length > 0
      ) {
        const message = response.data.choices[0].message.content;
        setUploadStatus(
          `Direct OpenAI test successful! Response: "${message}"`
        );
      } else {
        setUploadStatus(
          "Direct OpenAI test returned an unexpected response format"
        );
      }
    } catch (error) {
      console.error("Direct OpenAI test error:", error);

      let errorMessage = error.message;
      if (error.response) {
        errorMessage += ` (Status: ${error.response.status})`;
        if (error.response.data && error.response.data.error) {
          errorMessage += ` - ${
            error.response.data.error.message ||
            JSON.stringify(error.response.data)
          }`;
        }
      }

      setUploadStatus(`Direct OpenAI test failed: ${errorMessage}`);
    }
  };

  const setManualPort = () => {
    const port = prompt("Enter the server port number:", "");
    if (port && !isNaN(parseInt(port))) {
      const portNumber = parseInt(port);
      setServerPort(portNumber);
      setUploadStatus(
        `Server port set to ${portNumber}. Checking connection...`
      );

      // Check connection on the entered port
      fetch(`http://localhost:${portNumber}/api/status`)
        .then((response) => response.json())
        .then((data) => {
          // Handle different possible response structures
          const deepseekAvailable =
            data.deepseek ||
            (data.apis && data.apis.deepseek && data.apis.deepseek.available) ||
            false;
          const openaiAvailable =
            data.openai ||
            (data.apis && data.apis.openai && data.apis.openai.available) ||
            false;

          setServerStarted(true);
          setTestResults((prev) => ({
            ...prev,
            proxy: {
              status: "connected",
              message: `Connected to port ${portNumber}`,
            },
            deepseek: {
              status: deepseekAvailable ? "success" : "failed",
              message: deepseekAvailable ? "Connected" : "Not connected",
            },
            openai: {
              status: openaiAvailable ? "success" : "failed",
              message: openaiAvailable ? "Connected" : "Not connected",
            },
          }));
          setAiServiceStatus(
            openaiAvailable
              ? "OpenAI"
              : deepseekAvailable
              ? "DeepSeek"
              : "Unknown"
          );
        })
        .catch((error) => {
          console.error(`Error connecting to port ${portNumber}:`, error);
          setTestResults((prev) => ({
            ...prev,
            proxy: {
              status: "failed",
              message: `Failed to connect to port ${portNumber}`,
            },
          }));
        });
    } else if (port !== null) {
      // Only show error if the user didn't cancel the prompt
      alert("Please enter a valid port number.");
    }
  };

  const toggleMockMode = () => {
    const newMockMode = !isMockMode;
    setIsMockMode(newMockMode);

    if (newMockMode) {
      localStorage.setItem("useMockData", "true");
      setUploadStatus(
        "Mock mode enabled. Using mock data for document analysis."
      );
      setAiServiceStatus("Mock Generator");
      setTestResults((prev) => ({
        ...prev,
        openai: { status: "idle", message: "Disabled in mock mode" },
        deepseek: { status: "idle", message: "Disabled in mock mode" },
      }));
    } else {
      localStorage.removeItem("useMockData");
      setUploadStatus(
        "Mock mode disabled. Using real AI services for document analysis."
      );
      setAiServiceStatus("Unknown");
      setTestResults((prev) => ({
        ...prev,
        openai: { status: "idle", message: "Ready for connection" },
        deepseek: { status: "idle", message: "Ready for connection" },
      }));
    }
  };

  const SettingsPanel = () => (
    <div className="settings-panel">
      <h3>Content Settings</h3>
      <div className="setting-group">
        <label>Max Content Length:</label>
        <input
          type="number"
          value={settings.maxContentLength}
          onChange={(e) =>
            setSettings({ ...settings, maxContentLength: e.target.value })
          }
        />
      </div>
      {/* Add more settings controls */}
    </div>
  );

  return (
    <div className="document-uploader">
      <h2>AI-Powered Document Analyzer</h2>
      <p className="uploader-description">
        Upload PDF documents to generate social media content with AI
      </p>

      <div className="status-bar">
        <div className="status-message">{uploadStatus}</div>
        <div className="server-status">
          <span className="status-label">Server:</span>
          <span
            className={`status-value ${
              serverStarted ? "connected" : "disconnected"
            }`}
          >
            {serverStarted ? `Connected (Port ${serverPort})` : "Not Connected"}
          </span>
        </div>
        <div className="ai-status">
          <span className="status-label">AI Service:</span>
          <span
            className={`status-value ${
              aiServiceStatus === "Unknown"
                ? "unknown"
                : aiServiceStatus === "Mock Generator"
                ? "mock"
                : "active"
            }`}
          >
            {aiServiceStatus}
          </span>
        </div>
      </div>

      <div className="upload-container">
        <div className="file-input-container">
          <input
            type="file"
            id="file-input"
            onChange={handleFileChange}
            accept=".pdf,.txt,.docx"
            multiple
            className="file-input"
          />
          <label htmlFor="file-input" className="file-input-label">
            <i className="icon-upload"></i> Choose PDF Files
          </label>

          <button
            onClick={uploadFiles}
            className="upload-button"
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? "Processing..." : "Process Files"}
          </button>
        </div>

        {isUploading && (
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
            <div className="progress-text">{progress}%</div>
          </div>
        )}

        <div className="file-list">
          {selectedFiles.length > 0 ? (
            <div>
              <div className="selected-files-header">
                <h3>Selected Files ({selectedFiles.length})</h3>
                <button onClick={clearAll} className="clear-button">
                  Clear All
                </button>
              </div>
              <ul className="file-items">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="file-item">
                    <div className="file-info">
                      <i className="icon-pdf"></i>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="remove-file-btn"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="no-files">No files selected</p>
          )}
        </div>

        {analyzedContent && analyzedContent.length > 0 ? (
          <div className="analysis-results">
            <h3>Generated Social Media Content</h3>
            {analyzedContent.map((result, index) => (
              <div key={index} className="result-card">
                <h4>Content for: {result.fileName}</h4>
                <div className="result-section">
                  <h5>Suggested Title</h5>
                  <p>{result.title}</p>
                </div>
                <div className="result-section">
                  <h5>Post Content</h5>
                  <p>{result.content}</p>
                </div>
                <div className="result-section">
                  <h5>Hashtags</h5>
                  <div className="platforms">
                    {Array.isArray(result.hashtags) ? (
                      result.hashtags.map((tag, i) => (
                        <span key={i} className="platform-tag">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="platform-tag">
                        No hashtags available
                      </span>
                    )}
                  </div>
                </div>
                <div className="result-section">
                  <h5>Recommended Platforms</h5>
                  <div className="platforms">
                    {Array.isArray(result.platforms) ? (
                      result.platforms.map((platform, i) => (
                        <span key={i} className="platform-tag">
                          {platform}
                        </span>
                      ))
                    ) : (
                      <span className="platform-tag">
                        No platforms available
                      </span>
                    )}
                  </div>
                </div>
                <div className="result-section">
                  <h5>Image Generation Prompt</h5>
                  <p className="image-prompt">{result.imagePrompt}</p>
                </div>
                <div className="button-group">
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${result.title}\n\n${result.content}\n\n${
                          Array.isArray(result.hashtags)
                            ? result.hashtags.join(" ")
                            : ""
                        }`
                      );
                      alert("Content copied to clipboard!");
                    }}
                  >
                    Copy Content
                  </button>
                  <button
                    className="download-btn"
                    onClick={() => {
                      const content = `
Title: ${result.title}
Content: ${result.content}
Hashtags: ${Array.isArray(result.hashtags) ? result.hashtags.join(" ") : "None"}
Platforms: ${
                        Array.isArray(result.platforms)
                          ? result.platforms.join(", ")
                          : "None"
                      }
Image Prompt: ${result.imagePrompt || "None"}
                      `;

                      const blob = new Blob([content], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `social-content-${
                        result.fileName.split(".")[0]
                      }.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download
                  </button>
                  <button
                    className="generate-image-btn"
                    onClick={() => generateImage(result.imagePrompt)}
                  >
                    Generate Image
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : uploadStatus.includes("complete") ? (
          <div>No content was generated. Please try again.</div>
        ) : null}

        <button
          onClick={testAnalyzedContent}
          style={{ marginTop: "10px", padding: "5px 10px" }}
        >
          Test Results Display
        </button>

        {showAdminPanel && (
          <div className="admin-panel">
            <h3>API Testing & Diagnostics</h3>
            <div className="button-group">
              <button onClick={runEndpointTest}>Test Server Connection</button>
              <button onClick={runAPITest}>Test Deepseek API</button>
              <button onClick={runProxyAPITest}>Test API via Proxy</button>
              <button onClick={runOpenAITest}>Test OpenAI API</button>
              <button onClick={checkAPIStatus}>Check API Status</button>
              <button onClick={testOpenAIDirectly}>Test OpenAI Directly</button>
            </div>

            <div
              className={`api-status ${
                apiStatus.available ? "available" : "unavailable"
              }`}
            >
              <h4>
                API Status: {apiStatus.available ? "Available" : "Unavailable"}
              </h4>
              <p>{apiStatus.message}</p>
              {apiStatus.lastChecked && (
                <p>
                  Last checked: {apiStatus.lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="test-results">
              <div className={`test-result ${testResults.deepseek.status}`}>
                <h4>Deepseek API: {testResults.deepseek.status}</h4>
                <p>{testResults.deepseek.message}</p>
                {testResults.deepseek.timestamp && (
                  <p>
                    Last tested:{" "}
                    {testResults.deepseek.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className={`test-result ${testResults.proxy.status}`}>
                <h4>API via Proxy: {testResults.proxy.status}</h4>
                <p>{testResults.proxy.message}</p>
                {testResults.proxy.timestamp && (
                  <p>
                    Last tested:{" "}
                    {testResults.proxy.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className={`test-result ${testResults.openai.status}`}>
                <h4>OpenAI API: {testResults.openai.status}</h4>
                <p>{testResults.openai.message}</p>
                {testResults.openai.timestamp && (
                  <p>
                    Last tested:{" "}
                    {testResults.openai.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowAdminPanel(!showAdminPanel)}
          className="admin-toggle"
        >
          {showAdminPanel ? "Hide Admin Panel" : "Show Admin Panel"}
        </button>

        {/* Collapsible Technical Tools Section */}
        <div className="collapsible-section">
          <button
            onClick={() => setIsToolsExpanded(!isToolsExpanded)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsToolsExpanded(!isToolsExpanded);
              }
            }}
            className="collapsible-button"
            aria-expanded={isToolsExpanded}
            aria-controls="technical-tools-section"
          >
            <span className="collapsible-icon">
              {isToolsExpanded ? "▾" : "▸"}
            </span>
            Technical Tools
            {isMockMode && (
              <span className="mock-mode-badge">Mock Mode Active</span>
            )}
          </button>

          <div
            id="technical-tools-section"
            className="collapsible-content"
            style={{ display: isToolsExpanded ? "block" : "none" }}
          >
            <div className="tools-grid">
              <div className="tool-category">
                <h4>Server Management</h4>
                <div className="button-group">
                  <button onClick={checkServerStatus}>
                    Check Server Status
                  </button>
                  <button onClick={startServer}>Start Server</button>
                  <button onClick={checkPort64970}>Check Port 64970</button>
                  <button onClick={setManualPort}>Set Port Manually</button>
                </div>
                <div className="status-indicators">
                  {Object.entries(testResults).map(([service, data]) => (
                    <div key={service} className="service-status">
                      <span className="service-name">{service}:</span>
                      <span className={`status-badge ${data.status}`}>
                        {data.status}
                      </span>
                      {data.message && (
                        <span className="status-message">{data.message}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="tool-category">
                <h4>Mode Settings</h4>
                <div className="button-group">
                  <button
                    onClick={toggleMockMode}
                    className={isMockMode ? "active-mock" : ""}
                  >
                    {isMockMode ? "Disable Mock Mode" : "Enable Mock Mode"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsPanel />

      <div className="server-tools">
        <p>
          Having trouble connecting to the server? Try the{" "}
          <a href="/find-server.html" target="_blank" rel="noopener noreferrer">
            Server Port Finder
          </a>
        </p>
      </div>
    </div>
  );
}

export default DocumentUploader;
