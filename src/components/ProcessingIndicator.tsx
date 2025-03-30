
import React from 'react';
import { Search } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingIndicatorProps {
  fileName: string;
  progress: number;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ fileName, progress }) => {
  return (
    <div className="w-full flex flex-col items-center p-6 bg-white rounded-lg border shadow-sm animate-pulse-subtle">
      <div className="mb-4 rounded-full bg-blue-100 p-3">
        <Search className="h-6 w-6 text-theme-blue" />
      </div>
      <h3 className="text-lg font-medium mb-2">Processing {fileName}</h3>
      <p className="text-sm text-gray-500 mb-4">Extracting text, please wait...</p>
      <div className="w-full max-w-md mb-2">
        <Progress value={progress} className="h-2" />
      </div>
      <p className="text-xs text-gray-400">{progress.toFixed(0)}% complete</p>
    </div>
  );
};

export default ProcessingIndicator;
