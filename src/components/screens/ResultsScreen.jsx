import React, { useState, useEffect } from 'react';
import { Crown, LogOut, ArrowLeft, Settings } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

export default function ResultsScreen({ 
  gameData, 
  setActiveGameId,
  confetti,
  isPractice,
  onRetry,
  onExit
}) {
  const [view, setView] = useState(isPractice ? 'podium' : 'countdown'); // countdown -> (team_victory) -> podium -> table
  const [count, setCount] = useState(3);

  // Calculate Team Scores
  const redScore = Object.values(gameData.players).filter(p => p.team === 'red').reduce((acc, p) => acc + (p.score || 0), 0);
  const blueScore = Object.values(gameData.players).filter(p => p.team === 'blue').reduce((acc, p) => acc + (p.score || 0), 0);
  const winningTeam = redScore > blueScore ? 'red' : blueScore > redScore ? 'blue' : 'draw';

  // Countdown Effect
  useEffect(() => {
    if (view === 'countdown') {
        const timer = setInterval(() => {
            setCount(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // If Team Mode, go to Team Victory first
                    if (gameData.teamMode) {
                        setView('team_victory');
                    } else {
                        setView('podium');
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [view, gameData.teamMode]);

  // Team Victory Effect
  useEffect(() => {
      if (view === 'team_victory') {
          const timer = setTimeout(() => {
              setView('podium');
          }, 4000); // Show for 4 seconds
          return () => clearTimeout(timer);
      }
  }, [view]);

  // Podium Effect (Auto switch to table after 10s)
  useEffect(() => {
      if (view === 'podium') {
          // Trigger confetti entry
          // Epic Confetti Trigger
          const duration = 3000;
          const end = Date.now() + duration;
          const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1'];

          (function frame() {
            confetti({
              particleCount: 5,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.8 },
              colors: colors
            });
            confetti({
              particleCount: 5,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.8 },
              colors: colors
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());

          if (!isPractice) {
              const timer = setTimeout(() => {
                  setView('table');
              }, 10000);
              return () => clearTimeout(timer);
          }
      }
  }, [view, isPractice]);

  const sortedPlayers = Object.entries(gameData.players)
     .filter(([id, p]) => {
        // In practice, always show players. In multiplayer, filter host if hostPlays is false.
        if (isPractice) return true;
        if (!gameData.hostPlays && id === gameData.host) return false;
        return true;
    })
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.score - a.score);
  
  const top3 = sortedPlayers.slice(0, 3);

  // --- VIEW: COUNTDOWN ---
  if (view === 'countdown') {
      return (
          <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
              <div key={count} className="text-[12rem] font-black text-slate-900 dark:text-white animate-ping-once drop-shadow-2xl">
                  {count}
              </div>
          </div>
      );
  }

  // --- VIEW: TEAM VICTORY ---
  if (view === 'team_victory') {
      return (
          <div className={`min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative animate-fade-in transition-colors ${winningTeam === 'red' ? 'bg-red-900' : winningTeam === 'blue' ? 'bg-blue-900' : 'bg-purple-900'}`}>
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="z-10 text-center animate-scale-up">
                  <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-widest mb-4 drop-shadow-lg">
                      {winningTeam === 'draw' ? '¡EMPATE!' : 'VICTORIA'}
                  </h2>
                  {winningTeam !== 'draw' && (
                      <h1 className={`text-6xl md:text-9xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 drop-shadow-2xl animate-bounce`}>
                          EQUIPO {winningTeam === 'red' ? 'ROJO' : 'AZUL'}
                      </h1>
                  )}
                  <div className="mt-8 flex gap-12 justify-center items-center text-white/90">
                      <div className="flex flex-col items-center">
                          <span className="text-xl font-bold uppercase tracking-widest text-red-400">Rojo</span>
                          <span className="text-6xl font-black">{redScore}</span>
                      </div>
                      <div className="text-4xl font-thin opacity-50">vs</div>
                      <div className="flex flex-col items-center">
                          <span className="text-xl font-bold uppercase tracking-widest text-blue-400">Azul</span>
                          <span className="text-6xl font-black">{blueScore}</span>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- VIEW: PODIUM ---
  if (view === 'podium') {
      return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden relative animate-fade-in transition-colors">
           {/* Top Left Exit Button */}
           <div className="absolute top-6 left-6 z-50 flex gap-2">
                <button onClick={onExit} className="p-3 bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                        <LogOut size={24}/>
                </button>
                <ThemeToggle />
           </div>

           <h2 className="text-5xl font-black text-slate-800 dark:text-white mb-24 tracking-[0.2em] relative z-10 animate-fade-in-down drop-shadow-2xl">
              ¡GANADORES!
           </h2>
           
           {/* Podium Container */}
           <div className="flex items-end justify-center gap-2 md:gap-4 mb-20 relative z-10 w-full max-w-4xl h-96">
               
               {/* 2nd Place */}
               <div className="flex flex-col items-center animate-slide-up" style={{animationDelay: '0.2s'}}>
                   {top3[1] && (
                       <>
                           <div className="mb-4 text-center">
                                <div className="mb-2 w-16 h-16 rounded-full border-4 border-slate-500 overflow-hidden shadow-lg mx-auto bg-slate-800">
                                    {top3[1].photoURL ? <img src={top3[1].photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{top3[1].name.charAt(0)}</div>}
                                </div>
                                <p className="font-bold text-slate-700 dark:text-slate-200 text-2xl mb-1">{top3[1].name}</p>
                               <p className="text-slate-400 font-mono text-lg">{top3[1].score} pts</p>
                           </div>
                           <div className="w-28 h-48 bg-slate-700 rounded-t-2xl flex items-end justify-center pb-6 shadow-[0_0_30px_rgba(51,65,85,0.3)] border-t-4 border-slate-500 relative overflow-hidden animate-grow-up origin-bottom">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                                <span className="text-5xl font-black text-slate-400">#2</span>
                           </div>
                       </>
                   )}
               </div>
     
               {/* 1st Place */}
               <div className="flex flex-col items-center z-20 animate-slide-up">
                   {top3[0] && (
                       <>
                            <Crown className="w-20 h-20 text-yellow-400 mb-2 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                             
                            <div className="mb-4 w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden shadow-xl mx-auto bg-yellow-600 relative z-10">
                               {top3[0].photoURL ? <img src={top3[0].photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl">{top3[0].name.charAt(0)}</div>}
                            </div>

                           <div className="mb-4 text-center">
                               <p className="font-black text-4xl text-yellow-600 dark:text-yellow-300 drop-shadow-lg mb-1">{top3[0].name}</p>
                               <p className="text-yellow-600 dark:text-yellow-100 font-mono text-2xl font-bold">{top3[0].score} pts</p>
                           </div>
                           <div className="w-40 h-72 bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-t-2xl flex items-end justify-center pb-8 shadow-[0_0_50px_rgba(234,179,8,0.4)] border-t-8 border-yellow-300 relative overflow-hidden ring-4 ring-yellow-400/20 animate-grow-up origin-bottom">
                                <div className="absolute inset-0 bg-yellow-300/20 animate-pulse"></div>
                                <span className="text-8xl font-black text-yellow-900/50 relative z-10">#1</span>
                           </div>
                       </>
                   )}
               </div>
     
               {/* 3rd Place */}
                <div className="flex flex-col items-center animate-slide-up" style={{animationDelay: '0.4s'}}>
                   {top3[2] && (
                       <>
                           <div className="mb-4 text-center">
                                <div className="mb-2 w-16 h-16 rounded-full border-4 border-orange-700 overflow-hidden shadow-lg mx-auto bg-orange-900">
                                    {top3[2].photoURL ? <img src={top3[2].photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{top3[2].name.charAt(0)}</div>}
                                </div>
                                <p className="font-bold text-orange-700 dark:text-orange-200 text-2xl mb-1">{top3[2].name}</p>
                               <p className="text-orange-300/80 font-mono text-lg">{top3[2].score} pts</p>
                           </div>
                           <div className="w-28 h-36 bg-orange-900 rounded-t-2xl flex items-end justify-center pb-6 shadow-[0_0_30px_rgba(124,45,18,0.3)] border-t-4 border-orange-700 relative overflow-hidden animate-grow-up origin-bottom">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                                <span className="text-5xl font-black text-orange-600">#3</span>
                           </div>
                       </>
                   )}
               </div>
           </div>

           {/* Skip Button */}
           {!isPractice && (
               <button onClick={() => setView('table')} className="text-slate-500 hover:text-white transition-colors underline text-sm absolute bottom-8">
                   Ver tabla completa &rarr;
               </button>
           )}

           {/* Practice Buttons Logic */}
           {isPractice && (
               <div className="mt-8 flex gap-3 relative z-20">
                    <button 
                       onClick={onRetry} 
                       className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-900/50"
                    >
                        <LogOut size={18}/> Practicar de Nuevo
                    </button>
                    <button 
                         onClick={onExit}
                         className="bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold py-3 px-8 rounded-full transition-all border border-slate-200 dark:border-white/20 backdrop-blur flex items-center gap-2 shadow-sm"
                    >
                      <LogOut size={20}/> Salir
                    </button>
                </div>
           )}
        </div>
      );
  }

  // --- VIEW: TABLE ---
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center p-6 overflow-hidden relative animate-fade-in transition-colors">
       {/* Top Left Exit Button */}
       <div className="absolute top-6 left-6 z-50 flex gap-2">
            <button onClick={onExit} className="p-3 bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                    <LogOut size={24}/>
            </button>
            <ThemeToggle />
       </div>
       
       <div className="w-full max-w-3xl flex flex-col h-[90vh]">
         {/* Header */}
         <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
                 <Crown className="text-yellow-500 w-10 h-10"/>
                 <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-wider">RESULTADOS FINALES</h2>
             </div>
             <button 
                onClick={onExit}
                className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-2 px-4 text-sm md:py-3 md:px-6 md:text-base rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm"
             >
                <ArrowLeft size={20}/> Volver al Inicio
             </button>
         </div>

         {/* Grid Header */}
         <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white dark:bg-slate-950/50 rounded-t-2xl text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
             <div className="col-span-2 text-center">Pos</div>
             <div className="col-span-7">Jugador</div>
             <div className="col-span-3 text-right">Puntos</div>
         </div>

         {/* Scrollable List */}
         <div className="flex-1 overflow-y-auto bg-white/50 dark:bg-slate-900/50 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-2xl p-2 space-y-2 custom-scrollbar">
             {sortedPlayers.map((p, index) => (
                 <div 
                   key={p.id} 
                   className={`grid grid-cols-12 gap-4 px-4 py-4 rounded-xl items-center transition-all border ${
                       p.team === 'red' ? 'bg-red-500/10 border-red-500/20 dark:bg-red-900/20 dark:border-red-500/30' :
                       p.team === 'blue' ? 'bg-blue-500/10 border-blue-500/20 dark:bg-blue-900/20 dark:border-blue-500/30' :
                       index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 
                       index === 1 ? 'bg-slate-200/50 dark:bg-slate-500/10 border-slate-300 dark:border-slate-500/30' : 
                       index === 2 ? 'bg-orange-500/10 border-orange-500/30' : 
                       'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'
                   }`}
                 >
                     <div className="col-span-2 flex justify-center">
                         <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-lg ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-slate-400 text-black' : index === 2 ? 'bg-orange-700 text-white' : 'text-slate-500 dark:text-slate-500 bg-slate-200 dark:bg-slate-900'}`}>
                             {index + 1}
                         </span>
                     </div>
                     <div className="col-span-7 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden shadow-sm border-2 ${
                              p.team === 'red' ? 'bg-red-500 border-red-400 text-white' :
                              p.team === 'blue' ? 'bg-blue-500 border-blue-400 text-white' :
                              p.id === gameData.host ? 'bg-yellow-500 border-yellow-300 text-black' : 
                              'bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white'
                          }`}>
                             {p.photoURL ? (
                                <img src={p.photoURL} alt={p.name} className="w-full h-full object-cover"/>
                             ) : (
                                p.name.charAt(0).toUpperCase()
                             )}
                          </div>
                         <span className={`font-bold text-lg truncate ${p.id === gameData.host ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-800 dark:text-white'}`}>
                             {p.name}
                         </span>
                     </div>
                     <div className="col-span-3 text-right font-mono text-xl font-bold text-blue-500 dark:text-blue-400">
                         {p.score}
                     </div>
                 </div>
             ))}
         </div>
       </div>
    </div>
  );
}
