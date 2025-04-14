
import { createWorker } from 'tesseract.js';
import { toast } from 'sonner';

// Define the PSM constants properly as numbers
export enum PSM {
  OSD_ONLY = 0,
  AUTO_OSD = 1,
  AUTO_ONLY = 2,
  AUTO = 3,
  SINGLE_COLUMN = 4,
  SINGLE_BLOCK_VERT_TEXT = 5,
  SINGLE_BLOCK = 6,
  SINGLE_LINE = 7,
  SINGLE_WORD = 8,
  CIRCLE_WORD = 9,
  SINGLE_CHAR = 10,
  SPARSE_TEXT = 11,
  SPARSE_TEXT_OSD = 12,
  RAW_LINE = 13
}

export enum OEM {
  LSTM_ONLY = 1
}

export interface ExtractionResult {
  text: string;
  fileName: string;
}

const initializeWorker = async () => {
  console.log('Initializing Tesseract worker...');
  const worker = await createWorker({
    logger: (m) => {
      console.log('Tesseract progress:', m);
    },
  });
  
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    // Fix: Use type assertion to specify the exact type expected by Tesseract
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
    });
    console.log('Tesseract worker initialized successfully');
    return worker;
  } catch (error) {
    console.error('Error initializing Tesseract worker:', error);
    toast.error('Failed to initialize OCR service. Please try again.');
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
    console.log('Tesseract worker terminated');
  }
};

const processFile = async (
  file: File | Blob,
  onProgress: (progress: number) => void,
  fileNameOverride?: string
): Promise<ExtractionResult> => {
  console.log('Processing file:', fileNameOverride || (file as File).name || 'image');
  
  try {
    const worker = await getWorker();
    console.log('Worker obtained, starting recognition');
    
    // Create a URL from the blob for Tesseract to use
    const fileUrl = URL.createObjectURL(file);
    
    const result = await worker.recognize(fileUrl, {
      rotateAuto: true,
    });
    
    // Clean up the object URL after use
    URL.revokeObjectURL(fileUrl);
    
    const text = result.data.text;
    const fileName = fileNameOverride || (file as File).name || 'image';
    
    console.log('OCR completed successfully');
    
    return { text, fileName };
  } catch (error) {
    console.error('Error during OCR:', error);
    toast.error('Error during OCR. Please try a different file or check your connection.');
    throw error;
  }
};

export { processFile, terminateWorker };
