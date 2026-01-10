import React from 'react';
import { Clock, BookOpen, Layers, Play, ArrowLeft, ChevronDown } from 'lucide-react';

export default function PracticeSetupScreen({
  onStart,
  onBack,
  duration,
  setDuration,
  infiniteTime,
  setInfiniteTime,
  showCheatSheet,
  setShowCheatSheet,
  numberRange,
  setNumberRange
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="glass-card w-full max-w-2xl p-8 relative z-10 animate-slide-up">
            <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300">
                    <ArrowLeft size={24}/>
                </button>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Modo Práctica</h2>
                    <p className="text-indigo-200">Personaliza tu sesión de entrenamiento</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Duration Setting */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-200 font-bold">
                            <Clock className="text-emerald-400"/>
                            <span>Tiempo de Práctica</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className={`text-sm font-medium ${infiniteTime ? 'text-emerald-400' : 'text-slate-500'}`}>Sin Límite</span>
                             <button 
                                onClick={() => setInfiniteTime(!infiniteTime)}
                                className={`w-12 h-7 rounded-full relative transition-colors ${infiniteTime ? 'bg-emerald-500' : 'bg-slate-600'}`}
                             >
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${infiniteTime ? 'translate-x-5' : 'translate-x-0'}`}></div>
                             </button>
                        </div>
                    </div>
                    
                    <div className={`transition-all duration-300 ${infiniteTime ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                         <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
                            <span>1 min</span>
                            <span className="text-white">{duration} min</span>
                            <span>15 min</span>
                         </div>
                         <input 
                            type="range" min="1" max="15" 
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                         />
                    </div>
                </div>

                {/* Range Selection */}
                <div className="space-y-2">
                     <div className="flex justify-between text-sm font-bold text-slate-300 mb-1">
                          <span className="flex items-center gap-2"><Layers size={18} className="text-purple-400"/> Rango de Números</span>
                     </div>
                     <div className="relative">
                       <select 
                         value={numberRange}
                         onChange={(e) => setNumberRange(e.target.value)}
                         className="w-full bg-slate-800 text-white rounded-lg pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-purple-400 border border-slate-600 appearance-none cursor-pointer"
                       >
                           <option value="0-10">0 - 10 (Principiante)</option>
                           <option value="0-20">0 - 20 (Básico)</option>
                           <option value="0-50">0 - 50 (Intermedio)</option>
                           <option value="0-69">0 - 69 (Normal)</option>
                           <option value="0-100">0 - 100 (Experto)</option>
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                     </div>
                     <p className="text-xs text-slate-400 pl-1">Selecciona la dificultad de los números.</p>
                </div>

                {/* Extras */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-slate-200 font-bold flex items-center gap-3">
                         Extras
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                         <div 
                            onClick={() => setShowCheatSheet(!showCheatSheet)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${showCheatSheet ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-black/20 border-white/5 hover:bg-black/30'}`}
                         >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${showCheatSheet ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                <BookOpen size={20}/>
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold ${showCheatSheet ? 'text-white' : 'text-slate-300'}`}>Panel de Referencia</h4>
                                <p className="text-xs text-slate-400">Muestra una guía visual de los números durante el juego.</p>
                            </div>
                            {showCheatSheet && <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>}
                         </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button 
                        onClick={onStart}
                        className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-xl tracking-tight group overflow-hidden relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-t border-white/20 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)]"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Play size={24} fill="currentColor" /> COMENZAR PRÁCTICA
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}
