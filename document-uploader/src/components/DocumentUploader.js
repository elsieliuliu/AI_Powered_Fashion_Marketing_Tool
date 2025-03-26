import React, { useState } from "react";
import "./DocumentUploader.css";

function DocumentUploader() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [analyzedContent, setAnalyzedContent] = useState([]);

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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus("Please select at least one file first.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading files...");

    try {
      // Simulate file upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUploadStatus("Files uploaded successfully! Analyzing content...");
      setIsUploading(false);
      setIsAnalyzing(true);

      // Simulate AI analysis
      const results = await analyzeDocuments(selectedFiles);
      setAnalyzedContent(results);
      setUploadStatus("Analysis complete!");
      setIsAnalyzing(false);
    } catch (error) {
      setUploadStatus("Process failed. Please try again.");
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  // Simulate AI analysis of documents
  const analyzeDocuments = async (files) => {
    // In a real application, you would send the files to your AI API endpoint
    // This is a simulation of AI analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return files.map((file) => ({
      fileName: file.name,
      title: `Engaging Social Post about ${file.name.split(".")[0]}`,
      content: `Check out our latest insights on ${
        file.name.split(".")[0]
      }! This comprehensive guide covers everything you need to know about this topic. #ProfessionalDevelopment #Innovation`,
      platforms: ["Twitter", "LinkedIn", "Facebook"],
      imagePrompt: `Professional image related to ${file.name.split(".")[0]}`,
    }));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setAnalyzedContent([]);
    setUploadStatus("");
    document.getElementById("file-input").value = "";
  };

  return (
    <div className="document-uploader">
      <h2>AI-Powered Document Analyzer</h2>
      <p className="uploader-description">
        Upload PDF documents to generate social media content with AI
      </p>

      <div className="upload-container">
        <input
          type="file"
          id="file-input"
          accept=".pdf"
          onChange={handleFileChange}
          className="file-input"
          multiple
        />

        <label htmlFor="file-input" className="file-label">
          <i className="file-icon">📄</i> Choose PDF Files
        </label>

        {selectedFiles.length > 0 && (
          <div className="selected-files-container">
            <h3>Selected Files ({selectedFiles.length})</h3>
            <ul className="selected-files-list">
              {selectedFiles.map((file, index) => (
                <li key={index} className="selected-file-item">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="remove-file-btn"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="file-actions">
              <button
                onClick={clearAll}
                className="clear-btn"
                disabled={isUploading || isAnalyzing}
              >
                Clear All
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  selectedFiles.length === 0 || isUploading || isAnalyzing
                }
                className="upload-button"
              >
                {isUploading
                  ? "Uploading..."
                  : isAnalyzing
                  ? "Analyzing..."
                  : "Upload & Analyze"}
              </button>
            </div>
          </div>
        )}

        {uploadStatus && (
          <div
            className={`upload-status ${
              uploadStatus.includes("successfully") ||
              uploadStatus.includes("complete")
                ? "success"
                : uploadStatus.includes("failed")
                ? "error"
                : ""
            }`}
          >
            {uploadStatus}
            {(isUploading || isAnalyzing) && <div className="loader"></div>}
          </div>
        )}

        {analyzedContent.length > 0 && (
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
                  <h5>Recommended Platforms</h5>
                  <div className="platforms">
                    {result.platforms.map((platform, i) => (
                      <span key={i} className="platform-tag">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="result-section">
                  <h5>Image Generation Prompt</h5>
                  <p className="image-prompt">{result.imagePrompt}</p>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${result.title}\n\n${result.content}`
                    );
                    alert("Content copied to clipboard!");
                  }}
                >
                  Copy Content
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentUploader;
