
import { createWorker } from 'tesseract.js';
import * as PDFJS from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { toast } from 'sonner';

// Set the worker path for PDF.js
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;

// Define the result type for text extraction
export interface ExtractionResult {
  text: string;
  fileName: string;
}

// Function to extract text from an image
export const extractTextFromImage = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<ExtractionResult> => {
  try {
    const worker = await createWorker();
    
    // Subscribe to progress updates
    if (onProgress) {
      // Handle progress using Tesseract.js API
      worker.progress(({ progress, status }) => {
        if (typeof progress === 'number') {
          onProgress(progress * 100);
        }
      });
    }
    
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data } = await worker.recognize(file);
    await worker.terminate();
    
    return {
      text: data.text,
      fileName: file.name
    };
  } catch (error) {
    console.error('Error extracting text from image:', error);
    toast.error('Failed to extract text from image', {
      description: 'There was an error processing the image.'
    });
    throw error;
  }
};

// Function to extract text from a PDF
export const extractTextFromPDF = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<ExtractionResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    let extractedText = '';
    
    // Process each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Join text items, preserving spaces and line breaks
      const pageText = textContent.items
        .map((item: any) => {
          // Add space after each text chunk if it doesn't end with a space
          const text = item.str;
          return text + (text.endsWith(' ') ? '' : ' ');
        })
        .join('')
        .replace(/\s+/g, ' '); // Normalize spaces
      
      extractedText += pageText + '\n\n';
      
      // Report progress
      if (onProgress) {
        onProgress((i / numPages) * 100);
      }
    }
    
    return {
      text: extractedText.trim(),
      fileName: file.name
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    toast.error('Failed to extract text from PDF', {
      description: 'There was an error processing the PDF.'
    });
    throw error;
  }
};

// Process files based on their type
export const processFile = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<ExtractionResult> => {
  if (file.type.startsWith('image/')) {
    return extractTextFromImage(file, onProgress);
  } else if (file.type === 'application/pdf') {
    return extractTextFromPDF(file, onProgress);
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
};
