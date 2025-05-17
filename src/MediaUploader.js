import React, { useState } from 'react';
import { Upload, FileImage, FileVideo, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const MediaUploader = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    
    // Check file type
    const type = selectedFile.type.split('/')[0];
    if (type !== 'image') {
      setStatus({ type: 'error', message: 'Please select an image file' });
      return;
    }
    
    setFileType(type);
    setFile(selectedFile);
    setStatus(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
  
    setUploading(true);
    setStatus({ type: "loading", message: "Processing your media with AI..." });
  
    try {
      const formData = new FormData();
      formData.append("file", file);
  
      const res = await fetch("https://deepfake-detector-api-l4ru.onrender.com/api/predict", {
        method: "POST",
        body: formData,
      });
  
      if (!res.ok) throw new Error("Server error while analysing media");
  
      const data = await res.json();
      const msg = data.is_deepfake
        ? `⚠️  Deepfake detected with ${(data.confidence * 100).toFixed(1)}% confidence`
        : `✅ Looks real – confidence ${(data.confidence * 100).toFixed(1)}%`;
  
      setStatus({
        type: data.is_deepfake ? "error" : "success",
        message: msg,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Unexpected error processing file",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">AI Deepfake Detector</h1>
      <p className="text-gray-600 mb-8">Upload your image for AI Deepfake Detection</p>
      
      <form onSubmit={handleSubmit} className="w-full">
        <div 
          className={`border-2 border-dashed rounded-lg p-6 mb-6 flex flex-col items-center justify-center min-h-64 transition-all
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'} 
            ${preview ? 'bg-gray-50' : 'bg-white'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!preview ? (
            <>
              <Upload size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2 text-center">
                Drag & drop your media here or click to browse
              </p>
              <p className="text-gray-400 text-sm text-center">
                Supports images (JPG, PNG) and videos (MP4, MOV)
              </p>
            </>
          ) : (
            <div className="w-full flex flex-col items-center">
              {fileType === 'image' ? (
                <img src={preview} alt="Preview" className="max-h-64 max-w-full rounded mb-4 object-contain" />
              ) : (
                <video 
                  src={preview} 
                  controls 
                  className="max-h-64 max-w-full rounded mb-4" 
                />
              )}
              <p className="text-gray-600 text-sm">
                {file?.name} ({(file?.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            </div>
          )}
          
          <input
            type="file"
            id="fileUpload"
            className="hidden"
            accept="image/*,video/*"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          
          <label 
            htmlFor="fileUpload" 
            className={`mt-4 cursor-pointer py-2 px-4 rounded font-medium 
              ${preview ? 'text-blue-500 border border-blue-500 bg-white hover:bg-blue-50' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            {preview ? 'Choose Different File' : 'Select File'}
          </label>
        </div>
        
        {preview && (
          <div className="flex justify-center mb-8">
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg flex items-center justify-center min-w-40 disabled:bg-blue-300"
            >
              {uploading ? (
                <>
                  <Loader className="animate-spin mr-2" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  {fileType === 'image' ? (
                    <FileImage size={18} className="mr-2" />
                  ) : (
                    <FileVideo size={18} className="mr-2" />
                  )}
                  Process with AI
                </>
              )}
            </button>
          </div>
        )}
      </form>
      
      {status && (
        <div className={`w-full p-4 rounded-lg mb-6 flex items-center
          ${status.type === 'error' ? 'bg-red-50 text-red-700' : 
            status.type === 'success' ? 'bg-green-50 text-green-700' : 
            'bg-blue-50 text-blue-700'}`}
        >
          {status.type === 'error' ? (
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          ) : status.type === 'success' ? (
            <CheckCircle size={20} className="mr-2 flex-shrink-0" />
          ) : (
            <Loader size={20} className="mr-2 animate-spin flex-shrink-0" />
          )}
          <p>{status.message}</p>
        </div>
      )}
      
      {/* {status?.type === 'success' && (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">AI Processing Results</h2>
          <div className="h-48 flex items-center justify-center border border-gray-200 rounded bg-white">
            <p className="text-gray-500">AI analysis results would appear here</p>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default MediaUploader;