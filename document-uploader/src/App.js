import React from "react";
import "./App.css";
import DocumentUploader from "./components/DocumentUploader";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AI-Powered Document Analyzer</h1>
        <p className="header-subtitle">
          Upload PDFs and generate engaging social media content
        </p>
      </header>
      <main>
        <DocumentUploader />
      </main>
      <footer>
        <p>Powered by AI • Upload your PDF documents securely</p>
        <p className="disclaimer">
          This tool analyzes document content to suggest social media posts
        </p>
      </footer>
    </div>
  );
}

export default App;
