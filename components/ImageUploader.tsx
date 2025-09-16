import React, { useCallback } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { UploadIcon } from './IconComponents';

interface MultiImageUploaderProps {
  onImagesSelect: (files: File[]) => void;
  id: string;
  multiple?: boolean;
}

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ onImagesSelect, id, multiple = true }) => {

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        onImagesSelect(Array.from(files));
      }
      event.target.value = '';
    },
    [onImagesSelect]
  );
  
  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        onImagesSelect(imageFiles);
      }
    },
    [onImagesSelect]
  );
  
  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
      <>
        <label
          htmlFor={id}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon className="w-10 h-10 mb-3 text-gray-500" />
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">Click to upload or drag and drop</span>
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
            </div>
        </label>
        <input
          id={id}
          type="file"
          multiple={multiple}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
      </>
  );
};

export default MultiImageUploader;