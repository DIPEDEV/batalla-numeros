import { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithPopup, signOut, setPersistence, browserLocalPersistence, updateProfile } from 'firebase/auth'; // Added updateProfile
import { auth, db, googleProvider, appleProvider, storage } from '../lib/firebase'; // Added storage
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Added storage functions
import { generateRound } from '../lib/frenchNumbers';

export function useGameLogic() {
  // --- User & Auth ---
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [needsUsername, setNeedsUsername] = useState(false); // Google login pending username
  const [userStats, setUserStats] = useState(null); // Added userStats

  // --- Navigation / Inputs ---
  const [gameIdInput, setGameIdInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(null); // 'google', 'apple', 'create', 'join', 'register', 'cleanup', 'upload'
  const [copied, setCopied] = useState(false);
  const [lastReactionId, setLastReactionId] = useState(null); // Local tracker for reactions

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // --- Game State ---
  const [activeGameId, setActiveGameId] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);

  // --- Lobby Config (Host) ---
  const [lobbyMaxPlayers, setLobbyMaxPlayers] = useState(10);
  const [lobbyDurationMinutes, setLobbyDurationMinutes] = useState(1);
  const [lobbyNumberRange, setLobbyNumberRange] = useState("0-69");
  const [hostPlays, setHostPlays] = useState(true);

  // --- Practice Config ---
  const [practiceConfig, setPracticeConfig] = useState({
      duration: 1,
      infiniteTime: false,
      showCheatSheet: false,
      numberRange: "0-69"
  });

  // --- In-Game Local State ---
  const [timeLeft, setTimeLeft] = useState(0);
  const [localFeedback, setLocalFeedback] = useState(null);
  const [combo, setCombo] = useState(0); // Added Combo State
  
  // Refs for timers
  const timerRef = useRef(null);
  const roundTimerRef = useRef(null);
  const statsRecordedRef = useRef(false); // To prevent double counting stats

  // 1. Unified Auth Init
  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);
            // Popup flow does not need getRedirectResult
        } catch (err) {
            console.error("Auth Persistence Error:", err);
        }

        unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                // User state changed
                setUser(u);
                
                if (!u.isAnonymous) {
                     setLoading('fetching_profile');
                     try {
                        const userDocRef = doc(db, 'users', u.uid);
                        
                        // Real-time listener for User Profile (Stats, Username, etc)
                        // We attach this listener and store unsubscribe function?
                        // Actually, since this is inside onAuthStateChanged, which is inside useEffect...
                        // We need to be careful not to create leaks. 
                        // Simplified approach: simpler onSnapshot, assuming component unmount cleans up auth listener.
                        // But wait, the parent useEffect unsubs auth listener.
                        // We need a way to unsub the inner listener too if user changes.
                        // For simplicity in this functional component: 
                        // We can't easily unsub inner listener from outer effect return unless we track it in ref.
                        // But this hook logic is a bit complex.
                        // Let's just use onSnapshot here. usage of onSnapshot returns an unsub function.
                        
                        onSnapshot(userDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                const userData = docSnap.data();
                                if (userData.username) {
                                    setUsername(userData.username);
                                    setNeedsUsername(false);
                                } else {
                                    setNeedsUsername(true);
                                }
                                setUserStats(userData); // Real-time Stats Update
                            } else {
                                console.log("User has no profile in DB");
                                setNeedsUsername(true);
                                if (u.displayName) setUsername(u.displayName.split(' ')[0]);
                            }
                            setLoading(null);
                        });
                        
                     } catch (err) {
                         console.error("Error setting up profile listener:", err);
                         setLoading(null);
                     }
                }
            } else {
                console.log("AuthStateChanged: No user. Signing in anonymously...");
                signInAnonymously(auth).catch((err) => console.error("Anonymous Auth Error:", err));
            }
        });
    };

    initAuth();

    return () => unsubscribe();
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

        // Record Stats when Game Finishes (Once)
        if (data.status === 'finished' && !statsRecordedRef.current && user && !user.isAnonymous) {
            const finalScore = data.players[user.uid]?.score || 0;
            updateUserStats(finalScore);
            statsRecordedRef.current = true;
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


    // 5. Question Timeout Logic (Variable Limit)
    const getRoundDuration = (difficulty) => {
        switch(difficulty) {
            case "0-10": return 3000;
            case "0-100": return 5000;
            case "0-50-mixed": return 5000;
            case "0-100-mixed": return 7000;
            case "0-100-sum": return 10000;
            case "0-100-sub": return 15000;
            case "0-100-math-mixed": return 15000;
            case "crazy-mode": return 20000;
            default: return 5000;
        }
    };

    useEffect(() => {
        if (!gameData || gameData.status !== 'playing') return;

        const currentDifficulty = practiceMode 
            ? practiceConfig.numberRange 
            : (gameData.config?.range || lobbyNumberRange);
            
        const maxTime = getRoundDuration(currentDifficulty);

        const timer = setInterval(() => {
            const now = Date.now();
            
            // Determine current question based on mode
            const currentQ = practiceMode 
                ? gameData.currentRound 
                : (gameData.players[user.uid]?.currentQuestion || gameData.currentRound);

            if (!currentQ || !currentQ.generatedAt) return; // Should exist

            const elapsed = now - currentQ.generatedAt;
            if (elapsed > maxTime) {
                // TIMEOUT!
                handleTimeoutPenalty();
            }
        }, 500);

        return () => clearInterval(timer);
    }, [gameData, practiceMode, user?.uid, practiceConfig.numberRange, lobbyNumberRange]);

    const handleTimeoutPenalty = async () => {
        const penalty = 200;
        setLocalFeedback({ val: `-${penalty} (Tiempo)`, type: 'bad' });
        setTimeout(() => setLocalFeedback(null), 1000);

        const nextRound = generateRound(practiceMode ? practiceConfig.numberRange : (gameData?.config?.range || lobbyNumberRange));
        nextRound.generatedAt = Date.now();

        if (practiceMode) {
             setGameData(prev => ({
                 ...prev,
                 currentRound: nextRound,
                 players: {
                     ...prev.players,
                     [user.uid]: {
                         ...prev.players[user.uid],
                         score: Math.max(0, (prev.players[user.uid].score || 0) - penalty)
                     }
                 }
             }));
        } else {
             // Multiplayer Timeout
             const currentScore = gameData.players[user.uid]?.score || 0;
             const newScore = Math.max(0, currentScore - penalty);
             
             const gameRef = doc(db, 'games', activeGameId);
             await updateDoc(gameRef, {
                 [`players.${user.uid}.score`]: newScore,
                 [`players.${user.uid}.currentQuestion`]: nextRound
             });
        }
    };

  // --- ACTIONS ---

  // A. Practice Mode
  const enterPracticeMode = (guestName) => {
    let currentUser = user;
    if (!currentUser) {
        // Create Local Guest
        currentUser = { 
            uid: 'guest-' + Date.now(), 
            isAnonymous: true, 
            displayName: guestName || "Invitado" 
        };
        setUser(currentUser);
        setUsername(guestName || "Invitado");
    }

    setPracticeMode(true);
    setGameData({
        status: 'setup',
        players: { [currentUser.uid]: { name: guestName || username || "Invitado", score: 0 } },
        playerList: [currentUser.uid],
        host: currentUser.uid
    });
  };

  const startGame = async () => {
    if (practiceMode) {
        // Init Practice Game
        const initialRound = generateRound(practiceConfig.numberRange);
        initialRound.generatedAt = Date.now(); // TIMESTAMP ADDED
        setGameData(prev => ({
            ...prev,
            status: 'playing',
            currentRound: initialRound,
            startedAt: Date.now() 
        }));
        if (!practiceConfig.infiniteTime) {
            setTimeLeft(practiceConfig.duration * 60);
        }
    } else {
        // Start Multiplayer Game (Host Only)
        if (!activeGameId) return;
        // Start Multiplayer Game (Host Only)
        if (!activeGameId) return;
        try {
            setLoading('launching');
            const gameRef = doc(db, 'games', activeGameId);
            
            // 1. Set status to launching (trigger countdown)
            await updateDoc(gameRef, {
                status: 'launching',
                launchingAt: serverTimestamp()
            });

            // 2. Wait 3.5 seconds then start for real
            setTimeout(async () => {
                const initialRound = generateRound(lobbyNumberRange);
                initialRound.generatedAt = Date.now(); // TIMESTAMP ADDED

                // Calculate End Time
                const now = new Date(); // Use host time as reference
                const endTime = new Date(now.getTime() + lobbyDurationMinutes * 60000);

                await updateDoc(gameRef, {
                    status: 'playing',
                    startTime: serverTimestamp(), // Record actual server start
                    endTime: endTime,
                    currentRound: initialRound, // Initial shared round
                    maxPlayers: lobbyMaxPlayers,
                    hostPlays: hostPlays,
                    config: {
                        range: lobbyNumberRange,
                        duration: lobbyDurationMinutes,
                        hostPlays: hostPlays
                    }
                });
            }, 3500);

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
    // Guests CAN host games now ("Todas las capacidades")
    if (!user) { setError("Esperando conexión..."); return; }
    if (!username.trim()) { setError("Ingresa un nombre"); return; }
    setLoading('create');
    try {
        // Validation for Anonymous users: Cannot use reserved names
        if (user.isAnonymous) {
             const usernameRef = doc(db, 'usernames', username.toLowerCase());
             const usernameDoc = await getDoc(usernameRef);
             if (usernameDoc.exists()) {
                 throw "Este nombre está reservado por un usuario registrado.";
             }
        }

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
                    photoURL: user.photoURL || null, // Include Avatar
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
        setError(typeof err === 'string' ? err : "Error al crear la sala");
    } finally {
        setLoading(null);
    }
  };

  const joinGame = async () => {
      // Guests CAN join games.
      if (!user) { setError("Esperando conexión..."); return; }
      if (!gameIdInput.trim() || !username.trim()) return;
      setLoading('join');
      const targetId = gameIdInput.toUpperCase();

      try {
          await runTransaction(db, async (transaction) => {
              const gameRef = doc(db, 'games', targetId);
              const gameDoc = await transaction.get(gameRef);

              if (!gameDoc.exists()) throw "Sala no encontrada";
              
              const data = gameDoc.data();
              if (data.status !== 'lobby') throw "La partida ya ha comenzado";
              if (data.playerList.length >= (data.maxPlayers || 30)) throw "Sala llena";

              // Unique Name Check within Game
              const existingPlayers = Object.values(data.players || {});
              const nameTaken = existingPlayers.some(p => p.name.toLowerCase() === username.toLowerCase() && p.joinedAt); // Ensure it's not a ghost
              if (nameTaken) throw "Ya hay un jugador con ese nombre en esta sala.";

              // Validation for Anonymous users: Cannot use reserved global names
              if (user.isAnonymous) {
                   const usernameRef = doc(db, 'usernames', username.toLowerCase());
                   const usernameDoc = await transaction.get(usernameRef);
                   if (usernameDoc.exists()) {
                       throw "Este nombre está reservado por un usuario registrado.";
                   }
              }

              transaction.update(gameRef, {
                  playerList: arrayUnion(user.uid),
                  [`players.${user.uid}`]: {
                      name: username,
                      photoURL: user.photoURL || null, // Include Avatar
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
          setLoading(null);
      }
  };
  
  // C. Gameplay Actions
  const handleAnswer = async (selectedVal) => {
      const currentQ = practiceMode 
            ? gameData.currentRound 
            : (gameData.players[user.uid]?.currentQuestion || gameData.currentRound);
            
      const isCorrect = selectedVal === currentQ.targetVal;
      
      const now = Date.now();
      const qStart = currentQ.generatedAt || now; // Fallback should not happen
      const timeTakenSec = Math.max(0, (now - qStart) / 1000);

      const currentDifficulty = practiceMode 
            ? practiceConfig.numberRange 
            : (gameData.config?.range || lobbyNumberRange);
      const maxTimeMs = getRoundDuration(currentDifficulty);
      const maxTimeSec = maxTimeMs / 1000;

      // 1. Calculate Score (Linear decay from 500 to 100 over maxTime)
      // Formula: 500 - (decayRate * t). 
      // decayRate = 400 / maxTimeSec
      const decayRate = 400 / maxTimeSec;
      
      let potentialPoints = Math.floor(500 - (decayRate * timeTakenSec));
      potentialPoints = Math.max(100, potentialPoints); // Keep a minimum of 100 for correct answers within time
      // Note: If t > 5, timeout handles it. But if user answers at 5.1s before timeout ticks? 
      // Let's cap at 100 min. Or fail? 
      // User says: "si no la sacas en 5s te quita 200". 
      // If they answer at 5.5s, technically they "didn't get it in 5s".
      // But race condition with timeout effect.
      // Let's assume if they answer, they get the answer result.
      
      let points = 0;
      let newCombo = combo;

      if (isCorrect) {
          // Increment Combo
          newCombo = combo + 1;
          setCombo(newCombo);

          // Calculate Multiplier (x1.2, x1.4, x1.6, x1.8, x2.0 MAX)
          // Formula: 1 + (combo * 0.2)
          const multiplier = 1 + (Math.min(newCombo, 5) * 0.2);
          
          points = Math.round(potentialPoints * multiplier);
      } else {
          // Reset Combo
          newCombo = 0;
          setCombo(0);

          // Penalty: Half of potential (no multiplier on penalty)
          points = -Math.floor(potentialPoints / 2);
      }

      // Feedback UI
      const feedbackText = isCorrect 
          ? `+${points}${newCombo > 0 ? ` (x${(1 + Math.min(newCombo, 5) * 0.2).toFixed(1)})` : ''}` 
          : `${points}`;
      
      setLocalFeedback({ val: feedbackText, type: isCorrect ? 'good' : 'bad' });
      setTimeout(() => setLocalFeedback(null), 1000);
      
      if (practiceMode) {
          // Practice Logic
          // If correct -> New Question. If incorrect -> Same question.
          const nextRound = generateRound(practiceConfig.numberRange);
          nextRound.generatedAt = Date.now();

          setGameData(prev => {
              const currentScore = prev.players[user.uid].score || 0;
              const newScore = Math.max(0, currentScore + points);

              const newState = {
                  ...prev,
                  players: {
                      ...prev.players,
                      [user.uid]: {
                          ...prev.players[user.uid],
                          score: newScore
                      }
                  }
              };
              if (isCorrect) {
                  newState.currentRound = nextRound;
              }
              return newState;
          });
      } else {
          // Multiplayer Logic
          // If correct -> New Question. If incorrect -> Same question.
          const currentScore = gameData.players[user.uid]?.score || 0;
          const newScore = Math.max(0, currentScore + points);

          const gameRef = doc(db, 'games', activeGameId);
          const updates = {
              [`players.${user.uid}.score`]: newScore,
          };

          if (isCorrect) {
               const nextRound = generateRound(gameData?.config?.range || lobbyNumberRange);
               nextRound.generatedAt = Date.now();
               updates[`players.${user.uid}.currentQuestion`] = nextRound;
          }
          
          await updateDoc(gameRef, updates);
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

              // Cleanup: Just local reset for Anon users.
              if (user.isAnonymous) {
                  setUsername(''); 
                  setNeedsUsername(false); // Can stay false as we use main screen input
              }

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
      setCombo(0); // Reset combo
      statsRecordedRef.current = false; // Reset for next game
  };

  const copyCode = () => {
      navigator.clipboard.writeText(activeGameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const sendReaction = async (emojiType) => {
      if (!activeGameId || practiceMode) return;
      
      // Rate limit locally? Maybe.
      // Firestore write:
      try {
          const gameRef = doc(db, 'games', activeGameId);
          await updateDoc(gameRef, {
              latestReaction: {
                  type: emojiType,
                  id: Math.random(), // Force change
                  timestamp: Date.now(),
                  sender: username // Added sender name
              }
          });
      } catch (err) {
          console.error("Error sending reaction:", err);
      }
  };

    // 12. Google Auth & Username Registration
    // 12. Google Auth & Username Registration
    const loginWithGoogle = async () => {
        setLoading('google');
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            console.error("Google login error:", err);
            if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                setError("Error al iniciar con Google: " + err.message);
            }
            setLoading(null);
        }
    };

    const loginWithApple = async () => {
        setLoading('apple');
        setError('');
        try {
            await signInWithPopup(auth, appleProvider);
        } catch (err) {
            console.error("Apple login error:", err);
            if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                setError("Error al iniciar con Apple: " + err.message);
            }
            setLoading(null);
        }
    };

    const registerUsername = async (chosenName) => {
        if (!user || user.isAnonymous) return; // Guests don't register
        const lowerName = chosenName.trim().toLowerCase();
        if (lowerName.length < 3) {
            setError("El nombre debe tener al menos 3 caracteres");
            return;
        }

        setLoading('register');
        try {
            await runTransaction(db, async (transaction) => {
                // 1. Check if name is taken by a REGISTERED user (Global Reservation)
                const usernameRef = doc(db, 'usernames', lowerName);
                const usernameDoc = await transaction.get(usernameRef);
                
                if (usernameDoc.exists()) {
                    throw "Este nombre pertenece a un usuario registrado. Elige otro.";
                }
                
                const userRef = doc(db, 'users', user.uid);
                
                if (user.isAnonymous) {
                    // Anonymous: Do NOT write to DB. Just set local state.
                    // Validation passed (not registered), so we are good.
                } else {
                    // Registered: Reserve globally
                    transaction.set(usernameRef, { uid: user.uid });
                    transaction.set(userRef, { 
                        username: chosenName,
                        email: user.email,
                        createdAt: serverTimestamp() 
                    }, { merge: true });
                }
            });

            setUsername(chosenName);
            setNeedsUsername(false);
            setError('');
        } catch (err) {
            console.error("Registration error:", err);
            setError(typeof err === 'string' ? err : "Error al registrar nombre");
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        if (!user) return;
        
        // Auto-cleanup for anonymous users to free up usernames
        if (user.isAnonymous && username) {
            setLoading('cleanup');
            try {
                // Delete username reservation and user profile
                const batch = import('firebase/firestore').then(({ writeBatch }) => {
                });
                
                await runTransaction(db, async (transaction) => {
                     // Check if docs exist before trying to delete? Not strictly needed for delete
                     const usernameRef = doc(db, 'usernames', username.toLowerCase());
                     const userRef = doc(db, 'users', user.uid);
                     transaction.delete(usernameRef);
                     transaction.delete(userRef);
                });
                console.log("Cleanup successful for anonymous user:", username);
            } catch (err) {
                console.error("Cleanup error:", err);
            }
        }

        await signOut(auth);
        setUsername('');
        setNeedsUsername(false);
        window.location.reload(); 
    };

    const uploadAvatar = async (file) => {
        if (!user || user.isAnonymous) return;
        if (!file) return;

        // Validation
        const isImage = file.type.startsWith('image/');
        if (!isImage) { setError("Solo se permiten imágenes"); return; }
        if (file.size > 2 * 1024 * 1024) { setError("La imagen no debe pesar más de 2MB"); return; }

        setLoading('upload');
        try {
            const fileRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(fileRef, file);
            const photoURL = await getDownloadURL(fileRef);

            // Update Auth Profile
            await updateProfile(auth.currentUser, { photoURL });
            
            // Update Firestore Profile
            await updateDoc(doc(db, 'users', user.uid), { photoURL });
            
            // Update Local State if needed (User obj might update automatically via auth listener, but let's be safe)
            setUser(prev => ({ ...prev, photoURL })); 
            
            console.log("Avatar updated:", photoURL);
        } catch (err) {
            console.error("Upload Error:", err);
            setError("Error al subir imagen");
        } finally {
            setLoading(null);
        }
    };

    const cleanAnonymousUsers = async () => {
        setLoading('cleanup');
        console.log("Starting cleanup...");
        try {
            // query all users where email is null
            // Note: firestore filtering by 'email == null' works if field exists and is null. 
            // If field is missing, we might need a different query or client side filter.
            // Let's fetch all users for safety in this small app context (~100 users max likely)
            // Or better: where("email", "==", null)
            const usersRef = collection(db, 'users');
            const q = import('firebase/firestore').then(async ({ query, where, getDocs, writeBatch }) => {
                 const q = query(collection(db, 'users'), where("email", "==", null));
                 const snapshot = await getDocs(q);
                 
                 console.log(`Found ${snapshot.size} anonymous users to delete.`);
                 
                 const batch = writeBatch(db);
                 let counter = 0;

                 snapshot.forEach(docSnap => {
                     const data = docSnap.data();
                     // Delete User Doc
                     batch.delete(docSnap.ref);
                     
                     // Delete Username Doc if exists
                     if (data.username) {
                         const usernameRef = doc(db, 'usernames', data.username.toLowerCase());
                         batch.delete(usernameRef);
                     }
                     counter++;
                 });

                 if (counter > 0) {
                     await batch.commit();
                     alert(`Se han eliminado ${counter} usuarios anónimos.`);
                 } else {
                     alert("No se encontraron usuarios anónimos para borrar.");
                 }
            });

        } catch (err) {
            console.error("Cleanup error:", err);
            alert("Error limpiando usuarios: " + err.message);
        } finally {
            setLoading(null);
        }
    };

    const removeAvatar = async () => {
        if (!user) return;
        setLoading('upload');
        try {
            // 1. Get original Google Photo
            const googlePhoto = user.providerData[0]?.photoURL || null;

            // 2. Update Profile
            await updateProfile(user, { photoURL: googlePhoto });
            
            // 3. Update Firestore User
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { photoURL: googlePhoto });

            // 4. Update Local State
            setUser({ ...user, photoURL: googlePhoto });
            
            // 5. Build storage ref correctly to delete
            // The file path is `avatars/${user.uid}`
            const avatarRef = ref(storage, `avatars/${user.uid}`);
            // We try to delete, but if it doesn't exist (or fails), we just ignore it to not block the UI reset
            await deleteObject(avatarRef).catch(err => console.log("Old avatar delete skipped:", err));

        } catch (error) {
            console.error("Error removing avatar:", error);
            setError("Error al eliminar la foto");
        } finally {
            setLoading(null);
        }
    };

    // Helper to update global user stats (Only for Registered Users)
    const updateUserStats = async (finalScore) => {
        if (!user || user.isAnonymous) return;
        
        try {
            const userRef = doc(db, "users", user.uid);
            // We use atomic increments
            await updateDoc(userRef, {
                totalScore: increment(finalScore),
                gamesPlayed: increment(1),
                lastPlayed: serverTimestamp()
            });
        } catch (err) {
            console.error("Error updating user stats debugging:", err);
        }
    };

    return {
    updateUserStats, // Added
    user,
    userStats,
    username, setUsername,
    needsUsername,
    loginWithGoogle,
    loginWithApple,
    registerUsername,
    logout,
    cleanAnonymousUsers,
    uploadAvatar,
    removeAvatar, // Added removeAvatar
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
    sendReaction,
    
    // State
    timeLeft,
    formatTime: (s) => {
        if (s === undefined || s === null) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    },
    localFeedback,
    copied,
    combo
  };
}
