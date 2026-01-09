import React, { useState, useEffect, useMemo } from 'react';
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
import { Play, Users, Copy, CheckCircle, Crown, Loader2, AlertCircle } from 'lucide-react';

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

// --- DATOS DEL JUEGO (DICCIONARIO FRANCÉS) ---
const FRENCH_NUMBERS = [
  { val: 1, text: "Un" }, { val: 2, text: "Deux" }, { val: 3, text: "Trois" }, 
  { val: 4, text: "Quatre" }, { val: 5, text: "Cinq" }, { val: 6, text: "Six" }, 
  { val: 7, text: "Sept" }, { val: 8, text: "Huit" }, { val: 9, text: "Neuf" }, 
  { val: 10, text: "Dix" }, { val: 11, text: "Onze" }, { val: 12, text: "Douze" }, 
  { val: 13, text: "Treize" }, { val: 14, text: "Quatorze" }, { val: 15, text: "Quinze" }, 
  { val: 16, text: "Seize" }, { val: 17, text: "Dix-sept" }, { val: 18, text: "Dix-huit" }, 
  { val: 19, text: "Dix-neuf" }, { val: 20, text: "Vingt" }, { val: 21, text: "Vingt et un" },
  { val: 30, text: "Trente" }, { val: 32, text: "Trente-deux" },
  { val: 40, text: "Quarante" }, { val: 45, text: "Quarante-cinq" },
  { val: 50, text: "Cinquante" }, { val: 55, text: "Cinquante-cinq" },
  { val: 60, text: "Soixante" }, { val: 69, text: "Soixante-neuf" },
  { val: 70, text: "Soixante-dix" }, { val: 71, text: "Soixante et onze" }, 
  { val: 75, text: "Soixante-quinze" }, { val: 80, text: "Quatre-vingts" }, 
  { val: 81, text: "Quatre-vingt-un" }, { val: 90, text: "Quatre-vingt-dix" }, 
  { val: 91, text: "Quatre-vingt-onze" }, { val: 99, text: "Quatre-vingt-dix-neuf" }, 
  { val: 100, text: "Cent" }
];

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
  const [gameIdInput, setGameIdInput] = useState('');
  const [activeGameId, setActiveGameId] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

    // Ruta: artifacts/{appId}/public/data/games/{gameId}
    // Usamos 'public' para que cualquiera con el ID pueda unirse
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', activeGameId);
    
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameData(snapshot.data());
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

  // --- ACCIONES DEL JUEGO ---

  const createGame = async () => {
    if (!user) return;
    setLoading(true);
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialRound = generateRound();
    
    const newGameData = {
      status: 'waiting', // waiting, playing, finished
      host: user.uid,
      players: {
        [user.uid]: { score: 0, name: "Jugador 1 (Host)" }
      },
      playerList: [user.uid],
      round: 1,
      currentQuestion: initialRound,
      winner: null,
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
    setLoading(true);
    const idToJoin = gameIdInput.toUpperCase();
    
    try {
      // Nota: En Firestore real, primero leemos, luego escribimos.
      // Aquí confiamos en el onSnapshot, pero para unirse necesitamos actualizar.
      const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', idToJoin);
      
      // Actualizamos directamente para unirnos
      await updateDoc(gameRef, {
        [`players.${user.uid}`]: { score: 0, name: "Jugador 2" },
        playerList: arrayUnion(user.uid),
        status: 'playing' // Al unirse el segundo, empieza el juego
      });
      
      setActiveGameId(idToJoin);
    } catch (e) {
      console.error(e);
      setError("No se pudo unir a la partida. Verifica el código.");
    }
    setLoading(false);
  };

  const handleAnswer = async (selectedVal) => {
    if (!gameData || gameData.status !== 'playing') return;
    
    const isCorrect = selectedVal === gameData.currentQuestion.targetVal;

    if (isCorrect) {
      // Lógica de victoria de ronda
      const myScore = (gameData.players[user.uid]?.score || 0) + 1;
      const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', activeGameId);
      
      let updates = {
        [`players.${user.uid}.score`]: increment(1)
      };

      if (myScore >= 10) {
        updates.status = 'finished';
        updates.winner = user.uid;
      } else {
        updates.currentQuestion = generateRound(); // Nueva pregunta para ambos
      }

      await updateDoc(gameRef, updates);
    } else {
      // Penalización opcional o simplemente nada (aquí no hacemos nada si fallas, solo esperas)
    }
  };

  const resetGame = async () => {
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', activeGameId);
    await updateDoc(gameRef, {
      status: 'playing',
      currentQuestion: generateRound(),
      winner: null,
      [`players.${gameData.playerList[0]}.score`]: 0,
      [`players.${gameData.playerList[1]}.score`]: 0
    });
  };

  const copyCode = () => {
    // Usamos un método más compatible con iframes y navegadores antiguos
    const textArea = document.createElement("textarea");
    textArea.value = activeGameId;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('No se pudo copiar', err);
    }
    
    document.body.removeChild(textArea);
  };

  // --- VISTAS ---

  // 1. Pantalla de Carga Inicial
  if (!user) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <Loader2 className="animate-spin h-8 w-8 mr-2" />
      <span className="text-xl">Connectant au serveur...</span>
    </div>
  );

  // 2. Menú Principal
  if (!activeGameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-white/20 text-center">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">
            <span className="text-blue-400">Bataille</span> de Nombres
          </h1>
          <p className="text-slate-300 mb-8">Aprende números en francés compitiendo.</p>
          
          <div className="space-y-4">
            <button 
              onClick={createGame} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
            >
              {loading ? <Loader2 className="animate-spin"/> : <Play size={20} />}
              Crear Partida Nueva
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
                disabled={loading || !gameIdInput}
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

  // 3. Sala de Espera
  if (gameData && gameData.status === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-slate-300">Sala de Espera</h2>
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mb-6">
            <p className="text-sm text-slate-400 mb-2">Comparte este código con tu amigo:</p>
            <div 
              onClick={copyCode}
              className="text-5xl font-mono font-black text-blue-400 tracking-widest cursor-pointer hover:text-blue-300 transition-colors flex items-center justify-center gap-3"
            >
              {activeGameId}
              {copied ? <CheckCircle className="text-green-500" size={24}/> : <Copy size={24} className="opacity-50"/>}
            </div>
            {copied && <p className="text-green-500 text-xs mt-2">¡Copiado al portapapeles!</p>}
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400 animate-pulse">
            <Users size={20} />
            Esperando al Jugador 2...
          </div>
        </div>
      </div>
    );
  }

  // 4. Pantalla de Juego
  if (gameData && gameData.status === 'playing') {
    const isMyTurn = true; // En este juego ambos juegan a la vez
    const myScore = gameData.players[user.uid]?.score || 0;
    const opponentId = gameData.playerList.find(id => id !== user.uid);
    const opponentScore = opponentId ? (gameData.players[opponentId]?.score || 0) : 0;

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col text-white">
        {/* Header / Scoreboard */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center shadow-lg z-10">
          <div className="flex flex-col items-center w-1/3">
            <span className="text-xs text-blue-400 font-bold tracking-wider">TÚ</span>
            <span className="text-3xl font-black">{myScore}</span>
          </div>
          <div className="bg-slate-900 px-4 py-1 rounded-full text-xs font-mono text-slate-500 border border-slate-700">
            PRIMERO A 10
          </div>
          <div className="flex flex-col items-center w-1/3">
            <span className="text-xs text-red-400 font-bold tracking-wider">RIVAL</span>
            <span className="text-3xl font-black">{opponentScore}</span>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Fondo decorativo (Bandera sutil) */}
          <div className="absolute inset-0 flex opacity-5 pointer-events-none">
            <div className="w-1/3 h-full bg-blue-500"></div>
            <div className="w-1/3 h-full bg-white"></div>
            <div className="w-1/3 h-full bg-red-500"></div>
          </div>

          <div className="relative z-10 w-full max-w-lg">
            <div className="mb-12 text-center">
              <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">Traduce al número</p>
              <h2 className="text-5xl md:text-6xl font-black text-white drop-shadow-2xl transition-all duration-300 transform scale-100">
                {gameData.currentQuestion.targetText}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {gameData.currentQuestion.options.map((option) => (
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
        </div>
      </div>
    );
  }

  // 5. Pantalla de Resultados
  if (gameData && gameData.status === 'finished') {
    const iWon = gameData.winner === user.uid;
    
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className={`text-center p-10 rounded-3xl max-w-md w-full shadow-2xl ${iWon ? 'bg-gradient-to-b from-yellow-500/20 to-slate-900 border border-yellow-500/30' : 'bg-slate-800 border border-slate-700'}`}>
          {iWon ? (
            <>
              <Crown className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-4xl font-black text-white mb-2">¡VICTORIA!</h2>
              <p className="text-yellow-200 mb-8">Eres un maestro del francés.</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">😔</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Derrota</h2>
              <p className="text-slate-400 mb-8">¡Buen intento! Sigue practicando.</p>
            </>
          )}

          <div className="flex gap-3 justify-center">
            <button 
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
            >
              Jugar de nuevo
            </button>
            <button 
              onClick={() => setActiveGameId(null)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}