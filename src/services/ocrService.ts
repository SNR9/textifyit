import { createWorker, PSM } from 'tesseract.js';
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
    
    // Configure better recognition settings for handwritten text
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Use enum instead of string '6'
      tessedit_ocr_engine_mode: '2', // Use LSTM neural network only
      preserve_interword_spaces: '1',
      tessjs_create_hocr: '0',
      tessjs_create_tsv: '0',
      tessjs_create_box: '0',
      tessjs_create_unlv: '0',
      tessjs_create_osd: '0',
    });
    
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

// Convert PDF page to image canvas with better quality
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
      
      // Extract text from the rendered page image with improved settings for handwritten text
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      // Configure worker for better handwritten text recognition
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Use enum instead of string '6'
        tessedit_ocr_engine_mode: '2', // Use LSTM neural network only
        preserve_interword_spaces: '1',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
        tessjs_create_box: '0',
        tessjs_create_unlv: '0',
        tessjs_create_osd: '0',
      });
      
      const { data } = await worker.recognize(blob);
      await worker.terminate();
      
      // Add page text with proper formatting
      combinedText += data.text + '\n\n';
      
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
