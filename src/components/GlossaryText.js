'use client';

import { useEffect, useState, useRef } from 'react';

// Global cache to avoid fetching multiple times
let glossaryCache = null;

export default function GlossaryText({ text, className = "" }) {
  const [glossary, setGlossary] = useState(glossaryCache || []);
  const [hoveredTerm, setHoveredTerm] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipOffset, setTooltipOffset] = useState(0);

  useEffect(() => {
    if (!glossaryCache) {
      fetch('/api/glosario')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            glossaryCache = data.data;
            setGlossary(data.data);
          }
        })
        .catch(err => console.error("Error loading glossary", err));
    }
  }, []);

  if (!text) return null;
  if (glossary.length === 0) return <span className={className}>{text}</span>;

  // Simple text replacement logic for React
  // We will split the text by a regex that matches any of the glossary terms
  const terms = glossary.map(g => g.termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (terms.length === 0) return <span className={className}>{text}</span>;

  const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  const handleMouseEnter = (e, term, idx) => {
    setHoveredIndex(idx);
    setHoveredTerm(term);
    
    if (typeof window !== 'undefined' && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const tooltipWidth = 256; // w-64
      
      const elementCenter = rect.left + rect.width / 2;
      const expectedLeft = elementCenter - tooltipWidth / 2;
      const expectedRight = elementCenter + tooltipWidth / 2;
      
      let offset = 0;
      if (expectedLeft < 16) {
        offset = 16 - expectedLeft;
      } else if (expectedRight > viewportWidth - 16) {
        offset = (viewportWidth - 16) - expectedRight;
      }
      setTooltipOffset(offset);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setHoveredTerm(null);
    setTooltipOffset(0);
  };

  return (
    <span className={`relative ${className}`}>
      {parts.map((part, index) => {
        const lowerPart = part.toLowerCase();
        const termMatch = glossary.find(g => g.termino.toLowerCase() === lowerPart);

        if (termMatch) {
          return (
            <span 
              key={index} 
              className="relative inline-block"
              onMouseEnter={(e) => handleMouseEnter(e, termMatch, index)}
              onMouseLeave={handleMouseLeave}
            >
              <span className="text-sky-500 border-b border-sky-500 border-dashed cursor-help font-semibold">
                {part}
              </span>
              
              {/* Tooltip */}
              {hoveredIndex === index && (
                <div 
                  className="absolute z-50 bottom-full left-1/2 mb-2 w-64 text-white p-4 rounded-lg shadow-xl text-xs border border-outline-variant font-body-md animate-fade-in-up"
                  style={{ 
                    backgroundColor: '#002b49', 
                    opacity: 1,
                    transform: `translate(calc(-50% + ${tooltipOffset}px), 0)`
                  }}
                >
                  <div className="font-bold text-gold-brand mb-1 tracking-wider uppercase text-[10px]">{termMatch.termino}</div>
                  <div className="leading-relaxed whitespace-pre-wrap">{termMatch.definicion}</div>
                  <div 
                    className="absolute -bottom-2 left-1/2 border-8 border-transparent"
                    style={{ 
                      borderTopColor: '#002b49',
                      transform: `translate(calc(-50% - ${tooltipOffset}px), 0)`
                    }}
                  ></div>
                </div>
              )}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
