import { useState, useEffect, useRef } from 'react';
import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc, 
  arrayUnion, arrayRemove, deleteField, serverTimestamp, increment, runTransaction 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { generateRound } from '../lib/frenchNumbers';

export function useGameLogic() {
  // --- User & Auth ---
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');

  // --- Navigation / Inputs ---
  const [gameIdInput, setGameIdInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Game State ---
  const [activeGameId, setActiveGameId] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);

  // --- Lobby Config (Host) ---
  const [lobbyMaxPlayers, setLobbyMaxPlayers] = useState(10);
  const [lobbyDurationMinutes, setLobbyDurationMinutes] = useState(3);
  const [lobbyNumberRange, setLobbyNumberRange] = useState("0-69");
  const [hostPlays, setHostPlays] = useState(true);

  // --- Practice Config ---
  const [practiceConfig, setPracticeConfig] = useState({
      duration: 3,
      infiniteTime: false,
      showCheatSheet: false,
      numberRange: "0-69"
  });

  // --- In-Game Local State ---
  const [timeLeft, setTimeLeft] = useState(0);
  const [localFeedback, setLocalFeedback] = useState(null);
  
  // Refs for timers
  const timerRef = useRef(null);
  const roundTimerRef = useRef(null);

  // 1. Auth Init
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch((err) => console.error("Auth error:", err));
      }
    });
    return () => unsub();
  }, []);

  // 2. Persist Username
  useEffect(() => {
    if(username) localStorage.setItem('batalla_username', username);
  }, [username]);

  // 3. Listen to Active Game (Multiplayer)
  useEffect(() => {
    if (!activeGameId || practiceMode) return;

    const gameRef = doc(db, 'games', activeGameId);
    const unsub = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGameData(data);

        // Sync local timer with server end time if playing
        if (data.status === 'playing' && data.endTime) {
            const end = data.endTime.toDate().getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((end - now) / 1000));
            setTimeLeft(remaining);
        }
      } else {
        setError('La partida ha sido eliminada');
        setActiveGameId(null);
        setGameData(null);
      }
    }, (err) => {
        console.error("Snapshot error:", err);
        setError("Error de conexión con la partida");
    });

    return () => unsub();
  }, [activeGameId, practiceMode]);

  // 4. Timer Logic (Local & Remote Sync)
  useEffect(() => {
    if ((activeGameId || practiceMode) && gameData?.status === 'playing') {
        const interval = setInterval(() => {
            if (practiceMode) {
               // Practice Mode Timer (Local Authority)
               if (!practiceConfig.infiniteTime) {
                   setTimeLeft(prev => {
                       if (prev <= 0) {
                           finishPracticeGame();
                           return 0;
                       }
                       return prev - 1;
                   });
               }
            } else {
               // Multiplayer Timer
               setTimeLeft(prev => Math.max(0, prev - 1));

               // HOST ONLY: Check for Game End
               if (gameData.host === user?.uid && gameData.endTime) {
                   const now = Date.now();
                   const end = gameData.endTime.toDate().getTime();
                   if (now >= end) {
                       const gameRef = doc(db, 'games', activeGameId);
                       updateDoc(gameRef, { status: 'finished' });
                       clearInterval(interval);
                   }
               }
            }
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [activeGameId, practiceMode, gameData?.status, practiceConfig.infiniteTime, user?.uid]);


  // --- ACTIONS ---

  // A. Practice Mode
  const enterPracticeMode = () => {
    setPracticeMode(true);
    setGameData({
        status: 'setup',
        players: { [user.uid]: { name: username, score: 0 } },
        playerList: [user.uid],
        host: user.uid
    });
  };

  const startGame = async () => {
    if (practiceMode) {
        // Init Practice Game
        const initialRound = generateRound(practiceConfig.numberRange);
        setGameData(prev => ({
            ...prev,
            status: 'playing',
            currentRound: initialRound,
            startedAt: Date.now() // For practice local scoring
        }));
        if (!practiceConfig.infiniteTime) {
            setTimeLeft(practiceConfig.duration * 60);
        }
    } else {
        // Start Multiplayer Game (Host Only)
        if (!activeGameId) return;
        try {
            setLoading(true);
            const gameRef = doc(db, 'games', activeGameId);
            
            // Generate Initial Round for everyone
            const initialRound = generateRound(lobbyNumberRange);

            // Calculate End Time
            const endTime = new Date();
            endTime.setMinutes(endTime.getMinutes() + lobbyDurationMinutes);

            await updateDoc(gameRef, {
                status: 'playing',
                startTime: serverTimestamp(),
                endTime: endTime,
                currentRound: initialRound,
                maxPlayers: lobbyMaxPlayers,
                // Save Host Preference & Config
                hostPlays: hostPlays, // Important: Save this!
                config: {
                    range: lobbyNumberRange,
                    duration: lobbyDurationMinutes,
                    hostPlays: hostPlays // Redundant but safe
                }
            });
        } catch (err) {
            console.error(err);
            setError("Error al iniciar la partida");
        } finally {
            setLoading(false);
        }
    }
  };

  // B. Multiplayer Actions
  const createGame = async () => {
    if (!username.trim()) { setError("Ingresa un nombre"); return; }
    setLoading(true);
    try {
        const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const gameRef = doc(db, 'games', newGameId);
        
        await setDoc(gameRef, {
            host: user.uid,
            status: 'lobby',
            createdAt: serverTimestamp(),
            playerList: [user.uid],
            players: {
                [user.uid]: {
                    name: username,
                    score: 0,
                    joinedAt: serverTimestamp()
                }
            },
            config: {
                range: "0-69", // Default
                duration: 3
            }
        });
        
        setActiveGameId(newGameId);
        setPracticeMode(false);
    } catch (err) {
        console.error(err);
        setError("Error al crear la sala");
    } finally {
        setLoading(false);
    }
  };

  const joinGame = async () => {
      if (!gameIdInput.trim() || !username.trim()) return;
      setLoading(true);
      const targetId = gameIdInput.toUpperCase();

      try {
          await runTransaction(db, async (transaction) => {
              const gameRef = doc(db, 'games', targetId);
              const gameDoc = await transaction.get(gameRef);

              if (!gameDoc.exists()) throw "Sala no encontrada";
              
              const data = gameDoc.data();
              if (data.status !== 'lobby') throw "La partida ya ha comenzado";
              if (data.playerList.length >= (data.maxPlayers || 30)) throw "Sala llena";

              transaction.update(gameRef, {
                  playerList: arrayUnion(user.uid),
                  [`players.${user.uid}`]: {
                      name: username,
                      score: 0,
                      joinedAt: serverTimestamp()
                  }
              });
          });

          setActiveGameId(targetId);
          setPracticeMode(false);
      } catch (err) {
          console.error(err);
          setError(typeof err === 'string' ? err : "No se pudo unir a la sala");
      } finally {
          setLoading(false);
      }
  };

  // C. Gameplay Actions
  const handleAnswer = async (selectedVal) => {
      const correct = selectedVal === gameData.currentRound.targetVal;
      
      const now = Date.now();
      const qStart = gameData.currentRound?.generatedAt || (now - 2000); 
      const timeTakenSec = Math.max(0, (now - qStart) / 1000);

      let points = 0;
      let potentialPoints = 0;

      // Unified Scoring Logic
      if (timeTakenSec > 3) {
          potentialPoints = 200;
      } else {
          potentialPoints = Math.floor(500 * Math.exp(-0.3 * timeTakenSec));
          potentialPoints = Math.max(200, potentialPoints); 
      }

      if (correct) {
          points = potentialPoints;
      } else {
           // Penalty: Half of what you WOULD have gotten
           points = -Math.floor(potentialPoints / 2);
      }

      // Feedback UI
      setLocalFeedback({ val: correct ? `+${points}` : `${points}`, type: correct ? 'good' : 'bad' });
      setTimeout(() => setLocalFeedback(null), 1000);

      const nextRound = generateRound(practiceMode ? practiceConfig.numberRange : (gameData?.config?.range || lobbyNumberRange));
      nextRound.generatedAt = Date.now();

      if (practiceMode) {
          setGameData(prev => {
              const newState = {
                  ...prev,
                  players: {
                      ...prev.players,
                      [user.uid]: {
                          ...prev.players[user.uid],
                          score: (prev.players[user.uid].score || 0) + points
                      }
                  }
              };
              if (correct) {
                  newState.currentRound = nextRound;
              }
              return newState;
          });
      } else {
          const gameRef = doc(db, 'games', activeGameId);
          const updates = {
              [`players.${user.uid}.score`]: increment(points)
          };
          if (correct) {
              updates.playersLastCorrect = user.uid;
              updates.currentRound = nextRound;
          }
          try {
             await updateDoc(gameRef, updates);
          } catch(e) {
             console.error("Error updating score", e);
          }
      }
  };

  const finishPracticeGame = () => {
     setGameData(prev => ({...prev, status: 'finished'}));
  };

  const exitGame = async () => {
      // Multiplayer cleanup: Remove user from playerList
      if (!practiceMode && activeGameId && user) {
          try {
              const gameRef = doc(db, 'games', activeGameId);
              // Optimistic local cleanup first
              setActiveGameId(null);
              setGameData(null);
              
              // Backend cleanup
              await updateDoc(gameRef, {
                  playerList: arrayRemove(user.uid),
                  [`players.${user.uid}`]: deleteField()
              });
          } catch(err) {
              console.error("Error leaving game:", err);
          }
      }
      
      // Local State Reset
      setActiveGameId(null);
      setGameData(null);
      setPracticeMode(false);
      setTimeLeft(0);
      setGameIdInput('');
  };

  const copyCode = () => {
      navigator.clipboard.writeText(activeGameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return {
    user,
    username, setUsername,
    loading, error,
    
    // Modes
    activeGameId, setActiveGameId,
    practiceMode,
    gameData,

    // Inputs
    gameIdInput, setGameIdInput,
    
    // Configs
    lobbyMaxPlayers, setLobbyMaxPlayers,
    lobbyDurationMinutes, setLobbyDurationMinutes,
    lobbyNumberRange, setLobbyNumberRange,
    hostPlays, setHostPlays,
    practiceConfig, setPracticeConfig,

    // Actions
    createGame,
    joinGame,
    enterPracticeMode,
    startGame,
    handleAnswer,
    exitGame,
    copyCode,
    
    // State
    timeLeft,
    formatTime: (s) => {
        if (s === undefined || s === null) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    },
    localFeedback,
    copied
  };
}
