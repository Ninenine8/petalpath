
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
    
    const currentUrl = window.location.href.includes('http') ? window.location.href : 'https://petalpath.app';
    
    const shareData = {
      title: title,
      text: text,
      url: currentUrl,
    };

    const textToCopy = `${title}\n\n${text}\n\nShared from PetalPath: ${currentUrl}`;

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      throw new Error();
    } catch (err) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          setStatus('copied');
          setTimeout(() => setStatus('idle'), 2000);
          return;
        }
        throw new Error();
      } catch (clipErr) {
        window.prompt("Share your floral plan:", textToCopy);
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
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 z-30 font-bold">
          Copied!
        </span>
      )}
    </button>
  );
};

const WeekCard: React.FC<{ week: any; onImageClick: (url: string, meta: { title: string, text: string }) => void }> = ({ week, onImageClick }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);

  const shareTitle = `PetalPath: Week ${week.week} Design`;
  const shareText = `Check out this ${week.mainFlower} arrangement for my floral plan! Theme: ${week.theme}`;

  useEffect(() => {
    const fetchImg = async () => {
      setLoadingImg(true);
      const url = await generateFlowerImage(`A ${week.vibe} floral arrangement featuring ${week.mainFlower} and ${week.secondaryFlowers.join(', ')}.`);
      setImgUrl(url);
      setLoadingImg(false);
    };
    fetchImg();
  }, [week]);

  return (
    <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-emerald-50 flex flex-col group">
      <div className="h-48 bg-emerald-50 overflow-hidden relative">
        {loadingImg ? (
          <div className="w-full h-full flex items-center justify-center animate-pulse"><span className="text-2xl">🌱</span></div>
        ) : imgUrl ? (
          <>
            <img src={imgUrl} alt={week.mainFlower} onClick={() => onImageClick(imgUrl, { title: shareTitle, text: shareText })} className="w-full h-full object-cover cursor-zoom-in" />
            <ShareButton title={shareTitle} text={shareText} className="absolute bottom-3 right-3 bg-white/95 text-emerald-700 shadow-md border border-white/50" iconOnly />
          </>
        ) : <div className="w-full h-full flex items-center justify-center text-emerald-200"><span className="text-4xl">🌸</span></div>}
      </div>
      <div className="p-6 space-y-4 flex-1">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Week {week.week}</span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">{week.vibe}</span>
        </div>
        <h4 className="text-xl font-serif text-emerald-900">{week.mainFlower}</h4>
        <p className="text-xs italic text-emerald-800"><span className="font-bold not-italic">Pro Tip:</span> {week.careTip}</p>
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
      alert("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-serif text-emerald-950">Weekly Bloom Scheduler</h2>
        <p className="text-emerald-700/70 text-lg">Curated 4-week journeys for your home.</p>
      </div>

      <div className="glass rounded-[32px] p-8 shadow-xl border border-emerald-50 space-y-8">
        <div className="flex flex-wrap justify-center gap-3">
          {vibes.map((v) => (
            <button key={v.label} onClick={() => setVibe(v.label)} disabled={loading} className={`px-6 py-3 rounded-2xl flex items-center gap-2 transition-all ${vibe === v.label ? 'bg-emerald-700 text-white shadow-lg' : 'bg-white text-emerald-800 border border-emerald-100'}`}>
              <span>{v.emoji}</span><span className="font-medium">{v.label}</span>
            </button>
          ))}
        </div>
        {vibe === 'Custom' && (
          <input type="text" value={customVibe} onChange={(e) => setCustomVibe(e.target.value)} placeholder="Describe your mood..." className="w-full bg-white border border-emerald-100 rounded-2xl py-4 px-6 outline-none transition-all" />
        )}
        <input type="text" value={likedFlowers} onChange={(e) => setLikedFlowers(e.target.value)} placeholder="Any preferred flowers? (e.g., Peonies)" className="w-full bg-white border border-emerald-100 rounded-2xl py-4 px-6 outline-none transition-all" />
        <button onClick={handleGenerate} disabled={loading} className="w-full bg-emerald-700 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-800 transition-all">
          {loading ? 'Curating Journey...' : 'Create My Subscription Plan'}
        </button>
      </div>

      {loading && <div className="py-20 text-center animate-pulse text-emerald-900 font-serif">Selecting stems...</div>}

      {plan && !loading && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8">
          <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-emerald-50 text-center relative overflow-hidden">
            <h3 className="text-4xl font-serif text-emerald-950">{plan.title}</h3>
            <p className="text-emerald-800 text-lg mt-4 italic">{plan.description}</p>
            <ShareButton title={plan.title} text={plan.description} className="absolute top-6 right-6 bg-emerald-50 text-emerald-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plan.weeks.map((week) => (
              <WeekCard key={week.week} week={week} onImageClick={onImageClick || (() => {})} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionView;
