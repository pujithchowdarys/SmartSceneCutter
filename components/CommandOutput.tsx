import React, { useState, useEffect } from 'react';
import { Clip } from '../types';

interface CommandOutputProps {
  clips: Clip[];
  fileName: string;
  onCommandsGenerated: (commands: string) => void;
}

type OutputMode = 'separate' | 'merged';

const CommandOutput: React.FC<CommandOutputProps> = ({ clips, fileName, onCommandsGenerated }) => {
  const [mode, setMode] = useState<OutputMode>('merged');
  const [commands, setCommands] = useState('');
  const [copied, setCopied] = useState(false);

  const generateScriptContent = (platform: 'sh' | 'bat'): string => {
    if (clips.length === 0) return '';

    const safeFileName = fileName.replace(/ /g, '_');
    const commentChar = platform === 'sh' ? '#' : 'REM';
    const header = platform === 'sh' ? '#!/bin/bash\n' : '@echo off\n';
    const lineEnding = platform === 'sh' ? '\n' : '\r\n';

    let scriptBody = '';

    if (mode === 'separate') {
      scriptBody = clips.map((clip, index) => {
        const outputFileName = `clip_${index + 1}_${safeFileName}`;
        return `ffmpeg -i "${fileName}" -ss ${clip.startTime} -to ${clip.endTime} -c copy "${outputFileName}"`;
      }).join(lineEnding);
    } else { // merged
      const fileListName = 'filelist.txt';
      const tempFiles: string[] = [];
      
      const cutCommands = clips.map((clip, index) => {
        const tempFileName = `temp_clip_${index + 1}.mp4`;
        tempFiles.push(tempFileName);
        return `ffmpeg -i "${fileName}" -ss ${clip.startTime} -to ${clip.endTime} -c copy "${tempFileName}"`;
      }).join(lineEnding);

      let createFileListCommand = '';
      if (platform === 'sh') {
        const lines = tempFiles.map(f => `file '${f}'`);
        if (lines.length > 0) {
            createFileListCommand = `echo "${lines[0]}" > ${fileListName}`;
            if (lines.length > 1) {
                createFileListCommand += '\n' + lines.slice(1).map(line => `echo "${line}" >> ${fileListName}`).join('\n');
            }
        }
      } else { // bat
        const lines = tempFiles.map(f => `  echo file '${f}'`).join(lineEnding);
        createFileListCommand = `(${lineEnding}${lines}${lineEnding}) > ${fileListName}`;
      }

      const mergeCommand = `ffmpeg -f concat -safe 0 -i ${fileListName} -c copy "merged_output_${safeFileName}"`;
      
      const cleanupCommand = platform === 'sh' 
        ? `rm ${tempFiles.join(' ')} ${fileListName}`
        : `del ${tempFiles.map(f => `"${f}"`).join(' ')} "${fileListName}"`;

      scriptBody = [
        `${commentChar} Step 1: Cut all the clips into temporary files`,
        cutCommands,
        ``,
        `${commentChar} Step 2: Create a file list for concatenation`,
        createFileListCommand,
        ``,
        `${commentChar} Step 3: Merge all temporary files into one`,
        mergeCommand,
        ``,
        `${commentChar} Step 4: Clean up temporary files`,
        cleanupCommand
      ].join(lineEnding);
    }
    
    return header + '\n' + scriptBody;
  };


  useEffect(() => {
    const scriptContent = generateScriptContent('sh');
    setCommands(scriptContent);
    onCommandsGenerated(scriptContent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips, fileName, mode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (platform: 'sh' | 'bat') => {
    const scriptContent = generateScriptContent(platform);
    const blob = new Blob([scriptContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `process_video.${platform}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (clips.length === 0) return null;

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <h2 className="text-xl font-bold text-slate-100 mb-2 sm:mb-0">FFmpeg Commands</h2>
        <div className="flex items-center space-x-2 bg-slate-700 p-1 rounded-lg">
          <button
            onClick={() => setMode('merged')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${mode === 'merged' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
          >
            Merged Video
          </button>
          <button
            onClick={() => setMode('separate')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${mode === 'separate' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
          >
            Separate Clips
          </button>
        </div>
      </div>
      <div className="relative bg-slate-900 rounded-md p-4">
        <div className="absolute top-3 right-3 flex items-center space-x-2">
            <button
                onClick={() => handleDownload('sh')}
                className="px-3 py-1 bg-slate-700 text-slate-200 text-xs font-semibold rounded-md hover:bg-slate-600 transition-colors"
                title="Download as shell script for macOS/Linux"
            >
                Download .sh
            </button>
            <button
                onClick={() => handleDownload('bat')}
                className="px-3 py-1 bg-slate-700 text-slate-200 text-xs font-semibold rounded-md hover:bg-slate-600 transition-colors"
                title="Download as batch file for Windows"
            >
                Download .bat
            </button>
            <button
                onClick={handleCopy}
                className="px-3 py-1 bg-slate-700 text-slate-200 text-xs font-semibold rounded-md hover:bg-slate-600 transition-colors"
            >
                {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
        <pre className="text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap pt-8 sm:pt-0">
          <code>
            {commands}
          </code>
        </pre>
      </div>
       <p className="text-xs text-slate-500 mt-3">
         Note: Run these commands in your terminal in the same directory as your video file. You must have FFmpeg installed on your system.
       </p>
    </div>
  );
};

export default CommandOutput;
