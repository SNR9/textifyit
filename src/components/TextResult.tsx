
import React, { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface TextResultProps {
  extractedText: string;
  fileName: string;
}

const TextResult: React.FC<TextResultProps> = ({ extractedText, fileName }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast.success('Text copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy text');
      console.error('Failed to copy text: ', err);
    }
  };
  
  const handleDownload = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Create download filename based on original file but with .txt extension
    const downloadName = fileName.split('.').slice(0, -1).join('.') || fileName;
    
    a.href = url;
    a.download = `${downloadName}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Text downloaded successfully!');
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          Extracted Text from {fileName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="result-container bg-gray-50 p-4 rounded border">
          {extractedText ? (
            <p className="whitespace-pre-wrap">{extractedText}</p>
          ) : (
            <p className="text-gray-400 italic">No text was extracted.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy}
          disabled={!extractedText}
        >
          <Copy className="h-4 w-4 mr-2" />
          {copied ? 'Copied!' : 'Copy Text'}
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleDownload}
          disabled={!extractedText}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TextResult;
