import type { ChangeEvent } from "react";
import "./FileUploader.css";

interface FileUploaderProps {
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onUpload: () => void;
  file: File | null;
  loading: boolean;
}

export default function FileUploader({
  onFileChange,
  onClear,
  onUpload,
  file,
  loading,
}: FileUploaderProps) {
  return (
    <div className="card">
      <input
        id="file-upload"
        type="file"
        onChange={onFileChange}
        className="hidden"
      />
      <label htmlFor="file-upload" className="upload-label">
        Choose File
      </label>
      <button onClick={onClear} disabled={!file}>
        Clear
      </button>
      <button
        onClick={onUpload}
        disabled={loading}
        aria-busy={loading}
        aria-label={loading ? "Processing prediction" : "Predict"}
      >
        {loading ? "Processing..." : "Predict"}
      </button>
    </div>
  );
}
