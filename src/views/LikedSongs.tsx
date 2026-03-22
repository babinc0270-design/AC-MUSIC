import { useMemo } from 'react';
import { SONGS } from '../data';
import { useAuth } from '../context/AuthContext';
import { SongCard } from '../components/SongCard';
import { HeartFilledIcon } from '../components/Icons';

interface LikedSongsProps {
  onAuthRequired: () => void;
}

export default function LikedSongs({ onAuthRequired }: LikedSongsProps) {
  const { userProfile } = useAuth();

  const likedSongs = useMemo(() => {
    if (!userProfile) return [];
    // The "|| []" ensures it never crashes even if likedSongs is temporarily missing
    return SONGS.filter((s) => (userProfile.likedSongs || []).includes(s.id));
  }, [userProfile]);

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-zinc-500 px-6 text-center">
        <HeartFilledIcon className="w-16 h-16 text-zinc-700" />
        <p className="text-xl font-semibold text-zinc-300">Sign in to see your liked songs</p>
        <p className="text-sm">All the songs you heart will appear here.</p>
        <button
          onClick={onAuthRequired}
          className="mt-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full text-sm transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (likedSongs.length === 0) {
    return (
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-2xl font-bold text-white mb-8">Liked Songs</h1>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-500">
          <HeartFilledIcon className="w-14 h-14 text-zinc-700" />
          <p className="text-lg font-medium text-zinc-400">No liked songs yet</p>
          <p className="text-sm">Heart songs from the home or search page to save them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
          <HeartFilledIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">Liked Songs</h1>
          <p className="text-sm text-zinc-400">
            {likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {likedSongs.map((song) => (
          <SongCard key={song.id} song={song} onAuthRequired={onAuthRequired} />
        ))}
      </div>
    </div>
  );
}
