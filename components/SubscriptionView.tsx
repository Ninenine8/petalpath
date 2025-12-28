
import React, { useState, useEffect } from 'react';
import { getSubscriptionPlan, generateFlowerImage } from '../services/geminiService';
import { SubscriptionPlan } from '../types';

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
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not available');
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (clipErr) {
        console.error('Sharing failed:', clipErr);
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
          Link copied!
        </span>
      )}
    </button>
  );
};

const WeekCard: React.FC<{ week: any; onImageClick: (url: string, meta: { title: string, text: string }) => void }> = ({ week, onImageClick }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);

  const shareTitle = `PetalPath: Week ${week.week} Arrangement`;
  const shareText = `Check out this ${week.mainFlower} design for my floral subscription plan! Vibe: ${week.vibe}`;

  useEffect(() => {
    const fetchImg = async () => {
      setLoadingImg(true);
      const url = await generateFlowerImage(`A ${week.vibe} floral arrangement featuring ${week.mainFlower} and ${week.secondaryFlowers.join(', ')}. Theme: ${week.theme}.`);
      setImgUrl(url);
      setLoadingImg(false);
    };
    fetchImg();
  }, [week]);

  return (
    <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-emerald-50 hover:shadow-md transition-shadow flex flex-col group">
      <div className="h-48 bg-emerald-50 overflow-hidden relative">
        {loadingImg ? (
          <div className="w-full h-full flex items-center justify-center animate-pulse">
            <span className="text-2xl">🌱</span>
          </div>
        ) : imgUrl ? (
          <>
            <img 
              src={imgUrl} 
              alt={week.mainFlower} 
              onClick={() => onImageClick(imgUrl, { title: shareTitle, text: shareText })}
              className="w-full h-full object-cover animate-in fade-in duration-500 cursor-zoom-in hover:brightness-95 transition-all" 
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
      </div>
      <div className="p-6 space-y-4 flex-1">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Week {week.week}</span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">{week.vibe}</span>
        </div>
        <div>
          <h4 className="text-xl font-serif text-emerald-900 mb-1">{week.mainFlower}</h4>
          <p className="text-sm text-emerald-600 font-medium">{week.theme}</p>
        </div>
        <div className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 block mb-1 uppercase">Pairings</span>
            <div className="flex flex-wrap gap-1">
              {week.secondaryFlowers.map((f: string) => (
                <span key={f} className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded-md text-neutral-600 font-medium">{f}</span>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-emerald-50">
            <p className="text-xs italic text-emerald-800">
              <span className="font-bold not-italic">Pro Tip:</span> {week.careTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SubscriptionViewProps {
  onImageClick?: (url: string, meta: { title: string, text: string }) => void;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onImageClick }) => {
  const [vibe, setVibe] = useState('Romantic Blush');
  const [customVibe, setCustomVibe] = useState('');
  const [likedFlowers, setLikedFlowers] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  const vibes = [
    { label: 'Wild & Bohemian', emoji: '🌿' },
    { label: 'Classic Elegance', emoji: '🏛️' },
    { label: 'Modern Minimalist', emoji: '⚪' },
    { label: 'Romantic Blush', emoji: '🌸' },
    { label: 'Tropical Vibrant', emoji: '🍍' },
    { label: 'Custom', emoji: '✨' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setPlan(null);
    const finalVibe = vibe === 'Custom' ? customVibe : vibe;
    try {
      const data = await getSubscriptionPlan(finalVibe || 'Seasonal Surprise', likedFlowers);
      setPlan(data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-serif text-emerald-950">Weekly Bloom Scheduler</h2>
        <p className="text-emerald-700/70 text-lg">Design a 4-week floral journey curated by AI for your home.</p>
      </div>

      <div className="glass rounded-[32px] p-8 md:p-12 shadow-xl border border-emerald-50 space-y-8">
        <div className="space-y-6">
          <label className="text-sm font-black text-emerald-500 uppercase tracking-widest block text-center">
            Choose Your Aesthetic
          </label>
          <div className="flex flex-wrap justify-center gap-3">
            {vibes.map((v) => (
              <button
                key={v.label}
                onClick={() => setVibe(v.label)}
                disabled={loading}
                className={`px-6 py-3 rounded-2xl flex items-center gap-2 transition-all duration-300 ${
                  vibe === v.label 
                    ? 'bg-emerald-700 text-white shadow-lg -translate-y-1' 
                    : 'bg-white text-emerald-800 border border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <span>{v.emoji}</span>
                <span className="font-medium">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {vibe === 'Custom' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest block ml-2">
              Describe your mood or custom vibe
            </label>
            <input
              type="text"
              value={customVibe}
              onChange={(e) => setCustomVibe(e.target.value)}
              placeholder="e.g., Moody Dark Academia, Sunset Over Sahara, Cottagecore Kitchen"
              className="w-full bg-white border border-emerald-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-black placeholder:text-emerald-800/20"
            />
          </div>
        )}

        <div className="space-y-3">
          <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest block ml-2">
            Do you have any preferred flowers?
          </label>
          <div className="relative">
            <input
              type="text"
              value={likedFlowers}
              onChange={(e) => setLikedFlowers(e.target.value)}
              placeholder="e.g., Lilies, Peonies, Baby's Breath..."
              className="w-full bg-white border border-emerald-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-black placeholder:text-emerald-800/20"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
          </div>
          <p className="text-[10px] text-emerald-700/40 ml-2">Our AI will try to include these in your weekly rotations!</p>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || (vibe === 'Custom' && !customVibe.trim())}
          className="w-full bg-emerald-700 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-xl shadow-emerald-700/20"
        >
          {loading ? 'Curating Your Personalized Journey...' : 'Create My Subscription Plan'}
        </button>
      </div>

      {loading && (
        <div className="py-20 text-center animate-pulse space-y-6">
          <div className="inline-block w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2">
            <p className="text-xl font-serif text-emerald-900">PetalPath AI is selecting stems...</p>
            <p className="text-sm text-emerald-600">Matching textures and colors to your unique vibe</p>
          </div>
        </div>
      )}

      {plan && !loading && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
          <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-emerald-50 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <div className="space-y-4">
              <h3 className="text-4xl font-serif text-emerald-950">{plan.title}</h3>
              <p className="text-emerald-800 text-lg max-w-2xl mx-auto leading-relaxed italic">{plan.description}</p>
            </div>
            <ShareButton 
              title={`PetalPath Subscription: ${plan.title}`}
              text={`I just generated a custom floral subscription plan: "${plan.title}" - ${plan.description}`}
              className="absolute top-6 right-6 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plan.weeks.map((week) => (
              <WeekCard 
                key={week.week} 
                week={week} 
                onImageClick={onImageClick || (() => {})} 
              />
            ))}
          </div>
          
          <div className="text-center py-10 border-t border-emerald-100">
             <button 
               onClick={() => { setPlan(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
               className="text-emerald-600 font-bold hover:text-emerald-800 transition-colors uppercase tracking-widest text-xs"
             >
               Start Over / Change Preferences
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionView;
