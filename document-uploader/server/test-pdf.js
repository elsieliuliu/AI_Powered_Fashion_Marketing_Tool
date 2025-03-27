const fs = require("fs");
const pdfParse = require("pdf-parse");
const pdfjsLib = require("pdfjs-dist");

// Path to a test PDF file
const testPdfPath = "./test.pdf"; // Place a simple PDF in this location

// Test pdf-parse
async function testPdfParse() {
  try {
    console.log("Testing pdf-parse library...");
    const dataBuffer = fs.readFileSync(testPdfPath);
    const data = await pdfParse(dataBuffer);
    console.log("PDF-parse success! Text length:", data.text.length);
    console.log("First 100 chars:", data.text.substring(0, 100));
    return true;
  } catch (error) {
    console.error("PDF-parse failed:", error.message);
    return false;
  }
}

// Test pdfjs-dist
async function testPdfjsDist() {
  try {
    console.log("Testing pdfjs-dist library...");
    const dataBuffer = fs.readFileSync(testPdfPath);

    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(dataBuffer);

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;

    let fullText = "";
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    console.log("PDFJS success! Text length:", fullText.length);
    console.log("First 100 chars:", fullText.substring(0, 100));
    return true;
  } catch (error) {
    console.error("PDFJS failed:", error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log("PDF TEST SCRIPT");
  console.log("===============");

  if (!fs.existsSync(testPdfPath)) {
    console.error(`Test PDF not found at ${testPdfPath}`);
    console.log("Please place a test PDF file at this location");
    return;
  }

  const pdfParseResult = await testPdfParse();
  const pdfjsResult = await testPdfjsDist();

  console.log("\nTEST RESULTS:");
  console.log("pdf-parse:", pdfParseResult ? "SUCCESS" : "FAILED");
  console.log("pdfjs-dist:", pdfjsResult ? "SUCCESS" : "FAILED");
}

runTests();
