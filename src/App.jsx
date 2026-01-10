import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  increment,
  arrayUnion 
} from 'firebase/firestore';
import { Play, Users, Copy, CheckCircle, Crown, Loader2, AlertCircle, Settings, Clock, User, LogOut, Monitor } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE Y GLOBALES ---
const firebaseConfig = {
  apiKey: "AIzaSyD-kxFKykKUu5rILZXC6mZojdjfO3s7H1M",
  authDomain: "numeros-frances.firebaseapp.com",
  projectId: "numeros-frances",
  storageBucket: "numeros-frances.firebasestorage.app",
  messagingSenderId: "41447800575",
  appId: "1:41447800575:web:d379900c000a4ef15f56ca",
  measurementId: "G-H4NGZN6HML"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- GENERADOR DE NÚMEROS (21 - 69) ---
const FRENCH_NUMBERS = (() => {
  const numbers = [];
  const tens = { 2: "Vingt", 3: "Trente", 4: "Quarante", 5: "Cinquante", 6: "Soixante" };
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];

  for (let i = 21; i <= 69; i++) {
    const ten = Math.floor(i / 10); // Obtiene la decena (2, 3, 4...)
    const unit = i % 10;            // Obtiene la unidad (0, 1, 2...)
    let text = tens[ten];

    if (unit === 0) {
      // Caso 30, 40, 50, 60: Se queda solo el nombre de la decena
    } else if (unit === 1) {
      // Caso 21, 31, 41...: Se agrega " et un"
      text += " et un";
    } else {
      // Otros casos: Se agrega guión, ej: "Vingt-deux"
      text += `-${units[unit]}`;
    }
    numbers.push({ val: i, text: text });
  }
  return numbers;
})();

