export default function MCQGeneratorPage() {
  return (
    <div className="m-4">
      <h1>MCQ Generator</h1>
      <pre className="font-mono">
        {`
Backend (API Route: /api/mcq-to-docx)
Purpose: Receives MCQ text, processes it, and generates a properly formatted Word document.

Key Steps:

Request Handling:
Accepts POST requests with JSON body
Expects: { mcqText: string, filename: string }
Validates input (checks for empty text)
Text Parsing:
Splits text into individual questions (separated by blank lines)
For each question:
Extracts question text (after [Q])
Extracts options (after [O])
Identifies correct answer (after [A])
Gets solution explanation (after [S])
Gets marks value (after [M])
DOCX Generation:
Uses JSZip library to create DOCX structure
Builds XML content with:
Table format for each question
Three columns: Label | Value | Status
Clean borders and formatting
Includes all required DOCX files:
word/document.xml (main content)
word/styles.xml (styling)
[Content_Types].xml (file type definitions)
Relationship files
Response:
Returns generated DOCX file as binary data
Sets appropriate headers:
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="generated_name.docx"
`}
      </pre>
    </div>
  );
}
