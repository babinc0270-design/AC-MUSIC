import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { SONGS } from '../data';
import type { Song } from '../types';

interface PlayerContextValue {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  playNext: () => void;
  playPrevious: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  // FIX: Use a direct Ref for history so React state doesn't accidentally duplicate songs!
  const historyRef = useRef<Song[]>([]);
  const currentSongRef = useRef<Song | null>(null);
  const playNextRef = useRef<() => void>();

  /* ── Auto-Play Logic ── */
  const playNext = () => {
    const current = currentSongRef.current;
    if (!current) return;

    let candidates = SONGS.filter(
      (s) =>
        s.id !== current.id && s.artist.some((a) => current.artist.includes(a))
    );

    if (candidates.length === 0) {
      candidates = SONGS.filter(
        (s) =>
          s.id !== current.id && (s as any).genre === (current as any).genre
      );
    }

    if (candidates.length === 0) {
      candidates = SONGS.filter((s) => s.id !== current.id);
    }

    if (candidates.length > 0) {
      const nextSong =
        candidates[Math.floor(Math.random() * candidates.length)];
      internalPlaySong(nextSong, false);
    }
  };

  playNextRef.current = playNext;

  /* ── Previous Logic ── */
  const playPrevious = () => {
    // Pro Feature: If song is playing for more than 3 seconds, previous restarts it
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }

    // If we have history, grab the last song and play it
    if (historyRef.current.length > 0) {
      const prevSong = historyRef.current.pop()!;
      internalPlaySong(prevSong, true);
    } else {
      // If no history, just restart
      seek(0);
    }
  };

  /* ── Core Play Logic ── */
  const internalPlaySong = (song: Song, isBacktrack: boolean) => {
    if (!audioRef.current) return;

    // Toggle play if clicking the identical song
    if (currentSongRef.current?.id === song.id) {
      togglePlay();
      return;
    }

    // Save to history (with a safety check against duplicates)
    if (!isBacktrack && currentSongRef.current) {
      const lastInHistory = historyRef.current[historyRef.current.length - 1];
      if (lastInHistory?.id !== currentSongRef.current.id) {
        historyRef.current.push(currentSongRef.current);
      }
    }

    audioRef.current.pause();
    audioRef.current.src = song.audio;
    audioRef.current.load();
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.error('Playback error:', err));

    currentSongRef.current = song;
    setCurrentSong(song);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const playSong = (song: Song): void => {
    internalPlaySong(song, false);
  };

  const togglePlay = (): void => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Playback error:', err));
    }
  };

  const seek = (pct: number): void => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    if (!dur || isNaN(dur)) return;
    const newTime = (pct / 100) * dur;
    audioRef.current.currentTime = newTime;
    setProgress(pct);
    setCurrentTime(newTime);
  };

  const setVolume = (v: number): void => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, v));
    setVolumeState(v);
  };

  /* ── Audio Event Listeners ── */
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.8;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration)) setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (playNextRef.current) {
        playNextRef.current();
      } else {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      }
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      audio.pause();
      audio.src = '';
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        progress,
        currentTime,
        duration,
        volume,
        playSong,
        togglePlay,
        seek,
        setVolume,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
