import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { HeartFilledIcon, MusicNoteIcon } from './Icons';

// Note: You will need to route your old "Liked" button in your Navbar to point to this component instead!
export function YourLibrary() {
  const authContext = useAuth() as any;
  const authUser = authContext?.user || authContext?.currentUser;
  const userProfile = authContext?.userProfile;
  
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        {/* Liked Songs Persistent Tile */}
        <div className="col-span-2 md:col-span-1 aspect-square bg-gradient-to-br from-indigo-600 to-purple-800 rounded-lg p-4 flex flex-col justify-end cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group relative overflow-hidden">
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
            <div key={playlist.id} className="bg-zinc-800/40 p-4 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors group">
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
