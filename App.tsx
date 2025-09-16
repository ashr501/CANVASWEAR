import React, { useState, useCallback } from 'react';
import MultiImageUploader from './components/ImageUploader';
import { ImageIcon, SparklesIcon, DownloadIcon, CloseIcon } from './components/IconComponents';
import { editImageWithNanoBanana } from './services/geminiService';
import type { GeminiResponse } from './types';

const MAX_IMAGES = 4;

const App: React.FC = () => {
  const [dressImages, setDressImages] = useState<File[]>([]);
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>(
    'Generate a realistic photo of the fashion model from the reference image wearing the dress shown in the uploaded dress images, combining the best angles of the dress. Place her on a clean, white studio background. The final result should look like a professional fashion catalog photo. If no reference model is provided, generate a suitable one.'
  );
  const [result, setResult] = useState<GeminiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImagesSelect = useCallback((newFiles: File[]) => {
    setDressImages(prevImages => {
      const uniqueFileNames = new Set(prevImages.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(f => !uniqueFileNames.has(f.name));
      return [...prevImages, ...uniqueNewFiles].slice(0, MAX_IMAGES);
    });
  }, []);
  
  const handleModelImageSelect = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
        setModelImage(newFiles[0]);
    }
  }, []);

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    setDressImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleRemoveModelImage = useCallback(() => {
    setModelImage(null);
  }, []);

  const handleSubmit = async () => {
    if (dressImages.length === 0 || !prompt.trim()) {
      setError("Please upload at least one dress image and provide a description.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await editImageWithNanoBanana(dressImages, modelImage, prompt);
      setResult(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!result?.imageUrl) return;

    const link = document.createElement('a');
    link.href = result.imageUrl;
    const mimeType = result.imageUrl.split(';')[0].split(':')[1];
    const extension = mimeType ? mimeType.split('/')[1] : 'png';
    link.download = `fashion-fusion-result.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result]);

  const isButtonDisabled = dressImages.length === 0 || !prompt.trim() || isLoading;
  const canUploadMore = dressImages.length < MAX_IMAGES;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
            Fashion Fusion AI
          </h1>
          <p className="mt-3 text-lg text-gray-400">
            Combine dress images with an optional reference model to generate a new photo.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4">
                1. Upload Dress Images ({dressImages.length}/{MAX_IMAGES})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {dressImages.map((file, index) => (
                  <div key={file.name + index} className="relative aspect-square">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Dress preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                      onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {canUploadMore && (
                  <MultiImageUploader
                    id="dress-image-uploader"
                    onImagesSelect={handleImagesSelect}
                  />
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4">
                2. Upload Reference Model (Optional)
              </h3>
              {modelImage ? (
                <div className="relative w-40 h-40">
                  <img
                    src={URL.createObjectURL(modelImage)}
                    alt="Model preview"
                    className="w-full h-full object-cover rounded-lg"
                    onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                  />
                  <button
                    onClick={handleRemoveModelImage}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    aria-label="Remove model image"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <MultiImageUploader
                  id="model-image-uploader"
                  onImagesSelect={handleModelImageSelect}
                  multiple={false}
                />
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4">
                3. Describe the Final Image
              </h3>
              <textarea
                  id="prompt"
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-200 placeholder-gray-500 text-sm"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
          </div>
          
          {/* Action & Output Section */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex flex-col">
            <button
              onClick={handleSubmit}
              disabled={isButtonDisabled}
              className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all transform hover:scale-105"
            >
              <SparklesIcon className="w-6 h-6 mr-3" />
              {isLoading ? 'Generating...' : 'Generate Image'}
            </button>

            <div className="mt-6 flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-700 min-h-[300px]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
                  <p className="mt-4 text-gray-400">AI is thinking...</p>
                </div>
              )}
              {error && (
                <div className="text-center p-4">
                  <p className="text-red-400 font-semibold">Error</p>
                  <p className="text-red-500 mt-2 text-sm">{error}</p>
                </div>
              )}
              {!isLoading && !error && result?.imageUrl && (
                 <div className="w-full h-full p-2">
                    <img src={result.imageUrl} alt="Generated result" className="w-full h-full object-contain rounded-md" />
                 </div>
              )}
               {!isLoading && !error && !result && (
                <div className="text-center p-4">
                  <ImageIcon className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="mt-2 text-gray-500">Your generated image will appear here.</p>
                </div>
              )}
            </div>
             {result?.text && (
                  <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 italic">{result.text}</p>
                  </div>
              )}
               {!isLoading && result?.imageUrl && (
                <button
                    onClick={handleDownload}
                    className="w-full mt-4 flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download Image
                </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;