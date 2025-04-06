
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

// Function to extract text from an image with enhanced math recognition
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
    
    // Configure better recognition settings for math formulas
    await worker.setParameters({
      tessjs_create_hocr: '0',
      tessjs_create_tsv: '0',
      tessjs_create_box: '0',
      tessjs_create_unlv: '0',
      tessjs_create_osd: '0',
      preserve_interword_spaces: '1',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,+-*/()[]{}=><^_√∫∑∏π∞±≤≥≠≈',
      tessedit_pageseg_mode: '6', // Assume a single uniform block of text
      textord_heavy_nr: '1', // Better handling of superscripts/subscripts
      textord_tablefind_recognize_tables: '1', // Better for equation layouts
    });
    
    // Process the image with higher DPI if it's smaller
    const { data } = await worker.recognize(file);
    await worker.terminate();
    
    // Post-process recognized text to improve mathematical formula representation
    const processedText = postProcessMathText(data.text);
    
    return {
      text: processedText,
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

// Helper function to post-process text and improve math formula representation
const postProcessMathText = (text: string): string => {
  // Fix common OCR errors in mathematical notation
  return text
    // Fix superscripts and subscripts
    .replace(/([0-9])\s+([0-9])/g, '$1$2') // Remove spaces between adjacent numbers
    .replace(/([a-zA-Z])\s+(\d)/g, '$1$2') // Fix variable + number spacing
    .replace(/([a-zA-Z0-9])\s*\^\s*(\d)/g, '$1^$2') // Fix superscript notation
    .replace(/([a-zA-Z0-9])\s*\_\s*(\d)/g, '$1_$2') // Fix subscript notation
    // Fix common math symbols
    .replace(/\|\-/g, '√') // Fix square root
    .replace(/\-\-/g, '=') // Fix equals sign
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1/$2') // Fix fractions
    .replace(/([0-9a-zA-Z])\s*\*\s*([0-9a-zA-Z])/g, '$1*$2') // Fix multiplication
    .replace(/\s*\+\s*/g, ' + ') // Format addition
    .replace(/\s*\-\s*/g, ' - ') // Format subtraction
    .replace(/\)\s*\(/g, ')(') // Fix parentheses spacing
    .replace(/([a-zA-Z])\s+(\()/g, '$1$2') // Fix function notation
    .replace(/(\))\s+([a-zA-Z])/g, '$1$2') // Fix parentheses + letter spacing
    // Fix multi-character variables and equations
    .replace(/d\s*y\s*\/\s*d\s*x/g, 'dy/dx') // Fix derivatives
    .replace(/\\sum/g, '∑') // Fix summation
    .replace(/\\int/g, '∫') // Fix integral
    .replace(/\\infty/g, '∞') // Fix infinity
    .replace(/\\pi/g, 'π'); // Fix pi
};

// Convert PDF page to image canvas with higher resolution for math content
const pdfPageToCanvas = async (page: any, scale = 4): Promise<HTMLCanvasElement> => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  
  try {
    await page.render({
      canvasContext: context,
      viewport
    }).promise;
    
    return canvas;
  } catch (error) {
    console.error('Error rendering PDF page to canvas:', error);
    throw error;
  }
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
      // Update progress - 40% of progress is for loading pages
      if (onProgress) {
        onProgress((i / numPages) * 40);
      }
      
      const page = await pdf.getPage(i);
      
      // Render page to canvas at higher resolution for better OCR
      const canvas = await pdfPageToCanvas(page, 4);
      
      // Convert canvas to blob with higher quality
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 
          'image/png',
          1.0 // Use maximum quality
        );
      });
      
      // Extract text from the rendered page image with improved settings for math
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      // Configure worker for better math recognition
      await worker.setParameters({
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
        tessjs_create_box: '0',
        tessjs_create_unlv: '0',
        tessjs_create_osd: '0',
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,+-*/()[]{}=><^_√∫∑∏π∞±≤≥≠≈',
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text
        textord_heavy_nr: '1', // Better handling of superscripts/subscripts
      });
      
      const { data } = await worker.recognize(blob);
      await worker.terminate();
      
      // Apply post-processing for better math formula representation
      const processedText = postProcessMathText(data.text);
      
      // Add page text with proper formatting
      combinedText += processedText + '\n\n';
      
      // Update progress - remaining 60% is for OCR
      if (onProgress) {
        onProgress(40 + (i / numPages) * 60);
      }
    }
    
    return {
      text: combinedText.trim(),
      fileName: file.name
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    toast.error('Failed to extract text from PDF', {
      description: 'There was an error processing the PDF. ' + 
        (error instanceof Error ? error.message : 'Unknown error')
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
  try {
    // Convert Blob to File if needed
    const fileObj = file instanceof File ? file : new File([file], fileName || 'pasted-image.png', { type: file.type });
    
    if (fileObj.type.startsWith('image/')) {
      return extractTextFromImage(fileObj, onProgress);
    } else if (fileObj.type === 'application/pdf') {
      return extractTextFromPDF(fileObj, onProgress);
    } else {
      throw new Error(`Unsupported file type: ${fileObj.type}`);
    }
  } catch (error) {
    console.error('Process file error:', error);
    throw error;
  }
};
