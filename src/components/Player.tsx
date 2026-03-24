import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import {
  PlayIcon,
  PauseIcon,
  SkipNextIcon,
  SkipPrevIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  MusicNoteIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  MoreHorizontalIcon,
  PlusIcon,
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

export function Player({ onArtistClick }: { onArtistClick: (name: string) => void }) {
  const playerContext = usePlayer() as any;
  const {
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    sleepTimer,
    setSleepTimerAction,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrevious,
  } = playerContext;

  const authContext = useAuth() as any;
  const userProfile = authContext?.userProfile;
  const authUser = authContext?.user || authContext?.currentUser; 
  const toggleLikedSong = authContext?.toggleLikedSong;

  const repeatMode = playerContext.repeatMode || 0; 
  const setRepeatMode = playerContext.setRepeatMode;
  const isShuffle = playerContext.isShuffle || false;
  const setIsShuffle = playerContext.setIsShuffle;

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'timer' | 'playlists'>('main');
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isLiked = currentSong && userProfile?.likedSongs?.includes(currentSong.id);

  useEffect(() => {
    if (menuView === 'playlists' && authUser) {
      const fetchPlaylists = async () => {
        setIsFetchingPlaylists(true);
        try {
          const q = query(collection(db, 'playlists'), where('userId', '==', authUser.uid));
          const snap = await getDocs(q);
          setUserPlaylists(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Error fetching playlists:", error);
        } finally {
          setIsFetchingPlaylists(false);
        }
      };
      fetchPlaylists();
    }
  }, [menuView, authUser]);

  const handleCreateAndAddPlaylist = async () => {
    if (!newPlaylistName.trim() || !authUser || !currentSong) return;
    try {
      const newPl = {
        name: newPlaylistName,
        userId: authUser.uid,
        songs: [currentSong.id], 
        createdAt: new Date()
      };
      await addDoc(collection(db, 'playlists'), newPl);
      setNewPlaylistName('');
      setShowOptionsMenu(false);
      showToast('Playlist created & song added!'); 
    } catch (error) {
      console.error("Error creating playlist:", error);
      showToast("Failed to create playlist."); 
    }
  };

  const handleAddToExistingPlaylist = async (playlistId: string) => {
    if (!currentSong) return;
    try {
      const ref = doc(db, 'playlists', playlistId);
      await updateDoc(ref, {
        songs: arrayUnion(currentSong.id)
      });
      setShowOptionsMenu(false);
      showToast('Added to playlist!'); 
    } catch (error) {
      console.error("Error updating playlist:", error);
    }
  };

  const handleToggleRepeat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setRepeatMode) setRepeatMode(repeatMode === 0 ? 1 : repeatMode === 1 ? 2 : 0);
  };

  const handleToggleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setIsShuffle) setIsShuffle(!isShuffle);
  };

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

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUser || !currentSong) {
      showToast("Please sign in to like songs!"); 
      return;
    }
    if (toggleLikedSong) await toggleLikedSong(currentSong.id);
  };

  const renderOptionsMenu = (position: 'top' | 'bottom') => (
    <div className={`absolute ${position === 'bottom' ? 'bottom-full mb-4' : 'top-full mt-2'} right-0 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[70] flex flex-col`}>
      <div className="p-3 border-b border-zinc-800 flex items-center">
        {menuView !== 'main' && (
          <button onClick={() => setMenuView('main')} className="mr-2 text-zinc-400 hover:text-white">
             <ChevronDownIcon className="w-5 h-5 rotate-90" />
          </button>
        )}
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex-1 text-center pr-5">
          {menuView === 'main' ? 'Options' : menuView === 'timer' ? 'Sleep Timer' : 'Add to Playlist'}
        </p>
      </div>

      <div className="flex flex-col py-1 max-h-64 overflow-y-auto">
        {menuView === 'main' && (
          <>
            <button
              onClick={() => setMenuView('timer')}
              className="text-left px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center justify-between transition-colors"
            >
              Sleep Timer
              {sleepTimer && <span className="text-xs text-emerald-500">Active</span>}
            </button>
            <button
              onClick={() => {
                if (!authUser) {
                  showToast("Sign in to create playlists!"); 
                  setShowOptionsMenu(false);
                  return;
                }
                setMenuView('playlists');
              }}
              className="text-left px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Add to Playlist
            </button>
          </>
        )}

        {menuView === 'timer' && (
          [
            { label: 'Off', value: null },
            { label: '15 minutes', value: 15 },
            { label: '30 minutes', value: 30 },
            { label: '45 minutes', value: 45 },
            { label: '1 hour', value: 60 },
            { label: 'End of track', value: 'track' },
          ].map((option) => (
            <button
              key={option.label}
              onClick={() => {
                setSleepTimerAction(option.value as number | 'track' | null);
                setShowOptionsMenu(false);
                setMenuView('main');
              }}
              className={`text-left px-4 py-2 text-sm transition ${
                sleepTimer === option.value ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))
        )}

        {menuView === 'playlists' && (
          <div className="p-2 flex flex-col gap-1">
            <div className="flex items-center gap-2 px-2 pb-2 border-b border-zinc-800 mb-1">
              <input 
                type="text" 
                placeholder="New playlist..." 
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-zinc-800 text-white text-xs px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button 
                onClick={handleCreateAndAddPlaylist}
                disabled={!newPlaylistName.trim()}
                className="bg-emerald-500 text-black p-1.5 rounded disabled:opacity-50 hover:bg-emerald-400 transition"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            {isFetchingPlaylists ? (
              <p className="text-xs text-zinc-500 text-center py-4">Loading...</p>
            ) : userPlaylists.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">No playlists yet.</p>
            ) : (
              userPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => handleAddToExistingPlaylist(pl.id)}
                  className="text-left px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded transition truncate"
                >
                  {pl.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

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
      {toastMessage && (
        <div className="fixed bottom-[100px] md:bottom-24 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-5 py-3 rounded-full shadow-2xl border border-zinc-700/50 z-[100] text-sm font-semibold flex items-center gap-3 transition-all animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          {toastMessage}
        </div>
      )}

      {isExpanded && (
        <>
          {/* MOBILE FULL SCREEN OVERLAY */}
          <div className="md:hidden fixed inset-0 z-[60] bg-zinc-950 flex flex-col pt-12 pb-8 px-6">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setIsExpanded(false)} className="p-2 -ml-2 text-zinc-400 hover:text-white transition">
                <ChevronDownIcon className="w-6 h-6" />
              </button>
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Now Playing</span>
              <div className="relative flex items-center">
                <button 
                  onClick={() => {
                    setShowOptionsMenu(!showOptionsMenu);
                    setMenuView('main');
                  }}
                  className={`p-2 -mr-2 transition ${showOptionsMenu ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  <MoreHorizontalIcon className="w-6 h-6" />
                  {sleepTimer && <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />}
                </button>
                {showOptionsMenu && renderOptionsMenu('top')}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex items-center justify-center mb-8">
              <img src={currentSong.cover} alt={currentSong.album} className="w-full h-full object-contain rounded-2xl shadow-2xl shadow-black/60" />
            </div>

            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1 truncate">{currentSong.title}</h2>
                
                {/* FIXED: Artist Name clickable in Mobile Full Screen! */}
                <div className="text-emerald-400 text-lg truncate flex flex-wrap gap-x-1 gap-y-0">
                  {currentSong.artist.map((artistName: string, index: number) => (
                    <span
                      key={artistName}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setIsExpanded(false); // Closes player so you can see the page
                        onArtistClick(artistName); 
                      }}
                      className="cursor-pointer hover:text-emerald-300 transition-colors"
                    >
                      {artistName}{index < currentSong.artist.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>

              </div>
              <button onClick={handleToggleLike} className="mt-1 flex-shrink-0 hover:scale-110 active:scale-95 transition-transform">
                {isLiked ? (
                  <HeartFilledIcon className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                ) : (
                  <HeartOutlineIcon className="w-8 h-8 text-zinc-400 hover:text-white transition-colors" />
                )}
              </button>
            </div>

            <div className="mb-8">
              <div className="relative w-full h-1.5 bg-zinc-800 rounded-full mb-2 cursor-pointer group">
                <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full group-hover:bg-emerald-400 transition-colors pointer-events-none" style={{ width: `${progress}%` }} />
                <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 font-medium tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 gap-4 mb-4">
              <button onClick={handleToggleRepeat} className={`transition p-2 ${repeatMode > 0 ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'}`}>
                {repeatMode === 1 ? <RepeatOneIcon className="w-6 h-6" /> : <RepeatIcon className="w-6 h-6" />}
              </button>
              <button onClick={playPrevious} className="text-zinc-400 hover:text-white transition">
                <SkipPrevIcon className="w-8 h-8" />
              </button>
              <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shadow-emerald-500/30">
                {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
              </button>
              <button onClick={playNext} className="text-zinc-400 hover:text-white transition">
                <SkipNextIcon className="w-8 h-8" />
              </button>
              <button onClick={handleToggleShuffle} className={`transition p-2 ${isShuffle ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'}`}>
                <ShuffleIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* DESKTOP RIGHT SIDEBAR */}
          <div className="hidden md:flex fixed right-0 top-0 bottom-[72px] w-80 bg-zinc-900 border-l border-zinc-800/40 z-30 flex-col p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white">Now Playing</h3>
              <button onClick={() => setIsExpanded(false)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <img src={currentSong.cover} alt={currentSong.album} className="w-full h-full object-contain rounded-xl shadow-xl shadow-black/40 mb-4" />
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1 truncate">{currentSong.title}</h2>
                
                {/* FIXED: Artist Name clickable in Desktop Right Sidebar! */}
                <div className="text-zinc-400 text-sm truncate flex flex-wrap gap-x-1 gap-y-0 mt-0.5">
                  {currentSong.artist.map((artistName: string, index: number) => (
                    <span
                      key={artistName}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setIsExpanded(false); 
                        onArtistClick(artistName); 
                      }}
                      className="cursor-pointer hover:text-emerald-400 transition-colors"
                    >
                      {artistName}{index < currentSong.artist.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>

              </div>
              <button onClick={handleToggleLike} className="mt-1 flex-shrink-0 hover:scale-110 active:scale-95 transition-transform">
                {isLiked ? (
                  <HeartFilledIcon className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                ) : (
                  <HeartOutlineIcon className="w-6 h-6 text-zinc-400 hover:text-white transition-colors" />
                )}
              </button>
            </div>
            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">About the Album</p>
              <p className="text-white text-sm font-medium mb-1">{currentSong.album}</p>
              <p className="text-zinc-400 text-xs">AC Music Library</p>
            </div>
          </div>
        </>
      )}

      {/* STANDARD BOTTOM BAR */}
      <div className={`fixed bottom-16 md:bottom-0 left-0 right-0 md:left-60 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/40 z-40 ${isExpanded ? 'hidden md:block' : 'block'}`}>
        <div className="relative h-1 group cursor-pointer">
          <div className="absolute inset-0 bg-zinc-700/60" />
          <div className="absolute inset-y-0 left-0 bg-emerald-500 group-hover:bg-emerald-400 transition-colors pointer-events-none" style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md" style={{ left: `calc(${progress}% - 6px)` }} />
          <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Seek" />
        </div>

        <div className="flex items-center px-4 py-3 gap-3">
          <div onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group hover:bg-zinc-800/40 p-1 -ml-1 rounded-lg transition-colors">
            <img src={currentSong.cover} alt={currentSong.album} className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-lg ring-1 ring-white/5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">{currentSong.title}</p>
              
              {/* Bottom bar clickable mapping (already done) */}
              <div className="text-xs text-zinc-400 truncate mt-0.5 flex flex-wrap gap-x-1 gap-y-0">
                {currentSong.artist.map((artistName: string, index: number) => (
                  <span
                    key={artistName}
                    onClick={(e) => { e.stopPropagation(); onArtistClick(artistName); }}
                    className="cursor-pointer hover:text-emerald-400 transition-colors"
                  >
                    {artistName}{index < currentSong.artist.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
            <ExpandIcon className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block ml-2" />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleToggleRepeat} className={`hidden md:flex transition ${repeatMode > 0 ? 'text-emerald-500' : 'text-zinc-500 hover:text-white'}`}>
              {repeatMode === 1 ? <RepeatOneIcon className="w-5 h-5" /> : <RepeatIcon className="w-5 h-5" />}
            </button>
            <button className="hidden md:flex text-zinc-500 hover:text-white transition-colors" onClick={playPrevious}>
              <SkipPrevIcon className="w-5 h-5" />
            </button>
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg">
              {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
            </button>
            <button className="hidden md:flex text-zinc-500 hover:text-white transition-colors" onClick={playNext}>
              <SkipNextIcon className="w-5 h-5" />
            </button>
            <button onClick={handleToggleShuffle} className={`hidden md:flex transition ${isShuffle ? 'text-emerald-500' : 'text-zinc-500 hover:text-white'}`}>
              <ShuffleIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1 justify-end min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 tabular-nums font-medium">
              <span className="text-zinc-300">{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="relative flex items-center">
              <button 
                onClick={() => {
                  setShowOptionsMenu(!showOptionsMenu);
                  setMenuView('main');
                }}
                className={`p-2 rounded-full hover:bg-zinc-800 transition relative ${showOptionsMenu ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <MoreHorizontalIcon className="w-5 h-5" />
                {sleepTimer && <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />}
              </button>
              {showOptionsMenu && renderOptionsMenu('bottom')}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleMuteToggle} className="text-zinc-500 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeMuteIcon className="w-5 h-5" /> : <VolumeHighIcon className="w-5 h-5" />}
              </button>
              <div className="relative w-24 h-1 group cursor-pointer flex items-center">
                <div className="absolute inset-0 bg-zinc-700/60 rounded-full" />
                <div className="absolute inset-y-0 left-0 bg-emerald-500 group-hover:bg-emerald-400 transition-colors pointer-events-none rounded-full" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md" style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)` }} />
                <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
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
