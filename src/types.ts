export interface Song {
  id: number;
  title: string;
  artist: string[];
  genre: string[];
  album: string;
  cover: string;
  audio: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  likedSongs: number[];
}

export type ViewType = 'home' | 'search' | 'liked' | 'profile' | 'auth';
