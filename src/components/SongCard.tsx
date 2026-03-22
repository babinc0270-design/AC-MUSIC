import React, { useState } from 'react';
import { PlayIcon, PauseIcon, HeartIcon, HeartFilledIcon } from './Icons';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import type { Song } from '../types';

interface SongCardProps {
  song: Song;
  onAuthRequired?: () => void;
}

export function SongCard({ song, onAuthRequired }: SongCardProps) {
  const { currentSong, isPlaying, playSong } = usePlayer();
  const { userProfile, toggleLikedSong, user } = useAuth();
  const [likeLoading, setLikeLoading] = useState(false);

  const isCurrentSong = currentSong?.id === song.id;
  const isLiked = userProfile && userProfile.likedSongs ? userProfile.likedSongs.includes(song.id) : false;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(song);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onAuthRequired?.();
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      await toggleLikedSong(song.id);
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => playSong(song)}
      onKeyDown={(e) => e.key === 'Enter' && playSong(song)}
      className={`group relative bg-zinc-900 hover:bg-zinc-800/80 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isCurrentSong ? 'ring-1 ring-emerald-500/30' : ''
      }`}
    >
      {/* Cover image */}
      <div className="relative aspect-square overflow-hidden bg-zinc-800">
        <img
          src={song.cover}
          alt={song.album}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Controls on hover */}
        <div className="absolute inset-0 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Play button */}
          <button
            onClick={handlePlay}
            className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all hover:scale-110 active:scale-95"
            aria-label={isCurrentSong && isPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentSong && isPlaying ? (
              <PauseIcon className="w-5 h-5 text-black" />
            ) : (
              <PlayIcon className="w-5 h-5 text-black" />
            )}
          </button>

          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-all hover:scale-110 active:scale-95 ${
              isLiked
                ? 'text-emerald-400 bg-black/30'
                : 'text-white/80 hover:text-white bg-black/20'
            } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            {isLiked ? (
              <HeartFilledIcon className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Always-visible playing bars indicator */}
        {isCurrentSong && (
          <div className="absolute top-2.5 right-2.5 flex items-end gap-[3px] h-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-[3px] bg-emerald-400 rounded-full ${
                  isPlaying ? 'animate-bounce' : ''
                }`}
                style={{
                  height: `${30 + i * 25}%`,
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="p-3">
        <h3
          className={`font-semibold text-sm truncate leading-tight ${
            isCurrentSong ? 'text-emerald-400' : 'text-white'
          }`}
        >
          {song.title}
        </h3>
        <p className="text-zinc-400 text-xs truncate mt-1">
          {song.artist.join(', ')}
        </p>
        <p className="text-zinc-600 text-xs truncate mt-0.5">{song.album}</p>
      </div>
    </div>
  );
}
