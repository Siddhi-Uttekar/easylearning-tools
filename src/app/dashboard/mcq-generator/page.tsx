"use client";
import { useState, ChangeEvent, FormEvent } from "react";

export default function MCQGenerator() {
  const [mcqText, setMcqText] = useState<string>("");
  const [filename, setFilename] = useState<string>("MCQs_Document");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();

    if (!mcqText.trim()) {
      setError("Please enter MCQ content");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/mcq-to-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mcqText, filename }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate document");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${filename}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      setSuccess("Document generated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMcqText("");
    setError("");
    setSuccess("");
  };

  const handleMcqTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMcqText(e.target.value);
  };

  const handleFilenameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            MCQ Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create formatted Word documents from your multiple-choice questions
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleGenerate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Input */}
                <div>
                  <div className="mb-6">
                    <label
                      htmlFor="filename"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Document Filename
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="filename"
                        value={filename}
                        onChange={handleFilenameChange}
                        className=" text-black flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter filename"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-black text-sm">
                        .docx
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="mcqText"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      MCQ Content
                    </label>
                    <textarea
                      id="mcqText"
                      value={mcqText}
                      onChange={handleMcqTextChange}
                      rows={15}
                      className="text-black w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder={`Enter MCQ content in the following format:

[Q] What is the capital of France?
[O] Paris
[O] London
[O] Berlin
[O] Madrid
[A] A
[S] Paris is the capital and most populous city of France.
[M] 1

[Q] Which planet is known as the Red Planet?
[O] Venus
[O] Mars
[O] Jupiter
[O] Saturn
[A] B
[S] Mars is often called the 'Red Planet' because it appears reddish in color.
[M] 1`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isLoading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Generating...
                        </span>
                      ) : (
                        "Generate Document"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Clear
                    </button>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                      <div className="flex">
                        <svg
                          className="h-5 w-5 text-red-400 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                      <div className="flex">
                        <svg
                          className="h-5 w-5 text-green-400 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{success}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Instructions */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Format Instructions
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Enter your multiple-choice questions using the following
                    format:
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                        1
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Question Format
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Use{" "}
                          <code className="bg-gray-200 px-1 rounded">[Q]</code>{" "}
                          followed by the question text
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                        2
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Options</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Use{" "}
                          <code className="bg-gray-200 px-1 rounded">[O]</code>{" "}
                          for each option
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                        3
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Correct Answer
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Use{" "}
                          <code className="bg-gray-200 px-1 rounded">[A]</code>{" "}
                          followed by the option letter (A, B, C, etc.)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                        4
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Solution</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Use{" "}
                          <code className="bg-gray-200 px-1 rounded">[S]</code>{" "}
                          for the solution explanation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                        5
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Marks</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Use{" "}
                          <code className="bg-gray-200 px-1 rounded">[M]</code>{" "}
                          for the marks value
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white rounded-md border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Example:</h3>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {`[Q] What is the capital of France?
[O] Paris
[O] London
[O] Berlin
[O] Madrid
[A] A
[S] Paris is the capital of France.
[M] 1`}
                    </pre>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                    <div className="flex">
                      <svg
                        className="h-5 w-5 text-yellow-400 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-yellow-700">
                        Separate each question with a blank line
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Generated documents will be formatted as tables with three columns:
            Label | Value | Status
          </p>
        </div>
      </div>
    </div>
  );
}
