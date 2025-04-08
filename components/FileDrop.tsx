'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FileDrop({ onFileRead }: { onFileRead: (content: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.md')) {
      alert('Please upload a .md file only.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onFileRead(reader.result as string);
    reader.readAsText(file);
  };

  return (
    <Card
      className={`w-full transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle>Upload Markdown</CardTitle>
        <CardDescription>Drag & drop a `.md` file or click to select.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={() => inputRef.current?.click()}>Select File</Button>
        <input
          type="file"
          accept=".md"
          ref={inputRef}
          onChange={handleChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}