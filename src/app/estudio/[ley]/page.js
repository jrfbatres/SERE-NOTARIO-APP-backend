/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '../../ThemeContext';

import GlossaryText from '@/components/GlossaryText';

const FlameIcon = ({ className = "", style = {} }) => {
  let fontSize = '12px';
  if (className.includes('w-3.5') || className.includes('h-3.5')) fontSize = '14px';
  else if (className.includes('w-4') || className.includes('h-4')) fontSize = '16px';
  else if (className.includes('w-3') || className.includes('h-3')) fontSize = '12px';

  return (
    <span 
      className={`inline-flex items-center justify-center select-none ${className}`} 
      style={{ 
        fontSize, 
        lineHeight: 1,
        width: 'auto',
        height: 'auto',
        ...style 
      }}
    >
      🔥
    </span>
  );
};

const isArticleDerogado = (art) => {
  if (!art) return false;
  const content = (art.contenido || '').trim();
  const contentUpper = content.toUpperCase();
  const titleUpper = (art.titulo || '').trim().toUpperCase();

  // 1. Explicit title or content starts with DEROGADO/DEROGADA/DEROGADOS
  if (contentUpper.startsWith('DEROGADO') || 
      contentUpper.startsWith('DEROGADA') || 
      contentUpper.startsWith('DEROGADOS') || 
      titleUpper.startsWith('DEROGADO') || 
      titleUpper.startsWith('DEROGADA') || 
      titleUpper.startsWith('DEROGADOS') || 
      titleUpper.startsWith('ARTÍCULO DEROGADO') || 
      titleUpper.startsWith('ARTICULO DEROGADO') || 
      titleUpper.includes('(DEROGADO)') || 
      titleUpper.includes('(DEROGADA)')) {
    return true;
  }

  // 2. Content matches common derogation citation patterns and is relatively short (e.g. < 120 chars)
  if (content.length > 0 && content.length < 120) {
    const isLawRef = /^(L\.?\s*\d+|D\.L\.?\s*\d+|DECRETO\s+(LEGISLATIVO\s+)?N)/i.test(content);
    if (isLawRef) {
      return true;
    }
    if (contentUpper.includes('DEROGADO') || contentUpper.includes('DEROGADA') || contentUpper.includes('DEROGADOS')) {
      return true;
    }
  }

  return false;
};

const cleanOptionText = (text) => {
  if (!text) return '';
  return text.replace(/^[a-c](?:\s*\.|\s*\)|\s+)\s*/i, '').trim();
};

const findAncestorIds = (node, targetId, path = []) => {
  if (!node) return null;
  if (node.id === targetId) return path;
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const result = findAncestorIds(child, targetId, [...path, node.id]);
      if (result) return result;
    }
  }
  return null;
};

const findNodeInTree = (node, targetId) => {
  if (!node) return null;
  if (node.id === targetId) return node;
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const found = findNodeInTree(child, targetId);
      if (found) return found;
    }
  }
  return null;
};

const areDescendantsCompleted = (node) => {
  if (!node) return true;
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (child.total_preguntas > 0 && !child.usuario_completado) {
        return false;
      }
      if (!areDescendantsCompleted(child)) {
        return false;
      }
    }
  }
  return true;
};