// Generador de preguntas aleatorias
const generateRound = () => {
  const target = FRENCH_NUMBERS[Math.floor(Math.random() * FRENCH_NUMBERS.length)];
  let options = [target];
  while (options.length < 4) {
    const random = FRENCH_NUMBERS[Math.floor(Math.random() * FRENCH_NUMBERS.length)];
    if (!options.find(o => o.val === random.val)) {
      options.push(random);
    }
  }
  // Mezclar opciones
  options = options.sort(() => Math.random() - 0.5);
  return {
    targetVal: target.val,
    targetText: target.text,
    options: options.map(o => o.val)
  };
};

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(''); // Nombre de usuario
  const [gameIdInput, setGameIdInput] = useState('');
  const [activeGameId, setActiveGameId] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Lobby Settings (Only for Host)
  const [lobbyMaxPlayers, setLobbyMaxPlayers] = useState(30);
  const [lobbyDurationMinutes, setLobbyDurationMinutes] = useState(3); // Default 3 mins
  const [hostPlays, setHostPlays] = useState(true); // ¿El host juega?

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);

  // 1. Inicialización y Autenticación
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
        setError("Error de conexión. Intenta recargar.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 2. Sincronización con Firestore (Juego Activo)
  useEffect(() => {
    if (!user || !activeGameId) return;

    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', activeGameId);
    
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGameData(data);

        // Sync Timer if playing
        if (data.status === 'playing' && data.startedAt && data.gameDuration) {
           const elapsed = (Date.now() - data.startedAt) / 1000;
           const remaining = Math.max(0, data.gameDuration - elapsed);
           setTimeLeft(remaining);
        }
      } else {
        setError("La partida no existe o ha terminado.");
        setActiveGameId(null);
      }
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Error sincronizando el juego.");
    });

    return () => unsubscribe();
  }, [user, activeGameId]);

  // 3. Timer Effect
  useEffect(() => {
    let interval;
    if (gameData && gameData.status === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - gameData.startedAt) / 1000;
        const remaining = Math.max(0, gameData.gameDuration - elapsed);
        
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameData, timeLeft]);

  // Handle Game End when time is 0 (Host triggers DB update)
  useEffect(() => {
    if (timeLeft === 0 && gameData?.status === 'playing' && gameData?.host === user?.uid) {
       const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', activeGameId);
       updateDoc(gameRef, { status: 'finished' });
    }
  }, [timeLeft, gameData, user, activeGameId]);


  // --- ACCIONES DEL JUEGO ---

  const createGame = async () => {
    if (!user) return;
    if (!username.trim()) {
      setError("Por favor ingresa un nombre.");
      return;
    }
    setLoading(true);
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // El host siempre se crea, pero luego decidimos si es espectador
    const newGameData = {
      status: 'lobby',
      host: user.uid,
      players: {
        [user.uid]: { 
          score: 0, 
          name: username, 
          currentQuestion: null,
          lastQuestionTime: Date.now()
        }
      },
      playerList: [user.uid],
      maxPlayers: 30,
      gameDuration: 180, // Default 3 mins
      hostPlays: true, // Default
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', newGameId), newGameData);
      setActiveGameId(newGameId);
    } catch (e) {
      setError("No se pudo crear la partida.");
    }
    setLoading(false);
  };

  const joinGame = async () => {
    if (!user || !gameIdInput) return;
    if (!username.trim()) {
      setError("Por favor ingresa un nombre.");
      return;
    }
    setLoading(true);
    const idToJoin = gameIdInput.toUpperCase();
    
    try {
      const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', idToJoin);
      
      await updateDoc(gameRef, {
        [`players.${user.uid}`]: { 
          score: 0, 
          name: username,
          currentQuestion: null,
          lastQuestionTime: Date.now()
        },
        playerList: arrayUnion(user.uid)
      });
      
      setActiveGameId(idToJoin);
    } catch (e) {
      console.error(e);
      setError("No se pudo unir a la partida. Verifica el código.");
    }
    setLoading(false);
  };

  const startGame = async () => {
    if (!user || !gameData || gameData.host !== user.uid) return;
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', activeGameId);
    
    const durationSec = lobbyDurationMinutes * 60;

    const updates = {
      status: 'playing',
      maxPlayers: lobbyMaxPlayers,
      gameDuration: durationSec,
      hostPlays: hostPlays,
      startedAt: Date.now()
    };
    
    // Init questions for PLAYERS only
    gameData.playerList.forEach(pid => {
      // If host is NOT playing and this ID is the host, SKIP generating question
      if (!hostPlays && pid === gameData.host) {
        updates[`players.${pid}.score`] = 0; // Just reset
        updates[`players.${pid}.status`] = 'spectator';
        return;
      }

      updates[`players.${pid}.currentQuestion`] = generateRound();
      updates[`players.${pid}.lastQuestionTime`] = Date.now();
      updates[`players.${pid}.score`] = 0;
    });

    await updateDoc(gameRef, updates);
  };

  const handleAnswer = async (selectedVal) => {
    if (!gameData || gameData.status !== 'playing') return;
    
    const playerData = gameData.players[user.uid];
    if (!playerData || !playerData.currentQuestion) return;

    const isCorrect = selectedVal === playerData.currentQuestion.targetVal;

    if (isCorrect) {
      const now = Date.now();
      const timeTaken = (now - (playerData.lastQuestionTime || now)) / 1000;
      
      // Scoring: Base 100 + Bonus
      let timeBonus = 0;
      if (timeTaken < 10) {
        timeBonus = Math.floor(50 * (1 - (timeTaken / 10)));
      }
      const points = 100 + timeBonus;

      const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', activeGameId);
      
      await updateDoc(gameRef, {
        [`players.${user.uid}.score`]: increment(points),
        [`players.${user.uid}.currentQuestion`]: generateRound(),
        [`players.${user.uid}.lastQuestionTime`]: now
      });
    }
  };

  const copyCode = () => {
    const textArea = document.createElement("textarea");
    textArea.value = activeGameId;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      if (document.execCommand('copy')) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {}
    document.body.removeChild(textArea);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- VISTAS ---

  // 1. Loading
  if (!user) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <Loader2 className="animate-spin h-8 w-8 mr-2" />
      <span className="text-xl">Conectando...</span>
    </div>
  );

  // 2. Menú Principal
  if (!activeGameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-white/20 text-center">
          <h1 className="text-4xl font-black text-white mb-6 tracking-tighter">
            <span className="text-blue-400">Bataille</span> de Nombres
          </h1>
          
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Nombre de Usuario" 
                className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={15}
              />
            </div>

            <button 
              onClick={createGame} 
              disabled={loading || !username.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin"/> : <Play size={20} />}
              Crear Partida
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-900/50 text-slate-400 rounded">O únete a una</span></div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="CÓDIGO" 
                className="bg-slate-800 border border-slate-700 text-white text-center font-mono text-lg rounded-xl flex-1 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button 
                onClick={joinGame} 
                disabled={loading || !username.trim() || !gameIdInput}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Entrar
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2 flex items-center justify-center gap-1"><AlertCircle size={14}/> {error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // 3. Sala de Espera / Lobby
  if (gameData && (gameData.status === 'lobby' || gameData.status === 'waiting')) {
    const isHost = gameData.host === user.uid;
    const connectedCount = gameData.playerList.length;

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-2xl w-full flex flex-col md:flex-row gap-8">
          
          <div className="flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-700 pb-8 md:pb-0 md:pr-8">
            <h2 className="text-2xl font-bold mb-4 text-slate-300">Sala de Espera</h2>
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mb-6 w-full">
              <p className="text-sm text-slate-400 mb-2">Comparte este código:</p>
              <div 
                onClick={copyCode}
                className="text-5xl font-mono font-black text-blue-400 tracking-widest cursor-pointer hover:text-blue-300 transition-colors flex items-center justify-center gap-3"
              >
                {activeGameId}
                {copied ? <CheckCircle className="text-green-500" size={24}/> : <Copy size={24} className="opacity-50"/>}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-400 animate-pulse mb-4">
              <Users size={20} />
              {connectedCount} / {gameData.maxPlayers || lobbyMaxPlayers} Jugadores
            </div>
            
            <div className="w-full max-h-40 overflow-y-auto bg-slate-900 p-2 rounded text-left space-y-1">
              {gameData.playerList.map(pid => (
                <div key={pid} className="flex items-center gap-2 text-sm text-slate-300">
                  <div className={`w-2 h-2 rounded-full ${pid === gameData.host ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  {gameData.players[pid]?.name || 'Jugador'} {pid === user.uid ? '(Tú)' : ''}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
             {isHost ? (
               <div className="space-y-6">
                 <div>
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2">
                     <Users size={16}/> Máx Jugadores ({lobbyMaxPlayers})
                   </label>
                   <input 
                    type="range" 
                    min="2" max="30"
                    value={lobbyMaxPlayers}
                    onChange={(e) => setLobbyMaxPlayers(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                   />
                 </div>
                 <div>
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2">
                     <Clock size={16}/> Duración ({lobbyDurationMinutes} min)
                   </label>
                   <input 
                    type="range" 
                    min="1" max="10"
                    value={lobbyDurationMinutes}
                    onChange={(e) => setLobbyDurationMinutes(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                   />
                 </div>

                 <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex items-center gap-3 cursor-pointer" onClick={() => setHostPlays(!hostPlays)}>
                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${hostPlays ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`}>
                        {hostPlays && <CheckCircle size={16} className="text-white"/>}
                    </div>
                    <span className="text-sm select-none">¿El host juega?</span>
                 </div>
                 
                 <button 
                  onClick={startGame}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/50 flex items-center justify-center gap-2 transition-transform hover:scale-105"
                 >
                   <Play size={20}/> INICIAR JUEGO
                 </button>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-500">
                 <Settings size={48} className="mb-4 opacity-20"/>
                 <p>Esperando al host...</p>
               </div>
             )}
          </div>

        </div>
      </div>
    );
  }

  // 4. Pantalla de Juego
  if (gameData && gameData.status === 'playing') {
    const isHost = gameData.host === user.uid;
    const isSpectator = isHost && !gameData.hostPlays;
    
    // Leaderboard Data
    // Filter out spectator host if needed, or include them with 0 score
    const sortedPlayers = Object.entries(gameData.players)
      .filter(([id, p]) => {
          // If host is spectator, maybe don't show them in leaderboard, or show them at bottom?
          // Usually spectators aren't on leaderboard.
          if (!gameData.hostPlays && id === gameData.host) return false;
          return true;
      })
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => b.score - a.score);

    // --- MODO ESPECTADOR (SOLO HOST) ---
    if (isSpectator) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col text-white overflow-hidden p-6">
           {/* Big Header */}
           <div className="flex items-center justify-between mb-8">
              <div className={`px-8 py-4 rounded-2xl text-5xl font-mono font-black border-2 ${timeLeft < 10 ? 'text-red-500 border-red-500 bg-red-900/20 animate-pulse' : 'text-white border-slate-700 bg-slate-800'}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="w-32"></div> {/* Spacer */}
           </div>

           {/* Centered Big Leaderboard */}
           <div className="flex-1 flex max-w-4xl mx-auto w-full bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex-col">
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-center">
                 <Crown className="text-yellow-500 mr-3 w-8 h-8"/>
                 <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-300">Top Mejores</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                 {sortedPlayers.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">Esperando jugadores...</div>
                 ) : (
                   sortedPlayers.map((p, index) => (
                    <div 
                      key={p.id} 
                      className="p-4 rounded-xl flex items-center justify-between bg-slate-900 border border-slate-800 transform transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-6">
                        <span className={`text-2xl font-mono font-bold w-12 h-12 flex items-center justify-center rounded-lg ${index === 0 ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
                          {index + 1}
                        </span>
                        <span className="text-2xl font-bold text-white">
                            {p.name}
                        </span>
                      </div>
                      <span className="font-black text-3xl text-blue-400">{p.score}</span>
                    </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      );
    }

    // --- MODO JUGADOR ---
    const playerData = gameData.players[user.uid];
    const myScore = playerData?.score || 0;
    const myCurrentQ = playerData?.currentQuestion;

    return (
      <div className="min-h-screen bg-slate-900 flex text-white overflow-hidden">
        
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col relative">
          
          <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center shadow-lg z-10">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-blue-400 font-bold tracking-wider">PUNTOS</span>
                <span className="text-3xl font-black">{myScore}</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-xl font-mono border ${timeLeft < 10 ? 'text-red-500 border-red-500 bg-red-900/20 animate-pulse' : 'text-slate-300 border-slate-700 bg-slate-900'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
             <div className="absolute inset-0 flex opacity-5 pointer-events-none">
              <div className="w-1/3 h-full bg-blue-500"></div>
              <div className="w-1/3 h-full bg-white"></div>
              <div className="w-1/3 h-full bg-red-500"></div>
            </div>

            {myCurrentQ ? (
              <div className="relative z-10 w-full max-w-lg">
                <div className="mb-12 text-center">
                  <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">Traduce el número</p>
                  <h2 className="text-5xl md:text-6xl font-black text-white drop-shadow-2xl">
                    {myCurrentQ.targetText}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {myCurrentQ.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className="bg-white text-slate-900 hover:bg-blue-500 hover:text-white hover:scale-105 active:scale-95 transition-all duration-150 font-bold text-3xl md:text-4xl py-8 rounded-2xl shadow-xl border-b-4 border-slate-300 hover:border-blue-700"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Loader2 className="animate-spin w-12 h-12 mx-auto mb-4 text-blue-500"/>
                <p>Cargando pregunta...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Leaderboard */}
        <div className="w-72 bg-slate-950 border-l border-slate-800 flex flex-col z-20 shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-bold text-slate-300 flex items-center gap-2">
              <Crown size={18} className="text-yellow-500"/> Tabla de Puntos
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-20">
            {sortedPlayers.map((p, index) => (
              <div 
                key={p.id} 
                className={`p-3 rounded-xl flex items-center justify-between transition-all ${p.id === user.uid ? 'bg-blue-900/40 border border-blue-500/50 shadow-blue-900/20 shadow-lg scale-[1.02]' : 'bg-slate-900 border border-slate-800'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className={`text-sm font-mono font-bold w-6 h-6 flex items-center justify-center rounded-md ${index === 0 ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    {index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold truncate max-w-[120px] ${p.id === user.uid ? 'text-white' : 'text-slate-300'}`} title={p.name}>
                        {p.name}
                    </span>
                  </div>
                </div>
                <span className="font-black text-3xl bg-slate-950 px-2 py-1 rounded text-slate-400 scale-75 origin-right">{p.score}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // 5. Pantalla de Resultados
  if (gameData && gameData.status === 'finished') {
    const sortedPlayers = Object.entries(gameData.players)
       .filter(([id, p]) => {
          if (!gameData.hostPlays && id === gameData.host) return false;
          return true;
      })
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => b.score - a.score);
    
    // If I'm spectator host, different view
    const isSpectator = !gameData.hostPlays && gameData.host === user.uid;
    const myRank = isSpectator ? null : sortedPlayers.findIndex(p => p.id === user.uid) + 1;
    const isWinner = myRank === 1;

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className={`text-center p-10 rounded-3xl max-w-md w-full shadow-2xl ${isWinner ? 'bg-gradient-to-b from-yellow-500/20 to-slate-900 border border-yellow-500/30' : 'bg-slate-800 border border-slate-700'}`}>
          
          {isSpectator ? (
             <>
               <Monitor className="w-16 h-16 text-blue-400 mx-auto mb-4"/>
               <h2 className="text-3xl font-bold text-white mb-2">Partida Finalizada</h2>
             </>
          ) : isWinner ? (
            <>
              <Crown className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-4xl font-black text-white mb-2">¡VICTORIA!</h2>
              <p className="text-yellow-200 mb-8">Eres un maestro del francés.</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4 text-slate-500 font-mono">
                #{myRank}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Juego Terminado</h2>
            </>
          )}

          <div className="bg-slate-900/50 rounded-xl p-4 mb-8 max-h-60 overflow-y-auto">
             {sortedPlayers.map((p, index) => (
               <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                 <span className={`${index === 0 ? 'text-yellow-400 font-bold' : 'text-slate-300'}`}>#{index+1} {p.name}</span>
                 <span className="font-mono">{p.score} pts</span>
               </div>
             ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => setActiveGameId(null)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              <LogOut size={20} className="inline mr-2"/>
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}