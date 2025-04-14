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
    
    console.log('File selection triggered with', files.length, 'files');
    setProcessing(true);
    setResults([]);
    const newResults: ExtractionResult[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);
        setProgress(0);
        
        console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
        toast.info(`Processing ${file.name}`, {
          description: 'Text extraction started.'
        });
        
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + 5;
            return newProgress > 90 ? 90 : newProgress;
          });
        }, 300);
        
        const result = await processFile(file, (progressValue) => {
          setProgress(progressValue);
        });
        
        clearInterval(progressInterval);
        setProgress(100);
        
        newResults.push(result);
        
        toast.success(`Completed ${file.name}`, {
          description: 'Text extraction finished.'
        });
      }
      
      setResults(newResults);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Error processing files', {
        description: 'There was an error extracting text. Please try again or use a different file.'
      });
    } finally {
      setProcessing(false);
      setCurrentFile('');
    }
  };
  
  const handleImagePaste = async (blob: Blob) => {
    console.log('Image paste triggered');
    setProcessing(true);
    setResults([]);
    setCurrentFile('Pasted Image');
    setProgress(0);
    
    try {
      toast.info('Processing pasted image', {
        description: 'Text extraction started.'
      });
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      const result = await processFile(blob, (progressValue) => {
        setProgress(progressValue);
      }, 'Pasted Image');
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setResults([result]);
      
      toast.success('Completed processing', {
        description: 'Text extraction finished.'
      });
    } catch (error) {
      console.error('Error processing pasted image:', error);
      toast.error('Error processing pasted image', {
        description: 'There was an error extracting text. Please try again or use a different image.'
      });
    } finally {
      setProcessing(false);
      setCurrentFile('');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 py-12">
      <div className="container px-4 mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col items-center">
          <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
            <Logo />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600">Image & PDF to Text Converter</h1>
          <p className="text-gray-600 max-w-2xl text-center">
            Extract text from images and PDF files quickly and securely with our powerful conversion tool
          </p>
        </header>
        
        <div className="mb-10 transform hover:shadow-lg transition-all duration-300">
          <FileUpload 
            onFileSelect={handleFileSelect} 
            onImagePaste={handleImagePaste}
            isProcessing={processing} 
          />
        </div>
        
        {processing && (
          <div className="mb-10">
            <ProcessingIndicator 
              fileName={currentFile} 
              progress={progress} 
            />
          </div>
        )}
        
        {results.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-800">Results</h2>
            <div className="space-y-8">
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
        
        <div className="mb-10">
          <ContactUs />
        </div>
        
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p className="mb-1">All processing happens locally in your browser. Your files never leave your device.</p>
          <p className="text-indigo-500 font-medium">Privacy and security guaranteed.</p>
          <p className="mt-3 text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-500">
            Created with ❤ by Naseer
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
