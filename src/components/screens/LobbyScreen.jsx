import { Users, Clock, CheckCircle, Play, Settings, Copy, ArrowLeft, ChevronDown } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

export default function LobbyScreen({
  user,
  gameData,
  activeGameId,
  copyCode,
  copied,
  startGame,
  lobbyMaxPlayers,
  setLobbyMaxPlayers,
  lobbyDurationMinutes,
  setLobbyDurationMinutes,
  lobbyNumberRange,
  setLobbyNumberRange,
  hostPlays,
  setHostPlays,
  onBack
}) {
  const isHost = gameData.host === user.uid;
  const connectedCount = gameData.playerList.length;

  // Determine display max players based on role
  const displayMaxPlayers = isHost ? lobbyMaxPlayers : (gameData.maxPlayers || lobbyMaxPlayers);

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden transition-colors">
      {/* Settings Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Abstract BG */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-6xl glass-card relative z-10 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[85vh] max-h-[800px] animate-slide-up bg-white/60 dark:bg-black/40 shadow-2xl backdrop-blur-xl">
        
        {/* Left Panel: Players (SCROLLABLE) */}
        <div className="lg:col-span-7 flex flex-col h-full border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/10 shrink-0">
             <div className="flex items-center gap-4">
                {onBack && (
                  <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors" title="Salir">
                      <ArrowLeft className="text-slate-600 dark:text-indigo-300" size={24}/>
                  </button>
                )}
                <div>
                   <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Sala de Espera</h2>
                   <p className="text-indigo-600 dark:text-indigo-300 text-sm font-medium ml-1">{connectedCount} / {displayMaxPlayers} Jugadores</p>
                </div>
             </div>
             <div className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-500/30">
               EN ESPERA
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
             <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {gameData.playerList
                  .filter(pid => {
                    // Filter out host if hostPlays is false
                    if (!hostPlays && pid === gameData.host) return false;
                    return true;
                  })
                  .map(pid => (
                  <div key={pid} className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${pid === user.uid ? 'bg-indigo-100 dark:bg-indigo-600/20 border-indigo-200 dark:border-indigo-500/50' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm shadow-inner overflow-hidden ${pid === gameData.host ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'}`}>
                      {gameData.players[pid]?.photoURL ? (
                          <img 
                              src={gameData.players[pid].photoURL} 
                              alt={gameData.players[pid].name} 
                              className="w-full h-full object-cover"
                          />
                      ) : (
                          gameData.players[pid]?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{gameData.players[pid]?.name}</span>
                  </div>
                ))}
                {/* Dynamic placeholder generation - Adjust count calculations */}
                {Array.from({ length: Math.max(0, displayMaxPlayers - (hostPlays ? connectedCount : connectedCount - 1)) }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-4 rounded-xl border border-slate-200 dark:border-white/5 border-dashed flex items-center justify-center text-slate-400 dark:text-white/10 text-sm h-full">
                    <span className="select-none">Esperando...</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Panel: Settings & Code (FIXED) */}
        <div className="lg:col-span-5 flex flex-col gap-6 p-6 md:p-8 bg-slate-50/50 dark:bg-black/20 h-full overflow-y-auto">
          
          <div className="glass-card p-8 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900/40 dark:to-purple-900/40 border-indigo-500/30 relative overflow-hidden group shrink-0 shadow-xl">
             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <p className="text-white/80 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4 text-center">Código de la partida</p>
             <div 
               onClick={copyCode}
               className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
             >
               <span className="text-7xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-white dark:from-white dark:via-white dark:to-white tracking-widest drop-shadow-md">
                 {activeGameId}
               </span>
               <div className="mt-4 text-sm text-white/90 dark:text-indigo-300 flex items-center gap-2 font-medium">
                 {copied ? <><CheckCircle size={16} className="text-emerald-300 dark:text-emerald-400"/> Copiado al portapapeles</> : <><Copy size={16}/> Toca para copiar</>}
               </div>
             </div>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
          {isHost ? (
                 <div className="space-y-8">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300">
                     <span className="flex items-center gap-2"><Users size={18} className="text-indigo-600 dark:text-indigo-400"/> Jugadores Máximos</span>
                     <span className="text-indigo-600 dark:text-indigo-400 font-mono text-lg">{lobbyMaxPlayers}</span>
                   </div>
                   <input 
                    type="range" min="2" max="30"
                    value={lobbyMaxPlayers}
                    onChange={(e) => setLobbyMaxPlayers(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                   />
                 </div>

                 <div className="space-y-2">
                   <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300">
                     <span className="flex items-center gap-2"><Clock size={18} className="text-indigo-600 dark:text-indigo-400"/> Duración (minutos)</span>
                     <span className="text-indigo-600 dark:text-indigo-400 font-mono text-lg">{lobbyDurationMinutes}</span>
                   </div>
                   <input 
                    type="range" min="1" max="15"
                    value={lobbyDurationMinutes}
                    onChange={(e) => setLobbyDurationMinutes(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                   />
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                         <span className="flex items-center gap-2"><Settings size={18} className="text-indigo-600 dark:text-indigo-400"/> Rango de Números</span>
                    </div>
                    <select 
                      value={lobbyNumberRange}
                      onChange={(e) => setLobbyNumberRange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-400 border border-slate-300 dark:border-slate-600 appearance-none"
                    >
                        <option value="0-10">0 - 10 (Fácil)</option>
                        <option value="0-100">0 - 100 (Medio)</option>
                        <option value="0-50-mixed">0 - 50 (Mixto)</option>
                        <option value="0-100-mixed">0 - 100 (Mixto Difícil)</option>
                        <option value="0-100-sum">0 - 100 (Suma)</option>
                        <option value="0-100-sub">0 - 100 (Resta)</option>
                        <option value="0-100-math-mixed">0 - 100 (Mixto Operaciones)</option>
                        <option value="crazy-mode">0 - 100 (MODO LOCO 🔥)</option>
                    </select>
                 </div>

                 <div className="flex items-center justify-between bg-white/50 dark:bg-white/5 p-4 rounded-xl cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5" onClick={() => setHostPlays(!hostPlays)}>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">¿El Host participa?</span>
                    <div className={`w-14 h-8 rounded-full relative transition-colors shadow-inner ${hostPlays ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${hostPlays ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                 </div>
               </div>
               
               <button 
                onClick={startGame}
                className="btn-primary w-full py-6 rounded-2xl flex items-center justify-center gap-4 text-xl tracking-tight group overflow-hidden relative shadow-xl shadow-indigo-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
               >
                 <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></div>
                 <Play size={28} fill="currentColor" className="relative z-10" /> 
                 <span className="relative z-10">INICIAR JUEGO</span>
               </button>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-8 text-center bg-white/50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 border-dashed">
               <div className="w-20 h-20 rounded-full bg-white/50 dark:bg-white/5 flex items-center justify-center mb-6 animate-pulse-slow">
                  <Settings size={40} className="animate-spin text-indigo-500 dark:text-indigo-400" style={{animationDuration: '10s'}} />
               </div>
               <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Preparando</h3>
               <p className="text-base text-slate-500 dark:text-slate-400 max-w-[200px]">El Host está configurando la partida...</p>
             </div>
           )}
           </div>
        </div>
      </div>
    </div>
  );
}
