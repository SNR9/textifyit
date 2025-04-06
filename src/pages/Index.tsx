
import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import TextResult from '@/components/TextResult';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import ContactUs from '@/components/ContactUs';
import Logo from '@/components/Logo';
import { processFile, ExtractionResult } from '@/services/ocrService';
import { toast } from 'sonner';

const Index = () => {
  const [processing, setProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ExtractionResult[]>([]);
  
  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    
    setProcessing(true);
    setResults([]);
    const newResults: ExtractionResult[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);
        setProgress(0);
        
        toast.info(`Processing ${file.name}`, {
          description: 'Text extraction started.'
        });
        
        const result = await processFile(file, (progressValue) => {
          setProgress(progressValue);
        });
        
        newResults.push(result);
        
        toast.success(`Completed ${file.name}`, {
          description: 'Text extraction finished.'
        });
      }
      
      setResults(newResults);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Error processing files', {
        description: 'There was an error extracting text from one or more files.'
      });
    } finally {
      setProcessing(false);
      setCurrentFile('');
    }
  };
  
  const handleImagePaste = async (blob: Blob) => {
    setProcessing(true);
    setResults([]);
    setCurrentFile('Pasted Image');
    setProgress(0);
    
    try {
      toast.info('Processing pasted image', {
        description: 'Text extraction started.'
      });
      
      const result = await processFile(blob, (progressValue) => {
        setProgress(progressValue);
      }, 'Pasted Image');
      
      setResults([result]);
      
      toast.success('Completed processing', {
        description: 'Text extraction finished.'
      });
    } catch (error) {
      console.error('Error processing pasted image:', error);
      toast.error('Error processing pasted image', {
        description: 'There was an error extracting text from the pasted image.'
      });
    } finally {
      setProcessing(false);
      setCurrentFile('');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container px-4 mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col items-center">
          <Logo />
          <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-2">Image & PDF to Text Converter</h1>
          <p className="text-gray-600">
            Extract text from images and PDF files quickly and securely
          </p>
        </header>
        
        <div className="mb-8">
          <FileUpload 
            onFileSelect={handleFileSelect} 
            onImagePaste={handleImagePaste}
            isProcessing={processing} 
          />
        </div>
        
        {processing && (
          <div className="mb-8">
            <ProcessingIndicator 
              fileName={currentFile} 
              progress={progress} 
            />
          </div>
        )}
        
        {results.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="space-y-6">
              {results.map((result, index) => (
                <TextResult 
                  key={index} 
                  extractedText={result.text} 
                  fileName={result.fileName} 
                />
              ))}
            </div>
          </div>
        )}
        
        <ContactUs />
        
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>All processing happens locally in your browser. Your files never leave your device.</p>
          <p className="mt-2">Privacy and security guaranteed.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
