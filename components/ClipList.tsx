// Fix: Add DOM library reference to resolve TypeScript errors for DOM APIs.
/// <reference lib="dom" />

import React, { useState } from 'react';
import { Clip, ClipType } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface ClipListProps {
  clips: Clip[];
  onRemoveClip: (index: number) => void;
  videoFile: File;
  ffmpeg: FFmpeg | null;
  isFfmpegLoaded: boolean;
}

const ClipList: React.FC<ClipListProps> = ({ clips, onRemoveClip, videoFile, ffmpeg, isFfmpegLoaded }) => {
  const [processingClipIndex, setProcessingClipIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDownloadClip = async (clip: Clip, index: number) => {
    if (!isFfmpegLoaded || !ffmpeg || processingClipIndex !== null) return;

    setProcessingClipIndex(index);
    setProgress(0);
    
    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
    });

    const inputFileName = `input_${videoFile.name}`;
    const outputFileName = `clip_${index + 1}_${videoFile.name}`;

    try {
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
      
      await ffmpeg.exec([
        '-i', inputFileName,
        '-ss', clip.startTime,
        '-to', clip.endTime,
        '-c', 'copy',
        outputFileName
      ]);

      const data = await ffmpeg.readFile(outputFileName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
      
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

    } catch (error) {
      console.error("Error processing video clip:", error);
      alert("An error occurred while processing the video clip. Please check the console for details.");
    } finally {
      ffmpeg.on('progress', null); // clear listener
      setProcessingClipIndex(null);
      setProgress(0);
    }
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <h2 className="text-xl font-bold text-slate-100 mb-4">Detected Clips</h2>
      <div className="space-y-3">
        {clips.map((clip, index) => (
          <div key={index} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md animate-fade-in">
            <div className="flex items-center space-x-4">
               <div className="text-cyan-400 font-mono text-sm bg-slate-800 px-2 py-1 rounded">{String(index + 1).padStart(2, '0')}</div>
              <div>
                <p className="font-semibold text-slate-200">{clip.startTime} &rarr; {clip.endTime}</p>
                <p className="text-sm text-slate-400 italic">"{clip.description}"</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
                {processingClipIndex === index ? (
                    <div className="w-28 text-center" aria-live="polite">
                        <div className="w-full bg-slate-600 rounded-full h-2">
                            <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${progress}%` }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{progress > 0 ? `${progress}%` : 'Preparing...'}</p>
                    </div>
                ) : (
                    <button 
                        onClick={() => handleDownloadClip(clip, index)}
                        disabled={!isFfmpegLoaded || processingClipIndex !== null}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-900/50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download this clip"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                        </svg>
                    </button>
                )}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                clip.type === ClipType.Manual 
                ? 'bg-blue-900/50 text-blue-300' 
                : 'bg-purple-900/50 text-purple-300'
              }`}>
                {clip.type}
              </span>
              <button onClick={() => onRemoveClip(index)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/50 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClipList;