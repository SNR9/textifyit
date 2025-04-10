
import { createWorker } from 'tesseract.js';
import { toast } from 'sonner';

export interface ExtractionResult {
  text: string;
  fileName: string;
}

const initializeWorker = async () => {
  const worker = await createWorker({
    logger: (m) => {
      // console.log(m); // Detailed logging
    },
  });
  
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: 'AUTO',
      preserve_interword_spaces: '1',
      tessjs_create_hocr: '1',
      tessjs_create_tsv: '1',
    });
    return worker;
  } catch (error) {
    console.error('Error initializing Tesseract worker:', error);
    toast.error('Failed to initialize OCR service. Please check console for details.');
    await worker.terminate();
    throw error;
  }
};

let workerPromise: Promise<Tesseract.Worker>;

const getWorker = () => {
  if (!workerPromise) {
    workerPromise = initializeWorker();
  }
  return workerPromise;
};

const terminateWorker = async () => {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = undefined;
  }
};

// Improve special character recognition for mathematical and numbered lists
const postProcessText = (text: string): string => {
  // Fix common OCR errors for numbered lists with parentheses
  let processed = text
    // Fix numbered lists like (1), (2), etc.
    .replace(/\(([Ii])\)/g, '(i)')
    .replace(/\(([Ii][Ii])\)/g, '(ii)')
    .replace(/\(([Ii][Ii][Ii])\)/g, '(iii)')
    .replace(/\(([Ii][Vv])\)/g, '(iv)')
    .replace(/\(([Vv])\)/g, '(v)')
    
    // Fix numeric lists
    .replace(/\(l\)/g, '(1)')
    .replace(/\(Z\)/g, '(2)')
    .replace(/\(z\)/g, '(2)')
    .replace(/\(S\)/g, '(5)')
    .replace(/\(s\)/g, '(5)')
    .replace(/\(O\)/g, '(0)')
    .replace(/\(o\)/g, '(0)')
    
    // Fix common mathematical symbols
    .replace(/\^([a-zA-Z0-9]+)/g, '^$1') // Preserve superscripts
    .replace(/_([a-zA-Z0-9]+)/g, '_$1'); // Preserve subscripts
  
  return processed;
};

const processFile = async (
  file: File | Blob,
  onProgress: (progress: number) => void,
  fileNameOverride?: string
): Promise<ExtractionResult> => {
  const worker = await getWorker();
  
  try {
    // Use higher quality options for better recognition
    const result = await worker.recognize(file, {
      rotateAuto: true,
      rotateAutoThreshold: 0.5,
      deskew: true,
    });
    
    const originalText = result.data.text;
    const processedText = postProcessText(originalText);
    const fileName = fileNameOverride || (file as File).name || 'image';
    
    return { text: processedText, fileName };
  } catch (error) {
    console.error('Error during OCR:', error);
    toast.error('Error during OCR. Please check console for details.');
    throw error;
  } finally {
    // No need to terminate the worker here
  }
};

export { processFile, terminateWorker };
