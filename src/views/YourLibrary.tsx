import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

// PERFECTLY FIXED IMPORT: Reaches back into the components folder!
import { HeartFilledIcon, MusicNoteIcon } from '../components/Icons'; 

export function YourLibrary() {
  const authContext = useAuth() as any;
  const authUser = authContext?.user || authContext?.currentUser;
  const userProfile = authContext?.userProfile;
  
  const playerContext = usePlayer() as any;
  const { songs, playSong, currentSong, isPlaying } = playerContext;
  
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // INNER VIEW STATE: Controls whether we are looking at the grid or inside a specific playlist
  const [activePlaylist, setActivePlaylist] = useState<any | 'liked' | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!authUser) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'playlists'), where('userId', '==', authUser.uid));
        const snap = await getDocs(q);
        setPlaylists(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [authUser]);

  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-6 text-center">
        <MusicNoteIcon className="w-16 h-16 mb-4 text-zinc-600" />
        <h2 className="text-xl font-bold text-white mb-2">Sign in to view your Library</h2>
        <p>Your saved playlists and liked songs will appear here.</p>
      </div>
    );
  }

  // ── INNER VIEW: SONG LIST ──
  // This renders when you click on a specific playlist tile
  if (activePlaylist) {
    const songIds = activePlaylist === 'liked' 
      ? (userProfile?.likedSongs || []) 
      : (activePlaylist.songs || []);
      
    const displaySongs = songs.filter((s: any) => songIds.includes(s.id));
    
    const title = activePlaylist === 'liked' ? 'Liked Songs' : activePlaylist.name;
    const subtitle = activePlaylist === 'liked' 
      ? `${songIds.length} liked songs` 
      : `Playlist • ${songIds.length} songs`;

    return (
      <div className="p-6 max-w-7xl mx-auto w-full pb-32">
        <button 
          onClick={() => setActivePlaylist(null)} 
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors font-medium text-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Library
        </button>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{title}</h1>
        <p className="text-zinc-400 mb-8">{subtitle}</p>

        {displaySongs.length === 0 ? (
          <div className="text-zinc-500 text-center py-12">
            <MusicNoteIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No songs here yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displaySongs.map((song: any) => {
              const isActive = currentSong?.id === song.id;
              return (
                <div 
                  key={song.id}
                  onClick={() => playSong(song)}
                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors group ${
                    isActive ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                    <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                    {isActive && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-4 h-4 text-emerald-500">
                           <svg fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${isActive ? 'text-emerald-400' : 'text-white'}`}>
                      {song.title}
                    </h3>
                    <p className="text-sm text-zinc-400 truncate">{song.artist.join(', ')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── DEFAULT VIEW: THE GRID ──
  return (
    <div className="p-6 pb-32 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center text-sm uppercase">
            {authUser.email?.[0] || 'A'}
          </div>
          Your Library
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Liked Songs Tile */}
        <div 
          onClick={() => setActivePlaylist('liked')}
          className="col-span-2 md:col-span-1 aspect-square bg-gradient-to-br from-indigo-600 to-purple-800 rounded-lg p-4 flex flex-col justify-end cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <HeartFilledIcon className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">Liked Songs</h2>
          <p className="text-white/80 text-sm font-medium">
            {userProfile?.likedSongs?.length || 0} liked songs
          </p>
        </div>

        {/* Custom Playlists */}
        {loading ? (
          <div className="col-span-full text-zinc-500 text-sm mt-4">Loading playlists...</div>
        ) : (
          playlists.map((playlist) => (
            <div 
              key={playlist.id} 
              onClick={() => setActivePlaylist(playlist)}
              className="bg-zinc-800/40 p-4 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors group"
            >
              <div className="w-full aspect-square bg-zinc-700 rounded-md mb-4 flex items-center justify-center shadow-lg">
                <MusicNoteIcon className="w-12 h-12 text-zinc-500" />
              </div>
              <h3 className="text-white font-bold truncate">{playlist.name}</h3>
              <p className="text-zinc-400 text-sm mt-1">Playlist • {playlist.songs?.length || 0} songs</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
