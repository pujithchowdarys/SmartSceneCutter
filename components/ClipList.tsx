
import React from 'react';
import { Clip, ClipType } from '../types';

interface ClipListProps {
  clips: Clip[];
  onRemoveClip: (index: number) => void;
}

const ClipList: React.FC<ClipListProps> = ({ clips, onRemoveClip }) => {
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
