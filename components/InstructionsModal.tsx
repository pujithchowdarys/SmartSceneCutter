
import React from 'react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 shadow-2xl p-8 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How It Works</h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <p className="text-slate-400 mb-6">
          SmartSceneCutter uses Gemini AI to understand your instructions and generate FFmpeg commands to cut your video locally.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">1. Timestamp Mode</h3>
            <p className="text-slate-300 mb-2">Provide specific time ranges to cut. The tool supports various formats.</p>
            <pre className="bg-slate-900 p-3 rounded-md text-sm text-slate-300 whitespace-pre-wrap"><code>Cut 2:00–4:30, 7:30-8:30, and 00:20:00 - 00:25:30.</code></pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">2. AI Scene Detection Mode</h3>
            <p className="text-slate-300 mb-2">Describe the scenes you want. The AI will find relevant moments (note: this is a simulation and generates plausible example timestamps).</p>
            <pre className="bg-slate-900 p-3 rounded-md text-sm text-slate-300 whitespace-pre-wrap"><code>Keep only the scenes where the hero meets the villain.</code></pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">3. Mixed Mode</h3>
            <p className="text-slate-300 mb-2">Combine specific timestamps with descriptive requests for powerful editing.</p>
            <pre className="bg-slate-900 p-3 rounded-md text-sm text-slate-300 whitespace-pre-wrap"><code>Cut from 2:00 to 4:30, and also add any fight scenes detected automatically.</code></pre>
          </div>
        </div>

        <button onClick={onClose} className="mt-8 w-full px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500">
          Got It!
        </button>
      </div>
    </div>
  );
};

export default InstructionsModal;
