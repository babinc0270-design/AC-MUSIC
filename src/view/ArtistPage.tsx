import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { UserCircleIcon, ChevronLeftIcon, MusicNoteIcon } from '../components/Icons'; 

interface ArtistPageProps {
  artistName: string;
  onBack: () => void;
}

export function ArtistPage({ artistName, onBack }: ArtistPageProps) {
  const playerContext = usePlayer() as any;
  const { songs, playContext, currentSong, isPlaying } = playerContext;
  
  // 1. Filter all songs to find this artist's music
  const artistSongs = songs.filter((s: any) => s.artist.includes(artistName));

  return (
    <div className="p-6 max-w-7xl mx-auto w-full pb-32">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors font-medium text-sm"
      >
        <ChevronLeftIcon className="w-5 h-5" />
        Back
      </button>

      {/* Artist Page Header (Placeholder for photo) */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
        <div className="w-40 h-40 rounded-full bg-zinc-800 flex items-center justify-center shadow-2xl shadow-black/60 group relative overflow-hidden">
          <UserCircleIcon className="w-24 h-24 text-zinc-600" />
        </div>
        <div className="flex-1 min-w-0 text-center md:text-left mt-4 md:mt-0">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Artist</p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-2 truncate">{artistName}</h1>
          <p className="text-zinc-400 text-lg">{artistSongs.length} songs available</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Popular Songs by {artistName}</h2>

      {artistSongs.length === 0 ? (
        <div className="text-zinc-500 text-center py-12">
          <MusicNoteIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>This artist's music is not currently in the database.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {artistSongs.map((song: any) => {
            const isActive = currentSong?.id === song.id;
            return (
              <div 
                key={song.id}
                // FIXED: Uses contextual playback for the artist queue!
                onClick={() => playContext(song, artistSongs)}
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
