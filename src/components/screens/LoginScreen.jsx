import React from 'react';
import { User, Loader2, MoveUp } from 'lucide-react';

export default function LoginScreen({ 
  username, 
  setUsername, 
  loading, 
  error, 
  createGame, 
  joinGame, 
  gameIdInput, 
  setGameIdInput,
  enterPracticeMode // New prop
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/30 rounded-full blur-[100px] animate-float" style={{animationDelay: '-3s'}}></div>
      
      <div className="glass-card max-w-md w-full p-8 md:p-12 relative z-10 animate-pop-in">
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white via-pink-200 to-indigo-200 drop-shadow-sm">
            L'Arène
          </h1>
          <h2 className="text-2xl md:text-3xl font-light text-indigo-200 tracking-widest uppercase">
            des Nombres
          </h2>
          <p className="text-[10px] text-indigo-300/30 font-mono tracking-widest mt-2 uppercase">
            La Arena de los Números
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="group">
            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 ml-1">Tu Nombre</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-300 group-focus-within:text-white transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Ej. Diego" 
                className="glass-input pl-12 pr-4 py-4 w-full rounded-2xl font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={15}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={enterPracticeMode}
                className="btn-secondary py-4 rounded-2xl flex flex-col items-center justify-center gap-1 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30"
             >
                <div className="font-bold">MODO PRÁCTICA</div>
                <div className="text-[10px] opacity-70">Un solo jugador</div>
             </button>
             <button 
                onClick={createGame} 
                disabled={loading || !username.trim()}
                className="btn-primary py-4 rounded-2xl flex flex-col items-center justify-center gap-1 text-sm disabled:opacity-50 disabled:scale-100"
             >
                {loading ? <Loader2 className="animate-spin"/> : (
                    <>
                    <div className="font-bold">PARTIDA GRUPAL</div>
                    <div className="text-[10px] opacity-70">Multijugador</div>
                    </>
                )}
             </button>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center"><span className="px-4 text-sm text-indigo-300 bg-[#1e1b4b]/80 backdrop-blur rounded-full">o únete a una existente</span></div>
          </div>

          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="CÓDIGO" 
              className="glass-input text-center font-mono text-xl tracking-widest rounded-2xl flex-1 uppercase py-4"
              value={gameIdInput}
              onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button 
              onClick={joinGame} 
              disabled={loading || !username.trim() || !gameIdInput}
              className="btn-secondary px-6 rounded-2xl shadow-lg shadow-emerald-900/20 bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300 disabled:opacity-50 disabled:scale-100"
            >
              <MoveUp className="rotate-90" size={24} strokeWidth={3} />
            </button>
          </div>
          {error && <p className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg border border-red-500/20 animate-pulse">{error}</p>}
        </div>
      </div>
    </div>
  );
}
