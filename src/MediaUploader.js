import React, { useState } from "react";
import {
  Upload,
  FileImage,
  FileVideo,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronDown
} from "lucide-react";

const MODEL_OPTIONS = [
  { label: "Version 1", value: "v1" },
  { label: "Version 2", value: "v2" }
];

const MediaUploader = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [model, setModel] = useState("v1");               

  const readFile = (f) => {
    const typeRoot = f.type.split("/")[0];
    if (typeRoot !== "image") {
      setStatus({ type: "error", message: "Please select an image file" });
      return;
    }
    setFileType(typeRoot);
    setFile(f);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setStatus({ type: "loading", message: "Analysing…" });

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch(
        `https://deepfake-detector-api-l4ru.onrender.com/api/predict?model=${model}`, // pass model
        { method: "POST", body }
      );
      if (!res.ok) throw new Error("Server error while analysing media");

      const data = await res.json();
      const msg = data.is_deepfake
        ? `⚠️ Deepfake detected – ${(data.confidence * 100).toFixed(1)} %`
        : `✅ Looks real – ${(data.confidence * 100).toFixed(1)} % confidence`;

      setStatus({ type: data.is_deepfake ? "error" : "success", message: msg });
    } catch (err) {
      setStatus({ type: "error", message: err.message ?? "Unexpected error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) readFile(e.dataTransfer.files[0]);
  };

  return (
    <section className="flex justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-8">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">
            Deepfake Detector
          </h1>
          <p className="text-sm text-slate-500">
            Upload an image and choose a model version
          </p>
        </header>

        {/* Model selector */}
        <div className="mb-6 relative">
          <label
            htmlFor="model"
            className="block mb-1 text-sm font-medium text-slate-700"
          >
            Model&nbsp;version
          </label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-10 text-sm text-slate-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3 top-9 pointer-events-none text-slate-500"
          />
        </div>

        {/* Upload card */}
        <form onSubmit={handleSubmit}>
          <div
            className={`border-2 border-dashed rounded-xl p-6 mb-6 min-h-56 flex flex-col items-center justify-center transition-colors
            ${dragActive ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400"}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {!preview ? (
              <>
                <Upload size={48} className="text-slate-400 mb-4" />
                <p className="text-slate-600 mb-2 text-center">
                  Drag & drop image here <br /> or click to browse
                </p>
                <p className="text-xs text-slate-400">JPEG / PNG</p>
              </>
            ) : (
              <>
                {fileType === "image" ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="max-h-60 object-contain rounded mb-4"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    className="max-h-60 rounded mb-4"
                  />
                )}
                <p className="text-slate-600 text-sm">
                  {file?.name}{" "}
                  <span className="text-slate-400">
                    ({(file.size / 1048576).toFixed(2)} MB)
                  </span>
                </p>
              </>
            )}

            <input
              id="file"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
              className="hidden"
            />
            <label
              htmlFor="file"
              className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg
                         bg-blue-600 text-white text-sm font-medium cursor-pointer
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {preview ? "Choose a different file" : "Select file"}
            </label>
          </div>

          {/* Submit button */}
          {preview && (
            <button
              type="submit"
              disabled={uploading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg
                        bg-blue-600 text-white font-medium hover:bg-blue-700
                        disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {fileType === "image" ? (
                <FileImage size={18} />
              ) : (
                <FileVideo size={18} />
              )}
              Analyse with {model.toUpperCase()}
            </button>
          )}
        </form>

        {/* Status banner */}
        {status && (
          <div
            className={`mt-6 p-4 rounded-lg text-sm flex items-center gap-2 flex justify-center
            ${
              status.type === "error"
                ? "bg-red-50 text-red-700"
                : status.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {status.type === "error" ? (
              <AlertCircle size={18} />
            ) : status.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <Loader size={18} className="animate-spin" />
            )}
            {status.message}
          </div>
        )}
      </div>
    </section>
  );
};

export default MediaUploader;
