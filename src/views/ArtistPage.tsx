import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { usePlayer } from '../context/PlayerContext';
import { UserCircleIcon, ChevronLeftIcon, MusicNoteIcon, PlayIcon } from '../components/Icons'; 

interface ArtistPageProps {
  artistName: string;
  onBack: () => void;
}

export function ArtistPage({ artistName, onBack }: ArtistPageProps) {
  const playerContext = usePlayer() as any;
  const { songs, playContext, currentSong, isPlaying } = playerContext;
  
  const [artistPhoto, setArtistPhoto] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(true);

  // 1. Filter all songs to find this artist's music
  const artistSongs = songs.filter((s: any) => s.artist.includes(artistName));

  // THE BULLETPROOF FALLBACK: Always grab the song cover immediately 
  const fallbackPhoto = artistSongs.length > 0 ? artistSongs[0].cover : null;

  // 2. Fetch the official HD photo from your new Bot-powered database
  useEffect(() => {
    let isMounted = true;
    
    const fetchArtistData = async () => {
      setIsPhotoLoading(true);
      try {
        const artistRef = doc(db, 'artists', artistName);
        const artistSnap = await getDoc(artistRef);
        
        if (isMounted && artistSnap.exists() && artistSnap.data().photoUrl) {
          setArtistPhoto(artistSnap.data().photoUrl);
        }
      } catch (error) {
        console.error("Firebase read error (Check your database rules!):", error);
      } finally {
        if (isMounted) setIsPhotoLoading(false);
      }
    };

    if (artistName) fetchArtistData();

    return () => { isMounted = false; };
  }, [artistName]);

  // 3. Determine which photo to show (HD Photo > Fallback Cover > Generic Icon)
  const displayPhoto = artistPhoto || fallbackPhoto;

  return (
    <div className="p-6 max-w-7xl mx-auto w-full pb-32">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors font-medium text-sm"
      >
        <ChevronLeftIcon className="w-5 h-5" />
        Back
      </button>

      {/* Artist Page Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-zinc-800 flex items-center justify-center shadow-2xl shadow-black/60 relative overflow-hidden flex-shrink-0 transition-opacity duration-300">
          {isPhotoLoading && !displayPhoto ? (
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          ) : displayPhoto ? (
            <img src={displayPhoto} alt={artistName} className="w-full h-full object-cover" />
          ) : (
            <UserCircleIcon className="w-24 h-24 text-zinc-600" />
          )}
        </div>
        <div className="flex-1 min-w-0 text-center md:text-left mt-4 md:mt-0">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Artist</p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 truncate tracking-tight">{artistName}</h1>
          <p className="text-zinc-400 text-lg font-medium">{artistSongs.length} songs available</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Popular</h2>

      {artistSongs.length === 0 ? (
        <div className="text-zinc-500 text-center py-12">
          <MusicNoteIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>This artist's music is not currently in the database.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {artistSongs.map((song: any, index: number) => {
            const isActive = currentSong?.id === song.id;
            return (
              <div 
                key={song.id}
                onClick={() => playContext(song, artistSongs)}
                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors group ${
                  isActive ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/50'
                }`}
              >
                {/* Number column like Spotify */}
                <div className="w-6 text-center text-zinc-500 text-sm font-medium group-hover:hidden">
                  {index + 1}
                </div>
                <div className="w-6 text-center text-white hidden group-hover:block">
                  <PlayIcon className="w-4 h-4 mx-auto" />
                </div>

                <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden shadow-md">
                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                  {isActive && isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-4 h-4 text-emerald-500 animate-pulse">
                         <svg fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${isActive ? 'text-emerald-400' : 'text-white'}`}>
                    {song.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
