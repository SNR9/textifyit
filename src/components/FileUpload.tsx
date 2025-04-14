
import React, { useCallback, useState } from 'react';
import { FileImage, FileText, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ImagePaste from './ImagePaste';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  onImagePaste: (blob: Blob) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onImagePaste, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    validateAndProcessFiles(files);
  }, [onFileSelect]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change detected');
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      console.log('Files selected:', files.map(f => f.name));
      validateAndProcessFiles(files);
    } else {
      console.log('No files were selected');
    }
  }, [onFileSelect]);
  
  const validateAndProcessFiles = useCallback((files: File[]) => {
    console.log('Validating files:', files.length);
    const validFiles = files.filter(file => {
      const isValidType = 
        file.type.startsWith('image/') || 
        file.type === 'application/pdf';
      
      if (!isValidType) {
        toast.error(`Unsupported file type: ${file.name}`, {
          description: "Only images and PDFs are supported."
        });
        console.log('Invalid file type:', file.type, file.name);
      }
      
      return isValidType;
    });
    
    if (validFiles.length > 0) {
      console.log('Processing valid files:', validFiles.length);
      toast.info(`Processing ${validFiles.length} file(s)`, {
        description: "Starting file processing..."
      });
      onFileSelect(validFiles);
    }
  }, [onFileSelect]);
  
  return (
    <div className="space-y-4">
      <div
        className={`dropzone border-2 border-dashed rounded-lg p-4 ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center py-4">
          <div className="mb-4 rounded-full bg-theme-blue/10 p-3">
            <Upload className="h-8 w-8 text-theme-blue" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Upload Files</h3>
          <p className="mb-4 text-sm text-gray-500 text-center">
            Drag and drop your images or PDF files, or click to select
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full">
              <FileImage className="h-4 w-4 mr-1 text-theme-darkGray" />
              <span className="text-xs">JPG, PNG, GIF</span>
            </div>
            <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full">
              <FileText className="h-4 w-4 mr-1 text-theme-darkGray" />
              <span className="text-xs">PDF</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 items-center">
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <label htmlFor="file-upload">
              <Button 
                variant="outline" 
                className="w-full" 
                type="button" 
                disabled={isProcessing}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Select Files
              </Button>
            </label>
            
            <ImagePaste onImagePaste={onImagePaste} isProcessing={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
