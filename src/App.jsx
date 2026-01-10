import React from 'react';
import { Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameLogic } from './hooks/useGameLogic';
import LoginScreen from './components/screens/LoginScreen';
import LobbyScreen from './components/screens/LobbyScreen';
import GameScreen from './components/screens/GameScreen';
import ResultsScreen from './components/screens/ResultsScreen';
import PracticeSetupScreen from './components/screens/PracticeSetupScreen';

export default function App() {
  const game = useGameLogic();

  // 1. Loading
  if (!game.user) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <Loader2 className="animate-spin h-8 w-8 mr-2" />
      <span className="text-xl">Conectando...</span>
    </div>
  );

  // 2. Menú Principal (Login)
  if (!game.activeGameId && !game.practiceMode) {
    return (
        <LoginScreen 
            username={game.username}
            setUsername={game.setUsername}
            loading={game.loading}
            error={game.error}
            createGame={game.createGame}
            joinGame={game.joinGame}
            gameIdInput={game.gameIdInput}
            setGameIdInput={game.setGameIdInput}
            enterPracticeMode={game.enterPracticeMode}
        />
    );
  }

  // 3. Practice Setup
  if (game.practiceMode && game.gameData?.status === 'setup') {
      return (
          <PracticeSetupScreen 
             onStart={game.startGame}
             onBack={game.exitGame}
             duration={game.practiceConfig.duration}
             setDuration={(v) => game.setPracticeConfig(p => ({...p, duration: v}))}
             infiniteTime={game.practiceConfig.infiniteTime}
             setInfiniteTime={(v) => game.setPracticeConfig(p => ({...p, infiniteTime: v}))}
             showCheatSheet={game.practiceConfig.showCheatSheet}
             setShowCheatSheet={(v) => game.setPracticeConfig(p => ({...p, showCheatSheet: v}))}
             numberRange={game.practiceConfig.numberRange}
             setNumberRange={(v) => game.setPracticeConfig(p => ({...p, numberRange: v}))}
          />
      );
  }

  // 4. Sala de Espera / Lobby (Multiplayer Only)
  if (!game.practiceMode && game.gameData && (game.gameData.status === 'lobby' || game.gameData.status === 'waiting')) {
    return (
        <LobbyScreen 
            user={game.user}
            gameData={game.gameData}
            activeGameId={game.activeGameId}
            copyCode={game.copyCode}
            copied={game.copied}
            startGame={game.startGame}
            lobbyMaxPlayers={game.lobbyMaxPlayers}
            setLobbyMaxPlayers={game.setLobbyMaxPlayers}
            lobbyDurationMinutes={game.lobbyDurationMinutes}
            setLobbyDurationMinutes={game.setLobbyDurationMinutes}
            lobbyNumberRange={game.lobbyNumberRange}
            setLobbyNumberRange={game.setLobbyNumberRange}
            hostPlays={game.hostPlays}
            setHostPlays={game.setHostPlays}
            onBack={game.exitGame}
        />
    );
  }

  // 5. Pantalla de Juego (Both)
  if (game.gameData && (game.gameData.status === 'playing' || game.gameData.status === 'launching')) {
    return (
        <GameScreen 
            user={game.user}
            gameData={game.gameData}
            timeLeft={game.timeLeft}
            formatTime={game.formatTime}
            handleAnswer={game.handleAnswer}
            localFeedback={game.localFeedback}
            skillFeedback={null}
            // Props for Practice Mode
            isPractice={game.practiceMode}
            onExit={game.exitGame}
            showCheatSheet={game.practiceConfig?.showCheatSheet}
        />
    );
  }

  // 6. Pantalla de Resultados
  if (game.gameData && game.gameData.status === 'finished') {
    return (
        <ResultsScreen 
            gameData={game.gameData}
            setActiveGameId={game.setActiveGameId}
            confetti={confetti}
            isPractice={game.practiceMode}
            onRetry={game.enterPracticeMode}
            onExit={game.exitGame}
        />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin h-8 w-8 mr-2" />
        <span className="text-xl">Cargando estado del juego...</span>
    </div>
  );
}
