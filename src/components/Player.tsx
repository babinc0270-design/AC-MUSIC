import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import {
  PlayIcon,
  PauseIcon,
  SkipNextIcon,
  SkipPrevIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  MusicNoteIcon,
} from './Icons';

// ── CUSTOM ICONS ──
const ExpandIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Heart Icons
const HeartOutlineIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const HeartFilledIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

function formatTime(s: number): string {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function Player() {
  const {
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrevious,
  } = usePlayer();

  const authContext = useAuth() as any;
  const userProfile = authContext?.userProfile;
  const authUser = authContext?.user || authContext?.currentUser; 

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [isExpanded, setIsExpanded] = useState(false);

  // NEW: Optimistic UI State for the Heart Icon
  const [localIsLiked, setLocalIsLiked] = useState(false);

  // Sync the local heart state with the database whenever the song changes
  useEffect(() => {
    if (currentSong && userProfile?.likedSongs) {
      setLocalIsLiked(userProfile.likedSongs.includes(currentSong.id));
    } else {
      setLocalIsLiked(false);
    }
  }, [currentSong, userProfile]);

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  // NEW: The Instant Heart Toggle Logic
  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!authUser || !currentSong) {
      alert("Please sign in to like songs!");
      return;
    }

    // 1. Instantly toggle the heart on the screen (no waiting!)
    const newLikedState = !localIsLiked;
    setLocalIsLiked(newLikedState);

    // 2. Quietly update Firebase in the background
    const userRef = doc(db, 'users', authUser.uid);
    try {
      if (!newLikedState) {
        await updateDoc(userRef, { likedSongs: arrayRemove(currentSong.id) });
      } else {
        await updateDoc(userRef, { likedSongs: arrayUnion(currentSong.id) });
      }
    } catch (error) {
      console.error("Error updating liked status:", error);
      // If Firebase fails, revert the heart back
      setLocalIsLiked(!newLikedState);
    }
  };

  if (!currentSong) {
    return (
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-60 h-[72px] bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/40 z-40 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-zinc-600">
          <MusicNoteIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Select a song to play</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── EXPANDED VIEWS ── */}
      {isExpanded && (
        <>
          {/* 1. MOBILE FULL SCREEN OVERLAY */}
          <div className="md:hidden fixed inset-0 z-[60] bg-zinc-950 flex flex-col pt-12 pb-8 px-6">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 -ml-2 text-zinc-400 hover:text-white transition"
              >
                <ChevronDownIcon className="w-6 h-6" />
              </button>
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Now Playing
              </span>
              <div className="w-6 h-6" /> 
            </div>

            <div className="flex-1 min-h-0 flex items-center justify-center mb-8">
              <img
                src={currentSong.cover}
                alt={currentSong.album}
                className="w-full aspect-square object-cover rounded-2xl shadow-2xl shadow-black/60"
              />
            </div>

            {/* Info + MOBILE LIKE BUTTON */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1 truncate">
                  {currentSong.title}
                </h2>
                <p className="text-emerald-400 text-lg truncate">
                  {currentSong.artist.join(', ')}
                </p>
              </div>
              
              <button 
                onClick={handleToggleLike} 
                className="mt-1 flex-shrink-0 hover:scale-110 active:scale-95 transition-transform"
              >
                {localIsLiked ? (
                  <HeartFilledIcon className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                ) : (
                  <HeartOutlineIcon className="w-8 h-8 text-zinc-400 hover:text-white transition-colors" />
                )}
              </button>
            </div>

            {/* Mobile Scrubber */}
            <div className="mb-8">
              <div className="relative w-full h-1.5 bg-zinc-800 rounded-full mb-2 cursor-pointer group">
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full group-hover:bg-emerald-400 transition-colors pointer-events-none"
                  style={{ width: `${progress}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 font-medium tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Big Mobile Controls */}
            <div className="flex items-center justify-center gap-8 mb-4">
              <button onClick={playPrevious} className="text-zinc-400 hover:text-white transition">
                <SkipPrevIcon className="w-8 h-8" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shadow-emerald-500/30"
              >
                {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
              </button>
              <button onClick={playNext} className="text-zinc-400 hover:text-white transition">
                <SkipNextIcon className="w-8 h-8" />
              </button>
            </div>
          </div>

          {/* 2. DESKTOP RIGHT SIDEBAR */}
          <div className="hidden md:flex fixed right-0 top-0 bottom-[72px] w-80 bg-zinc-900 border-l border-zinc-800/40 z-30 flex-col p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white">Now Playing</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <img
              src={currentSong.cover}
              alt={currentSong.album}
              className="w-full aspect-square object-cover rounded-xl shadow-xl shadow-black/40 mb-4"
            />

            {/* Info + DESKTOP LIKE BUTTON */}
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1 truncate">
                  {currentSong.title}
                </h2>
                <p className="text-zinc-400 text-sm truncate">
                  {currentSong.artist.join(', ')}
                </p>
              </div>

              <button 
                onClick={handleToggleLike} 
                className="mt-1 flex-shrink-0 hover:scale-110 active:scale-95 transition-transform"
              >
                {localIsLiked ? (
                  <HeartFilledIcon className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                ) : (
                  <HeartOutlineIcon className="w-6 h-6 text-zinc-400 hover:text-white transition-colors" />
                )}
              </button>
            </div>

            {/* Extra desktop info box */}
            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">
                About the Album
              </p>
              <p className="text-white text-sm font-medium mb-1">
                {currentSong.album}
              </p>
              <p className="text-zinc-400 text-xs">AC Music Library</p>
            </div>
          </div>
        </>
      )}

      {/* ── STANDARD BOTTOM BAR ── */}
      <div
        className={`fixed bottom-16 md:bottom-0 left-0 right-0 md:left-60 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/40 z-40 ${
          isExpanded ? 'hidden md:block' : 'block'
        }`}
      >
        <div className="relative h-1 group cursor-pointer">
          <div className="absolute inset-0 bg-zinc-700/60" />
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 group-hover:bg-emerald-400 transition-colors pointer-events-none"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek"
          />
        </div>

        <div className="flex items-center px-4 py-3 gap-3">
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group hover:bg-zinc-800/40 p-1 -ml-1 rounded-lg transition-colors"
          >
            <img
              src={currentSong.cover}
              alt={currentSong.album}
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-lg ring-1 ring-white/5"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">
                {currentSong.title}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {currentSong.artist.join(', ')}
              </p>
            </div>
            <ExpandIcon className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block ml-2" />
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden md:flex text-zinc-500 hover:text-white transition-colors" onClick={playPrevious}>
              <SkipPrevIcon className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
            </button>
            <button className="hidden md:flex text-zinc-500 hover:text-white transition-colors" onClick={playNext}>
              <SkipNextIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1 justify-end min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 tabular-nums font-medium">
              <span className="text-zinc-300">{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleMuteToggle} className="text-zinc-500 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeMuteIcon className="w-5 h-5" /> : <VolumeHighIcon className="w-5 h-5" />}
              </button>

              <div className="relative w-24 h-1 group cursor-pointer flex items-center">
                <div className="absolute inset-0 bg-zinc-700/60 rounded-full" />
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500 group-hover:bg-emerald-400 transition-colors pointer-events-none rounded-full"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md"
                  style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <div className="md:hidden text-xs text-zinc-500 tabular-nums font-medium flex-shrink-0">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>
    </>
  );
}
