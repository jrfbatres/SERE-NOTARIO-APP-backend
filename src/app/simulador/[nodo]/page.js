'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '../../ThemeContext';

// Web Audio API Sound Synthesizer (Zero-dependency, offline-ready)
const playSound = (isCorrect) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    if (isCorrect) {
      // Success sound: Chime C5 -> E5 -> G5
      // Note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);

      // Note 3
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain3.gain.setValueAtTime(0.12, now + 0.16);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.16);
      osc3.stop(now + 0.45);
    } else {
      // Error sound: Detuned, buzzing low-frequency drone (Fuerte/Loud)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(130.81, now); // C3
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(127.0, now + 0.04); // Slightly detuned
      gain2.gain.setValueAtTime(0.25, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.65);
    }
  } catch (e) {
    console.error('Web Audio API was blocked or not supported:', e);
  }
};

export default function SimuladorPage() {
  const router = useRouter();
  const params = useParams();
  const nodo = params.nodo; // Either a node_id or 'simulacro'
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [preguntas, setPreguntas] = useState([]);
  const [nodeContent, setNodeContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleClose = () => {
    if (nodo && typeof nodo === 'string' && nodo.startsWith('ley-')) {
      const leyId = nodo.split('-')[1];
      router.push(`/estudio/${leyId}`);
    } else {
      router.push('/');
    }
  };

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  // To track answers per question (for the end-screen summary and database)
  const [userResponses, setUserResponses] = useState({}); // { index: { selected, correct, isCorrect } }
  const [isFinished, setIsFinished] = useState(false);

  // Hands-free states
  const [isHandsFreeActive, setIsHandsFreeActive] = useState(false);
  const isHandsFreeActiveRef = useRef(false);
  const handsFreeStateRef = useRef('idle'); 
  const recognitionRef = useRef(null);
  const [handsFreeTranscript, setHandsFreeTranscript] = useState('');
  const [playingArticleId, setPlayingArticleId] = useState(null);

  const toggleReadingRelated = (textToRead) => {
    if (playingArticleId === 'related') {
      window.speechSynthesis.cancel();
      setPlayingArticleId(null);
    } else {
      setPlayingArticleId('related');
      speakHandsFreeText(textToRead, () => setPlayingArticleId(null), () => setPlayingArticleId(null));
    }
  };
  
  const currentIndexRef = useRef(0);
  const isAnsweredRef = useRef(false);
  const selectedOptionRef = useRef(null);

  useEffect(() => {
    isHandsFreeActiveRef.current = isHandsFreeActive;
    if (!isHandsFreeActive) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      window.speechSynthesis.cancel();
    } else {
      speakCurrentHandsFreeQuestion();
    }
  }, [isHandsFreeActive]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    if (isHandsFreeActiveRef.current && preguntas.length > 0) {
      speakCurrentHandsFreeQuestion();
    }
  }, [currentIndex, preguntas]);

  useEffect(() => {
    isAnsweredRef.current = isAnswered;
  }, [isAnswered]);

  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  const cleanOptionText = (text) => {
    if (!text) return '';
    return text.replace(/[*#_`]/g, '').replace(/\[\+\]/g, '').replace(/\[-\]/g, '');
  };

  const speakHandsFreeText = (textToRead, onEndCallback, onErrorCallback) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();

    const cleanText = cleanOptionText(textToRead)
      .replace(/\bArts\b\.?/gi, 'Artículos')
      .replace(/\bArt\b\.?/gi, 'Artículo');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX';
    
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es-MX')) || 
                    voices.find(v => v.lang.startsWith('es-419')) || 
                    voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;
    
    utterance.rate = 0.96;
    utterance.pitch = 0.95;

    utterance.onend = () => { if (onEndCallback) onEndCallback(); };
    utterance.onerror = (e) => { if (onErrorCallback) onErrorCallback(); };

    window.speechSynthesis.speak(utterance);
  };

  const speakCurrentHandsFreeQuestion = () => {
    if (!isHandsFreeActiveRef.current) return;
    const questions = preguntas;
    const idx = currentIndexRef.current;
    if (!questions || questions.length === 0 || idx >= questions.length) return;

    handsFreeStateRef.current = 'speaking_question';
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const currentQ = questions[idx];
    let text = `Pregunta número ${idx + 1}. ${currentQ.pregunta}. `;
    if (currentQ.opcion_a) text += `Opción A. ${cleanOptionText(currentQ.opcion_a)}. `;
    if (currentQ.opcion_b) text += `Opción B. ${cleanOptionText(currentQ.opcion_b)}. `;
    if (currentQ.opcion_c) text += `Opción C. ${cleanOptionText(currentQ.opcion_c)}. `;
    if (currentQ.opcion_d) text += `Opción D. ${cleanOptionText(currentQ.opcion_d)}. `;
    if (currentQ.opcion_e) text += `Opción E. ${cleanOptionText(currentQ.opcion_e)}. `;
    text += `¿Cuál es tu respuesta?`;

    speakHandsFreeText(text, () => {
      if (isHandsFreeActiveRef.current) startListeningForResponse();
    }, () => {
      if (isHandsFreeActiveRef.current) startListeningForResponse();
    });
  };

  const startListeningForResponse = () => {
    if (!isHandsFreeActiveRef.current) return;

    handsFreeStateRef.current = 'listening';
    setHandsFreeTranscript('');

    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsHandsFreeActive(false);
      return;
    }

    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const rec = new SpeechRecognition();
    rec.lang = 'es-MX';
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      if (!isHandsFreeActiveRef.current) return;
      
      let resultText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        resultText += event.results[i][0].transcript;
      }
      
      setHandsFreeTranscript(resultText);
      handleSpeechInput(resultText);
    };

    rec.onerror = (event) => {
      if (event.error === 'no-speech' && isHandsFreeActiveRef.current && handsFreeStateRef.current === 'listening') {
        setTimeout(() => { if (isHandsFreeActiveRef.current && handsFreeStateRef.current === 'listening') startListeningForResponse(); }, 1000);
      }
    };

    rec.onend = () => {
      if (isHandsFreeActiveRef.current && handsFreeStateRef.current === 'listening') {
        setTimeout(() => { if (isHandsFreeActiveRef.current && handsFreeStateRef.current === 'listening') startListeningForResponse(); }, 500);
      }
    };

    try { rec.start(); } catch (e) {}
    recognitionRef.current = rec;
  };

  const handleNextVoice = () => {
    const idx = currentIndexRef.current;
    if (idx < preguntas.length - 1) {
      setCurrentIndex(idx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      const finalScore = (correctAnswers / preguntas.length) * 10;
      const passed = finalScore >= 7;
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/usuario/progreso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ nodo_id: nodo, nota: finalScore, completado: passed })
        }).catch(() => {});
      }
      setIsFinished(true);
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    }
  };

  const handleSubmitOptionVoice = (opcion) => {
    if (isAnsweredRef.current) return;

    const idx = currentIndexRef.current;
    const currentQ = preguntas[idx];
    const correct = opcion === currentQ.respuesta_correcta;

    setIsAnswered(true);
    setSelectedOption(opcion);

    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      playSound(true);
    } else {
      playSound(false);
    }

    setUserResponses(prev => ({
      ...prev,
      [idx]: {
        selected: opcion,
        correct: currentQ.respuesta_correcta,
        isCorrect: correct,
        preguntaText: currentQ.pregunta,
        explicacion: currentQ.explicacion,
        referencia: currentQ.referencia_legal || currentQ.articulo,
        leyNombre: currentQ.ley_nombre
      }
    }));

    setTimeout(() => {
      if (!isHandsFreeActiveRef.current) return;
      let text = correct ? "¡Correcta! " : `Incorrecta. La respuesta correcta era la opción ${currentQ.respuesta_correcta}. `;
      if (currentQ.explicacion) {
        text += `Explicación: ${currentQ.explicacion}. `;
      }
      text += "Di 'Siguiente' para continuar.";

      handsFreeStateRef.current = 'speaking_feedback';
      speakHandsFreeText(text, () => {
        if (isHandsFreeActiveRef.current) startListeningForResponse();
      }, () => {
        if (isHandsFreeActiveRef.current) startListeningForResponse();
      });
    }, 500);

    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/usuario/pregunta-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pregunta_id: currentQ.id,
          es_correcta: correct,
          respuesta_usuario: opcion
        })
      }).catch(() => {});
    }
  };

  const handleSpeechInput = (transcript) => {
    if (!isHandsFreeActiveRef.current) return;
    const lowerTranscript = transcript.toLowerCase();

    if (handsFreeStateRef.current !== 'listening') return;

    const answered = isAnsweredRef.current;

    if (!answered) {
      let chosenLabel = null;
      if (/\b(opción a|letra a|la a|a)\b/.test(lowerTranscript)) chosenLabel = 'A';
      else if (/\b(opción b|letra b|la b|b)\b/.test(lowerTranscript)) chosenLabel = 'B';
      else if (/\b(opción c|letra c|la c|c)\b/.test(lowerTranscript)) chosenLabel = 'C';
      else if (/\b(opción d|letra d|la d|d)\b/.test(lowerTranscript)) chosenLabel = 'D';
      else if (/\b(opción e|letra e|la e|e)\b/.test(lowerTranscript)) chosenLabel = 'E';

      if (chosenLabel) {
        handsFreeStateRef.current = 'processing';
        if (recognitionRef.current) try { recognitionRef.current.abort(); } catch(e) {}
        
        handleSubmitOptionVoice(chosenLabel);
      }
    } else {
      if (/\b(siguiente|avanzar|continuar|próxima)\b/.test(lowerTranscript)) {
        handsFreeStateRef.current = 'processing';
        if (recognitionRef.current) try { recognitionRef.current.abort(); } catch(e) {}
        handleNextVoice();
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    const fetchWithAuth = (url) => 
      fetch(`${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`, { headers, cache: 'no-store' })
        .then(res => {
          if (res.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
            return { success: false };
          }
          return res.json();
        });

    if (nodo === 'simulacro') {
      fetchWithAuth(`/api/simulador/preguntas?nodo_id=simulacro`)
        .then(preguntasData => {
          if (preguntasData.success) {
            setPreguntas(preguntasData.data);
          }
          setNodeContent({ nombre: 'Simulacro General' });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (nodo && typeof nodo === 'string' && nodo.startsWith('ley-')) {
      fetchWithAuth(`/api/simulador/preguntas?nodo_id=${nodo}`)
        .then(preguntasData => {
          if (preguntasData.success) {
            setPreguntas(preguntasData.data);
            const firstQuestion = preguntasData.data[0];
            setNodeContent({ 
              nombre: firstQuestion ? `Examen: ${firstQuestion.ley_nombre}` : 'Examen de Ley' 
            });
          } else {
            setNodeContent({ nombre: 'Examen de Ley' });
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      Promise.all([
        fetchWithAuth(`/api/simulador/preguntas?nodo_id=${nodo}`),
        fetchWithAuth(`/api/nodos/${nodo}/contenido`)
      ]).then(([preguntasData, nodeData]) => {
        if (preguntasData.success) setPreguntas(preguntasData.data);
        if (nodeData.success) setNodeContent(nodeData.data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [nodo, router]);

  const handleSelectOption = (opcion) => {
    if (isAnswered) return;
    setSelectedOption(opcion);
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    if (playingArticleId) setPlayingArticleId(null);
  };

  const handleSubmitOption = (opcion) => {
    if (isAnswered) return;

    const currentQ = preguntas[currentIndex];
    const correct = opcion === currentQ.respuesta_correcta;

    setIsAnswered(true);
    setSelectedOption(opcion);

    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      playSound(true);
    } else {
      playSound(false);
    }

    // Save user response tracking locally
    setUserResponses(prev => ({
      ...prev,
      [currentIndex]: {
        selected: opcion,
        correct: currentQ.respuesta_correcta,
        isCorrect: correct,
        preguntaText: currentQ.pregunta,
        explicacion: currentQ.explicacion,
        referencia: currentQ.referencia_legal || currentQ.articulo,
        leyNombre: currentQ.ley_nombre
      }
    }));

    // Log individual response to database
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/usuario/pregunta-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pregunta_id: currentQ.id,
          es_correcta: correct,
          respuesta_usuario: opcion
        })
      })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      })
      .catch(err => console.error("Error logging question response:", err));
    }
  };

  const handleConfirmSubmit = () => {
    if (!selectedOption || isAnswered) return;
    handleSubmitOption(selectedOption);
  };

  const handleDoubleClickOption = (opcion) => {
    if (isAnswered) {
      handleNext();
    } else {
      handleSubmitOption(opcion);
    }
  };

  const handleNext = () => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    if (playingArticleId) setPlayingArticleId(null);

    if (currentIndex < preguntas.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Calculate final grade
      const finalScore = (correctAnswers / preguntas.length) * 10;
      const passed = finalScore >= 7;

      // Submit progress to save the last score
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/usuario/progreso', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nodo_id: nodo,
            nota: finalScore,
            completado: passed
          })
        })
        .then(res => {
          if (res.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
          }
        })
        .catch(err => console.error("Error saving progress:", err));
      }

      setIsFinished(true);
    }
  };

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    textPrimary: isDarkMode ? "text-white" : "text-[#002b49]",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-500",
    headerBg: isDarkMode ? "bg-[#001524]/90 border-white/10" : "bg-white border-gray-200/80",
    cardBg: isDarkMode ? "bg-[#002b49]/50 border-white/10" : "bg-white border-gray-200/80",
    cardSidebarBg: isDarkMode ? "bg-[#002b49]/30 border-white/10" : "bg-white border-gray-200/80",
    footerBg: isDarkMode ? "bg-[#001524] border-white/10" : "bg-gray-50 border-gray-200/80",
    optionUnselected: isDarkMode ? "border-white/10 bg-[#001524] hover:border-[#b59348]/40 hover:bg-white/5 text-gray-200" : "border-gray-200 hover:border-[#b59348]/40 hover:bg-gray-50/50 text-gray-700 bg-white",
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${themeClasses.bg}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b59348] mb-4"></div>
        <span className={`font-bold ${themeClasses.textPrimary} animate-pulse`}>Preparando Simulador...</span>
      </div>
    );
  }

  if (preguntas.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${themeClasses.bg} p-6 text-center`}>
        <span className="material-symbols-outlined text-6xl text-[#b59348]/40 mb-4">error</span>
        <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-2`}>No hay preguntas de nivel Difícil o Trampa</h2>
        <p className={`${themeClasses.textSecondary} max-w-[28rem] mb-6`}>
          No logramos encontrar preguntas que coincidan con la dificultad requerida en este momento.
        </p>
        <button 
          onClick={handleClose} 
          className="px-6 py-2.5 bg-[#002b49] text-white rounded-xl font-bold shadow hover:bg-[#001c30] transition-all cursor-pointer"
        >
          {nodo && typeof nodo === 'string' && nodo.startsWith('ley-') ? 'Volver al Estudio' : 'Volver al Dashboard'}
        </button>
      </div>
    );
  }

  // End of Simulator Summary Screen
  if (isFinished) {
    const finalScore = (correctAnswers / preguntas.length) * 10;
    const isPassed = finalScore >= 7;

    return (
      <div className={`min-h-screen ${themeClasses.bg} flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto`}>
        <div className={`max-w-5xl w-full ${themeClasses.cardBg} rounded-3xl border shadow-xl overflow-hidden mt-4`}>
                    {/* Header Banner */}
          <div className="bg-[#002b49] text-white p-8 text-center relative">
            <div className="absolute top-4 left-4">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="h-10 w-auto object-contain bg-white p-1 rounded" 
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            </div>
            <span className="text-[11px] uppercase tracking-widest font-black text-[#b59348] block mb-1">Resultado de Evaluación</span>
            <h1 className="text-3xl font-black mb-3">Simulador Completado</h1>
            <p className="text-white/70 max-w-[32rem] mx-auto text-sm mb-4">
              Tu rendimiento ha sido calculado y almacenado para evaluar tu progreso hacia el examen de notariado.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-gold-brand hover:bg-[#ffe088] text-navy-brand rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-200 inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
              {nodo && typeof nodo === 'string' && nodo.startsWith('ley-') ? 'Volver al Estudio' : 'Volver al Dashboard'}
            </button>
          </div>

          {/* Results Summary Box */}
          <div className="p-8 flex flex-col md:flex-row items-center justify-around border-b border-gray-100 gap-10">
            <div className="flex flex-col items-center shrink-0">
              <span className="text-[11px] uppercase font-black text-[#002b49]/60 tracking-widest mb-3">Tu Calificación</span>
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer Track */}
                <div className={`absolute inset-0 rounded-full border-[6px] ${
                  isPassed ? 'border-emerald-100' : 'border-rose-100'
                }`}></div>
                {/* Fill */}
                <div className={`absolute inset-0 rounded-full border-[6px] border-t-transparent ${
                  isPassed ? 'border-emerald-500' : 'border-rose-500'
                }`} style={{ transform: `rotate(${(correctAnswers / preguntas.length) * 360}deg)` }}></div>
                
                <div className="z-10 text-center">
                  <span className={`text-4xl font-black block leading-none ${
                    isPassed ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {finalScore.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mt-1">Puntos</span>
                </div>
              </div>
            </div>
 
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-black text-slate-400 tracking-wider block mb-0.5">Total Preguntas</span>
                  <span className="text-2xl font-black text-slate-800">{preguntas.length}</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-3xl">list_alt</span>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-black text-emerald-600 tracking-wider block mb-0.5">Correctas</span>
                  <span className="text-2xl font-black text-emerald-700">{correctAnswers}</span>
                </div>
                <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
              </div>
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-black text-rose-600 tracking-wider block mb-0.5">Incorrectas</span>
                  <span className="text-2xl font-black text-rose-700">{preguntas.length - correctAnswers}</span>
                </div>
                <span className="material-symbols-outlined text-rose-500 text-3xl">cancel</span>
              </div>
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-black text-amber-600 tracking-wider block mb-0.5">Rendimiento</span>
                  <span className="text-2xl font-black text-amber-700">{((correctAnswers / preguntas.length) * 100).toFixed(0)}%</span>
                </div>
                <span className="material-symbols-outlined text-amber-500 text-3xl">analytics</span>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="p-8">
            <h2 className="text-lg font-black text-[#002b49] mb-4">Revisión de Preguntas</h2>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {preguntas.map((q, idx) => {
                const resp = userResponses[idx] || {};
                return (
                  <div key={q.id} className={`p-4 rounded-2xl border ${
                    resp.isCorrect ? 'border-emerald-100 bg-emerald-50/10' : 'border-rose-100 bg-rose-50/10'
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-white ${
                        resp.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}>
                        Pregunta {idx + 1}: {resp.isCorrect ? 'Correcta' : 'Incorrecta'}
                      </span>
                      {q.nivel_dificultad && (
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{q.nivel_dificultad}</span>
                      )}
                    </div>
                    
                    {resp.leyNombre && (
                      <span className="text-[10px] font-black text-[#b59348] block mb-1">{resp.leyNombre}</span>
                    )}

                    <p className="text-sm font-semibold text-gray-800 mb-2 leading-relaxed">{q.pregunta}</p>
                    
                    {!resp.isCorrect && (
                      <div className="text-xs text-rose-700 bg-rose-50/40 p-2 rounded-lg border border-rose-100/40 mb-1">
                        <span className="font-bold">Tu respuesta:</span> {q['opcion_' + resp.selected.toLowerCase()]}
                      </div>
                    )}
                    <div className="text-xs text-emerald-700 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100/40">
                      <span className="font-bold">Respuesta correcta:</span> {q['opcion_' + resp.correct.toLowerCase()]}
                    </div>

                    {q.explicacion && (
                      <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="font-bold uppercase text-[9px] tracking-wider text-gray-400 not-italic block mb-0.5">Explicación:</span>
                        {q.explicacion}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Helper function to format options for rendering
  const getShuffledOptions = (q) => {
    if (!q) return [];
    const opts = [];
    if (q.opcion_a) opts.push({ label: 'A', text: q.opcion_a });
    if (q.opcion_b) opts.push({ label: 'B', text: q.opcion_b });
    if (q.opcion_c) opts.push({ label: 'C', text: q.opcion_c });
    if (q.opcion_d) opts.push({ label: 'D', text: q.opcion_d });
    if (q.opcion_e) opts.push({ label: 'E', text: q.opcion_e });
    return opts;
  };

  const currentQ = preguntas[currentIndex];
  
  const options = getShuffledOptions(currentQ);

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.bg} transition-colors duration-300 h-screen overflow-hidden`}>
      
      {/* Header Minimalista (Stitch approach) */}
      <header className={`h-16 shrink-0 flex justify-between items-center px-4 md:px-6 shadow-sm sticky top-0 z-50 backdrop-blur-md border-b ${themeClasses.headerBg} transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleClose} 
            className={`material-symbols-outlined transition-colors cursor-pointer ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-[#002b49]'}`}
          >
            arrow_back
          </button>
          
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            className="h-10 w-auto object-contain bg-white/5 p-0.5 rounded hidden md:block" 
            onError={(e) => e.currentTarget.style.display = 'none'}
          />

          <div className="flex flex-col text-left">
            <span className={`font-black text-[14px] leading-tight ${isDarkMode ? 'text-white' : 'text-[#002b49]'}`}>
              Simulador <span className="text-[#b59348]">SERÉ NOTARIO</span>
            </span>
            <span className="text-[9px] text-gray-400 leading-none">Pregunta {currentIndex + 1} de {preguntas.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode}
            className={`material-symbols-outlined transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#002b49]'}`}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </button>
          {/* Hands-Free Mode Toggle */}
          <button 
            onClick={() => setIsHandsFreeActive(!isHandsFreeActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all font-bold text-[10px] uppercase tracking-wider cursor-pointer shadow-sm ${
              isHandsFreeActive 
                ? 'bg-blue-100 border-blue-300 text-blue-800 animate-pulse' 
                : isDarkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{isHandsFreeActive ? 'mic' : 'mic_off'}</span>
            <span className="hidden sm:inline">Manos Libres</span>
          </button>

          {/* Progress Indicator */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDarkMode ? 'bg-[#002b49]/50 border-white/10' : 'bg-[#002b49]/5 border-[#002b49]/20'}`}>
            <span className="material-symbols-outlined text-[#b59348] text-[16px]">military_tech</span>
            <div className="flex flex-col">
              <span className={`text-[8px] uppercase tracking-widest font-black leading-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Precisión</span>
              <span className={`text-xs font-black leading-none ${isDarkMode ? 'text-white' : 'text-[#002b49]'}`}>
                {currentIndex === 0 ? '--' : Math.round((correctAnswers / (isAnswered ? currentIndex + 1 : currentIndex)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        
        {/* Left Side: Question and Options */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 lg:p-12 items-center justify-start">
          <div className="w-full max-w-3xl">
            {/* Context/Category Chip */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'bg-[#b59348]/20 text-[#b59348]' : 'bg-[#b59348]/10 text-[#b59348]'}`}>
                {currentQ.ley_nombre || 'General'}
              </span>
              {currentQ.nivel_dificultad && (
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'bg-[#002b49] text-white' : 'bg-[#002b49]/5 text-[#002b49]'}`}>
                  Nivel {currentQ.nivel_dificultad}
                </span>
              )}
            </div>

            {/* Question Text */}
            <h2 className={`text-xl md:text-2xl font-bold mb-8 leading-snug ${themeClasses.textPrimary}`}>
              {currentQ.pregunta}
            </h2>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {options.map((opt) => {
                const isSelected = selectedOption === opt.label;
                const isCorrectOpt = opt.label === currentQ.respuesta_correcta;
                
                // Styling logic when answered
                let optionStyle = themeClasses.optionUnselected;
                if (isAnswered) {
                  if (isCorrectOpt) {
                    optionStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold';
                  } else if (isSelected) {
                    optionStyle = 'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold';
                  } else {
                    optionStyle = isDarkMode ? 'border-white/5 bg-transparent text-gray-500 opacity-60' : 'border-gray-100 bg-gray-50/30 text-gray-400 opacity-60';
                  }
                } else if (isSelected) {
                  optionStyle = isDarkMode ? 'border-[#b59348] bg-[#b59348]/20 text-white font-semibold' : 'border-[#002b49] bg-[#002b49]/5 text-[#002b49] font-semibold';
                }

                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelectOption(opt.label)}
                    onDoubleClick={() => handleDoubleClickOption(opt.label)}
                    disabled={isAnswered}
                    className={`w-full p-5 rounded-2xl border text-left flex items-start gap-4 transition-all duration-200 cursor-pointer ${optionStyle}`}
                  >
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm ${
                      isAnswered && isCorrectOpt ? 'bg-emerald-500 text-white' :
                      isAnswered && isSelected ? 'bg-rose-500 text-white' :
                      isSelected ? (isDarkMode ? 'bg-[#b59348] text-[#002b49]' : 'bg-[#002b49] text-white') : 
                      (isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-500')
                    }`}>
                      {opt.label}
                    </div>
                    <span className="text-[14px] leading-relaxed pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Instruction tooltip */}
            <div className={`mt-8 flex items-center justify-center gap-2 text-xs italic ${themeClasses.textSecondary}`}>
              <span className="material-symbols-outlined text-sm">info</span>
              <span>Haz clic para seleccionar, y doble clic para confirmar y avanzar de inmediato</span>
            </div>

          </div>
        </div>

        {/* Right Info Sidebar (Linked Articles & Feedback) */}
        <div className={`w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l p-6 flex flex-col overflow-y-auto transition-colors duration-300 ${themeClasses.cardSidebarBg}`}>
          
          {/* Exam Source Info (Always visible at top of right panel) */}
          {(currentQ.examen_titulo || currentQ.pdf_url) && (
            <div className={`mb-6 p-4 rounded-xl border ${isDarkMode ? 'bg-[#001524] border-white/10' : 'bg-white border-gray-200'} shadow-sm`}>
              <h3 className={`text-[11px] uppercase tracking-wider font-black mb-3 ${isDarkMode ? 'text-[#b59348]' : 'text-[#002b49]'}`}>Fuente de la Pregunta</h3>
              <div className="flex flex-col gap-2">
                {currentQ.examen_titulo && (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] mt-0.5 text-gray-400">history_edu</span>
                    <div className="flex flex-col">
                      <span className={`text-[13px] font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{currentQ.examen_titulo}</span>
                      {currentQ.orden && <span className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Pregunta Original: #{currentQ.orden}</span>}
                    </div>
                  </div>
                )}
                {currentQ.pdf_url && (
                  <a 
                    href={currentQ.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    Ver PDF Original
                  </a>
                )}
              </div>
            </div>
          )}

          {isAnswered ? (
            <div className="flex-1 flex flex-col justify-start">
              
              {/* Correct / Incorrect Header Indicator */}
              <div className={`p-4 rounded-2xl border mb-6 flex flex-col gap-4 ${
                selectedOption === currentQ.respuesta_correcta 
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' 
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-500'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[28px] font-bold">
                    {selectedOption === currentQ.respuesta_correcta ? 'check_circle' : 'cancel'}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm uppercase tracking-wider">
                      {selectedOption === currentQ.respuesta_correcta ? '¡Respuesta Correcta!' : 'Respuesta Incorrecta'}
                    </span>
                    <span className="text-xs opacity-85">
                      {selectedOption === currentQ.respuesta_correcta 
                        ? 'Excelente dominio de la norma jurídica.' 
                        : `La opción correcta era la ${currentQ.respuesta_correcta}`}
                    </span>
                  </div>
                </div>

                {/* Siguiente Pregunta button at the top */}
                <button
                  onClick={handleNext}
                  className="w-full py-2.5 bg-[#b59348] hover:bg-[#a1813b] text-[#002b49] rounded-xl font-black shadow transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Siguiente Pregunta
                </button>
              </div>

              {/* Explanations & Linked Articles */}
              <div className="space-y-5 text-left">
                {currentQ.explicacion && (
                  <div>
                    <h3 className={`text-[11px] uppercase tracking-wider font-black mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Explicación Técnica</h3>
                    <p className={`text-xs leading-relaxed p-3.5 rounded-xl border ${isDarkMode ? 'bg-[#001524] border-white/10 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                      {currentQ.explicacion}
                    </p>
                  </div>
                )}

                {currentQ.referencia_legal && (
                  <div>
                    <h3 className={`text-[11px] uppercase tracking-wider font-black mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Base Legal</h3>
                    <div className="bg-[#b59348]/10 border border-[#b59348]/20 p-3.5 rounded-xl text-xs">
                      <span className="font-bold text-[#b59348] block mb-1">Referencia</span>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{currentQ.referencia_legal}</span>
                    </div>
                  </div>
                )}

                {currentQ.articulos_vinculados && currentQ.articulos_vinculados.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-[11px] uppercase tracking-wider font-black ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Artículos Relacionados</h3>
                      <button 
                        onClick={() => {
                          const textToRead = currentQ.articulos_vinculados.map(art => `Artículo ${art.numero}. ${art.titulo ? art.titulo + '. ' : ''}${art.contenido}`).join(' ');
                          toggleReadingRelated(textToRead);
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all text-[9px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 ${playingArticleId === 'related' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : (isDarkMode ? 'bg-white/5 border-[#b59348]/30 hover:border-[#b59348]/60 hover:bg-white/10 text-[#b59348]' : 'bg-[#b59348]/10 border-[#b59348]/30 hover:bg-[#b59348]/20 text-[#002b49]')}`}
                        title={playingArticleId === 'related' ? "Detener lectura" : "Leer artículos en voz alta"}
                      >
                        <span className="material-symbols-outlined text-[13px]">{playingArticleId === 'related' ? 'stop' : 'volume_up'}</span>
                        <span>{playingArticleId === 'related' ? 'Detener' : 'Leer'}</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {currentQ.articulos_vinculados.map((art) => (
                        <div key={art.id} className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-[#001524] border-white/10' : 'bg-[#f8f9ff] border-gray-200/60'}`}>
                          <span className={`font-black text-xs block mb-1 ${isDarkMode ? 'text-white' : 'text-[#002b49]'}`}>
                            Art. {art.numero} - {art.titulo || 'Sin Título'}
                          </span>
                          <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{art.contenido}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className={`material-symbols-outlined text-[48px] mb-3 ${isDarkMode ? 'text-white/10' : 'text-gray-200'}`}>help_outline</span>
              <span className="text-xs font-bold uppercase tracking-wider mb-1">Ayuda y Referencia</span>
              <p className="text-[11px] max-w-[200px] leading-relaxed">
                Selecciona una opción y confirma para ver la base legal y la explicación.
              </p>
            </div>
          )}

          {/* Persistent Action Footer */}
          {!isAnswered && (
            <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
              <button
                onClick={handleConfirmSubmit}
                disabled={!selectedOption}
                className={`w-full py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wider cursor-pointer ${
                  selectedOption 
                    ? (isDarkMode ? 'bg-[#b59348] text-[#002b49] hover:bg-[#a1813b] shadow' : 'bg-[#002b49] hover:bg-[#001c30] text-white shadow') 
                    : (isDarkMode ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                }`}
              >
                Confirmar Respuesta
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Grid tracker of questions at the bottom (Stitch Progress Tracker) */}
      <footer className={`h-14 shrink-0 flex items-center justify-center px-6 border-t ${themeClasses.footerBg} transition-colors duration-300`}>
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          {preguntas.map((_, idx) => {
            const resp = userResponses[idx];
            let dotClass = isDarkMode ? 'border-white/20 bg-[#001524] text-gray-500' : 'border-gray-300 bg-white text-gray-500';
            if (idx === currentIndex) {
              dotClass = isDarkMode ? 'border-[#b59348] bg-[#b59348] text-[#002b49] scale-110 shadow-sm' : 'border-[#002b49] bg-[#002b49] text-white scale-110 shadow-sm';
            } else if (resp) {
              dotClass = resp.isCorrect 
                ? 'border-emerald-500 bg-emerald-500 text-white' 
                : 'border-rose-500 bg-rose-500 text-white';
            }
            return (
              <div 
                key={idx}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-[10px] shrink-0 ${dotClass}`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </footer>

    </div>
  );
}
