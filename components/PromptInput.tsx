
import React, { useState } from 'react';

interface PromptInputProps {
  videoUrl: string;
  onDurationChange: (duration: number) => void;
  onProcess: (prompt: string) => void;
  isLoading: boolean;
  fileName: string;
}

const PromptInput: React.FC<PromptInputProps> = ({ videoUrl, onDurationChange, onProcess, isLoading, fileName }) => {
  const [prompt, setPrompt] = useState('');

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    onDurationChange(e.currentTarget.duration);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onProcess(prompt);
    }
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-200 mb-2">Video Preview</h2>
          <p className="text-sm text-slate-400 mb-4 truncate" title={fileName}>{fileName}</p>
          <video
            src={videoUrl}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full rounded-md aspect-video bg-black"
          />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <label htmlFor="prompt" className="text-lg font-semibold text-slate-200 mb-2">
            Your Instructions
          </label>
          <p className="text-sm text-slate-400 mb-4">
            Enter timestamps (e.g., 2:00-4:30) and/or describe scenes to cut.
          </p>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Cut 1:15-2:40, 5:30-6:00, and include all scenes with the villain."
            className="flex-grow bg-slate-900 border border-slate-600 rounded-md p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            rows={8}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="mt-4 w-full flex justify-center items-center px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Process Prompt'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromptInput;
