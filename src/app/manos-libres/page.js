'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Helper for cleaning text for speech synthesis
const cleanTextForSpeech = (text) => {
  if (!text) return '';
  return text
    .replace(/[*#_`]/g, '')
    .replace(/\bArts\b\.?/gi, 'Artículos')
    .replace(/\bArt\b\.?/gi, 'Artículo')
    .replace(/\bLN\b/g, 'Ley de Notariado')
    .replace(/\[\+\]/g, '')
    .replace(/\[-\]/g, '');
};

const cleanOptionText = (text) => {
  if (!text) return '';
  return text.replace(/^[a-c](?:\s*\.|\s*\)|\s+)\s*/i, '').trim();
};

export default function ManosLibresPage() {
  const router = useRouter();

  // VIEW STATES
  const [viewState, setViewState] = useState('MENU'); // 'MENU' | 'PLAYER'
  const [leyesMenu, setLeyesMenu] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedLey, setSelectedLey] = useState(null);
  const [comingSoon, setComingSoon] = useState(null);
  const [blockedLaw, setBlockedLaw] = useState(null);
  // STAGES
  const [stage, setStage] = useState('LOADING_MAP');
  const [mapa, setMapa] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [nodeContent, setNodeContent] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  
  const [quizIndex, setQuizIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // BLOCK STATES
  const [blocksTotal, setBlocksTotal] = useState(1);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [allPreguntas, setAllPreguntas] = useState([]);
  const [wonInvitations, setWonInvitations] = useState(0);
  
  const [toast, setToast] = useState(null);
  const synthesisRef = useRef(null);

  // SPEECH RECOGNITION STATES
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // PAUSE & TIMER STATES
  const [isPaused, setIsPaused] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const isSpeakingRef = useRef(false);
  const audioContextRef = useRef(null);
  const clockIntervalRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const speakText = useCallback((text, onEnd) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    isSpeakingRef.current = true;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es-MX')) || 
                    voices.find(v => v.lang.startsWith('es-419')) || 
                    voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;
    
    utterance.rate = 0.95;
    utterance.pitch = 0.95;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };
    
    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
  }, []);

  // INIT SPEECH RECOGNITION
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          console.log("Mic escuchó:", transcript);
          handleVoiceCommandRef.current(transcript);
        };

        recognition.onerror = (event) => {
          console.error("Mic error:", event.error);
          if (event.error !== 'no-speech') {
            setMicError(true);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setMicSupported(false);
        setMicError(true);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || micError || isPaused) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch(e) {
      console.error("Error starting mic:", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch(e) {}
      setIsListening(false);
    }
  };

  const submitAnswer = useCallback((optionToSubmit, qIndex, pregs) => {
    if (stage !== 'QUIZ_QUESTION') return;
    stopListening(); // Stop mic when processing answer
    
    const q = pregs[qIndex];
    const isCorrect = optionToSubmit === q.respuesta_correcta;
    
    if (isCorrect) setCorrectCount(prev => prev + 1);
    
    setFeedback({
      isCorrect,
      correctAnswer: q.respuesta_correcta,
      legalBasis: q.referencia_legal || 'Sin base legal especificada'
    });
    setStage('QUIZ_FEEDBACK');

    let fbText = '';
    if (isCorrect) {
      fbText = "Correcto. ";
    } else {
      const correctAnswerText = cleanOptionText(q['opcion_' + q.respuesta_correcta.toLowerCase()]);
      fbText = `Incorrecto. La respuesta correcta es la opción ${q.respuesta_correcta}... ${correctAnswerText}. `;
    }
    fbText += `Base legal: ${q.referencia_legal || 'No especificada'}.`;
    
    speakText(fbText, () => {
      setTimeout(() => {
        if (qIndex + 1 < pregs.length) {
          setQuizIndex(prev => prev + 1);
          setSelectedOption(null);
          setFeedback(null);
          setStage('QUIZ_QUESTION');
        } else {
          setStage('QUIZ_RESULT');
        }
      }, 1000);
    });
  }, [stage, speakText]);

  const handleOptionSelect = useCallback((option, isDoubleClick = false) => {
    if (stage !== 'QUIZ_QUESTION') return;
    setSelectedOption(option);
    if (isDoubleClick) {
      submitAnswer(option, quizIndex, preguntas);
    }
  }, [stage, submitAnswer, quizIndex, preguntas]);

  // VOICE COMMAND DISPATCHER
  const handleVoiceCommand = useCallback((transcript) => {
    if (stage === 'QUIZ_QUESTION') {
      const matchA = transcript.match(/\b(a|la a|opción a|opcion a)\b/i);
      const matchB = transcript.match(/\b(b|la b|opción b|opcion b)\b/i);
      const matchC = transcript.match(/\b(c|la c|opción c|opcion c)\b/i);
      const matchD = transcript.match(/\b(d|la d|opción d|opcion d)\b/i);
      const matchE = transcript.match(/\b(e|la e|opción e|opcion e)\b/i);

      if (matchA) {
        setSelectedOption('A');
        submitAnswer('A', quizIndex, preguntas);
      } else if (matchB) {
        setSelectedOption('B');
        submitAnswer('B', quizIndex, preguntas);
      } else if (matchC) {
        setSelectedOption('C');
        submitAnswer('C', quizIndex, preguntas);
      } else if (matchD) {
        setSelectedOption('D');
        submitAnswer('D', quizIndex, preguntas);
      } else if (matchE) {
        setSelectedOption('E');
        submitAnswer('E', quizIndex, preguntas);
      } else {
        // If it didn't match, maybe restart listening to try again if we want to force hands-free
        if (!micError) startListening();
      }
    }
  }, [stage, quizIndex, preguntas, submitAnswer, micError]);

  const handleVoiceCommandRef = useRef(handleVoiceCommand);
  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  }, [handleVoiceCommand]);

  // CLOCK LOGIC
  const playTickSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch(e) { console.error('AudioContext error:', e); }
  }, []);

  const getStudySequence = (node) => {
    if (!node) return [];
    if (Array.isArray(node)) {
      let list = [];
      for (const n of node) {
        list = list.concat(getStudySequence(n));
      }
      return list;
    }
    let list = [];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        list = list.concat(getStudySequence(child));
      }
    }
    if (node.total_preguntas > 0) {
      list.push({ id: node.id, completado: node.usuario_completado, nombre: node.nombre });
    }
    return list;
  };

  // INITIAL EFFECT FOR MENU
  useEffect(() => {
    if (viewState === 'MENU') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      Promise.all([
        fetch('/api/dashboard/heatmap', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }).then(r => r.json()),
        fetch('/api/usuario/perfil', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }).then(r => r.json())
      ])
        .then(([heatmapData, profileData]) => {
          if (heatmapData.success && heatmapData.data) {
            setLeyesMenu(heatmapData.data);
          }
          if (profileData.success && profileData.data) {
            setUserProfile(profileData.data);
          }
          setMenuLoading(false);
        })
        .catch(err => {
          console.error(err);
          setMenuLoading(false);
        });
    }
  }, [viewState, router]);

  useEffect(() => {
    if (viewState !== 'PLAYER') return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (stage === 'LOADING_MAP') {
      const url = selectedLey ? `/api/nodos/mapa?root=${selectedLey}` : '/api/nodos/mapa';
      fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setMapa(data.data);
          const seq = getStudySequence(data.data);
          const firstUncompleted = seq.find(n => !n.completado);
          if (firstUncompleted) {
            setCurrentNode(firstUncompleted);
            setStage('LOADING_NODE');
          } else {
            showToast("¡Has completado todo el temario de esta ley!");
            router.push('/');
          }
        }
      });
    }
  }, [stage, router, viewState, selectedLey]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (viewState === 'PLAYER' && stage === 'LOADING_NODE' && currentNode) {
      Promise.all([
        fetch(`/api/nodos/${currentNode.id}/contenido?_t=${Date.now()}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }).then(r => r.json()),
        fetch(`/api/simulador/preguntas?nodo_id=${currentNode.id}&_t=${Date.now()}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }).then(r => r.json()),
        fetch(`/api/usuario/bloque?nodo_id=${currentNode.id}&_t=${Date.now()}`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }).then(r => r.json())
      ]).then(([contentData, quizData, blockData]) => {
        if (contentData.success) {
          setNodeContent(contentData.data);
        }
        if (quizData.success && quizData.data) {
          let questions = quizData.data || [];
          
          for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
          }
          
          const TQ = questions.length;
          let bCount = 1;
          let totalQ = TQ;
          
          if (TQ <= 5) {
            bCount = 1;
            totalQ = TQ;
          } else if (TQ <= 10) {
            bCount = 1;
            totalQ = 5;
          } else if (TQ <= 20) {
            bCount = 2;
            totalQ = 10;
          } else if (TQ <= 30) {
            bCount = 3;
            totalQ = 15;
          } else {
            bCount = 4;
            totalQ = 20;
          }
          
          const selectedQuestions = questions.slice(0, totalQ);
          setAllPreguntas(selectedQuestions);
          setBlocksTotal(bCount);
          
          const savedBlock = blockData.success ? parseInt(blockData.data, 10) : 0;
          let startBlock = savedBlock < bCount ? savedBlock : 0;
          setCurrentBlock(startBlock);
          
          const blockSize = TQ <= 5 ? TQ : 5;
          setPreguntas(selectedQuestions.slice(startBlock * 5, startBlock * 5 + blockSize));
        }
        setStage('READING_NODE');
      });
    }
  }, [stage, currentNode, viewState]);

  const readQuestion = useCallback(() => {
    stopListening();
    setWaitingSeconds(0);
    if (preguntas.length === 0) return;
    const q = preguntas[quizIndex];
    let text = `Pregunta ${quizIndex + 1}. ${q.pregunta}. `;
    if (q.opcion_a) text += `Opción A. ${cleanOptionText(q.opcion_a)}. `;
    if (q.opcion_b) text += `Opción B. ${cleanOptionText(q.opcion_b)}. `;
    if (q.opcion_c) text += `Opción C. ${cleanOptionText(q.opcion_c)}. `;
    if (q.opcion_d) text += `Opción D. ${cleanOptionText(q.opcion_d)}. `;
    if (q.opcion_e) text += `Opción E. ${cleanOptionText(q.opcion_e)}. `;
    speakText(text, () => {
      if (!micError && !isPaused) {
        startListening();
      }
    });
  }, [preguntas, quizIndex, speakText, micError, isPaused]);

  // CLOCK EFFECT
  useEffect(() => {
    if (stage === 'QUIZ_QUESTION' && isListening && !isPaused && !isSpeakingRef.current) {
      clockIntervalRef.current = setInterval(() => {
        setWaitingSeconds(prev => {
          if (prev >= 60) {
            readQuestion();
            return 0;
          }
          playTickSound();
          return prev + 1;
        });
      }, 1000);
    } else {
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current);
        clockIntervalRef.current = null;
      }
    }
    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
  }, [stage, isListening, isPaused, playTickSound, readQuestion]);

  useEffect(() => {
    if (viewState !== 'PLAYER' || isPaused) return;

    if (stage === 'READING_NODE' && nodeContent) {
      let textToRead = `Tema: ${nodeContent.nombre}. `;
      if (nodeContent.concepto) textToRead += `Concepto: ${cleanTextForSpeech(nodeContent.concepto)} `;
      if (nodeContent.analisis_jurisconsulto) textToRead += `Análisis: ${cleanTextForSpeech(nodeContent.analisis_jurisconsulto)} `;
      
      speakText(textToRead, () => {
        setStage('QUIZ_INTRO');
      });
    }

    if (stage === 'QUIZ_INTRO') {
      const introText = "Iniciando simulacro. Escucha atentamente la pregunta y responde con Opción A, B, o C.";
      speakText(introText, () => {
        setQuizIndex(0);
        setCorrectCount(0);
        setFeedback(null);
        setSelectedOption(null);
        setStage('QUIZ_QUESTION');
      });
    }

    if (stage === 'QUIZ_QUESTION' && preguntas.length > 0) {
      readQuestion();
    }
  }, [stage, nodeContent, quizIndex, preguntas, viewState, readQuestion, speakText, isPaused]);

  useEffect(() => {
    if (viewState !== 'PLAYER' || isPaused) return;

    if (stage === 'QUIZ_RESULT') {
      const score = (correctCount / (preguntas.length || 5)) * 10;
      const passed = score >= 8.0;

      const token = localStorage.getItem('token');
      const leyObj = leyesMenu.find(l => l.id === selectedLey);

      if (passed && currentBlock + 1 < blocksTotal) {
        // Passed intermediate block
        let resultText = `Excelente trabajo, tuviste ${correctCount} de ${preguntas.length} correctas. ¡Has aprobado este bloque con ${score.toFixed(1)} puntos! `;
        
        if (blocksTotal >= 4) {
          resultText += "Este tema es muy importante porque históricamente se han preguntado muchas cosas sobre él en el examen. Por lo tanto, pasaremos al siguiente bloque de preguntas para dominarlo y mejorar tus probabilidades de éxito.";
        } else if (blocksTotal === 3) {
          resultText += "Este tema suele evaluarse moderadamente en el examen, por lo que realizaremos otro bloque para que aseguremos este conocimiento.";
        } else {
          resultText += "Aunque este tema sale con menor frecuencia, es importante dominarlo por completo, así que continuaremos con el siguiente bloque de preguntas.";
        }

        if (token && currentNode) {
          fetch('/api/usuario/bloque', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ nodo_id: currentNode.id, bloque_actual: currentBlock + 1 })
          })
          .then(r => r.json())
          .then(data => {
            if (data.invitationAwarded) {
              setWonInvitations(prev => prev + 1);
            }
          });
        }

        speakText(resultText, () => {
          const nextBlock = currentBlock + 1;
          setCurrentBlock(nextBlock);
          const blockSize = allPreguntas.length <= 5 ? allPreguntas.length : 5;
          setPreguntas(allPreguntas.slice(nextBlock * 5, nextBlock * 5 + blockSize));
          setStage('QUIZ_INTRO');
        });

      } else if (passed && currentBlock + 1 === blocksTotal) {
        // Passed final block
        let resultText = `Simulacro terminado. Tuviste ${correctCount} respuestas correctas de ${preguntas.length}. `;
        resultText += `Tu calificación es de ${score.toFixed(1)} puntos. `;
        resultText += "¡Felicidades, has dominado todo este tema! Pasaremos al siguiente.";
      
        if (token && currentNode) {
          fetch('/api/usuario/progreso', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              nodo_id: currentNode.id,
              nota: score,
              completado: true,
              ley: leyObj ? leyObj.nombre : 'civil'
            })
          })
          .then(r => r.json())
          .then(data => {
            if (data.success && data.invitationsAwarded && data.invitationsAwarded > 0) {
              setWonInvitations(prev => prev + data.invitationsAwarded);
            }
            fetch('/api/usuario/bloque', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ nodo_id: currentNode.id, bloque_actual: 0 })
            });
          });
        }

        speakText(resultText, () => {
          setStage('LOADING_MAP');
        });
      } else {
        // Failed
        let resultText = `Simulacro terminado. Tuviste ${correctCount} respuestas correctas de ${preguntas.length}. `;
        resultText += `Tu calificación es de ${score.toFixed(1)} puntos. `;
        resultText += "No has alcanzado la nota mínima de 8 puntos. Repasemos el tema de nuevo para lograrlo.";
        speakText(resultText, () => {
          setStage('READING_NODE');
        });
      }
    }
  }, [stage, correctCount, preguntas, currentNode, viewState, leyesMenu, selectedLey, speakText, currentBlock, blocksTotal, allPreguntas]);

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (typeof window !== 'undefined' && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      if (stage === 'QUIZ_QUESTION' && !isSpeakingRef.current && !micError) {
        startListening();
      }
    } else {
      setIsPaused(true);
      if (typeof window !== 'undefined' && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
      stopListening();
    }
  };

  const leaveHandsFree = () => {
    setIsPaused(false);
    stopSpeech();
    stopListening();
    router.push('/');
  };

  const handleLeyClick = (ley) => {
    if (userProfile && userProfile.rol === 'DEMO') {
      if (!ley.nombre.toUpperCase().includes('CÓDIGO CIVIL')) {
        setBlockedLaw(ley);
        speakText("Acceso Limitado. Esta ley está bloqueada. Como usuario DEMO, tu acceso está restringido al Código Civil.");
        return;
      }
    }

    // total_preguntas comes from the API now. If 0, it means no questions loaded in DB.
    if (!ley.total_preguntas || parseInt(ley.total_preguntas) === 0) {
      setComingSoon(ley);
      speakText(`Aún no se han cargado preguntas para ${ley.nombre}. Estamos trabajando en ello para brindarte el mejor contenido.`);
      return;
    }
    setSelectedLey(ley.id);
    setViewState('PLAYER');
    setStage('LOADING_MAP');
  };

  // Helper for current law name
  const currentLeyObj = leyesMenu.find(l => l.id === selectedLey);
  const currentLeyNombre = currentLeyObj ? currentLeyObj.nombre : 'MODO MANOS LIBRES';

  // --------------------------------------------------------
  // MENU RENDER (Stitch Theme)
  // --------------------------------------------------------
  if (viewState === 'MENU') {
    return (
      <div className="min-h-screen bg-[#191c1e] text-[#eff1f3] flex flex-col font-body-md items-center py-10 px-4 relative overflow-y-auto">
        <button 
          onClick={() => { stopSpeech(); stopListening(); router.push('/'); }}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#191c1e] shadow-[4px_4px_8px_#0a0b0c,-4px_-4px_8px_#282d30] active:shadow-[inset_2px_2px_4px_#0a0b0c,inset_-2px_-2px_4px_#282d30] text-[#c6c6cd] hover:text-[#ffe088] transition-all z-50 border border-transparent"
          title="Volver al Inicio"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">home</span>
        </button>

        <div className="z-10 w-full max-w-3xl flex flex-col items-center">
          <img 
            src="/images/logo-oscuro.png" 
            alt="Seré Notario" 
            className="h-24 md:h-32 w-auto mb-6 object-contain" 
          />
          
          <h1 className="text-3xl md:text-5xl font-black mb-3 text-center text-[#ffe088] tracking-tight">
            MODO MANOS LIBRES
          </h1>
          <p className="text-[#c6c6cd] text-center mb-10 text-sm md:text-base font-medium w-full max-w-2xl px-4 leading-relaxed">
            Selecciona la ley que deseas repasar de forma auditiva. Haz <span className="text-[#ffe088] font-bold">doble clic</span> en una ley para iniciar el estudio interactivo.
          </p>

          <div className="w-full flex justify-between items-center mb-4 px-3 border-b border-[#c6c6cd]/20 pb-2">
            <span className="text-[11px] font-bold text-[#c6c6cd] uppercase tracking-widest">Leyes a Estudiar</span>
            <span className="text-[11px] font-bold text-[#c6c6cd] uppercase tracking-widest">% Examen</span>
          </div>

          <div className="flex flex-col gap-6 w-full">
            {menuLoading ? (
              <div className="text-center text-[#c6c6cd] py-10 animate-pulse font-bold tracking-widest flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-[#ffe088]">sync</span>
                Cargando leyes...
              </div>
            ) : (
              leyesMenu.map(ley => (
                <div
                  key={ley.id}
                  onClick={() => handleLeyClick(ley)}
                  className="flex items-center justify-between p-5 md:p-6 rounded-2xl bg-[#191c1e] shadow-[8px_8px_16px_#0a0b0c,-8px_-8px_16px_#282d30] active:shadow-[inset_4px_4px_8px_#0a0b0c,inset_-4px_-4px_8px_#282d30] border-2 border-transparent hover:border-[#ffe088]/30 transition-all duration-200 cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0 mr-4">
                    <div className="w-12 h-12 rounded-full bg-[#191c1e] shadow-[inset_4px_4px_8px_#0a0b0c,inset_-4px_-4px_8px_#282d30] flex items-center justify-center text-[#c6c6cd] group-hover:text-[#ffe088] transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[24px]">headphones</span>
                    </div>
                    <span className="font-bold text-sm md:text-base text-[#eff1f3] group-hover:text-white transition-colors truncate">
                      {ley.nombre}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xl md:text-2xl font-black text-[#fed65b] transition-colors tracking-tight">
                      {parseFloat(ley.porcentaje_preguntas).toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#c6c6cd]">Frecuencia</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={() => { stopSpeech(); stopListening(); router.push('/'); }}
            className="mt-12 px-8 py-4 rounded-xl bg-[#191c1e] shadow-[8px_8px_16px_#0a0b0c,-8px_-8px_16px_#282d30] active:shadow-[inset_4px_4px_8px_#0a0b0c,inset_-4px_-4px_8px_#282d30] text-[#c6c6cd] hover:text-[#ffe088] transition-all font-bold uppercase tracking-widest text-xs flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al Inicio
          </button>
        </div>

        {/* Coming Soon Modal */}
        {comingSoon && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#191c1e] w-[90vw] max-w-[400px] rounded-3xl p-6 border border-[#ffe088]/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col items-center text-center relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#ffe088] rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#ffe088] to-[#998651] flex items-center justify-center mb-5 sm:mb-6 shadow-lg text-[#191c1e] shrink-0">
                <span className="material-symbols-outlined text-3xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black text-[#eff1f3] mb-2 sm:mb-3 tracking-tight">Próximamente</h2>
              
              <p className="text-[#c6c6cd] text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed px-2">
                Aún no se han cargado preguntas para <strong className="text-[#ffe088]">{comingSoon.nombre}</strong>. Estamos trabajando en ello para brindarte el mejor contenido.
              </p>
              
              <button 
                onClick={() => {
                  stopSpeech();
                  setComingSoon(null);
                }}
                className="w-full py-3 sm:py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs bg-[#191c1e] text-[#ffe088] border border-[#ffe088]/30 hover:bg-[#ffe088] hover:text-[#191c1e] transition-all shadow-[4px_4px_8px_#0a0b0c,-4px_-4px_8px_#282d30] active:shadow-[inset_2px_2px_4px_#0a0b0c,inset_-2px_-2px_4px_#282d30] shrink-0"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Blocked Law Modal */}
        {blockedLaw && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#191c1e] w-[90vw] max-w-[400px] rounded-3xl p-6 border border-[#ffe088]/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col items-center text-center relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#ffe088] rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#ffe088] to-[#998651] flex items-center justify-center mb-5 sm:mb-6 shadow-lg text-[#191c1e] shrink-0">
                <span className="material-symbols-outlined text-3xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black text-[#eff1f3] mb-2 sm:mb-3 tracking-tight">Acceso Limitado</h2>
              
              <p className="text-[#c6c6cd] text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed px-2">
                La ley <strong className="text-[#ffe088]">{blockedLaw.nombre}</strong> está bloqueada. Como usuario DEMO, tu acceso está restringido al Código Civil. Actualiza tu plan para liberar todo el contenido.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => router.push('/planes')}
                  className="w-full py-3 sm:py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs bg-[#ffe088] text-[#191c1e] shadow-[4px_4px_8px_#0a0b0c,-4px_-4px_8px_#282d30] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)] transition-all shrink-0"
                >
                  Ver Planes
                </button>
                <button 
                  onClick={() => {
                    stopSpeech();
                    setBlockedLaw(null);
                  }}
                  className="w-full py-3 sm:py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs bg-[#191c1e] text-[#c6c6cd] hover:text-[#ffe088] transition-all shrink-0"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------
  // PLAYER RENDER (Stitch Theme)
  // --------------------------------------------------------
  return (
    <div className="h-screen bg-[#191c1e] text-[#eff1f3] flex flex-col font-body-md overflow-hidden relative">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#ba1a1a] text-[#ffffff] px-6 py-3 rounded-xl shadow-[8px_8px_16px_#0a0b0c,-8px_-8px_16px_#282d30] z-[100] animate-in fade-in slide-in-from-top-4 font-bold text-center min-w-[320px] max-w-[90vw] md:max-w-md">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b border-[#c6c6cd]/10 shrink-0 bg-[#191c1e] relative z-10 shadow-[0_4px_8px_#0a0b0c]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            onClick={() => { stopSpeech(); stopListening(); router.push('/'); }}
            className="w-10 h-10 shrink-0 rounded-full bg-[#191c1e] shadow-[4px_4px_8px_#0a0b0c,-4px_-4px_8px_#282d30] active:shadow-[inset_2px_2px_4px_#0a0b0c,inset_-2px_-2px_4px_#282d30] flex items-center justify-center text-[#c6c6cd] hover:text-[#ffe088] transition-all"
            title="Home"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
          </button>
          <span className="material-symbols-outlined text-[24px] text-[#ffe088] shrink-0">headphones</span>
          <div className="flex-1 min-w-0 mr-4">
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-[#ffe088] truncate">
              {currentLeyNombre}
            </h1>
            {currentNode && <p className="text-[#c6c6cd] text-[10px] sm:text-xs font-bold truncate w-full mt-1 uppercase tracking-wider">{currentNode.nombre}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={togglePause}
            className={`flex items-center justify-center px-4 h-10 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-wider mr-1 shadow-[4px_4px_8px_#0a0b0c,-4px_-4px_8px_#282d30] active:shadow-[inset_2px_2px_4px_#0a0b0c,inset_-2px_-2px_4px_#282d30] ${
              isPaused 
                ? 'bg-[#ffe088] text-[#191c1e] animate-pulse' 
                : 'bg-[#191c1e] text-[#ffe088] border border-[#ffe088]/20'
            }`}
          >
            <span className="material-symbols-outlined mr-2">{isPaused ? 'play_arrow' : 'pause'}</span>
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>
          
          <button 
            onClick={() => {
              stopSpeech();
              stopListening();
              setIsPaused(false);
              setViewState('MENU');
            }}
            className="flex items-center justify-center px-3 h-10 rounded-xl bg-[#191c1e] shadow-[4px_4px_8px_#0a0b0c,-4px_-4px_8px_#282d30] active:shadow-[inset_2px_2px_4px_#0a0b0c,inset_-2px_-2px_4px_#282d30] text-[#c6c6cd] hover:text-[#ffe088] transition-colors text-[10px] font-bold uppercase tracking-wider mr-2"
          >
            Menú Leyes
          </button>
          <button 
            onClick={leaveHandsFree}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#191c1e] shadow-[4px_4px_8px_#0a0b0c,-4px_-4px_8px_#282d30] active:shadow-[inset_2px_2px_4px_#0a0b0c,inset_-2px_-2px_4px_#282d30] text-[#c6c6cd] hover:text-[#ba1a1a] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden p-3 sm:p-4 flex flex-col justify-center items-center relative z-10 w-full">
        
        {/* Status Indicators */}
        {(stage === 'LOADING_MAP' || stage === 'LOADING_NODE') && (
          <div className="flex flex-col items-center gap-4 text-[#ffe088]/50 animate-pulse">
            <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
            <p className="font-bold tracking-widest uppercase text-xs">Buscando Siguiente Tema...</p>
          </div>
        )}

        {(stage === 'READING_NODE' || stage === 'QUIZ_INTRO') && (
          <div className="flex flex-col items-center gap-4 w-full max-w-3xl px-4 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#191c1e] shadow-[inset_8px_8px_16px_#0a0b0c,inset_-8px_-8px_16px_#282d30] flex items-center justify-center relative overflow-hidden border border-[#ffe088]/20">
              <span className="material-symbols-outlined text-4xl text-[#fed65b] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              <div className="absolute inset-0 bg-[#fed65b]/20 animate-ping rounded-full" style={{ animationDuration: '2s' }} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#eff1f3] tracking-tight w-full mt-4">
              {stage === 'QUIZ_INTRO' ? 'Preparando Simulacro...' : 'Leyendo Tema...'}
            </h2>
            <p className="text-[#c6c6cd] text-xs sm:text-sm leading-relaxed font-medium w-full">
              {stage === 'READING_NODE' ? 'Escucha atentamente. Al finalizar la lectura, iniciará una evaluación de 5 preguntas.' : 'La evaluación está a punto de comenzar.'}
            </p>
            <button
              onClick={() => {
                stopSpeech();
                setStage('QUIZ_INTRO');
              }}
              className="mt-6 px-6 py-3 rounded-xl bg-[#191c1e] shadow-[6px_6px_12px_#0a0b0c,-6px_-6px_12px_#282d30] active:shadow-[inset_3px_3px_6px_#0a0b0c,inset_-3px_-3px_6px_#282d30] text-[#c6c6cd] hover:text-[#ffe088] transition-all duration-300 text-[10px] font-bold uppercase tracking-[0.2em]"
            >
              Saltar Lectura
            </button>
          </div>
        )}

        {(stage === 'QUIZ_QUESTION' || stage === 'QUIZ_FEEDBACK') && preguntas.length > 0 && (
          <div className="w-full max-w-4xl flex flex-col h-full justify-between">
            {/* Question Header */}
            <div className="text-center space-y-2 px-2 w-full shrink-0">
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#191c1e] shadow-[inset_4px_4px_8px_#0a0b0c,inset_-4px_-4px_8px_#282d30] text-[#ffe088] font-black text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                  Bloque {currentBlock + 1} de {blocksTotal} • Pregunta {quizIndex + 1} de {preguntas.length}
                </span>
                {stage === 'QUIZ_QUESTION' && (
                  <button onClick={readQuestion} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#191c1e] shadow-[4px_4px_8px_#0a0b0c,-4px_-4px_8px_#282d30] active:shadow-[inset_2px_2px_4px_#0a0b0c,inset_-2px_-2px_4px_#282d30] text-[#c6c6cd] hover:text-[#ffe088]" title="Repetir Pregunta">
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                  </button>
                )}
              </div>
              {/* Exam Info & PDF Link */}
              {(preguntas[quizIndex].examen_titulo || preguntas[quizIndex].pdf_url) && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                  {preguntas[quizIndex].examen_titulo && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#c6c6cd] uppercase tracking-wider bg-[#191c1e] border border-[#c6c6cd]/20 px-2 py-0.5 rounded-md">
                      {preguntas[quizIndex].examen_titulo} {preguntas[quizIndex].orden ? `(#${preguntas[quizIndex].orden})` : ''}
                    </span>
                  )}
                  {preguntas[quizIndex].pdf_url && (
                    <a 
                      href={preguntas[quizIndex].pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#ffdad6] hover:text-white transition-colors bg-[#310002] border border-[#93000a]/30 px-2 py-0.5 rounded-md uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                      Ver PDF
                    </a>
                  )}
                </div>
              )}

              <h2 className="text-base sm:text-xl font-bold leading-snug text-[#eff1f3] tracking-tight w-full px-2 max-h-[80px] sm:max-h-[100px] overflow-y-auto">
                {preguntas[quizIndex].pregunta}
              </h2>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full px-2 mt-2 mb-2 overflow-y-auto content-center flex-1">
              {['A', 'B', 'C', 'D', 'E'].map((optKey) => {
                const optText = preguntas[quizIndex][`opcion_${optKey.toLowerCase()}`];
                if (!optText) return null;
                
                const isSelected = selectedOption === optKey;
                let cardClass = "bg-[#191c1e] shadow-[6px_6px_12px_#0a0b0c,-6px_-6px_12px_#282d30] hover:shadow-[8px_8px_16px_#0a0b0c,-8px_-8px_16px_#282d30] border-2 border-transparent hover:border-[#ffe088]/30 text-[#eff1f3]";
                let icon = null;

                if (stage === 'QUIZ_FEEDBACK') {
                  if (optKey === feedback.correctAnswer) {
                    cardClass = "bg-[#002116] border-[#479175] text-[#a6f2d1] shadow-[6px_6px_12px_#0a0b0c,-6px_-6px_12px_#282d30]";
                    icon = <span className="material-symbols-outlined text-[#a6f2d1] text-[20px]">check_circle</span>;
                  } else if (isSelected && !feedback.isCorrect) {
                    cardClass = "bg-[#310002] border-[#93000a] text-[#ffdad6] shadow-[6px_6px_12px_#0a0b0c,-6px_-6px_12px_#282d30]";
                    icon = <span className="material-symbols-outlined text-[#ffdad6] text-[20px]">cancel</span>;
                  } else {
                    cardClass = "bg-[#191c1e] border-transparent text-[#c6c6cd] opacity-30 shadow-[inset_2px_2px_4px_#0a0b0c,inset_-2px_-2px_4px_#282d30]";
                  }
                } else if (isSelected) {
                  cardClass = "bg-[#191c1e] border-[#ffe088] text-[#ffe088] shadow-[inset_4px_4px_8px_#0a0b0c,inset_-4px_-4px_8px_#282d30]";
                }

                return (
                  <button
                    key={optKey}
                    onClick={() => handleOptionSelect(optKey, false)}
                    onDoubleClick={() => handleOptionSelect(optKey, true)}
                    disabled={stage === 'QUIZ_FEEDBACK'}
                    className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-all duration-300 text-left w-full group select-none ${cardClass}`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm sm:text-base transition-colors ${
                      isSelected && stage !== 'QUIZ_FEEDBACK' 
                        ? 'bg-[#ffe088] text-[#191c1e]' 
                        : stage === 'QUIZ_FEEDBACK' && optKey === feedback.correctAnswer ? 'bg-[#a6f2d1] text-[#002116]'
                        : stage === 'QUIZ_FEEDBACK' && isSelected && !feedback.isCorrect ? 'bg-[#ffdad6] text-[#93000a]'
                        : 'bg-[#3f465c] text-[#eff1f3]'
                    }`}>
                      {optKey}
                    </div>
                    <span className="font-semibold text-xs sm:text-sm leading-snug flex-1">
                      {cleanOptionText(optText)}
                    </span>
                    {icon && <div className="shrink-0">{icon}</div>}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions / Feedback */}
            <div className="shrink-0 flex flex-col items-center w-full px-2">
              {stage === 'QUIZ_FEEDBACK' ? (
                <div className={`w-full p-4 rounded-xl text-left shadow-[inset_6px_6px_12px_#0a0b0c,inset_-6px_-6px_12px_#282d30] flex flex-col items-start gap-2 ${
                  feedback.isCorrect ? 'bg-[#002116]/50' : 'bg-[#310002]/50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: feedback.isCorrect ? '#a6f2d1' : '#ffdad6' }}>
                      gavel
                    </span>
                    <p className={`font-black uppercase tracking-[0.2em] text-[10px] ${feedback.isCorrect ? 'text-[#a6f2d1]' : 'text-[#ffdad6]'}`}>
                      {feedback.isCorrect ? '¡Correcto!' : 'Respuesta Incorrecta'}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-[#eff1f3] line-clamp-2">Base: {feedback.legalBasis}</p>
                </div>
              ) : (
                <div className="w-full flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-[#c6c6cd]">
                    <button 
                      onClick={isListening ? stopListening : startListening}
                      disabled={micError && !micSupported || isPaused}
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[4px_4px_8px_#0a0b0c,-4px_-4px_8px_#282d30] active:shadow-[inset_2px_2px_4px_#0a0b0c,inset_-2px_-2px_4px_#282d30] transition-colors border-2 ${isPaused ? 'bg-[#191c1e] opacity-50 border-transparent' : isListening ? 'bg-[#002116] border-[#479175] text-[#a6f2d1] animate-pulse' : micError ? 'bg-[#310002] border-[#93000a] text-[#ffdad6] opacity-50' : 'bg-[#191c1e] border-transparent hover:text-[#ffe088]'}`}
                      title={isPaused ? "Pausado" : micError ? "Micrófono no disponible" : isListening ? "Escuchando... clic para detener" : "Clic para hablar"}
                    >
                      <span className="material-symbols-outlined">{isPaused ? 'pause_circle' : micError ? 'mic_off' : 'mic'}</span>
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#ffe088]">
                        {isPaused ? 'PAUSADO' : isListening ? `Escuchando tu respuesta... (${60 - waitingSeconds}s)` : micError ? 'Micrófono desactivado' : 'Activa el micrófono'}
                      </span>
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider opacity-70">
                        {isPaused ? 'Haz clic en reanudar' : micError ? 'Usa doble clic para responder' : 'Di "Opción A", "Opción B", etc.'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => submitAnswer(selectedOption, quizIndex, preguntas)}
                    disabled={!selectedOption}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all duration-300 shadow-[6px_6px_12px_#0a0b0c,-6px_-6px_12px_#282d30] ${
                      selectedOption 
                        ? 'bg-[#ffe088] text-[#191c1e] hover:bg-[#e9c349] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.5)] cursor-pointer' 
                        : 'bg-[#191c1e] text-[#3f465c] cursor-not-allowed border border-transparent opacity-50'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs">Siguiente</span>
                    <span className="material-symbols-outlined text-[16px]">skip_next</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {stage === 'QUIZ_RESULT' && (() => {
          const isApproved = correctCount / preguntas.length >= 0.8;
          const score = (correctCount / preguntas.length * 10).toFixed(1);
          return (
          <div className={`flex flex-col items-center text-center animate-in zoom-in-95 duration-700 max-w-[450px] w-full p-8 sm:p-10 rounded-[2.5rem] backdrop-blur-xl border border-white/5 shadow-2xl relative overflow-hidden ${isApproved ? 'bg-gradient-to-b from-[#003d2b]/40 to-[#191c1e]' : 'bg-gradient-to-b from-[#6b0f1a]/40 to-[#191c1e]'}`}>
            
            {/* Background Glow Effect */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-50 ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

            <div className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center mb-8 z-10 transition-transform hover:scale-110 duration-500 shadow-[0_0_40px_rgba(0,0,0,0.4)] border-4 ${
              isApproved 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-700 border-emerald-400/50' 
                : 'bg-gradient-to-br from-rose-500 to-red-800 border-rose-400/50'
            }`}>
              <span className={`material-symbols-outlined text-6xl sm:text-8xl drop-shadow-lg ${isApproved ? 'text-emerald-50 animate-bounce' : 'text-rose-50 animate-pulse'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {isApproved ? 'workspace_premium' : 'refresh'}
              </span>
            </div>
            
            <h2 className={`text-4xl sm:text-5xl font-black mb-4 tracking-tighter z-10 text-transparent bg-clip-text drop-shadow-sm ${isApproved ? 'bg-gradient-to-br from-emerald-200 to-teal-400' : 'bg-gradient-to-br from-rose-200 to-red-400'}`}>
              {isApproved ? '¡Tema Aprobado!' : 'Repaso Sugerido'}
            </h2>
            
            <div className="text-[#c6c6cd] text-sm sm:text-base mb-10 font-medium z-10 flex flex-col items-center gap-2">
              Obtuviste {correctCount} de {preguntas.length} aciertos
              <div className="mt-4 flex items-center justify-center relative group cursor-default">
                <div className={`absolute inset-0 blur-xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <span className={`relative font-black text-3xl sm:text-4xl px-10 py-5 rounded-3xl border backdrop-blur-md shadow-xl flex items-baseline gap-2 ${
                  isApproved 
                    ? 'bg-[#002116]/80 border-emerald-500/30 text-emerald-300' 
                    : 'bg-[#310002]/80 border-rose-500/30 text-rose-300'
                }`}>
                  {score} <span className="opacity-60 text-lg sm:text-xl font-bold">/ 10</span>
                </span>
              </div>
            </div>

            <div className="flex gap-4 w-full px-2 z-10">
              <button
                onClick={() => {
                  stopSpeech();
                  setStage(isApproved ? 'LOADING_MAP' : 'READING_NODE');
                }}
                className={`flex-1 px-6 py-5 rounded-2xl font-black uppercase tracking-[0.15em] transition-all duration-300 text-xs sm:text-sm shadow-xl hover:-translate-y-1 ${
                  isApproved
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-[#002116] hover:shadow-[0_10px_40px_-10px_rgba(52,211,153,0.5)]'
                    : 'bg-gradient-to-r from-rose-400 to-red-500 text-[#310002] hover:shadow-[0_10px_40px_-10px_rgba(251,113,133,0.5)]'
                }`}
              >
                Continuar
              </button>
            </div>
          </div>
          );
        })()}
      </main>

      {/* Pop-up de Invitaciones Ganadas */}
      {wonInvitations > 0 && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#191c1e] rounded-2xl p-8 max-w-sm w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden text-center transform scale-100 animate-slide-up border-2 border-[#b59348]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#b59348] via-[#ffd700] to-[#b59348]"></div>
            
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#191c1e] to-[#0a0b0c] rounded-full flex items-center justify-center mb-6 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] border border-[#b59348]/30">
              <span className="text-4xl">🎫</span>
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">
              ¡Felicidades Fundador!
            </h2>
            
            <p className="text-sm font-medium text-[#b59348] mb-4 uppercase tracking-widest">
              Has ganado {wonInvitations} {wonInvitations === 1 ? 'invitación' : 'invitaciones'}
            </p>
            
            <p className="text-[#c6c6cd] mb-8 text-[15px] leading-relaxed">
              Gracias por tu dedicación. Ahora tienes el poder de invitar a un amigo a la plataforma <strong>Notario Élite</strong>, otorgándole 2 meses de acceso gratuito.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { stopSpeech(); stopListening(); router.push('/invitaciones'); }}
                className="w-full bg-[#ffe088] hover:bg-[#fed65b] text-[#191c1e] font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Invitar a un amigo ahora
              </button>
              
              <button 
                onClick={() => setWonInvitations(0)}
                className="w-full bg-[#191c1e] hover:bg-[#282d30] border border-[#c6c6cd]/20 text-[#c6c6cd] font-semibold py-3 px-6 rounded-xl transition-all"
              >
                Continuar estudiando
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
