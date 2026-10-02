import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sendChatMessageApi } from '../services/api';
import { speakText, stopSpeech } from '../utils/speechUtils';
import { 
  Bot, 
  X, 
  Send, 
  Volume2, 
  Sparkles, 
  AlertTriangle, 
  MessageCircleQuestion, 
  CornerDownLeft,
  Mic
} from 'lucide-react';

export default function DiabetesAssistantModal({ isOpen, onClose }) {
  const { currentSenior, language } = useApp();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello ${currentSenior?.name ? currentSenior.name.split(' ')[0] : 'friend'}! I am your DiaCare diabetes companion. You can ask about your past readings, upcoming medicines, or healthy walking habits.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickQuestions = [
    { label: 'Latest Sugar', q: 'What is my latest blood sugar reading?' },
    { label: 'Next Medicine', q: 'When is my next medicine scheduled?' },
    { label: 'Walking Tips', q: 'How long should I walk after meals?' },
    { label: 'Weekly Summary', q: 'Can you summarize my weekly routine?' }
  ];

  const handleSend = async (textToSend = null) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessageApi({
        message: text,
        patientId: currentSenior?.id || currentSenior?._id,
        language
      });

      const assistantMsg = {
        role: 'assistant',
        text: res.reply || 'Please consult your doctor for personalized medical questions.'
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'I could not connect right now. Your health records are safe in your daily dashboard.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full h-[85vh] max-h-[680px] flex flex-col border border-slate-200 text-slate-900 overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Bot size={22} />
            </div>
            <div>
              <h3 id="assistant-title" className="font-bold text-lg text-white">
                DiaCare Companion
              </h3>
              <p className="text-xs text-teal-300 flex items-center gap-1">
                <Sparkles size={12} />
                <span>Grounded with your MongoDB logs</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close assistant"
          >
            <X size={22} />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center gap-2 shrink-0">
          <AlertTriangle size={15} className="shrink-0 text-amber-700" />
          <span>Informational only. Cannot diagnose or change prescription doses.</span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-base leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                }`}
              >
                <p>{m.text}</p>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => speakText(m.text, language)}
                    className="mt-2 text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                    title="Read aloud"
                  >
                    <Volume2 size={14} />
                    <span>Read Aloud</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-slate-500 text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                <span>DiaCare is checking your health logs...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q.q)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 text-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your sugar, medicines..."
              className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold p-3 rounded-xl touch-target-senior cursor-pointer shadow-md"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
