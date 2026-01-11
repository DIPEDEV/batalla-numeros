import React from 'react';
import { Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameLogic } from './hooks/useGameLogic';
import LoginScreen from './components/screens/LoginScreen';
import LobbyScreen from './components/screens/LobbyScreen';
import GameScreen from './components/screens/GameScreen';
import ResultsScreen from './components/screens/ResultsScreen';
import PracticeSetupScreen from './components/screens/PracticeSetupScreen';
import EmojiReactionSystem from './components/common/EmojiReactionSystem';

export default function App() {
  const game = useGameLogic();

  let content = null;
  const isOnline = !game.practiceMode && game.activeGameId && game.gameData;

  // 1. Loading
  if (!game.user) {
    content = (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin h-8 w-8 mr-2" />
        <span className="text-xl">Conectando...</span>
        </div>
    );
  }
  // 2. Menú Principal (Login)
  else if (!game.activeGameId && !game.practiceMode) {
    content = (
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
            loginWithGoogle={game.loginWithGoogle}
            loginWithApple={game.loginWithApple}
            registerUsername={game.registerUsername}
            needsUsername={game.needsUsername}
            logout={game.logout}
            user={game.user}
            isGoogleUser={!!game.user && !game.user.isAnonymous}
            uploadAvatar={game.uploadAvatar}
            removeAvatar={game.removeAvatar}
            userStats={game.userStats}
        />
    );
  }
  // 3. Practice Setup
  else if (game.practiceMode && game.gameData?.status === 'setup') {
      content = (
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
  else if (!game.practiceMode && game.gameData && (game.gameData.status === 'lobby' || game.gameData.status === 'waiting')) {
    content = (
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
  else if (game.gameData && (game.gameData.status === 'playing' || game.gameData.status === 'launching')) {
    content = (
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
            combo={game.combo}
        />
    );
  }
  // 6. Pantalla de Resultados
  else if (game.gameData && game.gameData.status === 'finished') {
    content = (
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
  else {
    content = (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <Loader2 className="animate-spin h-8 w-8 mr-2" />
            <span className="text-xl">Cargando estado del juego...</span>
        </div>
    );
  }

  return (
    <>
      {content}
      {isOnline && (
        <EmojiReactionSystem 
            gameData={game.gameData}
            sendReaction={game.sendReaction}
            isLobby={game.gameData.status === 'lobby'}
            isPlaying={game.gameData.status === 'playing'}
        />
      )}
    </>
  );
}
