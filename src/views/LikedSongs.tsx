import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { SongCard } from '../components/SongCard';
import { HeartFilledIcon } from '../components/Icons';

interface LikedSongsProps {
  onAuthRequired: () => void;
}

export default function LikedSongs({ onAuthRequired }: LikedSongsProps) {
  const { userProfile } = useAuth();
  
  // 1. Grab the live database songs from the brain
  const { songs, loadingSongs } = usePlayer();

  // 2. Filter the live songs based on what the user liked
  const likedSongs = useMemo(() => {
    if (!userProfile || !songs) return [];
    return songs.filter((s) => userProfile.likedSongs.includes(s.id));
  }, [userProfile, songs]);

  // 3. Loading screen
  if (loadingSongs) {
    return (
      <div className="px-4 md:px-8 py-24 flex items-center justify-center">
        <div className="text-zinc-400 text-lg font-medium flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          Loading Liked Songs... 🎧
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
          <HeartFilledIcon className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">Liked Songs</h1>
      </div>

      {likedSongs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {likedSongs.map((song) => (
            <SongCard key={song.id} song={song} onAuthRequired={onAuthRequired} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-zinc-500 font-medium">No liked songs yet.</p>
        </div>
      )}
    </div>
  );
}
