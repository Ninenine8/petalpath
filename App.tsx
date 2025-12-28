
import React, { useState, useEffect } from 'react';
import { AppMode, FlowerSuggestion } from './types';
import { getFlowerStyling, generateFlowerImage } from './services/geminiService';
import CameraModule from './components/CameraModule';
import SubscriptionView from './components/SubscriptionView';

const ShareButton: React.FC<{ 
  title: string; 
  text: string; 
  className?: string;
  iconOnly?: boolean;
}> = ({ title, text, className = "", iconOnly = false }) => {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareData = {
      title: title,
      text: text,
      url: window.location.href,
    };

    const textToCopy = `${title}\n\n${text}\n\nShared from PetalPath: ${window.location.href}`;

    try {
      if (navigator.share) {
        // Native share for mobile/supported browsers
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not available');
      }
    } catch (err) {
      // Fallback to clipboard for desktop/unsupported browsers
      try {
        await navigator.clipboard.writeText(textToCopy);
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (clipErr) {
        console.error('Sharing and Copying failed:', clipErr);
      }
    }
  };

  return (
    <button 
      type="button"
      onClick={handleShare}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all group active:scale-95 z-20 ${className}`}
      title="Share this"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform pointer-events-none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
      {!iconOnly && <span className="text-xs font-semibold">{status === 'copied' ? 'Copied!' : 'Share'}</span>}
      {status === 'copied' && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 z-30">
          Link copied to clipboard!
        </span>
      )}
    </button>
  );
};

const TechniqueCard: React.FC<{ 
  tech: any; 
  flowerName: string;
  colorPalette: string[];
  onImageClick: (url: string, metadata: { title: string, text: string }) => void 
}> = ({ tech, flowerName, colorPalette, onImageClick }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);

  const shareTitle = `PetalPath: ${tech.occasion} Styling Guide`;
  const shareText = `Check out this ${tech.occasion} wrapping style for ${flowerName}! ${tech.styleNotes}`;

  useEffect(() => {
    const fetchImg = async () => {
      setLoadingImg(true);
      const url = await generateFlowerImage(
        `A professional floral arrangement of ${flowerName} styled for a ${tech.occasion} occasion, strictly following a color palette of ${colorPalette.join(', ')}. ${tech.description}. Using materials like ${tech.materials.join(', ')}. Artistic bouquet photography.`
      );
      setImgUrl(url);
      setLoadingImg(false);
    };
    fetchImg();
  }, [tech, flowerName, colorPalette]);

  return (
    <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-emerald-50 flex flex-col hover:shadow-md transition-shadow group">
      <div className="h-48 bg-emerald-50 overflow-hidden relative">
        {loadingImg ? (
          <div className="w-full h-full flex items-center justify-center animate-pulse">
            <span className="text-2xl">🎀</span>
          </div>
        ) : imgUrl ? (
          <>
            <img 
              src={imgUrl} 
              alt={`${tech.occasion} style`} 
              onClick={() => onImageClick(imgUrl, { title: shareTitle, text: shareText })}
              className="w-full h-full object-cover animate-in fade-in duration-500 cursor-zoom-in hover:scale-105 transition-transform" 
            />
            <ShareButton 
              title={shareTitle}
              text={shareText}
              className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-emerald-700 shadow-md border border-white/50"
              iconOnly
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-200">
            <span className="text-4xl">🌸</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold rounded-full shadow-sm uppercase tracking-tighter">
            {tech.occasion}
          </span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h4 className="font-bold text-emerald-950 mb-2">Style Guide</h4>
        <p className="text-sm text-emerald-900/70 mb-4 flex-1 leading-relaxed">{tech.description}</p>
        <div className="space-y-3 pt-4 border-t border-emerald-50">
          <div>
            <span className="text-[10px] font-black text-emerald-400 block mb-1 uppercase tracking-widest">Required Materials</span>
            <p className="text-xs text-emerald-800">{tech.materials.join(' • ')}</p>
          </div>
          <p className="text-xs italic text-emerald-600">
            <span className="font-bold not-italic text-emerald-500">Stylist's Note:</span> {tech.styleNotes}
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.IDENTIFY);
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlowerSuggestion | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string, title: string, text: string } | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputName.trim()) return;
    
    setLoading(true);
    setResult(null);
    setCapturedImage(null);
    setGeneratedImage(null);
    try {
      const data = await getFlowerStyling(inputName);
      setResult(data);
      const img = await generateFlowerImage(`A stunning, artistic arrangement of ${data.name} featuring a harmonious color palette of ${data.colorPalette.join(', ')}. Accompanied by textures of ${data.complementaryFlowers.slice(0, 2).join(' and ')}. High-end floral design.`);
      setGeneratedImage(img);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = async (base64: string) => {
    setShowCamera(false);
    setLoading(true);
    setResult(null);
    setGeneratedImage(null);
    setCapturedImage(`data:image/jpeg;base64,${base64}`);
    try {
      const data = await getFlowerStyling({ base64, mimeType: 'image/jpeg' });
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze image. Try a clearer shot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 glass border-b border-emerald-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl">
            🌸
          </div>
          <h1 className="text-2xl font-serif font-bold text-emerald-900 tracking-tight">PetalPath</h1>
        </div>
        <nav className="hidden md:flex gap-8">
          <button 
            onClick={() => setMode(AppMode.IDENTIFY)}
            className={`text-sm font-medium transition-colors ${mode === AppMode.IDENTIFY ? 'text-emerald-700' : 'text-neutral-400 hover:text-emerald-600'}`}
          >
            Stylist
          </button>
          <button 
            onClick={() => setMode(AppMode.SUBSCRIPTION)}
            className={`text-sm font-medium transition-colors ${mode === AppMode.SUBSCRIPTION ? 'text-emerald-700' : 'text-neutral-400 hover:text-emerald-600'}`}
          >
            Subscriptions
          </button>
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-12">
        {mode === AppMode.IDENTIFY ? (
          <div className="max-w-3xl mx-auto space-y-12">
            {!result && !loading && (
              <div className="text-center space-y-4 mb-12 animate-in fade-in duration-1000">
                <h2 className="text-5xl font-serif text-emerald-950 leading-tight">
                  Design Your <br />Perfect Arrangement
                </h2>
                <p className="text-lg text-emerald-800/70 max-w-lg mx-auto">
                  Take a photo of your flowers or search by name to receive expert wrapping guides and styling advice.
                </p>
              </div>
            )}

            <div className="glass p-6 rounded-3xl shadow-xl space-y-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Enter flower name (e.g., Peony, Eucalyptus)"
                    className="w-full bg-white/50 border border-emerald-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-black placeholder:text-emerald-800/40"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-700 text-white px-8 rounded-2xl font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50"
                >
                  Ask Stylist
                </button>
              </form>
              
              <div className="flex items-center gap-4">
                <div className="h-px bg-emerald-100 flex-1" />
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Or Capture</span>
                <div className="h-px bg-emerald-100 flex-1" />
              </div>

              <button 
                onClick={() => setShowCamera(true)}
                className="w-full bg-white border-2 border-dashed border-emerald-200 py-8 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                </div>
                <span className="text-emerald-900 font-medium">Use AI Camera to Identify</span>
              </button>
            </div>

            {loading && (
              <div className="text-center py-20 animate-pulse">
                <div className="inline-block w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-2xl font-serif text-emerald-900">PetalPath AI is styling...</h3>
                <p className="text-emerald-600">Analyzing form, texture, and colors</p>
              </div>
            )}

            {result && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-12">
                <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-emerald-50 relative">
                  <div className="md:flex">
                    <div className="md:w-1/2 p-10 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">Identified Species</span>
                          <h2 className="text-4xl font-serif text-emerald-950 capitalize">{result.name}</h2>
                          {result.botanicalName && (
                            <p className="text-emerald-700 italic font-medium">{result.botanicalName}</p>
                          )}
                        </div>
                        <ShareButton 
                          title={`PetalPath Styling: ${result.name}`}
                          text={`Check out these floral styling tips for ${result.name}! Meaning: ${result.meaning}`}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        />
                      </div>
                      <p className="text-emerald-900/80 leading-relaxed text-lg">
                        {result.meaning}
                      </p>

                      <div className="bg-emerald-50/50 rounded-2xl p-6 grid grid-cols-3 gap-4 border border-emerald-100">
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className="w-8 h-8 flex items-center justify-center text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Watering</span>
                            <span className="text-xs text-emerald-900 font-medium">{result.careInstructions.watering}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2 border-x border-emerald-100">
                          <div className="w-8 h-8 flex items-center justify-center text-amber-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Sunlight</span>
                            <span className="text-xs text-emerald-900 font-medium">{result.careInstructions.sunlight}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className="w-8 h-8 flex items-center justify-center text-rose-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Temp</span>
                            <span className="text-xs text-emerald-900 font-medium">{result.careInstructions.temperature}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Styling Palette</h4>
                        <div className="flex gap-2">
                          {result.colorPalette.map((color, idx) => (
                            <div 
                              key={idx} 
                              className="w-10 h-10 rounded-full border border-neutral-100 shadow-sm transition-transform hover:scale-110" 
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="md:w-1/2 bg-emerald-50 flex items-center justify-center p-10 overflow-hidden min-h-[400px] relative group">
                      {capturedImage ? (
                        <>
                          <img 
                            src={capturedImage} 
                            alt="User captured" 
                            onClick={() => setLightbox({ url: capturedImage, title: 'My Flower Discoveries', text: `Look at this beautiful ${result.name} I found with PetalPath!` })}
                            className="w-full h-full object-cover rounded-2xl shadow-lg aspect-square cursor-zoom-in hover:brightness-95 transition-all" 
                          />
                          <ShareButton 
                            title={`PetalPath Find: ${result.name}`}
                            text={`I found this beautiful ${result.name}! PetalPath is giving me amazing styling tips.`}
                            className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm text-emerald-700 shadow-xl border border-white/50"
                            iconOnly
                          />
                        </>
                      ) : generatedImage ? (
                        <div className="relative group w-full h-full">
                           <img 
                             src={generatedImage} 
                             alt="Stylist's example" 
                             onClick={() => setLightbox({ url: generatedImage, title: `${result.name} Styling`, text: `A professional ${result.name} arrangement suggested by PetalPath.` })}
                             className="w-full h-full object-cover rounded-2xl shadow-xl aspect-square animate-in zoom-in-95 duration-500 cursor-zoom-in hover:brightness-95 transition-all" 
                           />
                           <ShareButton 
                            title={`PetalPath Suggestion: ${result.name}`}
                            text={`Check out this professional arrangement for ${result.name} I designed on PetalPath!`}
                            className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm text-emerald-700 shadow-xl border border-white/50"
                            iconOnly
                           />
                           <div className="absolute bottom-4 left-4 right-4 glass px-4 py-2 rounded-xl text-center pointer-events-none">
                              <p className="text-xs font-serif text-emerald-900 italic">Signature Arrangement</p>
                           </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 animate-pulse">
                          <div className="text-6xl">🎨</div>
                          <p className="text-emerald-800 font-serif italic text-lg">Curating visual display...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-serif text-emerald-950">Wrapping & Bouquet Guides</h3>
                    <p className="text-emerald-700/60 mt-2 italic">Tailored techniques for every special moment</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {result.wrappingTechniques.map((tech, idx) => (
                      <TechniqueCard 
                        key={idx} 
                        tech={tech} 
                        flowerName={result.name}
                        colorPalette={result.colorPalette}
                        onImageClick={(url, meta) => setLightbox({ url, ...meta })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <SubscriptionView onImageClick={(url, meta) => setLightbox({ url, ...meta })} />
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-emerald-100 px-6 py-3 z-50">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setMode(AppMode.IDENTIFY)}
            className={`flex flex-col items-center gap-1 ${mode === AppMode.IDENTIFY ? 'text-emerald-600' : 'text-neutral-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8l4 4-4 4M8 12h7"></path></svg>
            <span className="text-[10px] font-bold">STYLIST</span>
          </button>
          <button 
            onClick={() => setMode(AppMode.SUBSCRIPTION)}
            className={`flex flex-col items-center gap-1 ${mode === AppMode.SUBSCRIPTION ? 'text-emerald-600' : 'text-neutral-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span className="text-[10px] font-bold">PLANS</span>
          </button>
        </div>
      </footer>

      {showCamera && (
        <CameraModule 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      {/* Improved Lightbox with Dedicated Share */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setLightbox(null)}
        >
          <div className="absolute top-6 left-6 flex flex-col gap-1 text-white/90 pr-20">
             <h4 className="text-xl font-serif">{lightbox.title}</h4>
             <p className="text-sm text-white/60">{lightbox.text}</p>
          </div>

          <div className="absolute top-6 right-6 flex items-center gap-4">
            <ShareButton 
              title={lightbox.title}
              text={lightbox.text}
              className="bg-white/20 text-white hover:bg-white/30 border border-white/20 px-4 py-2"
            />
            <button 
              className="p-2 text-white/50 hover:text-white transition-colors"
              onClick={() => setLightbox(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <img 
            src={lightbox.url} 
            alt="Full size" 
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 cursor-zoom-out" 
          />
        </div>
      )}
    </div>
  );
};

export default App;