export default function EstudioPage() {
  const router = useRouter();
  const params = useParams();
  const { ley } = params;
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [mapa, setMapa] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(ley);
  const [nodeContent, setNodeContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [glossary, setGlossary] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('articulos'); // 'glosario' | 'articulos'
  const [wonInvitations, setWonInvitations] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) {
        setShowLeftSidebar(true);
        setShowRightSidebar(true);
      }
    }
  }, []);

  // Toast and sequential unlocking states
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };

  // Get study sequence (flattened active study nodes using post-order: children first, parent last)
  const getStudySequence = (node) => {
    if (!node) return [];
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

  const studySequence = getStudySequence(mapa);
  const selectedNode = findNodeInTree(mapa, selectedNodeId);
  const displayPct = selectedNode ? parseFloat(selectedNode.porcentaje_preguntas || 0) : parseFloat(nodeContent?.porcentaje_preguntas || 0);
  const displayTotalQ = selectedNode ? parseInt(selectedNode.total_preguntas || 0) : parseInt(nodeContent?.total_preguntas || 0);

  const isBaseNodeUnlocked = (nodeId) => {
    if (!mapa) return false;
    
    // Premium and Administrador bypass all locks
    const rol = userProfile?.rol;
    if (rol === 'Premium' || rol === 'Administrador') {
      return true;
    }

    const firstUncompleted = studySequence.find(n => !n.completado);
    
    // Vencido logic: only completed nodes are unlocked
    if (rol === 'Vencido') {
      const index = studySequence.findIndex(n => n.id === nodeId);
      if (index === -1) return true;
      return !!studySequence[index].completado;
    }

    // DEMO logic: limit to first 4 questions nodes
    if (rol === 'DEMO') {
      const index = studySequence.findIndex(n => n.id === nodeId);
      if (index >= 4) {
        return false; // Force lock from 5th node onwards
      }
    }

    if (!firstUncompleted) return true; // If everything is completed, all are unlocked
    if (nodeId === firstUncompleted.id) return true;
    
    const index = studySequence.findIndex(n => n.id === nodeId);
    if (index === -1) return true;
    if (studySequence[index].completado) return true;
    
    const ancestorsOfActive = findAncestorIds(mapa, firstUncompleted.id);
    if (ancestorsOfActive && ancestorsOfActive.includes(nodeId)) {
      return true;
    }
    
    for (let i = 0; i < index; i++) {
      if (!studySequence[i].completado) {
        return false;
      }
    }
    return true;
  };

  const isNodeUnlocked = (nodeId) => {
    if (!mapa) return false;
    
    // 1. If the node itself is base-unlocked, it's unlocked
    if (isBaseNodeUnlocked(nodeId)) return true;
    
    // 2. Otherwise, check if ANY descendant node (which has questions) is base-unlocked
    const targetNode = findNodeInTree(mapa, nodeId);
    if (!targetNode) return false;
    
    const hasUnlockedDescendantWithQuestions = (node) => {
      if (!node.children || node.children.length === 0) return false;
      for (const child of node.children) {
        if (child.total_preguntas > 0 && isBaseNodeUnlocked(child.id)) {
          return true;
        }
        if (hasUnlockedDescendantWithQuestions(child)) {
          return true;
        }
      }
      return false;
    };
    
    return hasUnlockedDescendantWithQuestions(targetNode);
  };

  const getFirstUncompletedNodeBefore = (nodeId) => {
    const index = studySequence.findIndex(n => n.id === nodeId);
    if (index > 0) {
      for (let i = 0; i < index; i++) {
        if (!studySequence[i].completado) {
          return studySequence[i]; // Return the whole object
        }
      }
    }
    return null;
  };

  // Tabs state
  const [activeTab, setActiveTab] = useState('simulacro'); // 'info' | 'slides' | 'simulacro' | 'preguntas_asociadas'
  const [showDerogados, setShowDerogados] = useState(false);
  const [preguntasAsociadas, setPreguntasAsociadas] = useState([]);
  const [loadingPreguntasAsociadas, setLoadingPreguntasAsociadas] = useState(false);

  // Mini-Simulacro states
  const [miniPreguntas, setMiniPreguntas] = useState([]);
  const [allMiniPreguntas, setAllMiniPreguntas] = useState([]);
  const [miniBlocksTotal, setMiniBlocksTotal] = useState(1);
  const [miniCurrentBlock, setMiniCurrentBlock] = useState(0);
  const [miniLoading, setMiniLoading] = useState(false);
  const [miniIndex, setMiniIndex] = useState(0);
  const [miniSelected, setMiniSelected] = useState(null);
  const [miniAnswered, setMiniAnswered] = useState(false);
  const [miniCorrectCount, setMiniCorrectCount] = useState(0);
  const [miniFinished, setMiniFinished] = useState(false);
  const [miniResponses, setMiniResponses] = useState([]);

  // Hands-free (Manos Libres) states and refs
  const [isHandsFreeActive, setIsHandsFreeActive] = useState(false);
  const isHandsFreeActiveRef = useRef(false);
  const micDisabledRef = useRef(false);
  const handsFreeStateRef = useRef('idle'); // 'idle' | 'speaking_question' | 'listening' | 'reading_articles' | 'speaking_feedback'
  const recognitionRef = useRef(null);
  const handsFreeTimeoutRef = useRef(null);
  const handsFreeTickIntervalRef = useRef(null);
  const [handsFreeTranscript, setHandsFreeTranscript] = useState('');
  const [playingArticleId, setPlayingArticleId] = useState(null);

  // Microphone diagnostics test states
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micTestResult, setMicTestResult] = useState('');
  const [micTestStatus, setMicTestStatus] = useState('idle'); // 'idle' | 'listening' | 'success' | 'error'
  const micTestRecognitionRef = useRef(null);

  // Synchronized refs to avoid stale closures in browser audio/speech callbacks
  const miniPreguntasRef = useRef([]);
  const miniIndexRef = useRef(0);
  const miniAnsweredRef = useRef(false);
  const miniSelectedRef = useRef(null);

  useEffect(() => {
    isHandsFreeActiveRef.current = isHandsFreeActive;
  }, [isHandsFreeActive]);

  useEffect(() => {
    miniPreguntasRef.current = miniPreguntas;
  }, [miniPreguntas]);

  useEffect(() => {
    miniIndexRef.current = miniIndex;
  }, [miniIndex]);

  useEffect(() => {
    miniAnsweredRef.current = miniAnswered;
  }, [miniAnswered]);

  useEffect(() => {
    miniSelectedRef.current = miniSelected;
  }, [miniSelected]);

  // Text-To-Speech for legal analysis
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const speechUtteranceRef = useRef(null);

  const toggleSpeech = (node) => {
    if (typeof window === 'undefined' || !node) return;
    
    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Construct the narrative text to read
    let textToRead = `Tema de estudio: ${node.nombre}. `;
    if (node.concepto && node.concepto.trim() !== '') {
      textToRead += `Concepto: ${node.concepto}. `;
    }
    if (node.analisis_jurisconsulto && node.analisis_jurisconsulto.trim() !== '') {
      textToRead += `Análisis Jurisconsulto: ${node.analisis_jurisconsulto}. `;
    }
    textToRead += "Fin de la lectura.";

    // Clean markdown symbols and expand abbreviations for natural spoken reading
    const cleanText = textToRead
      .replace(/[*#_`]/g, '')
      .replace(/\bArts\b\.?/gi, 'Artículos')
      .replace(/\bArt\b\.?/gi, 'Artículo')
      .replace(/\bLN\b/g, 'Ley de Notariado');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX'; // Neutral Spanish (Latin America)
    
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es-MX')) || 
                    voices.find(v => v.lang.startsWith('es-419')) || 
                    voices.find(v => v.lang.startsWith('es-ES')) || 
                    voices.find(v => v.lang.startsWith('es'));
    if (esVoice) {
      utterance.voice = esVoice;
    }
    
    utterance.rate = 0.96; // More natural, conversational pace
    utterance.pitch = 0.95; // Slightly lower, serene tone

    utterance.onend = () => {
      setIsPlayingSpeech(false);
    };

    utterance.onerror = () => {
      setIsPlayingSpeech(false);
    };

    speechUtteranceRef.current = utterance;
    setIsPlayingSpeech(true);
    window.speechSynthesis.speak(utterance);
  };

  // Helper to read a single article aloud from the sidebar
  const toggleSpeechArticle = (art) => {
    if (typeof window === 'undefined' || !art) return;
    
    if (playingArticleId === art.id) {
      window.speechSynthesis.cancel();
      setPlayingArticleId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingArticleId(art.id);

    // If hands-free is active, disable it to prevent mic picking up the synthesized audio
    if (isHandsFreeActiveRef.current) {
      setIsHandsFreeActive(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (handsFreeTimeoutRef.current) clearTimeout(handsFreeTimeoutRef.current);
      if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);
    }

    const titleText = art.titulo ? `${art.titulo}. ` : '';
    let textToRead = `Artículo ${art.numero}. ${titleText} ${art.contenido}.`;

    const cleanText = textToRead
      .replace(/[*#_`]/g, '')
      .replace(/\bArts\b\.?/gi, 'Artículos')
      .replace(/\bArt\b\.?/gi, 'Artículo')
      .replace(/\bLN\b/g, 'Ley de Notariado');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX';
    
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es-MX')) || 
                    voices.find(v => v.lang.startsWith('es-419')) || 
                    voices.find(v => v.lang.startsWith('es-ES')) || 
                    voices.find(v => v.lang.startsWith('es'));
    if (esVoice) {
      utterance.voice = esVoice;
    }
    
    utterance.rate = 0.96;
    utterance.pitch = 0.95;

    utterance.onend = () => {
      setPlayingArticleId(null);
    };

    utterance.onerror = () => {
      setPlayingArticleId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeechAllArticles = () => {
    if (typeof window === 'undefined' || !nodeContent || !nodeContent.articulos) return;
    
    if (playingArticleId === 'all') {
      window.speechSynthesis.cancel();
      setPlayingArticleId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingArticleId('all');

    if (isHandsFreeActiveRef.current) {
      setIsHandsFreeActive(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (handsFreeTimeoutRef.current) clearTimeout(handsFreeTimeoutRef.current);
      if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);
    }

    const filteredArticulos = (nodeContent.articulos || []).filter(art => {
      if (showDerogados) return true;
      return !isArticleDerogado(art);
    });

    let fullText = "Lectura de todos los artículos de este tema. ";
    filteredArticulos.forEach(art => {
      const titleText = art.titulo ? `${art.titulo}. ` : '';
      fullText += `Artículo ${art.numero}. ${titleText} ${art.contenido}. `;
    });

    const cleanText = fullText
      .replace(/[*#_`]/g, '')
      .replace(/\bArts\b\.?/gi, 'Artículos')
      .replace(/\bArt\b\.?/gi, 'Artículo')
      .replace(/\bLN\b/g, 'Ley de Notariado');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX';
    
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es-MX')) || 
                    voices.find(v => v.lang.startsWith('es-419')) || 
                    voices.find(v => v.lang.startsWith('es-ES')) || 
                    voices.find(v => v.lang.startsWith('es'));
    if (esVoice) {
      utterance.voice = esVoice;
    }
    
    utterance.rate = 0.96;
    utterance.pitch = 0.95;

    utterance.onend = () => {
      setPlayingArticleId(null);
    };

    utterance.onerror = () => {
      setPlayingArticleId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleReadingRelated = (textToRead, type) => {
    if (typeof window === 'undefined') return;
    
    if (playingArticleId === type) {
      window.speechSynthesis.cancel();
      setPlayingArticleId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingArticleId(type);

    if (isHandsFreeActiveRef.current) {
      setIsHandsFreeActive(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (handsFreeTimeoutRef.current) clearTimeout(handsFreeTimeoutRef.current);
      if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);
    }

    speakHandsFreeText(textToRead, () => setPlayingArticleId(null), () => setPlayingArticleId(null));
  };

  // Helper to speak custom text in neutral Spanish for hands-free mode
  const speakHandsFreeText = (textToRead, onEndCallback, onErrorCallback) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();

    const cleanText = textToRead
      .replace(/[*#_`]/g, '')
      .replace(/\bArts\b\.?/gi, 'Artículos')
      .replace(/\bArt\b\.?/gi, 'Artículo')
      .replace(/\bLN\b/g, 'Ley de Notariado')
      .replace(/\[\+\]/g, '')
      .replace(/\[-\]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX'; // Neutral Spanish
    
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es-MX')) || 
                    voices.find(v => v.lang.startsWith('es-419')) || 
                    voices.find(v => v.lang.startsWith('es-ES')) || 
                    voices.find(v => v.lang.startsWith('es'));
    if (esVoice) {
      utterance.voice = esVoice;
    }
    
    utterance.rate = 0.96; // More natural, conversational pace
    utterance.pitch = 0.95; // Lower, serene tone

    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn("Speech Synthesis warning in hands free:", e.error);
      }
      if (onErrorCallback) onErrorCallback();
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Helper to play a soft click sound (ticking clock)
  const playTickSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, ctx.currentTime); // 900Hz click
      
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.error("AudioContext error:", e);
    }
  };

  // Reads only the answer choices
  const speakOptionsVoice = () => {
    if (!isHandsFreeActiveRef.current) return;

    handsFreeStateRef.current = 'speaking_question';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);

    const questions = miniPreguntasRef.current;
    const idx = miniIndexRef.current;
    const currentQ = questions[idx];

    let text = `Las opciones son: `;
    text += `Opción A. ${cleanOptionText(currentQ.opcion_a)}. `;
    text += `Opción B. ${cleanOptionText(currentQ.opcion_b)}. `;
    if (currentQ.opcion_c) text += `Opción C. ${cleanOptionText(currentQ.opcion_c)}. `;
    if (currentQ.opcion_d) text += `Opción D. ${cleanOptionText(currentQ.opcion_d)}. `;
    if (currentQ.opcion_e) text += `Opción E. ${cleanOptionText(currentQ.opcion_e)}. `;
    text += `Selecciona tu respuesta en la pantalla.`;

    speakHandsFreeText(text, () => {
      handsFreeStateRef.current = 'idle';
    }, () => {
      handsFreeStateRef.current = 'idle';
    });
  };

  // Speaks the current question and options, then activates recognition
  const speakCurrentHandsFreeQuestion = () => {
    if (!isHandsFreeActiveRef.current) return;
    const questions = miniPreguntasRef.current;
    const idx = miniIndexRef.current;
    if (!questions || questions.length === 0 || idx >= questions.length) return;

    handsFreeStateRef.current = 'speaking_question';
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const currentQ = questions[idx];
    let text = `Pregunta número ${idx + 1}. ${currentQ.pregunta}. \n`;
    text += `Opción A. ${cleanOptionText(currentQ.opcion_a)}. `;
    text += `Opción B. ${cleanOptionText(currentQ.opcion_b)}. `;
    if (currentQ.opcion_c) text += `Opción C. ${cleanOptionText(currentQ.opcion_c)}. `;
    if (currentQ.opcion_d) text += `Opción D. ${cleanOptionText(currentQ.opcion_d)}. `;
    if (currentQ.opcion_e) text += `Opción E. ${cleanOptionText(currentQ.opcion_e)}. `;
    text += `Selecciona tu respuesta en la pantalla.`;

    speakHandsFreeText(text, () => {
      handsFreeStateRef.current = 'idle';
    }, () => {
      handsFreeStateRef.current = 'idle';
    });
  };

  // Starts SpeechRecognition listening (recreating instance each time for browser stability)
  const startListeningForResponse = () => {
    // Micrófono desactivado por petición del usuario (solo lectura)
    handsFreeStateRef.current = 'idle';
  };

  // Handles silence timeout after 10 seconds
  const handleSilenceTimeout = () => {
    if (!isHandsFreeActiveRef.current || handsFreeStateRef.current !== 'listening') return;

    handsFreeStateRef.current = 'speaking_feedback';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);

    speakHandsFreeText("¿Deseas que repita la pregunta o que lea las opciones?", () => {
      if (isHandsFreeActiveRef.current) {
        startListeningForResponse();
      }
    }, () => {
      if (isHandsFreeActiveRef.current) {
        startListeningForResponse();
      }
    });
  };

  // Parses voice commands
  const handleSpeechInput = (inputText) => {
    if (!isHandsFreeActiveRef.current) return;

    const text = inputText.toLowerCase().trim();

    // Detener modo
    if (text.includes('detener') || text.includes('parar') || text.includes('salir') || text.includes('cancelar') || text.includes('apagar')) {
      setIsHandsFreeActive(false);
      speakHandsFreeText("Modo manos libres desactivado.", null, null);
      if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);
      return;
    }

    // Leer artículos asociados
    if (text.includes('artículo') || text.includes('articulo') || text.includes('artículos') || text.includes('articulos') || text.includes('ley')) {
      readArticlesVoice();
      return;
    }

    // Repetir pregunta
    if (text.includes('repetir') || text.includes('repite') || text.includes('pregunta')) {
      speakCurrentHandsFreeQuestion();
      return;
    }

    // Leer opciones
    if (text.includes('opciones') || text.includes('lee opciones') || text.includes('leer opciones')) {
      speakOptionsVoice();
      return;
    }

    // Normalizar texto para comparación robusta
    const cleanText = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // quitar puntuación

    // Identificar opciones con regexes más amplios y flexibles
    let selectedOption = null;
    if (
      /\b(opcion|la|letra|letra\s+de|respuesta|marca)\s+a\b/i.test(cleanText) ||
      /\ba\s+(es|correcta|verdadera|falsa|de\s+abeja|de\s+avion|de\s+arbol)\b/i.test(cleanText) ||
      /^\s*a\s*$/i.test(cleanText) ||
      cleanText === 'a' ||
      cleanText.endsWith(' la a') ||
      cleanText.endsWith(' opcion a')
    ) {
      selectedOption = 'A';
    } else if (
      /\b(opcion|la|letra|letra\s+de|respuesta|marca)\s+b\b/i.test(cleanText) ||
      /\bb\s+(es|correcta|verdadera|falsa|de\s+bueno|de\s+burro|de\s+barco)\b/i.test(cleanText) ||
      /^\s*b\s*$/i.test(cleanText) ||
      cleanText === 'b' ||
      cleanText.endsWith(' la b') ||
      cleanText.endsWith(' opcion b')
    ) {
      selectedOption = 'B';
    } else if (
      /\b(opcion|la|letra|letra\s+de|respuesta|marca)\s+c\b/i.test(cleanText) ||
      /\bc\s+(es|correcta|verdadera|falsa|de\s+casa|de\s+carro|de\s+coco)\b/i.test(cleanText) ||
      /^\s*c\s*$/i.test(cleanText) ||
      cleanText === 'c' ||
      cleanText.endsWith(' la c') ||
      cleanText.endsWith(' opcion c')
    ) {
      selectedOption = 'C';
    }

    if (selectedOption) {
      setMiniSelected(selectedOption);

      handsFreeStateRef.current = 'speaking_feedback';
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);

      const questions = miniPreguntasRef.current;
      const idx = miniIndexRef.current;
      const currentQ = questions[idx];
      const isCorrect = selectedOption === currentQ.respuesta_correcta;

      handleMiniSubmitAnswer(selectedOption);

      const feedbackText = isCorrect 
        ? "Correcto." 
        : `Respuesta incorrecta. La respuesta correcta es la ${currentQ.respuesta_correcta.toLowerCase()}.`;

      speakHandsFreeText(feedbackText, () => {
        if (isHandsFreeActiveRef.current) {
          if (handsFreeTimeoutRef.current) clearTimeout(handsFreeTimeoutRef.current);
          handsFreeTimeoutRef.current = setTimeout(() => {
            advanceToNextHandsFree();
          }, 2500);
        }
      }, () => {
        if (isHandsFreeActiveRef.current) {
          advanceToNextHandsFree();
        }
      });
    } else {
      // Repetir instrucciones si no se entendió
      handsFreeStateRef.current = 'speaking_feedback';
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);
      speakHandsFreeText("No te entendí. Por favor di opción A, opción B, opción C, o leer artículo.", () => {
        if (isHandsFreeActiveRef.current) {
          startListeningForResponse();
        }
      }, () => {
        if (isHandsFreeActiveRef.current) {
          startListeningForResponse();
        }
      });
    }
  };

  // Reads associated articles out loud
  const readArticlesVoice = () => {
    if (!isHandsFreeActiveRef.current) return;

    handsFreeStateRef.current = 'reading_articles';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);

    const questions = miniPreguntasRef.current;
    const idx = miniIndexRef.current;
    const currentQ = questions[idx];

    let currentArticles = (currentQ?.articulos_vinculados || []).filter(art => !isArticleDerogado(art));
    if (currentArticles.length === 0) {
      currentArticles = (nodeContent?.articulos || []).filter(art => !isArticleDerogado(art));
    }

    if (currentArticles.length === 0) {
      speakHandsFreeText("No hay artículos asociados a esta pregunta.", () => {
        if (isHandsFreeActiveRef.current) {
          startListeningForResponse();
        }
      }, () => {
        if (isHandsFreeActiveRef.current) {
          startListeningForResponse();
        }
      });
      return;
    }

    let articlesText = "Lectura de artículos vinculados. ";
    currentArticles.forEach((art) => {
      articlesText += `Artículo ${art.numero}. ${art.titulo ? art.titulo + '. ' : ''} ${art.contenido}. `;
    });
    articlesText += "Fin de los artículos. ¿Cuál es tu respuesta?";

    speakHandsFreeText(articlesText, () => {
      if (isHandsFreeActiveRef.current) {
        startListeningForResponse();
      }
    }, () => {
      if (isHandsFreeActiveRef.current) {
        startListeningForResponse();
      }
    });
  };

  // Moves to the next question or finishes quiz
  const advanceToNextHandsFree = () => {
    if (!isHandsFreeActiveRef.current) return;

    const questions = miniPreguntasRef.current;
    const idx = miniIndexRef.current;

    if (idx < questions.length - 1) {
      setMiniIndex(prev => prev + 1);
      setMiniSelected(null);
      setMiniAnswered(false);
    } else {
      const correctCount = miniCorrectCount;
      const totalCount = questions.length;
      const score = (correctCount / totalCount) * 10;

      let endingText = `Evaluación de tema terminada. Tuviste ${correctCount} respuestas correctas de ${totalCount}. `;
      endingText += `Tu calificación final es de ${score.toFixed(1)} puntos. `;
      if (score >= 8.0) {
        endingText += "¡Felicidades, has aprobado este tema!";
      } else {
        endingText += "No has alcanzado la nota mínima de ocho puntos. Inténtalo de nuevo.";
      }

      setIsHandsFreeActive(false);
      speakHandsFreeText(endingText, null, null);
      handleMiniNext();
    }
  };

  const toggleHandsFree = () => {
    if (isHandsFreeActive) {
      setIsHandsFreeActive(false);
      micDisabledRef.current = false;
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (handsFreeTimeoutRef.current) {
        clearTimeout(handsFreeTimeoutRef.current);
      }
    } else {
      setIsHandsFreeActive(true);
      micDisabledRef.current = false;
      if (miniFinished) {
        setMiniFinished(false);
        setMiniIndex(0);
        setMiniCorrectCount(0);
        setMiniSelected(null);
        setMiniAnswered(false);
        setMiniResponses([]);
        loadMiniQuiz();
      }
    }
  };

  // Stop microphone diagnostics and verification test
  const stopMicTest = () => {
    setIsMicTesting(false);
    setMicTestStatus('idle');
    setMicTestResult('');
    if (micTestRecognitionRef.current) {
      try {
        micTestRecognitionRef.current.onresult = null;
        micTestRecognitionRef.current.onerror = null;
        micTestRecognitionRef.current.onend = null;
        micTestRecognitionRef.current.abort();
      } catch (e) {}
    }
  };

  // Run microphone diagnostics and verification test
  const runMicTest = () => {
    // 1. Turn off hands free first to avoid collision
    setIsHandsFreeActive(false);
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (handsFreeTimeoutRef.current) clearTimeout(handsFreeTimeoutRef.current);
    if (handsFreeTickIntervalRef.current) clearInterval(handsFreeTickIntervalRef.current);

    // 2. Clear previous test recognition
    stopMicTest();

    setIsMicTesting(true);
    setMicTestStatus('listening');
    setMicTestResult('Iniciando micrófono... Habla ahora');

    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicTestStatus('error');
      setMicTestResult('Tu navegador no soporta reconocimiento de voz nativo.');
      return;
    }

    playTickSound();

    const rec = new SpeechRecognition();
    rec.lang = 'es-MX';
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        text += event.results[i][0].transcript;
      }
      if (text.trim()) {
        setMicTestResult(text);
        setMicTestStatus('success');
      }
    };

    rec.onerror = (event) => {
      console.error("Mic test recognition error:", event.error);
      setMicTestStatus('error');
      if (event.error === 'not-allowed') {
        setMicTestResult('Permiso denegado. Habilita el micrófono en la barra de direcciones.');
      } else if (event.error === 'network') {
        setMicTestResult('Error: network. El reconocimiento de voz de Chrome/Edge requiere conexión a Internet.');
      } else {
        setMicTestResult(`Error: ${event.error}`);
      }
    };

    rec.onend = () => {
      // Done
    };

    micTestRecognitionRef.current = rec;

    try {
      rec.start();
    } catch (e) {
      console.error("Failed to start mic test:", e);
      setMicTestStatus('error');
      setMicTestResult('No se pudo iniciar el micrófono.');
    }
  };


  const playSynthSound = (isCorrect) => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (isCorrect) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start(ctx.currentTime + 0.15);
        osc1.stop(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.35);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshSidebarMap = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch(`/api/nodos/mapa?root=${ley}&_t=${Date.now()}`, { headers, cache: 'no-store' })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return { success: false };
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setMapa(data.data);
          setExpandedNodes(prev => {
            if (Object.keys(prev).length === 0) {
              return { [data.data.id]: true };
            }
            return prev;
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error refreshing sidebar map:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!ley) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch(`/api/glosario?ley_id=${ley}&_t=${Date.now()}`, { headers, cache: 'no-store' })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return { success: false };
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          const sorted = [...data.data].sort((a, b) => a.termino.localeCompare(b.termino));
          setGlossary(sorted);
          
          if (sorted.length > 0) {
            const firstTerm = sorted[0].termino.trim();
            const firstLetter = firstTerm.charAt(0).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
            setSelectedLetter(firstLetter);
          }
        }
      })
      .catch(err => console.error("Error loading glossary", err));
  }, [ley, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      fetch(`/api/nodos/mapa?root=${ley}&_t=${Date.now()}`, { headers, cache: 'no-store' }).then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return { success: false };
        }
        return res.json();
      }),
      fetch('/api/usuario/perfil', { headers, cache: 'no-store' }).then(res => res.json())
    ])
      .then(([mapData, profileData]) => {
        if (profileData && profileData.success) {
          setUserProfile(profileData.data);
        }

        if (mapData.success) {
          const rootNode = mapData.data;
          setMapa(rootNode);
          
          // Calculate study sequence to find the first uncompleted node
          const sequence = getStudySequence(rootNode);
          let initialSelectedId = rootNode.id;
          let initialExpanded = { [rootNode.id]: true };

          if (sequence.length > 0) {
            const firstUncompleted = sequence.find(n => !n.completado) || sequence[0];
            initialSelectedId = firstUncompleted.id;
            
            const ancestors = findAncestorIds(rootNode, firstUncompleted.id);
            if (ancestors) {
              ancestors.forEach(id => {
                initialExpanded[id] = true;
              });
            }
          }
          
          setSelectedNodeId(initialSelectedId);
          setExpandedNodes(initialExpanded);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading map:", err);
        setLoading(false);
      });
  }, [ley, router]);

  // Cancel any active text-to-speech and hands free when changing node or tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      setIsHandsFreeActive(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (handsFreeTimeoutRef.current) {
        clearTimeout(handsFreeTimeoutRef.current);
      }
      if (handsFreeTickIntervalRef.current) {
        clearInterval(handsFreeTickIntervalRef.current);
      }
      // Clean up mic test and speech
      stopMicTest();
      setPlayingArticleId(null);
    }
  }, [selectedNodeId, activeTab]);

  useEffect(() => {
    if (!selectedNodeId) return;
    setContentLoading(true);

    // Reset mini quiz states
    setMiniPreguntas([]);
    setMiniIndex(0);
    setMiniSelected(null);
    setMiniAnswered(false);
    setMiniCorrectCount(0);
    setMiniFinished(false);
    setMiniResponses([]);
    setActiveTab('simulacro');
    setSidebarTab('articulos');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch(`/api/nodos/${selectedNodeId}/contenido?_t=${Date.now()}`, { headers, cache: 'no-store' })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return { success: false };
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setNodeContent(data.data);
        }
        setContentLoading(false);
      })
      .catch(err => {
        console.error("Error loading node content:", err);
        setContentLoading(false);
      });
  }, [selectedNodeId, router]);

  const loadMiniQuiz = () => {
    if (!selectedNodeId) return;
    setMiniLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };
    fetch(`/api/simulador/preguntas?nodo_id=${selectedNodeId}&_t=${Date.now()}`, { headers, cache: 'no-store' })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return { success: false };
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          const allQuestions = data.data || [];
          
          // Randomize questions
          for (let i = allQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
          }

          const TQ = allQuestions.length;
          let blocksCount = 1;
          let totalQuizQuestions = TQ;
          
          if (TQ <= 5) {
            blocksCount = 1;
            totalQuizQuestions = TQ;
          } else if (TQ <= 10) {
            blocksCount = 1;
            totalQuizQuestions = 5;
          } else if (TQ <= 20) {
            blocksCount = 2;
            totalQuizQuestions = 10;
          } else if (TQ <= 30) {
            blocksCount = 3;
            totalQuizQuestions = 15;
          } else {
            blocksCount = 4;
            totalQuizQuestions = 20;
          }
          
          const selectedQuestions = allQuestions.slice(0, totalQuizQuestions);
          setAllMiniPreguntas(selectedQuestions);
          setMiniBlocksTotal(blocksCount);
          
          // Obtener bloque de BD en vez de localStorage
          return fetch(`/api/usuario/bloque?nodo_id=${selectedNodeId}&_t=${Date.now()}`, { headers, cache: 'no-store' })
            .then(bRes => bRes.json())
            .then(bData => {
              const savedBlock = bData.success ? parseInt(bData.data, 10) : 0;
              let startBlock = savedBlock < blocksCount ? savedBlock : 0;
              setMiniCurrentBlock(startBlock);
              
              const blockSize = TQ <= 5 ? TQ : 5;
              setMiniPreguntas(selectedQuestions.slice(startBlock * 5, startBlock * 5 + blockSize));
            });
        }
      })
      .then(() => {
        setMiniLoading(false);
      })
      .catch(err => {
        console.error("Error loading mini questions:", err);
        setMiniLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'simulacro' && miniPreguntas.length === 0 && !miniFinished && !miniLoading) {
      loadMiniQuiz();
    }
  }, [activeTab, selectedNodeId, miniPreguntas.length, miniFinished, miniLoading]);

  useEffect(() => {
    if (activeTab === 'preguntas_asociadas' && selectedNodeId) {
      setLoadingPreguntasAsociadas(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };
      fetch(`/api/nodos/${selectedNodeId}/preguntas_asociadas?_t=${Date.now()}`, { headers, cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPreguntasAsociadas(data.data);
          }
          setLoadingPreguntasAsociadas(false);
        })
        .catch(err => {
          console.error("Error loading preguntas asociadas:", err);
          setLoadingPreguntasAsociadas(false);
        });
    }
  }, [activeTab, selectedNodeId, router]);

  // Handle automatic question reading in hands-free mode
  useEffect(() => {
    if (isHandsFreeActive && activeTab === 'simulacro' && miniPreguntas.length > 0 && !miniFinished) {
      speakCurrentHandsFreeQuestion();
    }
  }, [miniIndex, isHandsFreeActive, activeTab, miniPreguntas, miniFinished]);

  // Cleanup voice resources on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }
        if (handsFreeTimeoutRef.current) {
          clearTimeout(handsFreeTimeoutRef.current);
        }
        if (handsFreeTickIntervalRef.current) {
          clearInterval(handsFreeTickIntervalRef.current);
        }
        if (micTestRecognitionRef.current) {
          try {
            micTestRecognitionRef.current.abort();
          } catch (e) {}
        }
      }
    };
  }, []);

  const handleMiniSelectOption = (optLabel) => {
    if (miniAnswered) return;
    setMiniSelected(optLabel);
    
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    if (playingArticleId) setPlayingArticleId(null);
  };

  const handleMiniSubmitAnswer = (directOpt = null) => {
    const optToSubmit = (typeof directOpt === 'string') ? directOpt : miniSelected;
    if (miniAnswered || !optToSubmit) return;
    
    const currentQ = miniPreguntas[miniIndex];
    const isCorrect = optToSubmit === currentQ.respuesta_correcta;
    
    if (isCorrect) {
      setMiniCorrectCount(prev => prev + 1);
    }
    
    setMiniAnswered(true);
    playSynthSound(isCorrect);

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
          es_correcta: isCorrect,
          respuesta_usuario: optToSubmit
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

    setMiniResponses(prev => [
      ...prev,
      {
        pregunta: currentQ.pregunta,
        selected: optToSubmit,
        correct: currentQ.respuesta_correcta,
        isCorrect,
        explicacion: currentQ.explicacion,
        opcion_a: currentQ.opcion_a,
        opcion_b: currentQ.opcion_b,
        opcion_c: currentQ.opcion_c,
        opcion_d: currentQ.opcion_d,
        opcion_e: currentQ.opcion_e
      }
    ]);
  };

  const handleMiniNext = () => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    if (playingArticleId) setPlayingArticleId(null);

    if (miniIndex < miniPreguntas.length - 1) {
      setMiniIndex(prev => prev + 1);
      setMiniSelected(null);
      setMiniAnswered(false);
    } else {
      const ratio = miniCorrectCount / (miniPreguntas.length || 5);
      const passed = ratio >= 0.8;
      
      if (passed && miniCurrentBlock + 1 < miniBlocksTotal) {
        const nextBlock = miniCurrentBlock + 1;
        const token = localStorage.getItem('token');
        if (token) {
          fetch('/api/usuario/bloque', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ nodo_id: selectedNodeId, bloque_actual: nextBlock })
          })
          .then(res => res.json())
          .then(data => {
            if (data.invitationAwarded) {
              setWonInvitations(prev => prev + 1);
            }
          })
          .catch(err => console.error("Error saving block:", err));
        }
        setMiniFinished(true); // Will show intermediate screen
      } else if (passed && miniCurrentBlock + 1 === miniBlocksTotal) {
        // Passed final block
        const finalScore = ratio * 10;
        const token = localStorage.getItem('token');
        if (token) {
          fetch('/api/usuario/progreso', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              nodo_id: selectedNodeId,
              nota: finalScore,
              completado: true
            })
          })
          .then(res => {
            if (res.status === 401) {
              localStorage.removeItem('token');
              router.push('/login');
              return { success: false };
            }
            return res.json();
          })
          .then(data => {
            if (data.success && data.invitationsAwarded && data.invitationsAwarded > 0) {
              setWonInvitations(prev => prev + data.invitationsAwarded);
            }
            refreshSidebarMap();
            // Reset bloque to 0
            fetch('/api/usuario/bloque', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ nodo_id: selectedNodeId, bloque_actual: 0 })
            }).catch(e => console.error(e));
          })
          .catch(err => console.error("Error saving progress:", err));
        }
        
        setMiniFinished(true);
      } else {
        // Failed
        setMiniFinished(true);
      }
    }
  };

  const toggleNode = (nodeId, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleNodeClick = (node) => {
    const isLocked = node.total_preguntas > 0 && !isNodeUnlocked(node.id);
    if (isLocked) {
      const firstUncompleted = getFirstUncompletedNodeBefore(node.id);
      if (firstUncompleted) {
        showToast(`Para acceder a este tema, primero debes completar y aprobar: ${firstUncompleted.nombre}`);
      } else {
        showToast("Este tema se encuentra bloqueado.");
      }
      return;
    }

    setSelectedNodeId(node.id);
    if (node.children && node.children.length > 0) {
      setExpandedNodes(prev => ({
        ...prev,
        [node.id]: true
      }));
    }
  };

  const getFireCount = (pctVal, totalPreguntas, depthVal) => {
    if (!totalPreguntas || totalPreguntas <= 0) return 0;
    const pct = parseFloat(pctVal || 0);
    if (depthVal === 0 || pct >= 15.0) return 5;
    if (pct >= 6.0) return 4;
    if (pct >= 2.0) return 3;
    if (pct >= 0.5) return 2;
    return 1;
  };

  const getRecursiveQuestionCount = (node) => {
    if (!node) return 0;
    let total = parseInt(node.total_preguntas || 0);
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        total += getRecursiveQuestionCount(child);
      }
    }
    return total;
  };

  const renderTree = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];
    const isSelected = selectedNodeId === node.id;
    const isLocked = node.total_preguntas > 0 && !isNodeUnlocked(node.id);

    // Use the actual percentage of questions from the database
    const pct = parseFloat(node.porcentaje_preguntas || 0);
    const fireCount = getFireCount(pct, node.total_preguntas, depth);
    const recursiveTotal = getRecursiveQuestionCount(node);


    return (
      <div key={node.id} className="ml-3 select-none">
        <div
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded transition-colors hover:bg-white/5 ${
            isSelected ? 'bg-white/10 border-l-4 border-gold-brand' : ''
          }`}
        >
          {/* Collapse/Expand Chevron */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleNode(node.id, e)}
              className="material-symbols-outlined text-[20px] text-white/70 hover:text-white hover:bg-white/10 rounded transition-all duration-200 p-0.5"
            >
              {isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
            </button>
          ) : (
            <span className="w-6 h-6 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>
            </span>
          )}

          {/* Node Selector Button */}
          <button
            onClick={() => handleNodeClick(node)}
            className="flex-1 text-left flex items-center justify-between gap-1.5 cursor-pointer min-w-0"
          >
            <span className="flex items-center gap-1.5 min-w-0">
              {node.total_preguntas > 0 && (
                <span 
                  className={`material-symbols-outlined text-[12px] shrink-0 ${
                    isLocked ? 'text-white/30' : 
                    (node.usuario_completado ? 'text-emerald-400' : 
                    (node.usuario_nota !== null ? 'text-red-400' : 'text-emerald-400'))
                  }`} 
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                  title={isLocked ? 'Tema bloqueado' : (node.usuario_completado ? 'Aprobado' : (node.usuario_nota !== null ? 'Reprobado' : 'Tema desbloqueado'))}
                >
                  {isLocked ? 'lock' : 
                    (node.usuario_completado ? 'check' : 
                    (node.usuario_nota !== null ? 'close' : 'lock_open'))}
                </span>
              )}
              <span className={`text-xs transition-colors text-white truncate ${isSelected ? 'font-black' : (depth <= 1 ? 'font-bold' : 'font-normal')} ${isSelected ? 'text-white' : 'text-white/75 hover:text-white'}`}>
                {node.nombre}
              </span>
            </span>
            {node.total_preguntas > 0 && (
              <span className="text-[10px] font-bold leading-none flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span className="flex items-center gap-0.5 bg-gold-brand/10 px-1.5 py-0.5 rounded-full border border-gold-brand/20 shadow-sm shrink-0" title={`Impacto en el examen: ${parseFloat(node.porcentaje_preguntas || 0).toFixed(2)}%`}>
                  {Array.from({ length: fireCount }).map((_, i) => (
                    <FlameIcon
                      key={i}
                      className="w-3 h-3 text-gold-brand select-none"
                    />
                  ))}
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Children container */}
        {hasChildren && isExpanded && (
          <div className="border-l border-white/10 mt-1 ml-2.5">
            {node.children.map(child => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredGlossary = glossary.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.termino.toLowerCase().includes(q) || item.definicion.toLowerCase().includes(q);
    }
    const termClean = item.termino.trim();
    if (selectedLetter) {
      const startChar = termClean.charAt(0).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      return startChar === selectedLetter;
    }
    return true;
  });

  const availableLetters = Array.from(new Set(
    glossary.map(item => {
      const termClean = item.termino.trim();
      return termClean.charAt(0).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    })
  )).sort();

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#001524] text-white' : 'bg-background text-on-surface'}`}>Cargando Entorno Élite...</div>;

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#001524] text-white' : 'bg-background text-on-surface'}`}>
      {/* Top Navbar */}
      <header className={`fixed top-0 left-0 w-full h-20 border-b flex justify-between items-center px-6 z-50 transition-colors duration-300 ${isDarkMode ? 'bg-[#001524]/90 border-white/10 text-white' : 'bg-surface border-outline-variant text-navy-brand'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className={`material-symbols-outlined transition-colors cursor-pointer ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-on-surface-variant hover:text-navy-brand'}`} title="Volver al Dashboard">arrow_back</button>
          
          {/* Toggle Left Sidebar */}
          <button 
            onClick={() => setShowLeftSidebar(!showLeftSidebar)} 
            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${isDarkMode ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-on-surface-variant hover:bg-navy-brand/5 hover:text-navy-brand'}`}
            title="Mostrar/Ocultar Mapa"
          >
            <span className="material-symbols-outlined text-[20px]">{showLeftSidebar ? 'menu_open' : 'menu'}</span>
          </button>

          <img
            src={isDarkMode ? "/images/logo-oscuro.png" : "/images/logo.png"}
            alt="Seré Notario Logo"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className={`h-5 w-[1px] ${isDarkMode ? 'bg-white/20' : 'bg-outline-variant'}`}></div>
          <div className="flex items-center gap-3">
            <span className={`font-headline-sm font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-navy-brand'}`}>
              {mapa?.nombre || 'Estudio Élite'} {nodeContent?.nombre && `/ ${nodeContent.nombre}`}
            </span>
            {nodeContent?.nombre && activeTab === 'info' && (
              <button
                onClick={() => toggleSpeech(nodeContent)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isPlayingSpeech
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-white text-navy-brand border-outline-variant hover:border-navy-brand'
                }`}
                title={isPlayingSpeech ? 'Detener lectura' : 'Escuchar tema completo'}
              >
                <span className="material-symbols-outlined text-[16px] font-bold">
                  {isPlayingSpeech ? 'stop' : 'volume_up'}
                </span>
                <span className="hidden sm:inline">{isPlayingSpeech ? 'Detener' : 'Oír'}</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode}
            className={`material-symbols-outlined transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-navy-brand'}`}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </button>
          {/* Toggle Right Sidebar (Glosario & Artículos de Apoyo) */}
          {activeTab === 'simulacro' ? (
            <>
              {/* Button: Artículos de Apoyo */}
              <button 
                onClick={() => {
                  if (showRightSidebar && sidebarTab === 'articulos') {
                    setShowRightSidebar(false);
                  } else {
                    setSidebarTab('articulos');
                    setShowRightSidebar(true);
                  }
                }} 
                className={`px-3 py-2 border rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  showRightSidebar && sidebarTab === 'articulos'
                    ? 'bg-navy-brand text-white border-navy-brand font-black'
                    : 'bg-white text-navy-brand border-outline-variant hover:border-navy-brand'
                }`}
                title="Mostrar/Ocultar Artículos de Apoyo"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span className="hidden sm:inline">
                  {showRightSidebar && sidebarTab === 'articulos' ? 'Ocultar Artículos' : 'Artículos'}
                </span>
              </button>

              {/* Button: Glosario */}
              <button 
                onClick={() => {
                  if (showRightSidebar && sidebarTab === 'glosario') {
                    setShowRightSidebar(false);
                  } else {
                    setSidebarTab('glosario');
                    setShowRightSidebar(true);
                  }
                }} 
                className={`px-3 py-2 border rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  showRightSidebar && sidebarTab === 'glosario'
                    ? 'bg-navy-brand text-white border-navy-brand font-black'
                    : 'bg-white text-navy-brand border-outline-variant hover:border-navy-brand'
                }`}
                title="Mostrar/Ocultar Glosario"
              >
                <span className="material-symbols-outlined text-[18px]">local_library</span>
                <span className="hidden sm:inline">
                  {showRightSidebar && sidebarTab === 'glosario' ? 'Ocultar Glosario' : 'Glosario'}
                </span>
              </button>
            </>
          ) : (
            /* Single Button: Glosario */
            <button 
              onClick={() => {
                if (showRightSidebar && sidebarTab === 'glosario') {
                  setShowRightSidebar(false);
                } else {
                  setSidebarTab('glosario');
                  setShowRightSidebar(true);
                }
              }} 
              className={`px-3 py-2 border rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                showRightSidebar && sidebarTab === 'glosario'
                  ? 'bg-navy-brand text-white border-navy-brand font-black'
                  : 'bg-white text-navy-brand border-outline-variant hover:border-navy-brand'
              }`}
              title="Mostrar/Ocultar Glosario"
            >
              <span className="material-symbols-outlined text-[18px]">local_library</span>
              <span className="hidden sm:inline">
                {showRightSidebar && sidebarTab === 'glosario' ? 'Ocultar Glosario' : 'Glosario'}
              </span>
            </button>
          )}

          {/* Multimedia Dropdown Widget */}
          {(mapa?.audio_1 || mapa?.audio_2 || mapa?.video_1 || mapa?.video_2) && (
            <div className="relative">
              <button 
                onClick={() => setShowAudioDropdown(!showAudioDropdown)}
                className={`px-4 py-2 border rounded-xl font-bold uppercase text-xs tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  showAudioDropdown 
                    ? 'bg-navy-brand text-white border-navy-brand' 
                    : 'bg-white text-navy-brand border-outline-variant hover:border-navy-brand'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">perm_media</span>
                <span>Multimedia</span>
              </button>
              
              {/* Dropdown panel */}
              {showAudioDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-[#002b49] text-white p-4 rounded-2xl border border-[#b59348]/40 shadow-2xl z-50 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold-brand flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">perm_media</span>
                      Apoyo de Estudio
                    </span>
                    <button 
                      onClick={() => setShowAudioDropdown(false)}
                      className="text-white/60 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>

                  {/* Audios Section */}
                  {(mapa.audio_1 || mapa.audio_2) && (
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gold-brand/85 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">headset</span>
                        Audios de Contexto
                      </span>
                      {mapa.audio_1 && (
                        <AudioPlayerCard src={`/audio/${mapa.audio_1}`} title={mapa.audio_1.replace(/\.[^/.]+$/, "").replace(/_/g, " ")} />
                      )}
                      {mapa.audio_2 && (
                        <AudioPlayerCard src={`/audio/${mapa.audio_2}`} title={mapa.audio_2.replace(/\.[^/.]+$/, "").replace(/_/g, " ")} />
                      )}
                    </div>
                  )}

                  {/* Videos Section */}
                  {(mapa.video_1 || mapa.video_2) && (
                    <div className="space-y-2.5 pt-3 border-t border-white/10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gold-brand/85 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">smart_display</span>
                        Videos Explicativos
                      </span>
                      {mapa.video_1 && (
                        <button 
                          onClick={() => {
                            setSelectedVideo(`/video/${mapa.video_1}`);
                            setShowAudioDropdown(false);
                          }}
                          className="w-full p-2.5 bg-white/10 hover:bg-white/15 active:scale-[0.98] transition-all rounded-xl border border-white/10 flex items-center gap-3 cursor-pointer text-left"
                        >
                          <span className="material-symbols-outlined text-gold-brand text-[22px]">play_circle</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-wider text-gold-brand/85 block">Video de Estudio</span>
                            <span className="text-[11px] font-bold text-white block truncate">
                              {mapa.video_1.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                            </span>
                          </div>
                        </button>
                      )}
                      {mapa.video_2 && (
                        <button 
                          onClick={() => {
                            setSelectedVideo(`/video/${mapa.video_2}`);
                            setShowAudioDropdown(false);
                          }}
                          className="w-full p-2.5 bg-white/10 hover:bg-white/15 active:scale-[0.98] transition-all rounded-xl border border-white/10 flex items-center gap-3 cursor-pointer text-left"
                        >
                          <span className="material-symbols-outlined text-gold-brand text-[22px]">play_circle</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-wider text-gold-brand/85 block">Video de Estudio</span>
                            <span className="text-[11px] font-bold text-white block truncate">
                              {mapa.video_2.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                            </span>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => router.push(`/simulador/ley-${ley}`)}
            className="bg-gold-brand text-navy-brand px-6 py-2 rounded font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-navy-brand hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            Examinar Ley
          </button>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden relative pt-20">
        
        {/* Backdrop for Left Sidebar (on mobile/tablet) */}
        {showLeftSidebar && (
          <div 
            className="absolute inset-0 bg-black/45 z-30 xl:hidden animate-in fade-in duration-200" 
            onClick={() => setShowLeftSidebar(false)}
          />
        )}
        
        {/* Backdrop for Right Sidebar (on mobile/tablet) */}
        {showRightSidebar && (
          <div 
            className="absolute inset-0 bg-black/45 z-30 xl:hidden animate-in fade-in duration-200" 
            onClick={() => setShowRightSidebar(false)}
          />
        )}

        <aside 
          className={`bg-navy-brand text-white overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300 z-40
            absolute inset-y-0 left-0 xl:static h-full flex flex-col
            ${showLeftSidebar 
              ? 'translate-x-0 w-96 p-4 border-r border-white/10 shadow-2xl xl:shadow-none' 
              : '-translate-x-full w-96 p-0 border-r-0 xl:w-0 xl:opacity-0 xl:pointer-events-none xl:p-0 xl:border-r-0'
            }`}
        >
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-4 px-2">Ruta Estratégica de Estudio</h2>
          <div className="-ml-3">
            {mapa ? renderTree(mapa) : <p className="px-3 text-xs italic text-white/40">No se encontró el mapa</p>}
          </div>
        </aside>

        {/* Edge Toggle Button (Desktop Only) */}
        <button
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className={`fixed top-[120px] z-50 p-1.5 py-4 rounded-r-xl shadow-lg border border-l-0 transition-all duration-300 hidden xl:flex items-center justify-center cursor-pointer
            ${showLeftSidebar 
              ? `left-96 ${isDarkMode ? 'bg-[#002b49] text-gold-brand border-white/10 hover:bg-[#003b60]' : 'bg-navy-brand text-gold-brand border-gold-brand/20 hover:bg-navy-brand/90'}` 
              : `left-0 ${isDarkMode ? 'bg-[#002b49] text-gold-brand border-gold-brand/30 hover:bg-[#003b60]' : 'bg-navy-brand text-gold-brand border-gold-brand/30 hover:bg-navy-brand/90'}`
            }`}
          title={showLeftSidebar ? "Ocultar panel de estudio" : "Mostrar panel de estudio"}
        >
          <span className="material-symbols-outlined text-xl">
            {showLeftSidebar ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>

        {/* Center: Zona de Lectura */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {contentLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-10 h-10 border-4 border-gold-brand border-t-transparent rounded-full animate-spin"></div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-navy-brand/60'}`}>Cargando contenido...</p>
            </div>
          ) : nodeContent ? (
            <div className="max-w-5xl mx-auto pb-24">

              {/* Tabs Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant mb-6 pb-2 gap-4">
                <div className={`flex gap-2 p-1 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-navy-brand/5 border-navy-brand/10'}`}>
                  <button
                    onClick={() => {
                      const isTabLocked = selectedNode && selectedNode.children && selectedNode.children.length > 0 && !areDescendantsCompleted(selectedNode);
                      if (isTabLocked) {
                        showToast("Debes completar y aprobar todos los subtemas antes de poder realizar evaluar este tema principal.");
                        return;
                      }
                      setActiveTab('simulacro');
                      setSidebarTab('articulos');
                      setShowLeftSidebar(false);
                      if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
                        setShowRightSidebar(true);
                      }
                    }}
                    className={`py-2 px-4 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-2 ${
                      activeTab === 'simulacro'
                        ? 'bg-navy-brand border-navy-brand text-white shadow-md'
                        : isDarkMode ? 'border-gold-brand text-gold-brand hover:bg-gold-brand/10 shadow-sm' : 'border-navy-brand text-navy-brand hover:bg-navy-brand/5 shadow-sm'
                    } ${selectedNode && selectedNode.children && selectedNode.children.length > 0 && !areDescendantsCompleted(selectedNode) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {selectedNode && selectedNode.children && selectedNode.children.length > 0 && !areDescendantsCompleted(selectedNode) ? 'lock' : 'quiz'}
                    </span>
                    Evaluar Tema
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('info');
                      setSidebarTab('glosario');
                      setShowLeftSidebar(false);
                    }}
                    className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      activeTab === 'info'
                        ? 'bg-gold-brand text-navy-brand font-black shadow-sm'
                        : isDarkMode ? 'text-white/60 hover:text-white/80 hover:bg-white/5' : 'text-navy-brand/60 hover:text-navy-brand/80 hover:bg-navy-brand/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    Información
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('slides');
                      setSidebarTab('glosario');
                      setShowLeftSidebar(false);
                    }}
                    className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      activeTab === 'slides'
                        ? 'bg-gold-brand text-navy-brand font-black shadow-sm'
                        : isDarkMode ? 'text-white/60 hover:text-white/80 hover:bg-white/5' : 'text-navy-brand/60 hover:text-navy-brand/80 hover:bg-navy-brand/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">article</span>
                    Listado de Artículos
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('preguntas_asociadas');
                      setSidebarTab('glosario');
                      setShowLeftSidebar(false);
                    }}
                    className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      activeTab === 'preguntas_asociadas'
                        ? 'bg-gold-brand text-navy-brand font-black shadow-sm'
                        : isDarkMode ? 'text-white/60 hover:text-white/80 hover:bg-white/5' : 'text-navy-brand/60 hover:text-navy-brand/80 hover:bg-navy-brand/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">list_alt</span>
                    Preguntas Asociadas
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'info' ? (
                /* Concepto, Análisis y Tips Didácticos */
                <div className="space-y-4 text-left animate-in fade-in duration-300">
                  {/* Progress Banner Moved to Info Tab */}
                  {selectedNode && selectedNode.total_preguntas > 0 && (
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 shadow-sm ${
                      selectedNode.usuario_completado 
                        ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-900' 
                        : selectedNode.usuario_nota !== null 
                          ? 'bg-red-50/40 border-red-200/80 text-red-900' 
                          : 'bg-slate-50/50 border-slate-200/80 text-slate-800'
                    }`}>
                      <div className="flex items-center gap-3 text-left">
                        <span className={`material-symbols-outlined text-2xl shrink-0 ${
                          selectedNode.usuario_completado 
                            ? 'text-emerald-600' 
                            : selectedNode.usuario_nota !== null 
                              ? 'text-red-500' 
                              : 'text-slate-400'
                        }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {selectedNode.usuario_completado 
                            ? 'check_circle' 
                            : selectedNode.usuario_nota !== null 
                              ? 'cancel' 
                              : 'help'
                          }
                        </span>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-75 block">Estado del Tema</span>
                          <span className="text-xs font-bold block">
                            {selectedNode.usuario_completado 
                              ? 'Aprobado · Completado ✓' 
                              : selectedNode.usuario_nota !== null 
                                ? 'No Aprobado · Requiere Nota 8.0 o superior' 
                                : 'Evaluación Pendiente · Evalúa el Tema'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center sm:text-right justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-black/5 pt-3 sm:pt-0">
                        <div className="text-left sm:text-right border-r border-black/10 pr-6 mr-2">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-75 block">Total Preguntas</span>
                          <span className="text-base font-black block">
                            {getRecursiveQuestionCount(selectedNode)}
                          </span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-75 block">Última Calificación</span>
                          <span className="text-base font-black block">
                            {selectedNode.usuario_nota !== null ? parseFloat(selectedNode.usuario_nota).toFixed(1) : '--'} / 10.0
                          </span>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm px-3 py-1 rounded-lg border border-black/5 text-center shrink-0">
                          <span className="text-[9px] font-black uppercase tracking-wider text-navy-brand/60 block">Nota Mínima</span>
                          <span className="text-xs font-bold text-navy-brand block">8.0</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {nodeContent.concepto && (
                    <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-outline-variant/80'}`}>
                      <div className="flex items-center gap-2 mb-2 text-gold-brand">
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                        <span className="text-[11px] font-black uppercase tracking-wider">Concepto</span>
                      </div>
                      <p className={`text-sm leading-relaxed font-semibold ${isDarkMode ? 'text-white' : 'text-navy-brand'}`}>
                        {nodeContent.concepto}
                      </p>
                    </div>
                  )}

                  {nodeContent.analisis_jurisconsulto && (
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-navy-brand/5 border-navy-brand/10'}`}>
                      <div className={`flex items-center gap-2 mb-2 ${isDarkMode ? 'text-white' : 'text-navy-brand'}`}>
                        <span className="material-symbols-outlined text-[18px]">gavel</span>
                        <span className="text-[11px] font-black uppercase tracking-wider">Análisis Jurisconsulto</span>
                      </div>
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-white/80' : 'text-navy-brand/80'}`}>
                        {nodeContent.analisis_jurisconsulto}
                      </p>
                    </div>
                  )}

                  {!nodeContent.concepto && !nodeContent.analisis_jurisconsulto && (
                    <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-outline-variant/60 shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[48px] text-gold-brand mb-4 opacity-80">build_circle</span>
                      <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-white' : 'text-navy-brand'}`}>Estamos preparando este contenido</h4>
                      <p className={`text-[12px] leading-relaxed max-w-[450px] ${isDarkMode ? 'text-white/60' : 'text-navy-brand/60'}`}>
                        Nos encontramos trabajando arduamente en la carga de los datos de la ley y las evaluaciones para este tema. Pronto estará disponible.
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === 'preguntas_asociadas' ? (
                <div className="space-y-4 text-left animate-in fade-in duration-300">
                  {loadingPreguntasAsociadas ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-8 h-8 border-4 border-gold-brand border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-navy-brand/60'}`}>Cargando preguntas...</p>
                    </div>
                  ) : preguntasAsociadas.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-outline-variant/60 shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[48px] text-gold-brand mb-4 opacity-80">sentiment_dissatisfied</span>
                      <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-white' : 'text-navy-brand'}`}>Sin preguntas asociadas</h4>
                      <p className={`text-[12px] leading-relaxed max-w-[450px] ${isDarkMode ? 'text-white/60' : 'text-navy-brand/60'}`}>
                        No se encontraron preguntas registradas para este nodo específico.
                      </p>
                    </div>
                  ) : (
                    preguntasAsociadas.map((grupo, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl border shadow-sm mb-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-outline-variant/80'}`}>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/50">
                          <h3 className={`text-sm font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-navy-brand'}`}>
                            {grupo.examen_titulo}
                          </h3>
                          <span className="bg-gold-brand/10 text-gold-brand px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {grupo.cantidad} Pregunta{grupo.cantidad !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <ul className="space-y-3 list-none pl-0 m-0">
                          {grupo.preguntas.map((pregunta, pIdx) => (
                            <li key={pIdx} className="flex gap-3 items-start">
                              <span className="material-symbols-outlined text-gold-brand/80 text-[16px] shrink-0 mt-0.5">help</span>
                              <span className={`text-[13px] leading-relaxed ${isDarkMode ? 'text-white/90' : 'text-navy-brand/85'}`}>{pregunta}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'slides' ? (
                /* Slides (Artículos) */
                (() => {
                  const filteredArticulos = (nodeContent.articulos || []).filter(art => {
                    if (showDerogados) return true;
                    return !isArticleDerogado(art);
                  });

                  return (
                    <div className="animate-in fade-in duration-300">
                      {nodeContent.articulos && nodeContent.articulos.length > 0 && (
                        <div className="flex items-center gap-4 mb-4 flex-wrap">
                          <button
                            type="button"
                            onClick={toggleSpeechAllArticles}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              playingArticleId === 'all' 
                                ? (isDarkMode ? 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900/50' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100')
                                : (isDarkMode ? 'bg-[#b59348]/20 text-[#b59348] border-[#b59348]/40 hover:bg-[#b59348]/30' : 'bg-white text-navy-brand border-outline-variant hover:border-navy-brand hover:bg-navy-brand/5')
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {playingArticleId === 'all' ? 'stop' : 'volume_up'}
                            </span>
                            {playingArticleId === 'all' ? 'Detener lectura' : 'Leer todos los artículos'}
                          </button>
                          <div className={`flex items-center gap-2 border-l pl-4 ${isDarkMode ? 'border-white/20' : 'border-outline-variant/60'}`}>
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-navy-brand/80'}`}>Artículos Derogados</span>
                            <button 
                              type="button"
                              onClick={() => setShowDerogados(!showDerogados)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                showDerogados ? 'bg-gold-brand' : (isDarkMode ? 'bg-white/20' : 'bg-outline-variant/60')
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                                  showDerogados ? 'translate-x-5 bg-navy-brand' : (isDarkMode ? 'translate-x-0 bg-gray-300' : 'translate-x-0 bg-white')
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {filteredArticulos.length > 0 ? (
                        <div className="space-y-4 text-left">
                        {/* Info banner: articles identified via questions */}
                        {nodeContent.articulos_via_preguntas && (
                          <div className="flex items-start gap-2.5 bg-[#002b49]/5 border border-[#002b49]/15 px-4 py-3 rounded-xl">
                            <span className="material-symbols-outlined text-[#b59348] text-[18px] shrink-0 mt-0.5">info</span>
                            <p className="text-[11px] text-navy-brand/70 leading-relaxed">
                              Los artículos mostrados fueron identificados a partir de las preguntas vinculadas a este nodo de estudio, ya que el artículo de ley abarca múltiples subtemas.
                            </p>
                          </div>
                        )}
                        {filteredArticulos.map(art => {
                          const derog = isArticleDerogado(art);
                          return (
                            <div key={art.id} className={`p-5 rounded-xl border shadow-sm transition-all ${
                              derog 
                                ? 'bg-red-50/30 border-red-200/60 opacity-80' 
                                : 'bg-white border-outline-variant/60'
                            }`}>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h3 className="font-bold text-navy-brand text-sm tracking-tight flex-1">
                                  Artículo {art.numero} {art.titulo ? `· ${art.titulo}` : ''}
                                </h3>
                                <div className="flex items-center gap-2 shrink-0">
                                  {derog && (
                                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Derogado
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => toggleSpeechArticle(art)}
                                    className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer ${
                                      playingArticleId === art.id ? 'text-red-600 bg-red-50' : 'text-navy-brand/60 hover:text-navy-brand'
                                    }`}
                                    title={playingArticleId === art.id ? 'Detener lectura' : 'Escuchar artículo'}
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      {playingArticleId === art.id ? 'stop_circle' : 'volume_up'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                              <div className="text-[13px] leading-relaxed text-navy-brand/85 whitespace-pre-wrap">
                                <GlossaryText text={art.contenido} />
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      ) : (nodeContent.articulos && nodeContent.articulos.length > 0) ? (
                        <div className="bg-red-50/20 border border-red-200/50 p-6 rounded-2xl text-left">
                          <p className="text-navy-brand font-semibold text-sm mb-1">Todos los artículos de este tema están derogados.</p>
                          <p className="text-on-surface-variant text-xs">
                            Activa la opción <span className="font-bold">&quot;Artículos Derogados&quot;</span> en la parte superior para visualizarlos.
                          </p>
                        </div>
                      ) : (
                        <div className={`flex flex-col items-center justify-center p-8 mt-4 rounded-2xl border text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-outline-variant/60 shadow-sm'}`}>
                          <span className="material-symbols-outlined text-[48px] text-gold-brand mb-4 opacity-80">gavel</span>
                          <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-white' : 'text-navy-brand'}`}>Actualización en proceso</h4>
                          <p className={`text-[12px] leading-relaxed max-w-[450px] ${isDarkMode ? 'text-white/60' : 'text-navy-brand/60'}`}>
                            Estamos trabajando con dedicación en la carga de los artículos de la ley y el material de estudio para este tema. Te invitamos a regresar pronto.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* Evaluar Tema */
                <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60">
                  {!isNodeUnlocked(selectedNodeId) ? (
                    <div className="text-center py-12 px-4 w-full max-w-[576px] mx-auto animate-in fade-in duration-300">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <span className="material-symbols-outlined text-[24px] text-slate-400 font-bold">
                          lock
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-navy-brand mb-2">Evaluador Bloqueado</h3>
                      <p className="text-xs text-on-surface-variant/80 leading-relaxed mb-6 font-semibold">
                        Para desbloquear la evaluación de este tema, primero debes aprobar el tema anterior de la ruta de aprendizaje:
                      </p>
                      
                      {(() => {
                        const reqNode = getFirstUncompletedNodeBefore(selectedNodeId);
                        if (!reqNode) return null;
                        return (
                          <div className="bg-white p-4 rounded-xl border border-outline-variant/60 mb-6 text-left shadow-sm">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Requisito Pendiente</span>
                            <span className="text-xs font-bold text-navy-brand block">{reqNode.nombre}</span>
                            <span className="text-[10px] text-on-surface-variant block mt-0.5">Nota mínima requerida: 8.0 para aprobar</span>
                          </div>
                        );
                      })()}

                      {(() => {
                        const reqNode = getFirstUncompletedNodeBefore(selectedNodeId);
                        if (!reqNode) return null;
                        return (
                          <button
                            onClick={() => {
                              setSelectedNodeId(reqNode.id);
                            }}
                            className="bg-[#002b49] text-white hover:bg-gold-brand hover:text-[#002b49] w-full py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 shadow-md"
                          >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            <span>Ir a {reqNode.nombre}</span>
                          </button>
                        );
                      })()}
                    </div>
                  ) : miniLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 border-4 border-gold-brand border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-navy-brand/60 font-bold uppercase tracking-wider">Cargando evaluación...</p>
                    </div>
                  ) : miniFinished ? (
                    /* Final Result Summary */
                    <div className="text-center py-6">
                      <div className="flex flex-col md:flex-row gap-8 items-center justify-center max-w-2xl mx-auto mb-8 bg-white p-8 rounded-2xl border border-outline-variant/60 text-left shadow-sm">
                        {/* Left Side: Score Circle */}
                        <div className="shrink-0 flex flex-col items-center">
                          <div className="text-[10px] uppercase font-black text-navy-brand/60 tracking-widest mb-3">Calificación</div>
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            {/* Outer Track */}
                            <div className={`absolute inset-0 rounded-full border-[6px] ${
                              (miniCorrectCount / (miniPreguntas.length || 5)) >= 0.8 
                                ? 'border-green-100' 
                                : 'border-red-100'
                            }`}></div>
                            {/* Fill */}
                            <div className={`absolute inset-0 rounded-full border-[6px] border-t-transparent ${
                              (miniCorrectCount / (miniPreguntas.length || 5)) >= 0.8 
                                ? 'border-green-600' 
                                : 'border-red-600'
                            }`} style={{ transform: `rotate(${(miniCorrectCount / (miniPreguntas.length || 5)) * 360}deg)` }}></div>
                            
                            <div className="z-10 text-center">
                              <span className={`text-4xl font-black block leading-none ${
                                (miniCorrectCount / (miniPreguntas.length || 5)) >= 0.8 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {((miniCorrectCount / (miniPreguntas.length || 5)) * 10).toFixed(0)}
                              </span>
                              <span className="text-[10px] font-bold text-navy-brand/60 uppercase tracking-wider block mt-1">Puntos</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Stats & Actions */}
                        <div className="flex-1 w-full flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-black text-navy-brand mb-1">{(miniCorrectCount / (miniPreguntas.length || 5)) >= 0.8 ? (miniCurrentBlock + 1 < miniBlocksTotal ? "¡Bloque Superado!" : "¡Evaluación de Tema Completada!") : "Bloque No Aprobado"}</h3>
                            <p className="text-[11px] text-on-surface-variant/80 mb-4 font-semibold">{(miniCorrectCount / (miniPreguntas.length || 5)) >= 0.8 ? "Tu progreso ha sido guardado de forma segura." : "Debes superar este bloque para avanzar."}</p>
                            
                            {(miniCorrectCount / (miniPreguntas.length || 5)) >= 0.8 ? (
                              <div className="text-xs font-bold text-green-700 bg-green-50 p-3 rounded-xl border border-green-200 w-full mb-4">
                                ¡Aprobado con {((miniCorrectCount / (miniPreguntas.length || 5)) * 100).toFixed(0)}%! <br/>
                                <span className="text-[10px] font-normal text-green-600 block mt-1">
                                  {miniCurrentBlock + 1 < miniBlocksTotal ? `Bloque ${miniCurrentBlock + 1} de ${miniBlocksTotal} superado ✓` : "Este tema ha sido marcado como estudiado ✓"}
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 w-full mb-4">
                                No aprobado ({((miniCorrectCount / (miniPreguntas.length || 5)) * 100).toFixed(0)}%) <br/>
                                <span className="text-[10px] font-normal text-red-600 block mt-1">Necesitas 80% o más ({Math.ceil((miniPreguntas.length || 5) * 0.8)} correctas) para pasar este bloque.</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs font-bold text-navy-brand/80 mb-4">
                            <div className="bg-green-50/50 p-3 rounded-xl border border-green-100 flex items-center justify-between">
                              <span className="text-[10px] text-green-600 uppercase font-black">Correctas</span>
                              <span className="text-lg font-black text-green-700">{miniCorrectCount}</span>
                            </div>
                            <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 flex items-center justify-between">
                              <span className="text-[10px] text-red-600 uppercase font-black">Incorrectas</span>
                              <span className="text-lg font-black text-red-700">{(miniPreguntas.length || 5) - miniCorrectCount}</span>
                            </div>
                          </div>

                          {(miniCorrectCount / (miniPreguntas.length || 5)) >= 0.8 && miniCurrentBlock + 1 < miniBlocksTotal ? (
                            <button
                              onClick={() => {
                                const nextBlock = miniCurrentBlock + 1;
                                setMiniCurrentBlock(nextBlock);
                                setMiniIndex(0);
                                setMiniCorrectCount(0);
                                setMiniSelected(null);
                                setMiniAnswered(false);
                                setMiniResponses([]);
                                setMiniFinished(false);
                                const blockSize = allMiniPreguntas.length <= 5 ? allMiniPreguntas.length : 5;
                                setMiniPreguntas(allMiniPreguntas.slice(nextBlock * 5, nextBlock * 5 + blockSize));
                              }}
                              className="bg-gold-brand text-navy-brand hover:bg-navy-brand hover:text-white w-full py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-200 cursor-pointer text-center"
                            >
                              Siguiente Bloque
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setMiniFinished(false);
                                setMiniIndex(0);
                                setMiniCorrectCount(0);
                                setMiniSelected(null);
                                setMiniAnswered(false);
                                setMiniResponses([]);
                                const currentQuestions = [...miniPreguntas];
                                for (let i = currentQuestions.length - 1; i > 0; i--) {
                                  const j = Math.floor(Math.random() * (i + 1));
                                  [currentQuestions[i], currentQuestions[j]] = [currentQuestions[j], currentQuestions[i]];
                                }
                                setMiniPreguntas(currentQuestions);
                              }}
                              className="bg-navy-brand text-white hover:bg-gold-brand hover:text-navy-brand w-full py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-200 cursor-pointer text-center"
                            >
                              {(miniCorrectCount / (miniPreguntas.length || 5)) >= 0.8 && miniCurrentBlock + 1 === miniBlocksTotal ? "Volver a practicar" : "Reiniciar Bloque"}
                            </button>
                          )}
                        </div>
                      </div>

                      
                      <div className="mt-8 text-left max-w-2xl mx-auto space-y-4">
                        <h4 className="text-xs font-black uppercase text-navy-brand/70 tracking-widest px-2 mb-2">Revisión de Preguntas</h4>
                        {miniResponses.map((resp, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border ${resp.isCorrect ? 'border-green-200 bg-green-50/20' : 'border-error/20 bg-error-container/10'}`}>
                            <div className="text-xs font-bold text-navy-brand mb-2">
                              Pregunta {idx + 1}: {resp.pregunta}
                            </div>
                            <div className="space-y-1.5 mb-3">
                              <div className={`text-[11px] font-bold ${resp.selected === resp.correct ? 'text-green-700' : 'text-error'}`}>
                                Tu respuesta: {cleanOptionText(resp.selected === 'A' ? resp.opcion_a : resp.selected === 'B' ? resp.opcion_b : resp.selected === 'C' ? resp.opcion_c : resp.selected === 'D' ? resp.opcion_d : resp.opcion_e)}
                              </div>
                              {!resp.isCorrect && (
                                <div className="text-[11px] font-bold text-green-700">
                                  Respuesta correcta: {cleanOptionText(resp.correct === 'A' ? resp.opcion_a : resp.correct === 'B' ? resp.opcion_b : resp.correct === 'C' ? resp.opcion_c : resp.correct === 'D' ? resp.opcion_d : resp.opcion_e)}
                                </div>
                              )}
                            </div>
                            {resp.explicacion && (
                              <div className="text-[10px] text-on-surface-variant/80 border-t border-outline-variant/40 pt-2">
                                <span className="font-bold block text-navy-brand">Explicación:</span>
                                {resp.explicacion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : miniPreguntas.length > 0 ? (
                    /* Question Play Screen */
                    <div className="text-left">
                      {/* Microphone Test Panel */}
                      {isMicTesting && (
                        <div className="mb-6 bg-slate-50 border border-outline-variant/60 p-4 rounded-xl text-left shadow-sm space-y-3 animate-in fade-in duration-300">
                          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
                            <span className="text-[10px] font-black uppercase text-navy-brand/75 tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-gold-brand animate-pulse">settings_voice</span>
                              Prueba de Micrófono
                            </span>
                            <button 
                              type="button"
                              onClick={stopMicTest}
                              className="text-[10px] font-black uppercase text-navy-brand/50 hover:text-navy-brand cursor-pointer"
                            >
                              Cerrar Test
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              micTestStatus === 'listening' ? 'bg-red-500 text-white animate-pulse' :
                              micTestStatus === 'success' ? 'bg-green-500 text-white' :
                              micTestStatus === 'error' ? 'bg-orange-500 text-white' : 'bg-slate-200'
                            }`}>
                              <span className="material-symbols-outlined text-sm">
                                {micTestStatus === 'listening' ? 'mic' :
                                 micTestStatus === 'success' ? 'check' :
                                 micTestStatus === 'error' ? 'warning' : 'mic_none'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold block text-navy-brand">
                                {micTestStatus === 'listening' ? 'Habla ahora... Di "opción A" o cualquier texto' :
                                 micTestStatus === 'success' ? '¡Prueba exitosa! Reconocimiento funcionando' :
                                 micTestStatus === 'error' ? 'Fallo en la prueba' : 'Prueba de micrófono'}
                              </span>
                              <span className="text-[11px] text-on-surface-variant block truncate font-semibold">
                                {micTestResult || 'Esperando inicio...'}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2 border-t border-outline-variant/30">
                            <button
                              type="button"
                              onClick={stopMicTest}
                              className="px-3 py-1.5 bg-navy-brand text-white font-bold rounded-lg text-[10px] uppercase tracking-wider hover:bg-gold-brand transition-colors cursor-pointer"
                            >
                              Cerrar Prueba
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Hands-Free Listening Status Indicator */}
                      {isHandsFreeActive && handsFreeStateRef.current === 'listening' && (
                        <div className="mb-6 bg-[#b59348]/10 border border-[#b59348]/30 p-3 rounded-xl flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-navy-brand font-bold uppercase tracking-wider flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-gold-brand animate-pulse">mic</span>
                              Escuchando tu respuesta...
                            </span>
                            <div className="flex gap-1.5 items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            </div>
                          </div>
                          <div className="text-[11px] text-navy-brand font-semibold bg-white/40 p-2.5 rounded-lg border border-black/5 min-h-[38px] flex items-center">
                            {handsFreeTranscript ? (
                              <span className="italic text-navy-brand/90">&quot;{handsFreeTranscript}&quot;</span>
                            ) : (
                              <span className="text-navy-brand/45 font-normal">Habla ahora... Di A, B, C, o &quot;leer artículo&quot;</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Question Text */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                        {miniPreguntas[miniIndex].examen_titulo && (
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${isDarkMode ? 'bg-white/10 text-white/70 border-white/20' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {miniPreguntas[miniIndex].examen_titulo}
                            {miniPreguntas[miniIndex].orden ? ` • Pregunta #${miniPreguntas[miniIndex].orden}` : ''}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          {miniPreguntas[miniIndex].pdf_url && (
                            <button
                              onClick={() => {
                                const baseUrl = ''; 
                                const hashParam = miniPreguntas[miniIndex].orden ? `#search="Pregunta ${miniPreguntas[miniIndex].orden}"` : '';
                                const pdfUrl = baseUrl + miniPreguntas[miniIndex].pdf_url + hashParam;
                                window.open(pdfUrl, '_blank');
                              }}
                              className={`px-3 py-1 border rounded-lg font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${isDarkMode ? 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20' : 'bg-white text-navy-brand border-outline-variant hover:bg-slate-50'}`}
                              title="Abre el PDF original del examen en una nueva pestaña"
                            >
                              <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                              <span>PDF</span>
                            </button>
                          )}
                          <button
                            onClick={toggleHandsFree}
                            className={`p-1.5 border rounded-lg font-bold uppercase text-[9px] tracking-wider flex items-center transition-all duration-200 cursor-pointer ${
                              isHandsFreeActive
                                ? 'bg-red-600 text-white border-red-600 font-black shadow-sm'
                                : 'bg-white text-navy-brand border-outline-variant hover:border-navy-brand'
                            }`}
                            title={isHandsFreeActive ? 'Desactivar Manos Libres' : 'Activar Manos Libres'}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isHandsFreeActive ? 'mic' : 'mic_off'}
                            </span>
                          </button>
                           <button
                            onClick={isMicTesting ? stopMicTest : runMicTest}
                            className={`hidden px-3 py-1 border rounded-lg font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                              isMicTesting
                                ? 'bg-amber-500 text-white border-amber-500 font-black shadow-sm animate-pulse'
                                : 'bg-white text-navy-brand border-outline-variant hover:border-navy-brand'
                            }`}
                            title={isMicTesting ? 'Cerrar Prueba de Micrófono' : 'Probar si tu micrófono funciona correctamente'}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              settings_voice
                            </span>
                            <span>
                              {isMicTesting ? 'Probando...' : 'Probar Micro'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-navy-brand mb-6 leading-relaxed">
                        {miniPreguntas[miniIndex].pregunta}
                      </h4>

                      {/* Answer Choices */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                        {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                          const optionText = opt === 'A' 
                            ? miniPreguntas[miniIndex].opcion_a 
                            : opt === 'B' 
                              ? miniPreguntas[miniIndex].opcion_b 
                              : opt === 'C'
                                ? miniPreguntas[miniIndex].opcion_c
                                : opt === 'D'
                                  ? miniPreguntas[miniIndex].opcion_d
                                  : miniPreguntas[miniIndex].opcion_e;
                          
                          if (!optionText) return null;

                          const isSelected = miniSelected === opt;
                          const isCorrect = opt === miniPreguntas[miniIndex].respuesta_correcta;
                          
                          let btnClass = 'border-outline-variant hover:bg-surface-container-high text-navy-brand';
                          if (miniAnswered) {
                            if (isCorrect) {
                              btnClass = 'bg-green-100 border-green-400 text-green-900 font-bold';
                            } else if (isSelected) {
                              btnClass = 'bg-error-container border-error text-error font-bold';
                            } else {
                              btnClass = 'opacity-50 border-outline-variant text-navy-brand/70';
                            }
                          } else if (isSelected) {
                            btnClass = 'border-gold-brand bg-gold-brand/10 text-navy-brand font-bold shadow-sm';
                          }

                          return (
                            <button
                              key={opt}
                              onClick={() => handleMiniSelectOption(opt)}
                              onDoubleClick={() => {
                                if (!miniAnswered) {
                                  setMiniSelected(opt);
                                  handleMiniSubmitAnswer(opt);
                                }
                              }}
                              disabled={miniAnswered}
                              className={`w-full p-4 rounded-xl border text-xs text-left transition-all duration-150 flex gap-3 items-start cursor-pointer ${btnClass}`}
                            >
                              <span className="font-black text-gold-brand uppercase">{opt}.</span>
                              <span className="flex-1 leading-relaxed">{cleanOptionText(optionText)}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Correct Feedback Alert */}
                      {miniAnswered && miniSelected === miniPreguntas[miniIndex].respuesta_correcta && (miniPreguntas[miniIndex].base_legal || miniPreguntas[miniIndex].explicacion) && (
                        <div className="p-4 rounded-xl mb-6 border text-left bg-green-50 border-green-200 text-green-900">
                          {/* Base Legal */}
                          {miniPreguntas[miniIndex].base_legal && (
                            <div className="text-[10px] font-black uppercase text-navy-brand/70 mb-1">
                              Base Legal: {miniPreguntas[miniIndex].base_legal}
                            </div>
                          )}

                          {/* Explicación */}
                          {miniPreguntas[miniIndex].explicacion && (
                            <p className="text-[11px] leading-relaxed opacity-90">
                              {miniPreguntas[miniIndex].explicacion}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Bottom Actions */}
                      <div className="flex justify-end gap-3 mt-4 border-t border-outline-variant/60 pt-4">
                        {!miniAnswered ? (
                          <button
                            onClick={handleMiniSubmitAnswer}
                            disabled={!miniSelected}
                            className={`px-6 py-2.5 rounded font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-1.5 ${
                              miniSelected 
                                ? 'bg-gold-brand text-navy-brand hover:bg-navy-brand hover:text-white cursor-pointer' 
                                : 'bg-outline-variant text-navy-brand/35 cursor-not-allowed'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            Responder
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleMiniNext}
                              className="bg-navy-brand text-white hover:bg-gold-brand hover:text-navy-brand px-6 py-2.5 rounded font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Siguiente</span>
                              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center py-16 text-center rounded-2xl border mt-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-outline-variant/60 shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[56px] text-gold-brand mb-5 opacity-80">psychology</span>
                      <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-white' : 'text-navy-brand'}`}>Diseñando tu evaluación</h4>
                      <p className={`text-[12px] leading-relaxed max-w-[450px] ${isDarkMode ? 'text-white/60' : 'text-navy-brand/60'}`}>
                        Nuestros expertos están trabajando cuidadosamente en la carga de las preguntas y exámenes para este tema. Pronto podrás evaluar tus conocimientos.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-[600px] mx-auto text-center px-6 animate-in fade-in duration-500">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-outline-variant/60'}`}>
                <span className="material-symbols-outlined text-[48px] text-gold-brand opacity-80 animate-pulse">
                  architecture
                </span>
              </div>
              <h2 className={`text-2xl font-black mb-3 font-headline-sm tracking-tight ${isDarkMode ? 'text-white' : 'text-navy-brand'}`}>
                Construyendo tu entorno de estudio
              </h2>
              <p className={`text-sm leading-relaxed mb-8 ${isDarkMode ? 'text-white/60' : 'text-navy-brand/70'}`}>
                Nuestros especialistas se encuentran trabajando meticulosamente en la estructuración de los datos y el material de estudio. Este contenido estará disponible próximamente para tu preparación Élite.
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="w-2 h-2 rounded-full bg-gold-brand animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-brand">En proceso de carga</span>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Glosario / Artículos de Apoyo */}
        <aside 
          className={`bg-surface-container-low flex flex-col h-full overflow-hidden transition-all duration-300 z-40
            absolute inset-y-0 right-0 xl:static xl:translate-x-0
            ${showRightSidebar 
              ? 'translate-x-0 w-96 border-l border-outline-variant shadow-2xl xl:shadow-none' 
              : 'translate-x-full w-96 border-l-0 xl:w-0 xl:opacity-0 xl:pointer-events-none'
            }`}
        >
          {sidebarTab === 'articulos' ? (
            <>
              <div className="p-5 shrink-0 pb-2">
                {activeTab === 'simulacro' && miniBlocksTotal > 1 && (
                  <div className="mb-4 pb-4 border-b border-outline-variant/30 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-navy-brand/70 tracking-wider">Bloques</span>
                    <div className="flex items-center gap-1 bg-navy-brand/5 px-2 py-1 rounded-lg border border-navy-brand/10">
                      {Array.from({ length: miniBlocksTotal }).map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-[12px] ${i < miniCurrentBlock ? 'text-emerald-500' : i === miniCurrentBlock ? 'text-gold-brand animate-pulse' : 'text-slate-400'}`}>
                          {i < miniCurrentBlock ? 'lock_open' : 'lock'}
                        </span>
                      ))}
                      <span className="text-[8px] font-bold uppercase text-navy-brand/70 tracking-wider ml-1">{miniCurrentBlock + 1}/{miniBlocksTotal}</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col mb-4 text-left">
                  <div className="flex items-center gap-2 text-navy-brand">
                    <span className="material-symbols-outlined text-gold-brand">menu_book</span>
                    <h2 className="text-sm font-bold uppercase tracking-widest">Artículos de Apoyo</h2>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 block">
                    Asociados a la pregunta actual
                  </span>
                </div>
              </div>

              {/* Scrolling List */}
              <div className="flex-1 overflow-y-auto p-5 pt-2 custom-scrollbar space-y-3.5 pb-20 text-left">
                {!isNodeUnlocked(selectedNodeId) ? (
                  <div className="text-center py-10 text-on-surface-variant/60 text-xs italic">
                    La evaluación del tema está bloqueada. Aprueba el tema anterior para desbloquearlo y ver sus artículos de apoyo.
                  </div>
                ) : miniLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-navy-brand/60">
                    <div className="w-6 h-6 border-2 border-gold-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-bold uppercase tracking-wider">Cargando artículos...</p>
                  </div>
                ) : miniFinished ? (
                   (() => {
                     const allArticles = [];
                     const seenIds = new Set();
                     miniPreguntas.forEach(q => {
                       if (q.articulos_vinculados) {
                         q.articulos_vinculados.forEach(art => {
                           if (art && art.id && !seenIds.has(art.id) && !isArticleDerogado(art)) {
                             seenIds.add(art.id);
                             allArticles.push(art);
                           }
                         });
                       }
                     });
 
                     let isSpecific = true;
                     if (allArticles.length === 0) {
                       allArticles.push(...(nodeContent?.articulos || []).filter(art => !isArticleDerogado(art)));
                       isSpecific = false;
                     }
 
                     if (allArticles.length > 0) {
                       return (
                         <div className="space-y-4 animate-in fade-in duration-300">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] text-navy-brand/60 font-bold uppercase tracking-wider block">
                               {isSpecific 
                                 ? `Artículos del simulacro realizado (${allArticles.length} en total):` 
                                 : `Artículos generales del tema (${allArticles.length} en total):`}
                             </span>
                             <button 
                               onClick={() => {
                                 const textToRead = allArticles.map(art => `Artículo ${art.numero}. ${art.titulo ? art.titulo + '. ' : ''}${art.contenido}`).join(' ');
                                 toggleReadingRelated(textToRead, 'allMini');
                               }}
                               className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all text-[9px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 ${playingArticleId === 'allMini' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : (isDarkMode ? 'bg-white/5 border-[#b59348]/30 hover:border-[#b59348]/60 hover:bg-white/10 text-[#b59348]' : 'bg-[#b59348]/10 border-[#b59348]/30 hover:bg-[#b59348]/20 text-navy-brand')}`}
                               title={playingArticleId === 'allMini' ? "Detener lectura" : "Leer artículos en voz alta"}
                             >
                               <span className="material-symbols-outlined text-[13px]">{playingArticleId === 'allMini' ? 'stop' : 'volume_up'}</span>
                               <span>{playingArticleId === 'allMini' ? 'Detener' : 'Leer Todo'}</span>
                             </button>
                           </div>
                           {allArticles.map(art => (
                             <div key={art.id} className="bg-white p-4 rounded-xl border border-outline-variant/80 shadow-sm hover:shadow transition-all duration-200">
                               <div className="flex justify-between items-start gap-2 mb-1.5">
                                 <h4 className="font-bold text-navy-brand text-xs uppercase tracking-tight flex items-center gap-1.5 flex-1">
                                   <span className="w-1.5 h-1.5 rounded-full bg-gold-brand shrink-0"></span>
                                   Artículo {art.numero} {art.titulo ? `· ${art.titulo}` : ''}
                                 </h4>
                                 <button
                                   type="button"
                                   onClick={() => toggleSpeechArticle(art)}
                                   className={`p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0 flex items-center justify-center cursor-pointer ${
                                     playingArticleId === art.id ? 'text-red-600 bg-red-50' : 'text-navy-brand/60 hover:text-navy-brand'
                                   }`}
                                   title={playingArticleId === art.id ? 'Detener lectura' : 'Escuchar artículo'}
                                 >
                                   <span className="material-symbols-outlined text-[16px]">
                                     {playingArticleId === art.id ? 'stop_circle' : 'volume_up'}
                                   </span>
                                 </button>
                               </div>
                               <div className="text-[11px] text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                                 <GlossaryText text={art.contenido} />
                               </div>
                             </div>
                           ))}
                         </div>
                       );
                     }
 
                     return (
                       <div className="text-center py-10 text-on-surface-variant/50 text-xs italic">
                         Simulacro completado. No se encontraron artículos de apoyo específicos ni generales para este tema.
                       </div>
                     );
                   })()
                 ) : miniPreguntas.length > 0 ? (
                   (() => {
                     const currentQ = miniPreguntas[miniIndex];
                     let currentArticles = (currentQ?.articulos_vinculados || []).filter(art => !isArticleDerogado(art));
                     let isSpecific = true;
 
                     if (currentArticles.length === 0) {
                       currentArticles = (nodeContent?.articulos || []).filter(art => !isArticleDerogado(art));
                       isSpecific = false;
                     }

                     console.log("RIGHT SIDEBAR ARTICULOS RENDER:", {
                        miniIndex,
                        currentQ: currentQ ? { id: currentQ.id, pregunta: currentQ.pregunta.substring(0, 30) } : null,
                        currentArticlesCount: currentArticles.length,
                        isSpecific,
                        nodeContentArticlesCount: nodeContent?.articulos?.length
                      });
 
                     if (currentArticles.length > 0) {
                       return (
                         <div key={currentQ?.id || miniIndex} className="space-y-4 animate-in fade-in duration-300">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex flex-col text-left">
                               <span className="text-[10px] text-navy-brand/60 font-bold uppercase tracking-wider block">
                                 Pregunta {miniIndex + 1} de {miniPreguntas.length}
                               </span>
                               <span className="text-[9px] text-[#b59348] font-black uppercase tracking-wider mt-0.5 block">
                                 {isSpecific ? 'Artículos específicos de la pregunta' : 'Artículos generales del tema'}
                               </span>
                             </div>
                             <button 
                               onClick={() => {
                                 const textToRead = currentArticles.map(art => `Artículo ${art.numero}. ${art.titulo ? art.titulo + '. ' : ''}${art.contenido}`).join(' ');
                                 toggleReadingRelated(textToRead, 'currentMini');
                               }}
                               className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all text-[9px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 ${playingArticleId === 'currentMini' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : (isDarkMode ? 'bg-white/5 border-[#b59348]/30 hover:border-[#b59348]/60 hover:bg-white/10 text-[#b59348]' : 'bg-[#b59348]/10 border-[#b59348]/30 hover:bg-[#b59348]/20 text-navy-brand')}`}
                               title={playingArticleId === 'currentMini' ? "Detener lectura" : "Leer artículos en voz alta"}
                             >
                               <span className="material-symbols-outlined text-[13px]">{playingArticleId === 'currentMini' ? 'stop' : 'volume_up'}</span>
                               <span>{playingArticleId === 'currentMini' ? 'Detener' : 'Leer Todo'}</span>
                             </button>
                           </div>
                           {currentArticles.map(art => (
                             <div key={art.id} className="bg-white p-4 rounded-xl border border-outline-variant/80 shadow-sm hover:shadow transition-all duration-200">
                               <div className="flex justify-between items-start gap-2 mb-1.5">
                                 <h4 className="font-bold text-navy-brand text-xs uppercase tracking-tight flex items-center gap-1.5 flex-1">
                                   <span className="w-1.5 h-1.5 rounded-full bg-gold-brand shrink-0"></span>
                                   Artículo {art.numero} {art.titulo ? `· ${art.titulo}` : ''}
                                 </h4>
                                 <button
                                   type="button"
                                   onClick={() => toggleSpeechArticle(art)}
                                   className={`p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0 flex items-center justify-center cursor-pointer ${
                                     playingArticleId === art.id ? 'text-red-600 bg-red-50' : 'text-navy-brand/60 hover:text-navy-brand'
                                   }`}
                                   title={playingArticleId === art.id ? 'Detener lectura' : 'Escuchar artículo'}
                                 >
                                   <span className="material-symbols-outlined text-[16px]">
                                     {playingArticleId === art.id ? 'stop_circle' : 'volume_up'}
                                   </span>
                                 </button>
                               </div>
                               <div className="text-[11px] text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                                 <GlossaryText text={art.contenido} />
                               </div>
                             </div>
                           ))}
                         </div>
                       );
                     }
 
                     return (
                       <div className={`flex flex-col items-center justify-center p-6 mt-4 text-center border rounded-xl shadow-sm ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-outline-variant/60'}`}>
                         <span className="material-symbols-outlined text-[32px] text-gold-brand mb-3 opacity-80">hourglass_empty</span>
                         <p className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-navy-brand/60'}`}>
                           Estamos elaborando el banco de preguntas y artículos para este tema.
                         </p>
                       </div>
                     );
                   })()
                 ) : (
                   <div className="text-center py-10 text-on-surface-variant/50 text-xs italic">
                     No hay preguntas de simulación disponibles para este tema específico.
                   </div>
                 )}
              </div>
            </>
          ) : (
            <>
              <div className="p-5 shrink-0 pb-2">
                <div className="flex flex-col mb-4 text-left">
                  <div className="flex items-center gap-2 text-navy-brand">
                    <span className="material-symbols-outlined text-gold-brand">local_library</span>
                    <h2 className="text-sm font-bold uppercase tracking-widest">Glosario Jurídico</h2>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 block">
                    Solo de esta Ley
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-navy-brand/40 text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Buscar en el glosario..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-surface border border-outline-variant rounded-lg focus:ring-1 focus:ring-gold-brand focus:border-gold-brand outline-none text-navy-brand"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-navy-brand/40 text-[16px] hover:text-navy-brand"
                    >
                      close
                    </button>
                  )}
                </div>

                {/* Alphabetical Grid */}
                <div className="flex flex-wrap gap-1 pb-3 border-b border-outline-variant/60 justify-start">
                  {availableLetters.map(letter => {
                    const isLetterSelected = selectedLetter === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => {
                          setSelectedLetter(letter);
                          setSearchQuery('');
                        }}
                        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                          isLetterSelected 
                            ? 'bg-gold-brand text-navy-brand font-black' 
                            : 'text-navy-brand/60 hover:bg-navy-brand/5 hover:text-navy-brand'
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                  {availableLetters.length === 0 && (
                    <span className="text-[10px] text-on-surface-variant/60 italic">Glosario vacío</span>
                  )}
                </div>
              </div>

              {/* Scrolling List */}
              <div className="flex-1 overflow-y-auto p-5 pt-2 custom-scrollbar space-y-3.5 pb-20 text-left">
                {filteredGlossary.length > 0 ? (
                  filteredGlossary.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-outline-variant/80 shadow-sm hover:shadow transition-all duration-200">
                      <h4 className="font-bold text-navy-brand text-xs mb-1.5 uppercase tracking-tight flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-brand"></span>
                        {item.termino}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                        {item.definicion}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-on-surface-variant/50 text-xs italic">
                    No se encontraron términos que coincidan.
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

      </div>

      {/* Video Lightbox Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-[#001c30] p-4 border-b border-white/10">
              <h3 className="font-bold text-gold-brand text-xs uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-gold-brand">smart_display</span>
                {selectedVideo.split('/').pop().replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
              </h3>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black">
              <video 
                src={selectedVideo} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast container */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#002b49] text-white px-5 py-3.5 rounded-xl border border-white/10 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="material-symbols-outlined text-slate-300 text-[14px] font-bold">lock</span>
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Pop-up de Invitaciones Ganadas */}
      {wonInvitations > 0 && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-center transform scale-100 animate-slide-up border-2 border-[#b59348]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#b59348] via-[#ffd700] to-[#b59348]"></div>
            
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#fdfbf6] to-[#f5f1e5] dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-[#b59348]/30">
              <span className="text-4xl">🎫</span>
            </div>
            
            <h2 className="text-2xl font-black text-navy-brand dark:text-white mb-2 leading-tight">
              ¡Felicidades Fundador!
            </h2>
            
            <p className="text-sm font-medium text-[#b59348] mb-4 uppercase tracking-widest">
              Has ganado {wonInvitations} {wonInvitations === 1 ? 'invitación' : 'invitaciones'}
            </p>
            
            <p className="text-on-surface-variant dark:text-slate-300 mb-8 text-[15px] leading-relaxed">
              Gracias por tu dedicación. Ahora tienes el poder de invitar a un amigo a la plataforma <strong>Notario Élite</strong>, otorgándole 2 meses de acceso gratuito.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push('/invitaciones')}
                className="w-full bg-navy-brand hover:bg-navy-brand/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Invitar a un amigo ahora
              </button>
              
              <button 
                onClick={() => setWonInvitations(0)}
                className="w-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-on-surface-variant dark:text-slate-400 font-semibold py-3 px-6 rounded-xl transition-all"
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

function AudioPlayerCard({ src, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    // Reset player on source change
    setIsPlaying(false);
    setCurrentTime(0);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Audio playback error:", err));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center gap-4 w-full text-white">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay}
        className="w-11 h-11 rounded-full bg-gold-brand hover:bg-[#ffe088] text-navy-brand flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95 cursor-pointer shadow-md"
      >
        <span className="material-symbols-outlined text-[24px] font-bold">
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      {/* Info & Slider */}
      <div className="flex-1 w-full text-left">
        <h4 className="text-xs font-bold text-white tracking-tight line-clamp-1 mb-1.5 uppercase">{title}</h4>
        
        <div className="flex items-center gap-3">
          <input 
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-gold-brand"
            style={{
              background: `linear-gradient(to right, #fed65b 0%, #fed65b ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          <span className="text-[10px] font-mono text-white/70 shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
