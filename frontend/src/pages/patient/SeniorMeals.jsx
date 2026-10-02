import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { logMealApi } from '../../services/api';
import { 
  Utensils, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SeniorMeals() {
  const { currentSenior, setSyncToast } = useApp();
  const [activeCategory, setActiveCategory] = useState('breakfast');
  const [customDescription, setCustomDescription] = useState('');
  const [loggedNotice, setLoggedNotice] = useState(false);

  const categories = [
    { key: 'breakfast', label: 'Breakfast (नाश्ता)' },
    { key: 'lunch', label: 'Lunch (दोपहर का भोजन)' },
    { key: 'dinner', label: 'Dinner (रात का भोजन)' },
    { key: 'snacks', label: 'Snacks (हल्का नाश्ता)' },
    { key: 'festival', label: 'Festival / Fasting (त्योहार / उपवास)' }
  ];

  const mealGuidance = {
    breakfast: {
      recommendations: [
        'Vegetable Oats Upma with carrot, beans & peas',
        'Besan Chilla / Moong Dal Chilla with mint chutney',
        '2 Steamed Idlis with hot Sambar (rich in dal & vegetables)',
        'Sprouted Moong Salad with lemon & boiled egg whites'
      ],
      tip: 'Eat within 1-2 hours of waking to maintain stable morning glucose.'
    },
    lunch: {
      recommendations: [
        '1-2 Whole Wheat / Multigrain Rotis + 1 bowl Dal + Green Sabzi (Palak, Methi, Bhindi)',
        'Brown Rice or Quinoa (moderate portion) with Lauki/Tinda curry & fresh salad',
        'Curd (Dahi) with roasted jeera to aid digestion and provide protein'
      ],
      tip: 'Fill half your plate with non-starchy vegetables and green salads.'
    },
    dinner: {
      recommendations: [
        'Light Moong Dal Khichdi with extra chopped vegetables & curd',
        'Paneer Bhurji with 1 Roti and hot vegetable soup',
        'Steamed Fish / Grilled Chicken (non-veg option) with sautéed vegetables'
      ],
      tip: 'Have dinner at least 2 hours before sleep to prevent overnight glucose elevations.'
    },
    snacks: {
      recommendations: [
        'Roasted Chana (भुना चना) or Makhana (fox nuts)',
        'A handful of almonds (बादाम) and walnuts (अखरोट)',
        'Sprouted Chana / Moong Chaat with lemon & cucumber',
        'Warm herbal green tea without sugar'
      ],
      tip: 'Avoid deep-fried biscuits, farsan, or sugary tea.'
    },
    festival: {
      recommendations: [
        'Navratri/Ekadashi Fasting: Roasted Makhana, boiled sweet potato (small portion), cucumber salad, plain buttermilk',
        'Avoid deep-fried Sabudana Vada or sweetened Kheer; choose roasted nuts & plain fruit slices',
        'Maintain frequent sips of water to prevent dehydration during fasting hours'
      ],
      tip: 'If experiencing sudden dizziness during a religious fast, have immediate water and a light permitted snack.'
    }
  };

  const handleQuickLog = async (itemText) => {
    try {
      await logMealApi(currentSenior?.id || currentSenior?._id, {
        mealType: activeCategory === 'festival' ? 'festival_fasting' : activeCategory,
        foodItems: [itemText],
        description: itemText,
        estimatedCarbsLevel: 'medium'
      });
      setLoggedNotice(true);
      setSyncToast(`Logged: "${itemText}"`);
      setTimeout(() => setLoggedNotice(false), 4000);
    } catch (e) {
      alert('Could not log meal: ' + e.message);
    }
  };

  const currentGuide = mealGuidance[activeCategory];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/patient"
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Indian Food & Diabetes Guidance
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Educational meal ideas tailored for steady geriatric blood sugar
          </p>
        </div>
      </div>

      {loggedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>Meal recorded in your daily log!</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-3 rounded-2xl font-bold text-sm shrink-0 transition-all cursor-pointer ${
              activeCategory === cat.key
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Recommendations Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 capitalize flex items-center gap-2">
            <Utensils size={20} className="text-teal-600" />
            <span>Recommended Choices</span>
          </h2>
          <span className="text-xs font-semibold text-slate-400 uppercase">Tap to log</span>
        </div>

        <div className="space-y-3">
          {currentGuide.recommendations.map((food, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/50 hover:border-teal-300 transition-all flex items-center justify-between gap-3 group"
            >
              <span className="font-bold text-base text-slate-900 leading-snug">{food}</span>
              <button
                onClick={() => handleQuickLog(food)}
                className="bg-white group-hover:bg-teal-700 group-hover:text-white text-slate-700 font-bold px-3 py-1.5 rounded-xl border border-slate-300 group-hover:border-teal-700 text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                Log This
              </button>
            </div>
          ))}
        </div>

        {/* Nutritional Tip */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
          <Sparkles size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Healthy Eating Tip:</strong> {currentGuide.tip}
          </div>
        </div>
      </section>

      {/* Mandatory Clinical Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 leading-relaxed italic text-center">
        * General educational guidance only. Always ask your doctor or certified clinical dietitian for advice and carbohydrate limits specific to your kidney, heart, and metabolic profile.
      </div>
    </div>
  );
}
