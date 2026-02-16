"use client";
import { useState } from "react";
import axios from "axios";
import { UploadCloud, FileText, CheckCircle } from "lucide-react";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success">(
    "idle"
  );

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://localhost:8000/upload-resume", formData);
      setStatus("success");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
      setStatus("idle");
    }
  };

  return (
    <div className="bg-[#111] border border-white/10 p-8 rounded-2xl text-center">
      <div className="border-2 border-dashed border-white/10 rounded-xl p-8 mb-4 hover:border-blue-500/50 transition-colors cursor-pointer group">
        <input
          type="file"
          className="hidden"
          id="resume-upload"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <UploadCloud
            size={40}
            className="mx-auto mb-4 text-white/20 group-hover:text-blue-400 transition-colors"
          />
          <p className="text-sm text-gray-400">
            {file
              ? file.name
              : "Click to select or drag and drop your Resume (PDF)"}
          </p>
        </label>
      </div>

      {file && status !== "success" && (
        <button
          onClick={handleUpload}
          disabled={status === "uploading"}
          className="w-full bg-white text-black py-2 rounded-lg font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          {status === "uploading" ? "Processing..." : "Confirm Upload"}
        </button>
      )}

      {status === "success" && (
        <div className="text-green-400 flex items-center justify-center gap-2 text-sm font-bold animate-in zoom-in-95">
          <CheckCircle size={16} /> Resume Processed & Forged
        </div>
      )}
    </div>
  );
}
