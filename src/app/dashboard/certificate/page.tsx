"use client";
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CertificateData } from "@/types/certificates";
import { assignMedalType } from "@/utils/certificateUtils";
import Papa from "papaparse";
import { Upload, Download, Send, FileText, Users } from "lucide-react";

// Certificate Display Component
const CertificateDisplay = ({ data }: { data: CertificateData }) => {
  const { student, event } = data;

  const getMedalEmoji = () => {
    if (student.medalType === "gold") return "🥇";
    if (student.medalType === "silver") return "🥈";
    if (student.medalType === "bronze") return "🥉";
    return "⭐";
  };

  return (
    <div className="relative w-[1600px] h-[1131px] bg-white overflow-hidden">
      {/* Certificate border effects */}
      <div
        className="absolute inset-0 p-[14px] rounded-[22px]"
        style={{
          background: "#f8fbff",
        }}
      ></div>
      <div className="absolute inset-[18px] rounded-[16px] border-[3px] border-[rgba(11,130,182,0.12)]"></div>

      {/* Ribbon at the top */}
      <div
        className="absolute top-0 left-0 right-0 h-[120px] border-b border-[#dfeefe]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(14,165,233,0.18), rgba(255,255,255,0))",
        }}
      ></div>

      {/* Logo and brand name */}
      <div className="absolute top-[48px] left-0 right-0 flex items-center justify-center gap-4">
        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
          EL
        </div>
        <div className="flex flex-col items-start">
          <div className="text-[31px] font-bold text-blue-900 tracking-tight">
            EasyLearning
          </div>
          <div className="text-[15px] text-gray-500 -mt-1">
            Making Learning Easy
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="absolute left-[80px] right-[80px] top-[160px] bottom-[300px] flex flex-col items-center justify-center gap-[22px]">
        <div className="text-center">
          <h1 className="text-[67px] font-serif font-bold text-blue-900 mb-1">
            Certificate of Achievement
          </h1>
          <div className="text-lg font-bold tracking-[6px] uppercase text-blue-700">
            {event.name.toUpperCase()}
          </div>
        </div>

        <div className="text-center">
          <div className="text-gray-500 font-semibold tracking-[2px] uppercase mb-2">
            THIS IS PROUDLY AWARDED TO
          </div>
          <div className="text-[63px] font-bold">{student.name}</div>
        </div>

        {/* Medal badge */}
        <div
          className="flex items-center justify-center w-[200px] h-[200px] rounded-full text-[#4e3a0a] text-[51px] font-bold border-[6px] border-[#f5e6bd]"
          style={{
            background:
              "linear-gradient(135deg, #fff, #f3e9d0, #dfc074, #b78b2c)",
          }}
        >
          <div>
            {getMedalEmoji()}
            <small className="block text-[19px] tracking-[1px]">
              RANK {student.rank}
            </small>
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex gap-[26px] justify-center flex-wrap">
          <div className="px-4 py-2 rounded-full border border-[#e2ecf7] bg-[#f7fbff] font-semibold flex items-center gap-2">
            🏆 <span>Rank {student.rank}</span>
          </div>
          <div className="px-4 py-2 rounded-full border border-[#e2ecf7] bg-[#f7fbff] font-semibold flex items-center gap-2">
            📝 <span>{student.testsAttempted} Tests Attempted</span>
          </div>
          <div className="px-4 py-2 rounded-full border border-[#e2ecf7] bg-[#f7fbff] font-semibold flex items-center gap-2">
            📅 <span>{event.date.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute left-0 right-0 bottom-[25px] flex justify-center">
        <div className="bg-gray-100 rounded-lg px-8 py-4 text-gray-600 italic">
          EasyLearning Teachers Team
        </div>
      </div>
    </div>
  );
};

// CSV Upload Component for Bulk WhatsApp Sending
interface CSVRow {
  name: string;
  rank: string;
  testsAttempted: string;
  whatsappNumber: string;
  medalType?: "auto" | "gold" | "silver" | "bronze" | "participation";
  status?: "success" | "error";
  message?: string;
}

