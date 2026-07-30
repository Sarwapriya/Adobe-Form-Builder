import { useRef, useState } from "react";
import { useBuilderStore } from "../../store/builderStore.ts";

export function UploadStep() {
  const loadWorkbook = useBuilderStore((s) => s.loadWorkbook);
  const loadError = useBuilderStore((s) => s.loadError);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) void loadWorkbook(file);
  }

  return (
    <div className="panel">
      <h2>Upload an Excel workbook</h2>
      <p>
        Upload a .xlsx or .xls file containing multilingual questions and answers (see the reference format
        in <code>Documents/</code>).
      </p>
      <div
        className={`dropzone${dragOver ? " dragover" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p>Drag &amp; drop an Excel file here, or click to browse.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {loadError && (
        <p className="issue-item error" style={{ marginTop: 16 }}>
          {loadError}
        </p>
      )}
    </div>
  );
}
