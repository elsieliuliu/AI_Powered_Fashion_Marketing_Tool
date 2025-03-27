# Fashion Document Analysis System

## Introduction 介绍

The Fashion Document Analysis System is a web application designed to streamline document management and analysis for fashion industry professionals. It features a user-friendly interface for document uploading, automatic content extraction, and intelligent analysis. The system consists of a React-based frontend and a Node.js backend that work together to process various document formats (particularly PDF files) and extract valuable insights.

时尚文档分析系统是一个专为时尚行业专业人士设计的网络应用，旨在简化文档管理和分析流程。它提供用户友好的界面，支持文档上传、自动内容提取和智能分析。该系统由基于 React 的前端和 Node.js 后端组成，它们协同工作，处理各种文档格式（特别是 PDF 文件）并提取有价值的见解。

## Project Structure 项目结构

The project is organized as follows:

- `document-uploader/`: Main application directory
  - `src/`: Frontend React code
  - `server/`: Backend Node.js server
  - `public/`: Static assets
  - `uploads/`: Temporary storage for uploaded files

## Features 功能

- Document upload and processing
- PDF content extraction and analysis
- Responsive design for desktop and mobile use
- Intelligent port configuration for seamless deployment
- Secure file handling

## Getting Started 入门指南

### Prerequisites 前提条件

Before you begin, ensure you have installed:

- Node.js (v16 or later)
- npm (v7 or later)

### Installation 安装

1. Clone the repository:

   ```bash
   git clone [repository URL]
   cd Fashion
   ```

2. Install dependencies for both client and server:

   ```bash
   # Main dependencies
   npm install

   # Frontend dependencies
   cd document-uploader
   npm install

   # Backend dependencies
   cd server
   npm install
   ```

### Configuration 配置

1. Create environment files by copying the examples:

   ```bash
   cd document-uploader
   cp .env.example .env

   cd server
   cp .env.example .env
   ```

2. Edit the `.env` files to configure your settings (API keys, ports, etc.)

### Running the Application 运行应用

#### Development Mode 开发模式

1. Start the backend server:

   ```bash
   cd document-uploader/server
   npm run start:dev
   ```

2. In a separate terminal, start the frontend:

   ```bash
   cd document-uploader
   npm start
   ```

3. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:64970 (default) or as configured in your .env file

#### All-in-One Startup 一键启动

You can also start both the client and server with a single command:

```bash
cd document-uploader
npm run start:all
```

### Port Configuration 端口配置

The server port is determined in the following order:

1. `SERVER_PORT` environment variable (highest priority)
2. `PORT` environment variable
3. Default port `64970`

You can also specify ports using npm scripts:

```bash
npm run start:default  # Uses port 64970
npm run start:3000     # Uses port 3000
npm run start:random   # Uses a random available port
```

## Troubleshooting 故障排除

If you encounter connection issues:

1. Check that both server and client are running
2. Verify the correct ports are being used
3. Look at the console output for error messages
4. Use the "Set Port Manually" button in the UI if needed

## Development 开发

For development, you can use:

```bash
# Server with auto-reload
cd document-uploader/server
npm run start:dev

# Client with hot reloading
cd document-uploader
npm start
```