const BulkWhatsAppSender = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<CSVRow[]>([]);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Parsed CSV:", results.data);
        setCsvData(results.data as CSVRow[]);
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        alert("Error parsing CSV file. Please check the format.");
      },
    });
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        name: "Cristiano Ronaldo",
        rank: 1,
        testsAttempted: 15,
        whatsappNumber: "+911234567890",
        medalType: "auto",
      },
      {
        name: "Leo Messi",
        rank: 2,
        testsAttempted: 12,
        whatsappNumber: "911234567890",
        medalType: "auto",
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_certificates.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const processBulkCertificates = async () => {
    if (!csvData.length || !eventName) {
      alert("Please upload a CSV file and enter event name");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const totalStudents = csvData.length;
    const processedResults: CSVRow[] = [];

    for (let i = 0; i < totalStudents; i++) {
      const student = csvData[i];

      try {
        // Validate required fields
        if (!student.name || !student.whatsappNumber) {
          processedResults.push({
            ...student,
            status: "error",
            message: "Missing name or WhatsApp number",
          });
          continue;
        }

        // Create certificate data
        const medal =
          student.medalType === "auto"
            ? assignMedalType(parseInt(student.rank) || 999)
            : student.medalType || "participation";

        const certificateData: CertificateData = {
          student: {
            id: Math.random().toString(36).substring(7),
            name: student.name,
            rank: parseInt(student.rank) || 999,
            testsAttempted: parseInt(student.testsAttempted) || 1,
            medalType: medal as "gold" | "silver" | "bronze" | "participation",
          },
          event: {
            name: eventName,
            date: new Date(eventDate),
          },
        };

        // Generate certificate
        const response = await fetch("/api/generate-certificate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: certificateData,
            format: "pdf",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate certificate");
        }

        const blob = await response.blob();

        // Send via WhatsApp
        const formData = new FormData();
        formData.append("phoneNumber", student.whatsappNumber);
        formData.append("studentName", student.name);
        formData.append(
          "certificate",
          blob,
          `certificate-${student.name.replace(/\s+/g, "-").toLowerCase()}.pdf`
        );

        const whatsappResponse = await fetch("/api/send-whatsapp", {
          method: "POST",
          body: formData,
        });

        if (whatsappResponse.ok) {
          processedResults.push({
            ...student,
            status: "success",
            message: "Certificate sent successfully",
          });
        } else {
          processedResults.push({
            ...student,
            status: "error",
            message: "Failed to send WhatsApp message",
          });
        }
      } catch (error) {
        processedResults.push({
          ...student,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Update progress
      setProgress(((i + 1) / totalStudents) * 100);
      setResults([...processedResults]);

      // Add delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setIsProcessing(false);
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Bulk Certificate WhatsApp Sender
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bulkEventName">Event Name</Label>
            <Input
              id="bulkEventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulkEventDate">Event Date</Label>
            <Input
              id="bulkEventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* CSV Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Upload CSV File</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadSampleCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Sample
            </Button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-primary" />
              <div className="mt-4">
                <label htmlFor="csvFile" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium ">
                    {csvFile
                      ? csvFile.name
                      : "Choose CSV file or drag and drop"}
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              CSV should contain columns: name, rank, testsAttempted,
              whatsappNumber, medalType (optional)
            </AlertDescription>
          </Alert>
        </div>

        {/* CSV Preview */}
        {csvData.length > 0 && (
          <div className="space-y-2 ">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Preview ({csvData.length} students)
            </Label>
            <div className="max-h-60 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="dark:text-secondary">
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Rank</th>
                    <th className="px-3 py-2 text-left">Tests</th>
                    <th className="px-3 py-2 text-left">WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((student, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2">{student.name}</td>
                      <td className="px-3 py-2">{student.rank}</td>
                      <td className="px-3 py-2">{student.testsAttempted}</td>
                      <td className="px-3 py-2">{student.whatsappNumber}</td>
                    </tr>
                  ))}
                  {csvData.length > 5 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-2 text-center text-gray-500"
                      >
                        ... and {csvData.length - 5} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Process Button */}
        <Button
          onClick={processBulkCertificates}
          disabled={isProcessing || csvData.length === 0 || !eventName}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>Processing... ({Math.round(progress)}%)</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Certificates to WhatsApp
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">
              Processing {results.length} of {csvData.length} certificates...
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <Label>Results</Label>
            <div className="max-h-60 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="dark:text-secondary">
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2">{result.name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            result.status === "success"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        {result.status}
                      </td>
                      <td className="px-3 py-2">{result.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Component
export default function CertificateGenerator() {
  const [certificateData, setCertificateData] =
    useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [studentName, setStudentName] = useState("");
  const [rank, setRank] = useState<number>(1);
  const [testsAttempted, setTestsAttempted] = useState<number>(10);
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [medalType, setMedalType] = useState<
    "auto" | "gold" | "silver" | "bronze" | "participation"
  >("auto");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const medal =
      medalType === "auto"
        ? assignMedalType(rank)
        : (medalType as "gold" | "silver" | "bronze" | "participation");

    const data: CertificateData = {
      student: {
        id: Math.random().toString(36).substring(7),
        name: studentName,
        rank,
        testsAttempted,
        medalType: medal,
      },
      event: {
        name: eventName,
        date: new Date(date),
      },
    };

    setCertificateData(data);
  };

  const handleExport = async (format: "png" | "pdf") => {
    if (!certificateData) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: certificateData,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate certificate");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${certificateData.student.name
        .replace(/\s+/g, "-")
        .toLowerCase()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting certificate:", error);
      alert("Error exporting certificate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Certificate Generator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Certificate Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name</Label>
                    <Input
                      id="studentName"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter student name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rank">Rank</Label>
                    <Input
                      id="rank"
                      type="number"
                      min="1"
                      value={rank}
                      onChange={(e) => setRank(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testsAttempted">Tests Attempted</Label>
                    <Input
                      id="testsAttempted"
                      type="number"
                      min="1"
                      value={testsAttempted}
                      onChange={(e) =>
                        setTestsAttempted(parseInt(e.target.value) || 0)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name</Label>
                    <Input
                      id="eventName"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Enter event name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medalType">Medal Type</Label>
                    <Select
                      value={medalType}
                      onValueChange={(value: "auto" | "gold" | "silver" | "bronze" | "participation") => setMedalType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          Auto (based on rank)
                        </SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="participation">
                          Participation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Processing..." : "Preview Certificate"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExport("png")}
                    disabled={isLoading || !certificateData}
                  >
                    Export as PNG
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExport("pdf")}
                    disabled={isLoading || !certificateData}
                  >
                    Export as PDF
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div>
          {!certificateData ? (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">
                Enter certificate details to see preview
              </p>
            </div>
          ) : (
            <div className="relative overflow-auto max-h-[80vh] flex justify-center bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4">
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                  <div className="text-white text-lg">
                    Generating certificate...
                  </div>
                </div>
              )}
              <div
                style={{
                  transform: "scale(0.5)",
                  transformOrigin: "top center",
                }}
              >
                <CertificateDisplay data={certificateData} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk WhatsApp Sender Component */}
      <BulkWhatsAppSender />
    </div>
  );
}
