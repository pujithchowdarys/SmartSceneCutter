
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Clip } from './types';
import FileUpload from './components/FileUpload';
import PromptInput from './components/PromptInput';
import ClipList from './components/ClipList';
import CommandOutput from './components/CommandOutput';
import InstructionsModal from './components/InstructionsModal';
import { parsePromptForClips } from './services/geminiService';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const Header: React.FC<{ onShowInstructions: () => void }> = ({ onShowInstructions }) => (
  <header className="py-6 px-4 sm:px-8 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20 border-b border-slate-700">
    <div className="max-w-5xl mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <svg className="w-8 h-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5-4.72-4.72a.75.75 0 0 0-1.06 1.06L14.69 12l-4.72 4.72a.75.75 0 1 0 1.06 1.06l4.72-4.72a.75.75 0 0 0 0-1.06Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5 3.53 5.78a.75.75 0 0 0-1.06 1.06L7.19 12l-4.72 4.72a.75.75 0 1 0 1.06 1.06l4.72-4.72a.75.75 0 0 0 0-1.06Z" />
        </svg>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          SmartScene<span className="text-cyan-400">Cutter</span>
        </h1>
      </div>
      <button onClick={onShowInstructions} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>Instructions</span>
      </button>
    </div>
  </header>
);


function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    const loadFfmpeg = async () => {
      const ffmpeg = new FFmpeg();
      ffmpeg.on('log', ({ message }) => {
        // console.log(message); // Useful for debugging, but can be noisy
      });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        ffmpegRef.current = ffmpeg;
        setIsFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg', err);
        setError('Failed to load the video processing engine. Please try reloading the page.');
      }
    };
    loadFfmpeg();
  }, []);

  const handleFileChange = (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    // Reset state when a new video is uploaded
    setClips([]);
    setError(null);
  };

  const handleProcessPrompt = async (prompt: string) => {
    if (!videoFile) {
      setError("Please upload a video file first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const parsedClips = await parsePromptForClips(prompt, videoDuration);
      setClips(parsedClips);
    } catch (err) {
      console.error(err);
      setError("Failed to parse prompt. The AI model might be unavailable or the response was invalid. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeClip = (index: number) => {
    setClips(clips.filter((_, i) => i !== index));
  };

  return (
    <>
      <Header onShowInstructions={() => setShowInstructions(true)} />
      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8">
        {!videoFile ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
              <h2 className="text-xl font-semibold mb-4 text-slate-300">Start by Uploading Your Video</h2>
              <p className="text-slate-400 mb-6">Select a video file to begin cutting scenes.</p>
              <FileUpload onFileChange={handleFileChange} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <PromptInput 
              videoUrl={videoUrl!} 
              onDurationChange={setVideoDuration} 
              onProcess={handleProcessPrompt} 
              isLoading={isLoading} 
              fileName={videoFile.name}
            />

            {error && <div className="p-4 bg-red-900/50 text-red-200 border border-red-700 rounded-lg">{error}</div>}
            
            {clips.length > 0 && (
              <>
                <ClipList 
                  clips={clips} 
                  onRemoveClip={removeClip} 
                  videoFile={videoFile}
                  ffmpeg={ffmpegRef.current}
                  isFfmpegLoaded={isFfmpegLoaded}
                />
                <CommandOutput 
                  clips={clips} 
                  videoFile={videoFile}
                  ffmpeg={ffmpegRef.current}
                  isFfmpegLoaded={isFfmpegLoaded}
                />
              </>
            )}
          </div>
        )}
      </main>
      <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} />
    </>
  );
}

export default App;