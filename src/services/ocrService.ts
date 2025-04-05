
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
    // Create worker with correct progress tracking
    const worker = await createWorker({
      logger: m => {
        if (onProgress && m.progress !== undefined) {
          onProgress(m.progress * 100);
        }
      }
    });
    
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

// Process a Blob or File
export const processFile = async (
  file: File | Blob, 
  onProgress?: (progress: number) => void,
  fileName?: string
): Promise<ExtractionResult> => {
  // Convert Blob to File if needed
  const fileObj = file instanceof File ? file : new File([file], fileName || 'pasted-image.png', { type: file.type });
  
  if (fileObj.type.startsWith('image/')) {
    return extractTextFromImage(fileObj, onProgress);
  } else if (fileObj.type === 'application/pdf') {
    return extractTextFromPDF(fileObj, onProgress);
  } else {
    throw new Error(`Unsupported file type: ${fileObj.type}`);
  }
};
