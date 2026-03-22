import type { Song } from './types';

export const SONGS: Song[] = [
  {
    id: 1,
    title: '295',
    artist: ['Sidhu Moose Wala'],
    album: 'Moosetape',
    genre: ['Progressive', 'Conscious Hip Hop'],
    cover:
      'https://res.cloudinary.com/dr1rn40sn/image/upload/v1774073930/8cbef7af042f82b961cdce9c06ba8ab0_1_eqog87.jpg',
    audio:
      'https://dn721502.ca.archive.org/0/items/the-weeknd-sao-paulo-official-audio-mp-3-320-k/295%20%28Official%20Audio%29%20_%20Sidhu%20Moose%20Wala%20_%20The%20Kidd%20_%20Moosetape%28MP3_320K%29.mp3',
  },
  {
    id: 2,
    title: 'São Paulo',
    artist: ['The Weeknd', 'Anitta'],
    album: 'São Paulo',
    genre: ['Brazilian funk'],
    cover:
      'https://res.cloudinary.com/dr1rn40sn/image/upload/v1774073930/sao-paulo-single-cover-v0-pz7w6yw49yxd1_arqaa3.jpg',
    audio:
      'https://dn721502.ca.archive.org/0/items/the-weeknd-sao-paulo-official-audio-mp-3-320-k/The%20Weeknd%20-%20S%C3%A3o%20Paulo%20%28Official%20Audio%29%28MP3_320K%29.mp3',
  },
  {
    id: 3,
    title: 'Counting Stars',
    artist: ['OneRepublic'],
    album: 'Native',
    genre: ['POP-Rock'],
    cover:
      'https://res.cloudinary.com/dr1rn40sn/image/upload/v1774073930/9628291be1b27383ef34a17548f06377_f5jf6l.jpg',
    audio:
      'https://dn721502.ca.archive.org/0/items/the-weeknd-sao-paulo-official-audio-mp-3-320-k/Counting%20Stars%28MP3_320K%29.mp3',
  },
  {
    id: 4,
    title: 'Me and the Devil',
    artist: ['Soap&Skin'],
    album: 'Sugarbread', // Same album as song 1!
    genre: [
      ' Alternative/Experimental',
      'Dark Wave',
      'Neo-classical Dark Wave',
    ], // Same genre as song 1!
    cover:
      'https://res.cloudinary.com/dr1rn40sn/image/upload/v1774073930/Me-and-the-Devil-Unknown-2024-20241101075332-500x500_ohewkj.jpg',
    audio:
      'https://dn721502.ca.archive.org/0/items/the-weeknd-sao-paulo-official-audio-mp-3-320-k/Me%20And%20The%20Devil%20%28SLOWED%20%20%20ECO%29%28MP3_320K%29.mp3',
  },
  {
    id: 5,
    title: 'Skyfall',
    artist: ['Adele'],
    album: 'Deep Space',
    genre: ['Orchestral pop', 'pop-soul'],
    cover:
      'https://res.cloudinary.com/dr1rn40sn/image/upload/v1774073930/skyfall-poster-official001f_nvb8vx.jpg',
    audio:
      'https://dn721502.ca.archive.org/0/items/the-weeknd-sao-paulo-official-audio-mp-3-320-k/Adele%20-%20Skyfall%20%28Official%20Lyric%20Video%29%28MP3_320K%29.mp3',
  },
];
