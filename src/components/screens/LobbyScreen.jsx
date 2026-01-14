import { Users, Clock, CheckCircle, Play, Settings, Copy, ArrowLeft, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
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
  toggleTeamMode,
  switchTeam,
  chaosMode,
  setChaosMode,
  chaosFrequency,
  setChaosFrequency,
  addBot,
  removeBot,
  onBack
}) {
  const isHost = gameData.host === user.uid;
  const connectedCount = gameData.playerList.length;

  // Determine display max players based on role
  const displayMaxPlayers = isHost ? lobbyMaxPlayers : (gameData.maxPlayers || lobbyMaxPlayers);

  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="h-screen relative flex flex-col items-center justify-start lg:justify-center p-4 lg:p-4 pt-10 lg:pt-4 overflow-y-auto lg:overflow-hidden transition-colors">
      {/* Settings Toggle */}
      <div className="absolute top-6 right-6 z-50 flex gap-2">
        <ThemeToggle />
      </div>

      {/* Game Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 relative animate-scale-in">
            <button 
              onClick={() => setShowSettings(false)} 
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Settings className="text-indigo-500" size={24} />
              Ajustes de Partida
            </h3>
            
            <div className="space-y-4">
               <div>
                   <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                       <span className="flex items-center gap-2">Rango de Números</span>
                  </div>
                  <select 
                    value={lobbyNumberRange}
                    onChange={(e) => setLobbyNumberRange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 border border-slate-300 dark:border-slate-600 appearance-none transition-all"
                  >
                      <option value="0-10">0 - 10 (Fácil)</option>
                      <option value="0-100">0 - 100 (Medio)</option>
                      <option value="0-50-mixed">0 - 50 (Mixto)</option>
                      <option value="0-100-mixed">0 - 100 (Mixto Difícil)</option>
                      <option value="0-100-sum">0 - 100 (Suma)</option>
                      <option value="0-100-sub">0 - 100 (Resta)</option>
                      <option value="0-100-math-mixed">0 - 100 (Mixto Operaciones)</option>
                      <option value="crazy-mode">0 - 100 (MODO LOCO 🔥)</option>
                      <option value="hot-potato">LA BOMBA (Hot Potato 💣)</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-1">
                    Selecciona la dificultad y el tipo de operaciones para la partida.
                  </p>
               </div>

               {/* Team Mode Toggle inside Modal */}
               <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between cursor-pointer group" onClick={toggleTeamMode}>
                     <div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                           <Users size={18} className="text-indigo-500"/>
                           Juego en Equipos
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                           Divide a los jugadores en equipos Rojo y Azul.
                        </div>
                     </div>
                     <div className={`w-12 h-7 rounded-full relative transition-colors shadow-inner ${gameData.teamMode ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${gameData.teamMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                  </div>
               </div>

               {/* Chaos Mode Settings */}
               <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between cursor-pointer group mb-4" onClick={() => setChaosMode(!chaosMode)}>
                     <div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                           <span className="text-amber-500">⚡</span>
                           Modo Caos Global
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                           Eventos aleatorios para todos los jugadores.
                        </div>
                     </div>
                     <div className={`w-12 h-7 rounded-full relative transition-colors shadow-inner ${chaosMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${chaosMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                  </div>

                  {chaosMode && (
                      <div className="space-y-2 animate-fade-in-down">
                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                             <span>Frecuencia de Eventos</span>
                             <span className="text-amber-600 dark:text-amber-400">{chaosFrequency} seg</span>
                        </div>
                        <input 
                            type="range" min="10" max="60" step="5"
                            value={chaosFrequency}
                            onChange={(e) => setChaosFrequency(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                        />
                      </div>
                  )}
               </div>

               {/* Bot Controls (Moved to Settings) */}
               <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Agregar Bots</label>
                  <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => addBot('easy')} className="flex flex-col items-center gap-1 p-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors">
                          <span className="text-lg">🤖</span>
                          <span className="text-[10px] font-bold">Fácil</span>
                      </button>
                      <button onClick={() => addBot('medium')} className="flex flex-col items-center gap-1 p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded-lg transition-colors">
                          <span className="text-lg">🤖</span>
                          <span className="text-[10px] font-bold">Medio</span>
                      </button>
                      <button onClick={() => addBot('hard')} className="flex flex-col items-center gap-1 p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 rounded-lg transition-colors">
                          <span className="text-lg">🤖</span>
                          <span className="text-[10px] font-bold">Difícil</span>
                      </button>
                  </div>
               </div> 

               <button
                 onClick={() => setShowSettings(false)}
                 className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
               >
                 Guardar Cambios
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Abstract BG */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-6xl glass-card relative z-10 flex flex-col lg:grid lg:grid-cols-12 h-[85vh] max-h-[800px] overflow-hidden animate-slide-up bg-white/60 dark:bg-black/40 shadow-2xl backdrop-blur-xl">
        
        {/* Mobile Header (Visible only on mobile) */}
        <div className="order-0 lg:hidden flex items-center justify-between p-6 pb-0 shrink-0 w-full animate-fade-in-down z-20">
             <div className="flex items-center gap-4">
                {onBack && (
                  <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors" title="Salir">
                      <ArrowLeft className="text-slate-600 dark:text-indigo-300" size={24}/>
                  </button>
                )}
                <div>
                   <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Sala de Espera</h2>
                   <p className="text-indigo-600 dark:text-indigo-300 text-xs font-medium ml-1">{connectedCount} / {displayMaxPlayers} Jugadores</p>
                </div>
             </div>
             <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold rounded-full border border-indigo-200 dark:border-indigo-500/30">
               EN ESPERA
             </div>
        </div>

        {/* Left Panel: Players (SCROLLABLE) */}
        <div className="order-2 lg:order-none lg:col-span-7 flex flex-col h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 p-6 md:p-8">
          <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/10 shrink-0">
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
             {gameData.teamMode && (
                 <div className="px-4 py-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold rounded-full border border-purple-200 dark:border-purple-500/30">
                    MODO EQUIPOS
                 </div>
             )}
             {!gameData.teamMode && (
                <div className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-500/30">
                    EN ESPERA
                </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 h-0 min-h-0">
             {gameData.teamMode ? (
                 <div className="grid grid-cols-2 gap-4 h-full">
                     {/* Red Team */}
                     <div className="flex flex-col gap-2 p-2 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                         <h3 className="text-center font-black text-red-500 uppercase tracking-widest text-sm mb-2">Equipo Rojo</h3>
                         {gameData.playerList.filter(pid => (hostPlays || pid !== gameData.host) && (gameData.players[pid]?.team === 'red' || !gameData.players[pid]?.team)).map(pid => (
                             <div key={pid} onClick={() => pid === user.uid && switchTeam()} className={`p-3 rounded-lg flex items-center gap-2 bg-white dark:bg-slate-800 border-l-4 border-red-500 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform`}>
                                 <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                                     {gameData.players[pid]?.photoURL ? <img src={gameData.players[pid].photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-xs">{gameData.players[pid]?.name?.charAt(0)}</div>}
                                 </div>
                                 <span className="text-xs font-bold truncate dark:text-white">{gameData.players[pid]?.name}</span>
                             </div>
                         ))}
                     </div>

                     {/* Blue Team */}
                     <div className="flex flex-col gap-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                         <h3 className="text-center font-black text-blue-500 uppercase tracking-widest text-sm mb-2">Equipo Azul</h3>
                         {gameData.playerList.filter(pid => (hostPlays || pid !== gameData.host) && gameData.players[pid]?.team === 'blue').map(pid => (
                             <div key={pid} onClick={() => pid === user.uid && switchTeam()} className={`p-3 rounded-lg flex items-center gap-2 bg-white dark:bg-slate-800 border-l-4 border-blue-500 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform`}>
                                 <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                                     {gameData.players[pid]?.photoURL ? <img src={gameData.players[pid].photoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-xs">{gameData.players[pid]?.name?.charAt(0)}</div>}
                                 </div>
                                 <span className="text-xs font-bold truncate dark:text-white">{gameData.players[pid]?.name}</span>
                             </div>
                         ))}
                     </div>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        {isHost && gameData.players[pid]?.isBot && (
                             <button 
                                onClick={(e) => { e.stopPropagation(); removeBot(pid); }}
                                className="ml-auto p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                                title="Eliminar Bot"
                             >
                                <X size={14} />
                             </button>
                        )}
                      </div>
                    ))}
                    {/* Dynamic placeholder generation - Adjust count calculations */}
                    {Array.from({ length: Math.max(0, displayMaxPlayers - (hostPlays ? connectedCount : connectedCount - 1)) }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-4 rounded-xl border border-slate-200 dark:border-white/5 border-dashed flex items-center justify-center text-slate-400 dark:text-white/10 text-sm h-full">
                        <span className="select-none">Esperando...</span>
                      </div>
                    ))}
                 </div>
             )}
          </div>
        </div>

        {/* Right Panel: Settings & Code (FIXED) */}
        <div className="order-1 lg:order-none lg:col-span-5 flex flex-col gap-6 p-6 md:p-8 bg-slate-50/50 dark:bg-black/20 h-auto lg:h-full overflow-y-auto shrink-0 border-b lg:border-b-0 border-slate-200 dark:border-white/10">
          
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
                     <button 
                       onClick={() => setShowSettings(true)}
                       className="w-full flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-xl transition-all group"
                     >
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform">
                              <Settings size={20} />
                           </div>
                           <div className="text-left">
                              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Ajustes de Partida</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Rango de números y dificultad</div>
                           </div>
                        </div>
                        <ChevronDown size={18} className="text-slate-400 dark:text-slate-500 -rotate-90 group-hover:translate-x-1 transition-transform" />
                     </button>
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
