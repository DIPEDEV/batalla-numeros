import React, { useEffect, useRef, useState } from 'react';
import { Crown, Loader2, LogOut, BookOpen, X, List, Trophy, Settings } from 'lucide-react';
import { getCheatSheetRules } from '../../lib/frenchNumbers';
import ThemeToggle from '../common/ThemeToggle';

export default function GameScreen({
  user,
  gameData,
  timeLeft,
  formatTime,
  handleAnswer,
  localFeedback,
  skillFeedback,
  isPractice,
  onExit,
  showCheatSheet,
  combo
}) {
  const isHost = gameData.host === user.uid;
  const isSpectator = isHost && !gameData.hostPlays && !isPractice; // Host only spectator in multiplayer
  const prevPlayersRef = useRef({});

  // Leaderboard Data Calculation
  const sortedPlayers = Object.entries(gameData.players)
    .filter(([id, p]) => {
        if (!gameData.hostPlays && id === gameData.host) return false;
        return true;
    })
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.score - a.score);


  // Used for diffs
  useEffect(() => {
      const newMap = {};
      sortedPlayers.forEach((p, idx) => {
          newMap[p.id] = { score: p.score, rank: idx };
      });
      prevPlayersRef.current = newMap;
  }, [gameData]); 

  // Toggle Cheat Sheet / Leaderboard
  const [sidePanelOpen, setSidePanelOpen] = useState(isPractice ? showCheatSheet : true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const cheatRules = getCheatSheetRules();

  const handleExitRequest = () => {
      setShowExitConfirm(true);
  };

  const confirmExit = () => {
      setShowExitConfirm(false);
      onExit();
  };

  const cancelExit = () => {
      setShowExitConfirm(false);
  };

  // --- COUNTDOWN OVERLAY ---
  const [countdown, setCountdown] = useState(3);
  
  useEffect(() => {
     if (gameData.status === 'launching') {
         setCountdown(3);
         const timer = setInterval(() => {
             setCountdown(prev => {
                if(prev <= 1) {
                    clearInterval(timer);
                    return 0; // or 1 depending on UX
                }
                return prev - 1;
             });
         }, 1000);
         return () => clearInterval(timer);
     }
  }, [gameData.status]);

  if (gameData.status === 'launching') {
      return (
          <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden relative transition-colors duration-300">
              <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/10 dark:bg-indigo-600/40 animate-pulse"></div>
              <div key={countdown} className="text-[20rem] font-black text-slate-900 dark:text-white animate-epic-zoom drop-shadow-2xl z-10">
                  {countdown}
              </div>
              <p className="z-10 text-3xl font-bold text-indigo-600 dark:text-indigo-300 tracking-[0.5em] mt-8 animate-bounce uppercase">¡Prepárate!</p>
          </div>
      );
  }

  // --- MODO ESPECTADOR (SOLO HOST MULTIPLAYER) ---
  if (isSpectator) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col text-slate-900 dark:text-white overflow-hidden p-6 transition-colors">
         {/* Custom Exit Modal for Spectator */}
         {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-up">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">¿Cerrar sala?</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Si sales, la partida terminará para todos.</p>
                  <div className="flex gap-3">
                      <button onClick={cancelExit} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors">Cancelar</button>
                      <button onClick={confirmExit} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/40">Cerrar</button>
                  </div>
              </div>
          </div>
         )}
         
         {/* Big Header */}
         <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black tracking-tighter text-slate-500">PANEL DEL HOST</h1>
            <div className={`px-8 py-4 rounded-2xl text-5xl font-mono font-black border-2 ${timeLeft < 10 ? 'text-red-500 border-red-500 bg-red-900/20 animate-pulse' : 'text-white border-slate-700 bg-slate-800'}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="w-32"></div> {/* Spacer */}
         </div>

         {/* Centered Big Leaderboard */}
         <div className="flex-1 flex max-w-4xl mx-auto w-full bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex-col">
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-center">
               <Crown className="text-yellow-500 mr-3 w-8 h-8"/>
               <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-300">Tabla de Posiciones</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
               {sortedPlayers.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">Esperando jugadores...</div>
               ) : (
                 sortedPlayers.map((p, index) => {
                  const prev = prevPlayersRef.current[p.id];
                  const diff = prev ? p.score - prev.score : 0;
                  const isUp = diff > 0;
                  const isDown = diff < 0;

                  return (
                      <div 
                      key={p.id} 
                      className={`p-4 rounded-xl flex items-center justify-between transition-all duration-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${isUp ? 'bg-green-100 dark:bg-green-900/20 border-green-500/50 scale-[1.02]' : isDown ? 'bg-red-100 dark:bg-red-900/20 border-red-500/50 shake' : ''}`}
                      >
                      <div className="flex items-center gap-6">
                          <span className={`text-2xl font-mono font-bold w-12 h-12 flex items-center justify-center rounded-lg ${index === 0 ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-orange-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {index + 1}
                          </span>
                           {p.photoURL && (
                             <img src={p.photoURL} alt={p.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-xl object-cover" />
                           )}
                          <span className="text-2xl font-bold text-slate-800 dark:text-white">
                              {p.name}
                          </span>
                      </div>
                      <div className="flex items-center gap-4">
                           {diff !== 0 && (
                               <span className={`font-black text-xl animate-bounce ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                   {diff > 0 ? '+' : ''}{diff}
                               </span>
                           )}
                           <span className="font-black text-3xl text-blue-400">{p.score}</span>
                      </div>
                      </div>
                  );
                 })
               )}
            </div>
         </div>
         
         <button onClick={handleExitRequest} className="absolute top-6 right-6 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors">
            <LogOut size={24}/>
         </button>
      </div>
    );
  }

  // --- MODO JUGADOR ---
  const playerData = gameData.players[user.uid];
  const myScore = playerData?.score || 0;
  // Fallback to global currentRound if player-specific is missing (Practice Mode uses global now)
  const myCurrentQ = playerData?.currentQuestion || gameData.currentRound;

  return (
    <div className="min-h-screen relative flex overflow-hidden font-sans">
      
      {/* --- AMBIENT BACKGROUND (Restored) --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      {/* SKILL FEEDBACK OVERLAY */}
      {skillFeedback && (
           <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
                <div className="bg-white/90 dark:bg-slate-900/90 border-4 border-yellow-400 p-8 rounded-3xl flex flex-col items-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute inset-0 bg-yellow-500/10 animate-pulse"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-yellow-600 dark:text-yellow-400 font-bold tracking-widest text-sm mb-2">¡RACHA DE 10!</span>
                        <div className="text-indigo-600 dark:text-white mb-4 animate-bounce">
                            {skillFeedback.skill.icon}
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white italic uppercase mb-2 text-center drop-shadow-lg">
                            {skillFeedback.skill.name}
                        </h2>
                        <p className="text-2xl text-yellow-600 dark:text-yellow-200 font-bold text-center">
                            {skillFeedback.text}
                        </p>
                    </div>
                </div>
           </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-up">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">¿Salir del juego?</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
                    {isPractice ? "Perderás tu progreso actual." : "Si sales, no podrás volver a entrar."}
                </p>
                <div className="flex gap-3">
                    <button onClick={cancelExit} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button onClick={confirmExit} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/40">Salir</button>
                </div>
            </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${sidePanelOpen ? 'mr-0 lg:mr-80' : ''}`}>
        
        {/* Top Left Exit Button (Absolute, matching Results) */}
        <div className="absolute top-6 left-6 z-50 flex gap-2">
            <button onClick={handleExitRequest} className="p-3 bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm">
                <LogOut size={24}/>
            </button>
            <ThemeToggle />
        </div>

        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-white/10 p-4 flex justify-between items-center shadow-lg z-20 pl-40 transition-colors"> 
          {/* Added padding-left to clear the absolute button or just remove the old button space. 
              Actually, if I use absolute button, I don't need it inside the flex header.
              But I need to keep the "score" info aligned? 
              Let's Keep the header structure but remove the button from it.
          */}
          
          <div className="flex items-center gap-6">
             {/* Text/Score Section */}
             <div className="flex flex-col relative">
               <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold tracking-widest uppercase mb-0.5">TU PUNTUACIÓN</span>
              <div className="flex items-center gap-3 relative">
                  <span key={myScore} className="text-4xl font-black text-slate-800 dark:text-white tracking-tight drop-shadow-md animate-score-pop">{myScore}</span>
                  
                  {/* Point Feedback Animation (Popping next to score) */}
                   {localFeedback && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 pointer-events-none">
                         <span className={`text-2xl font-black whitespace-nowrap animate-float-up-fade ${localFeedback.type === 'good' ? 'text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}>
                              {localFeedback.val}
                          </span>
                      </div>
                  )}
              </div>
            </div>

          </div>
          
          <div className="flex items-center gap-4">
             <div className={`px-5 py-2 rounded-xl text-2xl font-mono font-bold border-2 shadow-lg transition-all ${timeLeft < 10 ? 'text-rose-500 border-rose-500 bg-rose-100 dark:bg-rose-950/30 animate-pulse scale-110' : 'text-slate-600 dark:text-slate-200 border-indigo-200 dark:border-indigo-500/30 bg-white/50 dark:bg-indigo-950/30'}`}>
                {formatTime(timeLeft)}
             </div>

             <button 
              onClick={() => setSidePanelOpen(!sidePanelOpen)}
              className={`p-3 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 ${sidePanelOpen ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              title={isPractice ? "Ver Guía" : "Ver Tabla"}
             >
                {isPractice ? <BookOpen size={22}/> : <Trophy size={22}/>}
             </button>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
           
           {myCurrentQ ? (
            <div className="relative z-10 w-full max-w-2xl animate-fade-in-up">
              <div className="mb-16 text-center relative">
                
                {/* COMBO INDICATOR */}
                {combo >= 2 && (
                   <div key={combo} className="absolute left-1/2 -top-40 -translate-x-1/2 z-50 animate-slam origin-center pointer-events-none">
                       <div className="relative flex flex-col items-center">
                           {/* Background glow & Ring */}
                           <div className="absolute inset-0 bg-yellow-500/20 dark:bg-yellow-500/40 blur-xl rounded-full animate-pulse"></div>
                           <div className="absolute inset-0 border-4 border-yellow-500/30 rounded-full animate-ping-once transition-colors"></div>

                           <div className="relative transform -skew-x-12 px-8 py-3 rounded-xl flex items-baseline gap-3 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.4)]
                               bg-white dark:bg-slate-900 
                               border-2 border-yellow-500/50 dark:border-yellow-400
                               text-slate-900 dark:text-white transition-colors"
                           >
                               {/* Shimmer effect */}
                               <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-yellow-500/10 dark:via-white/40 to-transparent -translate-x-full animate-shine"></div>
                               
                               <div className="flex flex-col items-center z-10">
                                   <span className="text-xs font-black text-yellow-600 dark:text-yellow-400 tracking-[0.3em] leading-none mb-1 drop-shadow-sm uppercase">Seguidas</span>
                                   <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-600 leading-none drop-shadow-md filter" style={{ WebkitTextStroke: '1px rgba(0,0,0,0.1)' }}>
                                       {combo}
                                   </span>
                               </div>
                               
                               {combo >= 5 && (
                                   <div className="absolute top-1 right-1">
                                       <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded animate-pulse shadow-lg ring-1 ring-white/50">🔥</span>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
                )}

                <div className="inline-block px-4 py-1 rounded-full bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-[0.2em] mb-6 backdrop-blur-sm">
                    {myCurrentQ.displayMode === 'math' ? 'RESUELVE' : myCurrentQ.displayMode === 'reverse-math' ? 'ENCUENTRA LA OPERACIÓN' : 'TRADUCE AL NÚMERO'}
                </div>
                
                {myCurrentQ.displayMode === 'math' ? (
                   <div className="flex flex-col items-end justify-center animate-pop-in relative px-8">
                       <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-1 mr-4">{myCurrentQ.operand1}</div>
                       <div className="flex items-center justify-end gap-4 text-4xl md:text-5xl font-black text-slate-800 dark:text-white w-full">
                           <span className="text-indigo-500 absolute left-0 text-5xl">{myCurrentQ.operator}</span>
                           <span className="mr-4">{myCurrentQ.operand2}</span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-800 dark:bg-white rounded-full mt-2"></div>
                   </div>
                ) : myCurrentQ.displayMode === 'reverse-math' ? (
                   <h2 className="text-8xl md:text-9xl font-black pb-2 animate-pop-in">
                     <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-600 dark:from-white dark:via-purple-200 dark:to-indigo-300 drop-shadow-2xl">
                       {myCurrentQ.targetText}
                     </span>
                   </h2>
                ) : (
                   <h2 className="text-6xl md:text-7xl font-black pb-2">
                     <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 drop-shadow-2xl">
                       {myCurrentQ.targetText}
                     </span>
                   </h2>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {myCurrentQ.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="group relative bg-white/40 dark:bg-white/5 hover:bg-indigo-100/50 dark:hover:bg-indigo-600/20 active:bg-indigo-200/50 dark:active:bg-indigo-600/40 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-white transition-all duration-150 font-bold py-6 px-4 rounded-3xl border-2 border-white/50 dark:border-white/10 hover:border-indigo-400 shadow-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-1 active:scale-95 overflow-hidden backdrop-blur-sm flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {myCurrentQ.displayMode === 'reverse-math' ? (() => {
                        const op = option.includes(' + ') ? '+' : '-';
                        const [a, b] = option.split(op === '+' ? ' + ' : ' - ');
                        return (
                            <div className="relative z-10 flex flex-col items-end w-fit mx-auto animate-pop-in">
                                <span className="text-lg md:text-xl mr-2 leading-tight">{a}</span>
                                <div className="flex items-center justify-end w-full pl-6 relative">
                                     <span className="text-xl md:text-2xl absolute left-0 bottom-1 leading-none opacity-70">{op}</span>
                                     <span className="text-lg md:text-xl leading-tight">{b}</span>
                                </div>
                            </div>
                        );
                    })() : (
                        <span className="relative z-10 text-3xl md:text-5xl leading-none">{option}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-white/40 dark:bg-black/20 rounded-3xl backdrop-blur-sm border border-white/20 dark:border-white/5">
              <Loader2 className="animate-spin w-12 h-12 mx-auto mb-4 text-indigo-500"/>
              <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide animate-pulse">CARGANDO...</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Leaderboard (Multiplayer) OR Cheat Sheet (Practice) */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 transform transition-transform duration-300 z-50 ${sidePanelOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
        
        {isPractice ? (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
                    <h3 className="font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-2">
                        <BookOpen size={18}/> Guía Rápida
                    </h3>
                    <button onClick={() => setSidePanelOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <X size={20}/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                    {cheatRules.map((rule, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-1">{rule.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">{rule.description}</p>
                            {rule.details && <div className="text-xs bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 p-2 rounded mb-3">{rule.details}</div>}
                            <div className="grid grid-cols-2 gap-2">
                                {rule.examples.map((ex, j) => (
                                    <div key={j} className="text-xs bg-slate-100 dark:bg-black/20 p-2 rounded flex justify-between">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{ex.val}</span>
                                        <span className="text-slate-500">{ex.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Crown size={18} className="text-yellow-500"/> Tabla de Puntos
                    </h3>
                    <button onClick={() => setSidePanelOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <X size={20}/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-20 bg-slate-50 dark:bg-slate-950">
                    {sortedPlayers.map((p, index) => {
                        const prev = prevPlayersRef.current[p.id];
                        const diff = prev ? p.score - prev.score : 0;
                        const isUp = diff > 0;
                        const isDown = diff < 0;

                        return (
                            <div 
                                key={p.id} 
                                className={`p-3 rounded-xl flex items-center justify-between transition-all duration-300 ${p.id === user.uid ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-500/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'} border ${isUp ? 'ring-2 ring-green-500 ring-opacity-50' : isDown ? 'ring-2 ring-red-500 ring-opacity-50' : ''} shadow-sm`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                <span className={`text-sm font-mono font-bold w-6 h-6 flex items-center justify-center rounded-md ${index === 0 ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50' : index === 1 ? 'bg-slate-200 dark:bg-slate-300 text-black' : index === 2 ? 'bg-orange-500 dark:bg-orange-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                    {index + 1}
                                </span>
                                {p.photoURL ? (
                                    <img src={p.photoURL} alt={p.name} className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                        {p.name.substring(0,2).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold truncate max-w-[100px] ${p.id === user.uid ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`} title={p.name}>
                                        {p.name}
                                    </span>
                                </div>
                                </div>
                                <span className={`font-black text-xl px-2 py-1 rounded transition-colors duration-300 ${isUp ? 'text-green-600 dark:text-green-400 scale-125' : isDown ? 'text-red-500 dark:text-red-400 scale-125' : 'text-slate-400'}`}>
                                    {p.score}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

    </div>
  );
}
