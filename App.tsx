
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
    
    // Fallback URL if running in a restricted environment
    const currentUrl = window.location.href.includes('http') ? window.location.href : 'https://petalpath.app';
    
    const shareData = {
      title: title,
      text: text,
      url: currentUrl,
    };

    const textToCopy = `${title}\n\n${text}\n\nShared from PetalPath: ${currentUrl}`;

    try {
      // Priority 1: Web Share API (Mobile/Modern)
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      throw new Error('Share API not supported');
    } catch (err) {
      // Priority 2: Clipboard API (Desktop)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          setStatus('copied');
          setTimeout(() => setStatus('idle'), 2000);
          return;
        }
        throw new Error('Clipboard not available');
      } catch (clipErr) {
        // Priority 3: Fail-safe Prompt
        window.prompt("Share this floral guide:", textToCopy);
      }
    }
  };

  return (
    <button 
      type="button"
      onClick={handleShare}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all group active:scale-95 z-20 ${className}`}
      title="Share content"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform pointer-events-none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
      {!iconOnly && <span className="text-xs font-semibold">{status === 'copied' ? 'Copied!' : 'Share'}</span>}
      {status === 'copied' && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 z-30 font-bold">
          Link Copied!
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

  const shareTitle = `PetalPath Styling: ${tech.occasion}`;
  const shareText = `Check out this ${tech.occasion} wrapping style for ${flowerName}! ${tech.styleNotes}`;

  useEffect(() => {
    const fetchImg = async () => {
      setLoadingImg(true);
      const url = await generateFlowerImage(
        `A professional floral arrangement of ${flowerName} styled for a ${tech.occasion} occasion, strictly following a color palette of ${colorPalette.join(', ')}. ${tech.description}. Artistic bouquet photography.`
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
      const img = await generateFlowerImage(`A stunning, artistic arrangement of ${data.name} featuring textures of ${data.complementaryFlowers.slice(0, 2).join(' and ')}. High-end floral design.`);
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
          <button onClick={() => setMode(AppMode.IDENTIFY)} className={`text-sm font-medium transition-colors ${mode === AppMode.IDENTIFY ? 'text-emerald-700' : 'text-neutral-400 hover:text-emerald-600'}`}>Stylist</button>
          <button onClick={() => setMode(AppMode.SUBSCRIPTION)} className={`text-sm font-medium transition-colors ${mode === AppMode.SUBSCRIPTION ? 'text-emerald-700' : 'text-neutral-400 hover:text-emerald-600'}`}>Subscriptions</button>
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-12">
        {mode === AppMode.IDENTIFY ? (
          <div className="max-w-3xl mx-auto space-y-12">
            {!result && !loading && (
              <div className="text-center space-y-4 mb-12 animate-in fade-in duration-1000">
                <h2 className="text-5xl font-serif text-emerald-950 leading-tight">Design Your <br />Perfect Arrangement</h2>
                <p className="text-lg text-emerald-800/70 max-w-lg mx-auto">Take a photo of your flowers or search by name to receive expert wrapping guides and styling advice.</p>
              </div>
            )}

            <div className="glass p-6 rounded-3xl shadow-xl space-y-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Enter flower name (e.g., Peony, Eucalyptus)"
                  className="w-full bg-white/50 border border-emerald-100 rounded-2xl py-4 px-6 outline-none transition-all text-black placeholder:text-emerald-800/40"
                />
                <button type="submit" disabled={loading} className="bg-emerald-700 text-white px-8 rounded-2xl font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50">Ask Stylist</button>
              </form>
              <button onClick={() => setShowCamera(true)} className="w-full bg-white border-2 border-dashed border-emerald-200 py-8 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-emerald-50 transition-all group">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg></div>
                <span className="text-emerald-900 font-medium">Use AI Camera to Identify</span>
              </button>
            </div>

            {loading && (
              <div className="text-center py-20 animate-pulse">
                <div className="inline-block w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-2xl font-serif text-emerald-900">PetalPath AI is styling...</h3>
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
                          {result.botanicalName && <p className="text-emerald-700 italic font-medium">{result.botanicalName}</p>}
                        </div>
                        <ShareButton title={`PetalPath: ${result.name}`} text={`Floral styling guide for ${result.name}. Meaning: ${result.meaning}`} className="bg-emerald-50 text-emerald-700" />
                      </div>
                      <p className="text-emerald-900/80 leading-relaxed text-lg">{result.meaning}</p>
                      <div className="bg-emerald-50/50 rounded-2xl p-6 grid grid-cols-3 gap-4 border border-emerald-100">
                        <div className="flex flex-col items-center text-center space-y-2">
                          <span className="text-[10px] font-black text-emerald-400 uppercase block">Water</span>
                          <span className="text-xs text-emerald-900 font-medium">{result.careInstructions.watering}</span>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2 border-x border-emerald-100">
                          <span className="text-[10px] font-black text-emerald-400 uppercase block">Sun</span>
                          <span className="text-xs text-emerald-900 font-medium">{result.careInstructions.sunlight}</span>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2">
                          <span className="text-[10px] font-black text-emerald-400 uppercase block">Temp</span>
                          <span className="text-xs text-emerald-900 font-medium">{result.careInstructions.temperature}</span>
                        </div>
                      </div>
                    </div>
                    <div className="md:w-1/2 bg-emerald-50 flex items-center justify-center p-10 overflow-hidden min-h-[400px] relative">
                      {capturedImage ? (
                        <>
                          <img src={capturedImage} alt="User captured" onClick={() => setLightbox({ url: capturedImage, title: `My ${result.name} Find`, text: `Spotted this beautiful specimen!` })} className="w-full h-full object-cover rounded-2xl shadow-lg aspect-square cursor-zoom-in" />
                          <ShareButton title={`PetalPath Find: ${result.name}`} text={`I found this beautiful ${result.name}!`} className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm text-emerald-700 shadow-xl" iconOnly />
                        </>
                      ) : generatedImage ? (
                        <div className="relative w-full h-full">
                           <img src={generatedImage} alt="Stylist's example" onClick={() => setLightbox({ url: generatedImage, title: `${result.name} Arrangement`, text: `Signature styling from PetalPath.` })} className="w-full h-full object-cover rounded-2xl shadow-xl aspect-square cursor-zoom-in" />
                           <ShareButton title={`PetalPath Guide: ${result.name}`} text={`Signature arrangement for ${result.name}.`} className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm text-emerald-700 shadow-xl" iconOnly />
                        </div>
                      ) : <div className="text-center animate-pulse"><div className="text-6xl">🎨</div></div>}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-serif text-emerald-950">Wrapping & Bouquet Guides</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {result.wrappingTechniques.map((tech, idx) => (
                      <TechniqueCard key={idx} tech={tech} flowerName={result.name} colorPalette={result.colorPalette} onImageClick={(url, meta) => setLightbox({ url, ...meta })} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : <SubscriptionView onImageClick={(url, meta) => setLightbox({ url, ...meta })} />}
      </main>

      {showCamera && <CameraModule onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in" onClick={() => setLightbox(null)}>
          <div className="absolute top-6 right-6 flex items-center gap-4">
            <ShareButton title={lightbox.title} text={lightbox.text} className="bg-white/20 text-white hover:bg-white/30 border border-white/20 px-4 py-2" />
            <button className="p-2 text-white/50" onClick={() => setLightbox(null)}><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
          <img src={lightbox.url} alt="Full size" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl cursor-zoom-out" />
        </div>
      )}
    </div>
  );
};

export default App;
