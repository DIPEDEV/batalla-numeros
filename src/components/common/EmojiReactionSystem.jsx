import React, { useState, useEffect, useRef } from 'react';

const EMOJI_MAP = {
  'bien': '👍',
  'llorar': '😭',
  'nerd': '🤓',
  'enojado': '😡',
  'skull': '💀'
};

const EMOJI_LIST = ['bien', 'llorar', 'nerd', 'enojado', 'skull'];

export default function EmojiReactionSystem({ 
  gameData, 
  sendReaction, 
  isLobby, 
  isPlaying 
}) {
  const [fallingEmojis, setFallingEmojis] = useState([]);
  const lastReactionIdRef = useRef(null);

  const [activeCount, setActiveCount] = useState(0);

  // 1. Listen for new reactions
  useEffect(() => {
    if (gameData?.latestReaction) {
      const reaction = gameData.latestReaction;
      
      // Check if new
      if (reaction.id !== lastReactionIdRef.current) {
        lastReactionIdRef.current = reaction.id;
        spawnEmoji(reaction.type, reaction.sender);
      }
    }
  }, [gameData?.latestReaction]);

  // 2. Spawn Logic
  const spawnEmoji = (type, senderName) => {
    const id = Date.now() + Math.random();
    
    // Position Logic: Strict "Side Gutters" to avoid UI
    // We want to use the left 10-15% and right 10-15% of the screen.
    // Randomly choose left or right side.
    const side = Math.random() > 0.5 ? 'left' : 'right';
    let leftPos = 0;

    if (side === 'left') {
        // 2% to 15%
        leftPos = Math.floor(Math.random() * 13) + 2;
    } else {
        // 85% to 98%
        leftPos = Math.floor(Math.random() * 13) + 85;
    }

    const newEmoji = {
      id,
      emoji: EMOJI_MAP[type] || '❓',
      left: leftPos,
      sender: senderName || 'Anónimo',
      duration: Math.random() * 2 + 3 // 3s to 5s fall (slower to read name)
    };

    setFallingEmojis(prev => [...prev, newEmoji]);

    // Cleanup
    setTimeout(() => {
      setFallingEmojis(prev => prev.filter(e => e.id !== id));
    }, newEmoji.duration * 1000);
  };

  const handleSend = (type) => {
    if (activeCount >= 10) return; // Rate Limit

    if (sendReaction) {
        sendReaction(type);
        setActiveCount(prev => prev + 1);
        // Decentralize decrement to match approx fall time or just fixed 3s
        setTimeout(() => {
            setActiveCount(prev => Math.max(0, prev - 1));
        }, 3000);
    }
  };

  return (
    <>
        {/* Style for animation */}
        <style>{`
          @keyframes fallDown {
            0% { transform: translateY(-10vh); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
        `}</style>

        {/* 1. Falling Container (Pointer events none to not block clicks) */}
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {fallingEmojis.map(item => (
                <div
                    key={item.id}
                    className="absolute top-0 flex flex-col items-center"
                    style={{
                        left: `${item.left}%`,
                        animation: `fallDown ${item.duration}s linear forwards`
                    }}
                >
                    <div className="text-4xl md:text-5xl drop-shadow-2xl filter saturate-150">{item.emoji}</div>
                    <div className={`mt-1 font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap border border-white/10 ${item.sender.length > 12 ? 'text-[8px]' : 'text-[10px] md:text-xs'}`}>
                        {item.sender}
                    </div>
                </div>
            ))}
        </div>

        {/* 2. Control Panel */}
        <div className="fixed bottom-0 left-0 right-0 z-[90] flex justify-center pb-6 pointer-events-none">
            {/* Inner box with pointer-events-auto */}
            <div className={`bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full px-6 py-3 flex gap-4 shadow-2xl pointer-events-auto transition-all ${activeCount >= 10 ? 'opacity-50 grayscale' : 'hover:scale-105'}`}>
                {EMOJI_LIST.map(type => (
                    <button
                        key={type}
                        onClick={() => handleSend(type)}
                        disabled={activeCount >= 10}
                        className="text-2xl md:text-3xl hover:scale-125 hover:-translate-y-2 active:scale-95 transition-all duration-200 grayscale-[0.3] hover:grayscale-0 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                        title={type}
                    >
                        {EMOJI_MAP[type]}
                    </button>
                ))}
            </div>
        </div>
    </>
  );
}
