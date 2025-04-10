
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
      tessedit_pageseg_mode: '3', // Use numeric value instead of enum
      preserve_interword_spaces: '1',
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
    .replace(/_([a-zA-Z0-9]+)/g, '_$1')  // Preserve subscripts
    .replace(/(\d)\/(\d)/g, '$1÷$2')     // Improve division symbol recognition
    .replace(/([a-zA-Z0-9])\^2/g, '$1²') // Convert ^2 to superscript
    .replace(/([a-zA-Z0-9])\^3/g, '$1³') // Convert ^3 to superscript
    .replace(/sqrt/g, '√')              // Improve square root symbol
    .replace(/pi/g, 'π');              // Improve pi symbol
  
  return processed;
};

const processFile = async (
  file: File | Blob,
  onProgress: (progress: number) => void,
  fileNameOverride?: string
): Promise<ExtractionResult> => {
  const worker = await getWorker();
  
  try {
    // Use safer recognition settings with no custom properties
    const result = await worker.recognize(file);
    
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
