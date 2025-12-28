
import React, { useState } from 'react';
import { AppMode, FlowerSuggestion } from './types';
import { getFlowerStyling, generateFlowerImage } from './services/geminiService';
import CameraModule from './components/CameraModule';
import SubscriptionView from './components/SubscriptionView';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.IDENTIFY);
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlowerSuggestion | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputName.trim()) return;
    
    setLoading(true);
    setResult(null);
    setCapturedImage(null);
    setGeneratedImage(null);
    setShareStatus('idle');
    try {
      const data = await getFlowerStyling(inputName);
      setResult(data);
      // Generate a visual example based on the results
      const img = await generateFlowerImage(`A stunning arrangement of ${data.name} with ${data.complementaryFlowers.slice(0, 2).join(' and ')}. Elegant bouquet style.`);
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
    setShareStatus('idle');
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

  const handleShare = async () => {
    if (!result) return;

    const shareData = {
      title: `PetalPath: Styling guide for ${result.name}`,
      text: `Check out these floral styling tips for ${result.name}! 🌸 Meaning: ${result.meaning}. Suggested palette: ${result.colorPalette.join(', ')}.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const textToCopy = `${shareData.title}\n\n${shareData.text}\n\nShared from PetalPath.`;
        await navigator.clipboard.writeText(textToCopy);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
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
            {/* Hero Section */}
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

            {/* Input Controls */}
            <div className="glass p-6 rounded-3xl shadow-xl space-y-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Enter flower name (e.g., Peony, Eucalyptus)"
                    className="w-full bg-white/50 border border-emerald-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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

            {/* Loading State */}
            {loading && (
              <div className="text-center py-20 animate-pulse">
                <div className="inline-block w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-2xl font-serif text-emerald-900">PetalPath AI is styling...</h3>
                <p className="text-emerald-600">Analyzing form, texture, and colors</p>
              </div>
            )}

            {/* Results Display */}
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
                        <button 
                          onClick={handleShare}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                          <span className="text-sm font-semibold">
                            {shareStatus === 'copied' ? 'Copied!' : 'Share'}
                          </span>
                        </button>
                      </div>
                      <p className="text-emerald-900/80 leading-relaxed text-lg">
                        {result.meaning}
                      </p>
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
                    <div className="md:w-1/2 bg-emerald-50 flex items-center justify-center p-10 overflow-hidden min-h-[400px]">
                      {capturedImage ? (
                        <img src={capturedImage} alt="User captured" className="w-full h-full object-cover rounded-2xl shadow-lg aspect-square" />
                      ) : generatedImage ? (
                        <div className="relative group w-full h-full">
                           <img src={generatedImage} alt="Stylist's example" className="w-full h-full object-cover rounded-2xl shadow-xl aspect-square animate-in zoom-in-95 duration-500" />
                           <div className="absolute bottom-4 left-4 right-4 glass px-4 py-2 rounded-xl text-center">
                              <p className="text-xs font-serif text-emerald-900 italic">Stylist's Recommended Arrangement</p>
                           </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 animate-pulse">
                          <div className="text-6xl">🎨</div>
                          <p className="text-emerald-800 font-serif italic text-lg">Generating visual example...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-3xl font-serif text-emerald-950 text-center">Wrapping & Bouquet Guides</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {result.wrappingTechniques.map((tech, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 flex flex-col hover:shadow-md transition-shadow">
                        <div className="mb-4">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-tighter">
                            {tech.occasion}
                          </span>
                        </div>
                        <h4 className="font-bold text-emerald-950 mb-2">Technique</h4>
                        <p className="text-sm text-emerald-900/70 mb-4 flex-1">{tech.description}</p>
                        <div className="space-y-3 pt-4 border-t border-emerald-50">
                          <div>
                            <span className="text-[10px] font-black text-emerald-400 block mb-1 uppercase tracking-widest">Essential Materials</span>
                            <p className="text-xs text-emerald-800">{tech.materials.join(' • ')}</p>
                          </div>
                          <p className="text-xs italic text-emerald-600">
                            <span className="font-bold not-italic">Notes:</span> {tech.styleNotes}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <SubscriptionView />
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
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
    </div>
  );
};

export default App;
