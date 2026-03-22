import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Connects to your Firebase!
import type { Song } from '../types';

interface PlayerContextValue {
  songs: Song[];          // NEW: The live database!
  loadingSongs: boolean;  // NEW: Loading state for the database!
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
  // NEW: Database States
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  const historyRef = useRef<Song[]>([]);
  const currentSongRef = useRef<Song | null>(null);
  const playNextRef = useRef<() => void>();
  
  // Keep a ref of the songs for the auto-play engine to use
  const songsRef = useRef<Song[]>([]);

  /* ── 1. Fetch Live Database on Startup ── */
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'songs'));
        const liveSongs = querySnapshot.docs.map((doc) => doc.data() as Song);
        setSongs(liveSongs);
        songsRef.current = liveSongs; // Give them to the DJ Engine
      } catch (error) {
        console.error("Error fetching live songs:", error);
      } finally {
        setLoadingSongs(false);
      }
    };
    fetchSongs();
  }, []);

  /* ── Auto-Play Logic (Now uses Live Data) ── */
  const playNext = () => {
    const current = currentSongRef.current;
    const allSongs = songsRef.current;
    if (!current || allSongs.length === 0) return;

    let candidates = allSongs.filter(
      (s) => s.id !== current.id && s.artist.some((a) => current.artist.includes(a))
    );

    if (candidates.length === 0) {
      candidates = allSongs.filter(
        (s) => s.id !== current.id && (s as any).genre === (current as any).genre
      );
    }

    if (candidates.length === 0) {
      candidates = allSongs.filter((s) => s.id !== current.id);
    }

    if (candidates.length > 0) {
      const nextSong = candidates[Math.floor(Math.random() * candidates.length)];
      internalPlaySong(nextSong, false);
    }
  };

  playNextRef.current = playNext;

  /* ── Previous Logic ── */
  const playPrevious = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }
    if (historyRef.current.length > 0) {
      const prevSong = historyRef.current.pop()!;
      internalPlaySong(prevSong, true);
    } else {
      seek(0);
    }
  };

  /* ── Core Play Logic ── */
  const internalPlaySong = (song: Song, isBacktrack: boolean) => {
    if (!audioRef.current) return;
    if (currentSongRef.current?.id === song.id) {
      togglePlay();
      return;
    }

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

  const playSong = (song: Song): void => internalPlaySong(song, false);

  const togglePlay = (): void => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
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
    const handleError = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        songs,          // <--- Exposes the live database to the whole app!
        loadingSongs,   // <--- Lets the app know if it's still downloading!
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
