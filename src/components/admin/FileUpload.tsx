"use client";

import { useRef, useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

interface Props {
  storagePath: string;
  accept?: string;
  label?: string;
  onUploaded: (url: string, path: string) => void;
}

export function FileUpload({
  storagePath,
  accept = "*/*",
  label = "Upload file",
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function upload(file: File) {
    setError(null);
    const path = `${storagePath}/${file.name}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snap) => {
        setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err) => {
        setError(err.message);
        setProgress(null);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setProgress(null);
        onUploaded(url, path);
      }
    );
  }

  function handleFile(files: FileList | null) {
    if (!files?.length) return;
    upload(files[0]);
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
        dragging
          ? "border-indigo-400 bg-indigo-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
      {progress !== null ? (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">Uploading… {progress}%</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          <span className="font-medium text-indigo-600">{label}</span> or drag
          and drop
        </p>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
