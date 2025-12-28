
import React, { useState, useEffect } from 'react';
import { getSubscriptionPlan, generateFlowerImage } from '../services/geminiService';
import { SubscriptionPlan } from '../types';

const WeekCard: React.FC<{ week: any }> = ({ week }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);

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
    <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-emerald-50 hover:shadow-md transition-shadow flex flex-col">
      <div className="h-48 bg-emerald-50 overflow-hidden relative">
        {loadingImg ? (
          <div className="w-full h-full flex items-center justify-center animate-pulse">
            <span className="text-2xl">🌱</span>
          </div>
        ) : imgUrl ? (
          <img src={imgUrl} alt={week.mainFlower} className="w-full h-full object-cover animate-in fade-in duration-500" />
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

const SubscriptionView: React.FC = () => {
  const [vibe, setVibe] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  const vibes = [
    { label: 'Wild & Bohemian', emoji: '🌿' },
    { label: 'Classic Elegance', emoji: '🏛️' },
    { label: 'Modern Minimalist', emoji: '⚪' },
    { label: 'Romantic Blush', emoji: '🌸' },
    { label: 'Tropical Vibrant', emoji: '🍍' },
  ];

  const handleGenerate = async (selectedVibe: string) => {
    setLoading(true);
    setVibe(selectedVibe);
    setPlan(null);
    try {
      const data = await getSubscriptionPlan(selectedVibe);
      setPlan(data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif text-emerald-900">Weekly Bloom Scheduler</h2>
        <p className="text-emerald-700/70">Design a 4-week floral journey curated by AI for your home.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {vibes.map((v) => (
          <button
            key={v.label}
            onClick={() => handleGenerate(v.label)}
            disabled={loading}
            className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all ${
              vibe === v.label 
                ? 'bg-emerald-600 text-white shadow-lg scale-105' 
                : 'bg-white text-emerald-800 border border-emerald-100 hover:border-emerald-300'
            }`}
          >
            <span>{v.emoji}</span>
            {v.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-20 text-center animate-pulse">
          <div className="inline-block w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-800 font-medium">Curating your seasonal bouquet selection...</p>
        </div>
      )}

      {plan && !loading && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-50 text-center">
            <h3 className="text-2xl font-serif text-emerald-900 mb-2">{plan.title}</h3>
            <p className="text-emerald-700 italic">{plan.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plan.weeks.map((week) => (
              <WeekCard key={week.week} week={week} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionView;
