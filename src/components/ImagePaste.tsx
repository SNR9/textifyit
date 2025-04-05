
import React, { useCallback, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImagePasteProps {
  onImagePaste: (file: Blob) => void;
  isProcessing: boolean;
}

const ImagePaste: React.FC<ImagePasteProps> = ({ onImagePaste, isProcessing }) => {
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (isProcessing) return;
    
    const items = event.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          event.preventDefault();
          onImagePaste(blob);
          toast.info('Image pasted', {
            description: 'Processing pasted image...',
          });
          break;
        }
      }
    }
  }, [onImagePaste, isProcessing]);
  
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);
  
  const handleButtonClick = () => {
    toast.info('Paste shortcut', {
      description: 'Press Ctrl+V or Cmd+V to paste an image from your clipboard.',
    });
  };
  
  return (
    <Button 
      variant="outline" 
      className="flex items-center gap-2 mt-4"
      onClick={handleButtonClick}
      disabled={isProcessing}
    >
      <ImageIcon className="w-4 h-4" />
      <span>Paste image (Ctrl+V)</span>
    </Button>
  );
};

export default ImagePaste;
