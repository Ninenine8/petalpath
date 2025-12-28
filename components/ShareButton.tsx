
import React, { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  className?: string;
  iconOnly?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ title, text, className = "", iconOnly = false }) => {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Fallback URL logic for local or restricted environments
    const currentUrl = window.location.href.includes('http') ? window.location.href : 'https://petalpath.app';
    
    const shareData = {
      title: title,
      text: text,
      url: currentUrl,
    };

    const textToCopy = `${title}\n\n${text}\n\nShared via PetalPath: ${currentUrl}`;

    try {
      // 1. Native Mobile Share (requires HTTPS and user gesture)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Share API failed, trying clipboard...', err);
      } else {
        return; // User cancelled the native picker
      }
    }

    // 2. Clipboard Fallback (Desktop / Unsecured contexts)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2500);
        return;
      }
    } catch (clipErr) {
      console.error('Clipboard copy failed:', clipErr);
    }

    // 3. Final Fail-safe (e.g., if clipboard is restricted in an iframe)
    window.prompt("Copy this floral guide link:", textToCopy);
  };

  return (
    <button 
      type="button"
      onClick={handleShare}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all group active:scale-95 z-20 ${className} ${status === 'copied' ? 'bg-emerald-600 text-white border-emerald-600' : ''}`}
      title="Share floral guide"
    >
      {status === 'copied' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform pointer-events-none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
      )}
      {!iconOnly && <span className="text-xs font-semibold">{status === 'copied' ? 'Copied!' : 'Share'}</span>}
      {status === 'copied' && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 z-30 font-bold border border-emerald-700/50">
          Link Copied to Clipboard!
        </div>
      )}
    </button>
  );
};

export default ShareButton;
