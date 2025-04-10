import { createWorker, PSM, OEM } from 'tesseract.js';
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
      tessedit_pageseg_mode: PSM.AUTO,
      tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
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

const processFile = async (
  file: File | Blob,
  onProgress: (progress: number) => void,
  fileNameOverride?: string
): Promise<ExtractionResult> => {
  const worker = await getWorker();
  
  try {
    const result = await worker.recognize(file, {
      rotateAuto: true,
    });
    
    const text = result.data.text;
    const fileName = fileNameOverride || (file as File).name || 'image';
    
    return { text, fileName };
  } catch (error) {
    console.error('Error during OCR:', error);
    toast.error('Error during OCR. Please check console for details.');
    throw error;
  } finally {
    // No need to terminate the worker here
  }
};

export { processFile, terminateWorker };
