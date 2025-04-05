
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
  file: File | Blob, 
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
      fileName: file instanceof File ? file.name : 'extracted-image'
    };
  } catch (error) {
    console.error('Error extracting text from image:', error);
    toast.error('Failed to extract text from image', {
      description: 'There was an error processing the image.'
    });
    throw error;
  }
};

// Convert PDF page to image canvas
const pdfPageToCanvas = async (page: any, scale = 2): Promise<HTMLCanvasElement> => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: context!,
    viewport
  }).promise;
  
  return canvas;
};

// Function to extract text from a PDF by converting each page to an image first
export const extractTextFromPDF = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<ExtractionResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    let combinedText = '';
    
    // Process each page by converting to image first
    for (let i = 1; i <= numPages; i++) {
      // Update progress - 50% of progress is for loading pages
      if (onProgress) {
        onProgress((i / numPages) * 50);
      }
      
      const page = await pdf.getPage(i);
      
      // Render page to canvas at higher resolution for better OCR
      const canvas = await pdfPageToCanvas(page, 2);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      
      // Extract text from the rendered page image
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data } = await worker.recognize(blob);
      await worker.terminate();
      
      // Add page text with proper formatting
      combinedText += data.text + '\n\n';
      
      // Update progress - remaining 50% is for OCR
      if (onProgress) {
        onProgress(50 + (i / numPages) * 50);
      }
    }
    
    return {
      text: combinedText.trim(),
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
