import React, { useState } from 'react';
import { Clip } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface CommandOutputProps {
  clips: Clip[];
  videoFile: File;
  ffmpeg: FFmpeg | null;
  isFfmpegLoaded: boolean;
}

type OutputMode = 'separate' | 'merged';
type ProcessStatus = 'idle' | 'processing' | 'done';
interface OutputFile {
    name: string;
    url: string;
}

const CommandOutput: React.FC<CommandOutputProps> = ({ clips, videoFile, ffmpeg, isFfmpegLoaded }) => {
  const [mode, setMode] = useState<OutputMode>('merged');
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [outputFiles, setOutputFiles] = useState<OutputFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!isFfmpegLoaded || !ffmpeg || clips.length === 0 || status === 'processing') return;
    
    setStatus('processing');
    setProgress(0);
    setOutputFiles([]);
    setError(null);

    ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
    });

    try {
        const inputFileName = `input_${videoFile.name}`;
        await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

        if (mode === 'separate') {
            const generatedFiles: OutputFile[] = [];
            for (let i = 0; i < clips.length; i++) {
                const clip = clips[i];
                const outputFileName = `export_clip_${i + 1}_${videoFile.name}`;
                
                await ffmpeg.exec([
                    '-i', inputFileName,
                    '-ss', clip.startTime,
                    '-to', clip.endTime,
                    '-c', 'copy',
                    outputFileName
                ]);

                const data = await ffmpeg.readFile(outputFileName);
                const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
                generatedFiles.push({ name: outputFileName, url });
                await ffmpeg.deleteFile(outputFileName);
            }
            setOutputFiles(generatedFiles);
        } else { // merged
            const tempFiles: string[] = [];
            for (let i = 0; i < clips.length; i++) {
                const clip = clips[i];
                const tempFileName = `temp_${i}.mp4`;
                tempFiles.push(tempFileName);
                await ffmpeg.exec([
                    '-i', inputFileName,
                    '-ss', clip.startTime,
                    '-to', clip.endTime,
                    '-c', 'copy',
                    tempFileName
                ]);
            }
            
            const fileListContent = tempFiles.map(f => `file '${f}'`).join('\\n');
            const fileListName = 'filelist.txt';
            await ffmpeg.writeFile(fileListName, fileListContent);

            const outputFileName = `merged_${videoFile.name}`;
            await ffmpeg.exec([
                '-f', 'concat',
                '-safe', '0',
                '-i', fileListName,
                '-c', 'copy',
                outputFileName
            ]);
            
            const data = await ffmpeg.readFile(outputFileName);
            const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
            setOutputFiles([{ name: outputFileName, url }]);

            // Cleanup
            for (const tempFile of tempFiles) {
                await ffmpeg.deleteFile(tempFile);
            }
            await ffmpeg.deleteFile(fileListName);
            await ffmpeg.deleteFile(outputFileName);
        }
        
        await ffmpeg.deleteFile(inputFileName);
        setStatus('done');

    } catch (err) {
        console.error("FFmpeg processing error:", err);
        setError("An error occurred during video processing. Please check the console for details.");
        setStatus('idle');
    } finally {
        ffmpeg.on('progress', null);
    }
  };

  if (clips.length === 0) return null;

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <h2 className="text-xl font-bold text-slate-100 mb-2 sm:mb-0">Export Clips</h2>
        <div className="flex items-center space-x-2 bg-slate-700 p-1 rounded-lg">
          <button
            onClick={() => setMode('merged')}
            disabled={status === 'processing'}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${mode === 'merged' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
          >
            Merged Video
          </button>
          <button
            onClick={() => setMode('separate')}
            disabled={status === 'processing'}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${mode === 'separate' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
          >
            Separate Clips
          </button>
        </div>
      </div>
      
      {status === 'idle' && (
        <button 
          onClick={handleProcess} 
          disabled={!isFfmpegLoaded}
          className="w-full flex justify-center items-center px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
        >
          {isFfmpegLoaded ? `Process & Download ${mode === 'merged' ? 'Merged Video' : `${clips.length} Clips`}` : 'Loading Video Engine...'}
        </button>
      )}

      {status === 'processing' && (
        <div className="text-center p-4">
            <h3 className="text-lg font-semibold text-slate-200">Processing...</h3>
            <p className="text-slate-400 text-sm mb-3">This may take a few moments. Please keep this tab open.</p>
            <div className="w-full bg-slate-700 rounded-full h-4">
                <div 
                  className="bg-cyan-500 h-4 rounded-full text-right transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                  role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}
                >
                  <span className="px-2 text-xs font-bold text-slate-900">{progress}%</span>
                </div>
            </div>
        </div>
      )}

      {status === 'done' && (
        <div className="animate-fade-in">
            <h3 className="font-semibold text-lg text-green-300 mb-3">Processing Complete!</h3>
            <div className="space-y-2">
                {outputFiles.map((file, index) => (
                    <a 
                        href={file.url} 
                        download={file.name} 
                        key={index} 
                        className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md hover:bg-slate-700 transition-colors"
                    >
                        <span className="text-slate-300 truncate">{file.name}</span>
                        <span className="flex items-center space-x-2 text-sm font-medium text-cyan-400">
                            <span>Download</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>
                        </span>
                    </a>
                ))}
            </div>
            <button 
              onClick={() => { setStatus('idle'); setProgress(0); setOutputFiles([]) }} 
              className="mt-4 w-full px-4 py-2 bg-slate-600 text-slate-200 font-semibold rounded-lg hover:bg-slate-500 transition-colors"
            >
              Export Again
            </button>
        </div>
      )}

      {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}

    </div>
  );
};

export default CommandOutput;
