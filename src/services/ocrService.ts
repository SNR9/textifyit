
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
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Use enum value
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

// Enhanced post-processing for academic content and numbered lists
const postProcessText = (text: string): string => {
  // Fix Roman numerals in lists
  let processed = text
    // Roman numeral formatting for list items
    .replace(/\(([iI])\)/g, '(i)')
    .replace(/\(([iI][iI])\)/g, '(ii)')
    .replace(/\(([iI][iI][iI])\)/g, '(iii)')
    .replace(/\(([iI][vV])\)/g, '(iv)')
    .replace(/\(([vV])\)/g, '(v)')
    .replace(/\(([vV][iI])\)/g, '(vi)')
    .replace(/\(([vV][iI][iI])\)/g, '(vii)')
    .replace(/\(([vV][iI][iI][iI])\)/g, '(viii)')
    
    // Fix standalone Roman numerals (without parentheses)
    .replace(/^([iI])[\.\s]/gm, 'i) ')
    .replace(/^([iI][iI])[\.\s]/gm, 'ii) ')
    .replace(/^([iI][iI][iI])[\.\s]/gm, 'iii) ')
    .replace(/^([iI][vV])[\.\s]/gm, 'iv) ')
    .replace(/^([vV])[\.\s]/gm, 'v) ')
    .replace(/^([vV][iI])[\.\s]/gm, 'vi) ')
    
    // Fix Arabic numerals with brackets or parentheses
    .replace(/\(([0-9])\)/g, '($1)')
    .replace(/\[([0-9])\]/g, '[$1]')
    .replace(/\{([0-9])\}/g, '{$1}')
    
    // Fix common numeric list formats
    .replace(/([0-9])[\.\)]/g, '$1)')
    
    // Fix common OCR errors for numbered lists
    .replace(/\(l\)/g, '(1)')
    .replace(/\(Z\)/g, '(2)')
    .replace(/\(z\)/g, '(2)')
    .replace(/\(S\)/g, '(5)')
    .replace(/\(s\)/g, '(5)')
    .replace(/\(O\)/g, '(0)')
    .replace(/\(o\)/g, '(0)')
    
    // Academic questionnaire answer options
    .replace(/(\([0-9]\))(\s*)([^,\.]+)(?:,|\.)/g, '$1 $3\n')
    
    // Multiple Choice answer format
    .replace(/@/g, '@')  // Preserve @ symbol often used in answer choices
    .replace(/Choose your answer from the options/i, 'Choose your answer from the options')
    
    // Fix common mathematical symbols
    .replace(/\^([a-zA-Z0-9]+)/g, '^$1') // Preserve superscripts
    .replace(/_([a-zA-Z0-9]+)/g, '_$1')  // Preserve subscripts
    .replace(/(\d)\/(\d)/g, '$1÷$2')     // Improve division symbol recognition
    .replace(/([a-zA-Z0-9])\^2/g, '$1²') // Convert ^2 to superscript
    .replace(/([a-zA-Z0-9])\^3/g, '$1³') // Convert ^3 to superscript
    .replace(/sqrt/g, '√')              // Improve square root symbol
    .replace(/pi/g, 'π')               // Improve pi symbol
    
    // Preserve and fix common academic formatting
    .replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, '$1') // Preserve proper names
    .replace(/\b(ex-post|ex post)\s+facto\b/i, 'ex-post facto')  // Fix specialized terms
    .replace(/\bhypothetico[-\s]*deductive\b/i, 'hypothetico-deductive');  // Fix specialized terms
  
  // Standardize line breaks for better readability
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  return processed;
};

const processFile = async (
  file: File | Blob,
  onProgress: (progress: number) => void,
  fileNameOverride?: string
): Promise<ExtractionResult> => {
  const worker = await getWorker();
  
  try {
    // Basic recognition without extra options that might cause errors
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
