import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Song } from '../types';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';

interface PlayerContextValue {
  songs: Song[];
  loadingSongs: boolean;
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
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  // NEW: YouTube Player State
  const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  const historyRef = useRef<Song[]>([]);
  const currentSongRef = useRef<Song | null>(null);
  const playNextRef = useRef<() => void>();
  const songsRef = useRef<Song[]>([]);

  /* ── 1. Fetch Live Database ── */
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'songs'));
        const liveSongs = querySnapshot.docs.map((doc) => doc.data() as Song);
        
        // Shuffle the songs so the homepage looks fresh!
        const shuffled = liveSongs.sort(() => 0.5 - Math.random());
        
        setSongs(shuffled);
        songsRef.current = shuffled;
      } catch (error) {
        console.error("Error fetching live songs:", error);
      } finally {
        setLoadingSongs(false);
      }
    };
    fetchSongs();
  }, []);

  /* ── Auto-Play Logic ── */
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
    if (currentTime > 3) {
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

    currentSongRef.current = song;
    setCurrentSong(song);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true); // Triggers the YouTube component to auto-play when ready
  };

  const playSong = (song: Song): void => internalPlaySong(song, false);

  const togglePlay = (): void => {
    if (!ytPlayer || !currentSong) return;
    if (isPlaying) {
      ytPlayer.pauseVideo();
      setIsPlaying(false);
    } else {
      ytPlayer.playVideo();
      setIsPlaying(true);
    }
  };

  const seek = async (pct: number) => {
    if (!ytPlayer) return;
    const dur = await ytPlayer.getDuration();
    if (!dur) return;
    const newTime = (pct / 100) * dur;
    ytPlayer.seekTo(newTime, true);
    setProgress(pct);
    setCurrentTime(newTime);
  };

  const setVolume = (v: number): void => {
    const clamped = Math.max(0, Math.min(1, v));
    if (ytPlayer) ytPlayer.setVolume(clamped * 100); // YouTube volume is 0-100
    setVolumeState(clamped);
  };

  /* ── YouTube Timer Sync ── */
  // YouTube doesn't have a built-in time tracker event, so we create our own clock!
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && ytPlayer) {
      interval = setInterval(async () => {
        try {
          const time = await ytPlayer.getCurrentTime();
          const dur = await ytPlayer.getDuration();
          setCurrentTime(time);
          setDuration(dur);
          if (dur > 0) {
            setProgress((time / dur) * 100);
          }
        } catch (e) {
          // Ignore errors if player is still loading
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, ytPlayer]);
  
  /* ── 🎵 OS Media Session API (The Background Fix) 🎵 ── */
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      // 1. Tell the computer/phone exactly what is playing
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist.join(', '),
        album: currentSong.album,
        artwork: [
          { src: currentSong.cover, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      // 2. Wire your computer's media keys (Play/Pause/Next buttons on your keyboard) directly to AC Music
      navigator.mediaSession.setActionHandler('play', () => {
        if (ytPlayer) ytPlayer.playVideo();
        setIsPlaying(true);
      });
      
      navigator.mediaSession.setActionHandler('pause', () => {
        if (ytPlayer) ytPlayer.pauseVideo();
        setIsPlaying(false);
      });
      
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
  }, [currentSong, isPlaying, ytPlayer]);

 /* ── YouTube Player Events ── */
  const onPlayerReady = (event: YouTubeEvent) => {
    setYtPlayer(event.target);
    event.target.setVolume(volume * 100);
    // If it takes a second to load, force play immediately
    if (isPlaying) event.target.playVideo();
  };

  const onPlayerStateChange = (event: YouTubeEvent) => {
    const state = event.data;
    // 1 = Playing, 2 = Paused, 0 = Ended, -1 = Unstarted, 3 = Buffering, 5 = Video Cued

    if (state === 1) {
      setIsPlaying(true);
    } else if (state === 2) {
      setIsPlaying(false);
    } else if (state === 0) {
      // Song ended! Trigger the next song.
      if (playNextRef.current) playNextRef.current();
    } else if (state === -1 || state === 5) {
      // THE AGGRESSIVE BACKGROUND FIX 🚀
      // If the tab is hidden, YouTube will load the next song and pause it to save data.
      // We immediately force it to play without waiting for the user to open the tab!
      event.target.playVideo();
    }
  };

  const onPlayerError = (event: YouTubeEvent) => {
    console.warn("YouTube Video Embedding Restricted - Skipping to next track", event.data);
    if (playNextRef.current) playNextRef.current();
  };

  return (
    <PlayerContext.Provider
      value={{
        songs,
        loadingSongs,
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
      
      {/* THE SECRET WEAPON: The "Behind-the-Wall" YouTube Engine */}
      <div className="fixed top-1/2 left-1/2 w-[10px] h-[10px] z-[-50] opacity-[0.01] pointer-events-none">
        {currentSong && (
          <YouTube
            videoId={currentSong.audio} // Uses the YouTube ID
            opts={{
              height: '10', // Needs to be larger than 0 so the browser respects it
              width: '10',
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                playsinline: 1,
              },
            }}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onError={onPlayerError}
          />
        )}
      </div>
    </PlayerContext.Provider>
  );
}
