import React, { useState } from 'react';
import { User, Loader2, MoveUp, BarChart3 } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

export default function LoginScreen({ 
  username, 
  setUsername, 
  loading, 
  error, 
  createGame, 
  joinGame, 
  gameIdInput, 
  setGameIdInput,
  enterPracticeMode,
  loginWithGoogle,
  loginWithApple,
  registerUsername,
  needsUsername,
  logout,
  isGoogleUser,
  user,
  userStats
}) {
  // Stats state
  const [showStats, setShowStats] = useState(false);

  if (needsUsername) {
     return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
             <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
             <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-2xl rounded-3xl max-w-md w-full p-8 md:p-12 relative z-10 animate-pop-in text-center">
                 <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-2">¡Casi listo!</h2>
                 <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">Has iniciado con Google. Ahora elige un nombre de usuario único para identificarte en la arena.</p>

                 <div className="relative mb-6">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 dark:text-indigo-300" size={20} />
                    <input 
                        type="text" 
                        placeholder="Nombre único..." 
                        className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white pl-12 pr-4 py-4 w-full rounded-2xl font-bold transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={20}
                    />
                 </div>

                 <button 
                    onClick={() => registerUsername(username)}
                    disabled={loading === 'register' || !username.trim()}
                    className="w-full btn-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mb-3 disabled:opacity-50 disabled:scale-100"
                 >
                    {loading === 'register' ? <Loader2 className="animate-spin"/> : "Confirmar Registro"}
                 </button>
                 
                 <button 
                    onClick={logout}
                    className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                 >
                    Cancelar / Cerrar Sesión
                 </button>
                 
                 {error && <p className="mt-4 text-red-500 text-sm bg-red-100 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}
             </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Settings/Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/30 rounded-full blur-[100px] animate-float" style={{animationDelay: '-3s'}}></div>
      
      <div className="bg-white/90 dark:bg-[#1A1825]/95 backdrop-blur-2xl border border-white/60 dark:border-white/5 shadow-2xl rounded-3xl max-w-md w-full p-8 md:p-12 relative z-10 animate-pop-in">
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-600 dark:from-white dark:via-purple-200 dark:to-indigo-300 drop-shadow-sm">
            L'Arène
          </h1>
          <h2 className="text-2xl md:text-3xl font-light text-indigo-500 dark:text-indigo-200/80 tracking-widest uppercase">
            des Nombres
          </h2>
          <p className="text-[10px] text-indigo-400/50 dark:text-indigo-300/40 font-mono tracking-widest mt-2 uppercase">
            La Arena de los Números
          </p>
        </div>
        
        <div className="space-y-6 mb-8">
            {/* Name Input - Always Visible */}
            <div className="relative group">
               {/* Icon / Avatar - STATIC NOW */}
               {isGoogleUser && user?.photoURL ? (
                   <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                        <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover shadow-sm" />
                   </div>
               ) : (
                   <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 dark:text-indigo-300 pointer-events-none z-10" size={20} />
               )}

              <input 
                type="text" 
                placeholder="Elige tu nombre..." 
                className={`border text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isGoogleUser ? 'pl-20 cursor-default pointer-events-none select-none' : 'pl-12'} pr-4 py-4 w-full rounded-2xl font-bold transition-all outline-none ${
                    isGoogleUser 
                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10'
                }`}
                value={username}
                onChange={(e) => !isGoogleUser && setUsername(e.target.value)}
                maxLength={20}
                readOnly={isGoogleUser}
                tabIndex={isGoogleUser ? -1 : 0}
              />
              {isGoogleUser && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600/50 dark:text-emerald-400/50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
              )}
            </div>

            {/* Social Logins - Hide if logged in */}
            {!isGoogleUser && (
                <div className="mt-4 flex flex-col gap-2">
                     <button 
                         onClick={loginWithGoogle}
                         disabled={loading && loading !== 'google'}
                         className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-white text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm border border-slate-200 disabled:opacity-50 disabled:scale-100"
                     >
                         {loading === 'google' ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600"/> : (
                             <>
                             <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                             <span>Iniciar con Google</span>
                             </>
                         )}
                     </button>
                </div>
            )}
            {isGoogleUser && (
                 <div className="flex gap-2 mt-2">
                     <button 
                         onClick={() => setShowStats(true)}
                         className="flex-1 text-xs font-bold text-indigo-500 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center justify-center gap-2 transition-colors px-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-900/30"
                     >
                         <BarChart3 size={16} />
                         <span>Estadísticas</span>
                     </button>
                     <button 
                         onClick={logout}
                         className="flex-1 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 transition-colors px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/30"
                     >
                         <span>Cerrar Sesión</span>
                     </button>
                 </div>
             )}
          </div>

          {/* Game Controls - Block Multiplayer if Guest */}
          <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => enterPracticeMode(username)}
                disabled={!username.trim()}
                className="py-4 rounded-2xl flex flex-col items-center justify-center gap-1 text-sm transition-all active:scale-95 bg-white dark:bg-emerald-500/10 border-2 border-emerald-500/30 hover:border-emerald-500 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 disabled:opacity-50 disabled:grayscale"
             >
                <div className="font-bold">MODO PRÁCTICA</div>
                <div className="text-[10px] opacity-70">Un solo jugador</div>
             </button>
             <button 
                onClick={createGame} 
                disabled={loading === 'create' || !username.trim()}
                className="btn-primary py-4 rounded-2xl flex flex-col items-center justify-center gap-1 text-sm disabled:opacity-50 disabled:scale-100"
             >
                {loading === 'create' ? <Loader2 className="animate-spin"/> : (
                    <>
                    <div className="font-bold flex items-center gap-1">
                        PARTIDA GRUPAL
                    </div>
                    <div className="text-[10px] opacity-70">Multijugador</div>
                    </>
                )}
             </button>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/10"></div></div>
            <div className="relative flex justify-center"><span className="px-4 text-sm text-indigo-500 dark:text-indigo-300 bg-white/50 dark:bg-[#1e1b4b]/80 backdrop-blur rounded-full">o únete a una existente</span></div>
          </div>

          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="CÓDIGO" 
              className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-mono text-xl tracking-widest rounded-2xl flex-1 uppercase py-4 outline-none transition-all"
              value={gameIdInput}
              onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button 
              onClick={joinGame} 
              disabled={loading === 'join' || !username.trim() || !gameIdInput}
              className="px-6 rounded-2xl shadow-lg transition-all active:scale-95 bg-white dark:bg-emerald-500/10 border-2 border-emerald-500/30 hover:border-emerald-500 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 disabled:opacity-50 disabled:scale-100 disabled:grayscale"
            >
              {loading === 'join' ? <Loader2 className="animate-spin" size={24}/> : <MoveUp className="rotate-90" size={24} strokeWidth={3} />}
            </button>
          </div>
          {error && <p className="text-red-500 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-900/20 py-2 rounded-lg border border-red-500/20 animate-pulse">{error}</p>}

        </div>

        {/* Stats Modal */}
        {showStats && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#1A1825] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/20 relative animate-in zoom-in-95 duration-200">
                    <button 
                        onClick={() => setShowStats(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                            <BarChart3 size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">Estadísticas</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Tu progreso en la arena</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">
                                {userStats?.totalScore?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Puntos Totales
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                                {userStats?.gamesPlayed?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Partidas
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Promedio por juego</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                            {userStats?.gamesPlayed > 0 
                                ? Math.round(userStats.totalScore / userStats.gamesPlayed).toLocaleString() 
                                : 0} pts
                        </span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
