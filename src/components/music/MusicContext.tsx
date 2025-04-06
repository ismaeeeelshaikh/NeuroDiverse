'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

// Define the track type
interface Track {
  id: number;
  title: string;
  file: string;
  description: string;
}

// Define the context type
interface MusicContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  audioTracks: {
    nature: Track[];
    rain: Track[];
    piano: Track[];
  };
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

// Create the context with a default value
const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Provider component
export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio tracks organized by category
  const audioTracks = {
    nature: [
      { id: 1, title: 'Forest Birds', file: '/audio/relaxation/forest-birds.mp3', description: 'Peaceful sounds of birds in a forest environment' },
      { id: 2, title: 'Midnight Forest', file: '/audio/relaxation/midnight-forest.mp3', description: 'Calming night sounds from a forest setting' },
    ],
    rain: [
      { id: 3, title: 'Gentle Rain', file: '/audio/relaxation/gentle-rain.mp3', description: 'Soft rainfall sounds for relaxation' },
      { id: 4, title: 'Summer Rain', file: '/audio/relaxation/summer-rain.mp3', description: 'Warm summer rain sounds with distant thunder' },
      { id: 5, title: 'Rainy Tropics', file: '/audio/relaxation/rainy-tropics.mp3', description: 'Rain in a tropical setting with birds singing' },
    ],
    piano: [
      { id: 6, title: 'Relaxing Piano', file: '/audio/relaxation/relaxing-piano.mp3', description: 'Soothing piano melodies for focus and relaxation' },
    ]
  };

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.file;
      if (isPlaying) {
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      }
    }
  }, [currentTrack]);

  // Play a specific track
  const playTrack = (track: Track) => {
    if (currentTrack && currentTrack.id === track.id) {
      togglePlay();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.error('Error playing audio:', err));
    }
    setIsPlaying(!isPlaying);
  };

  // Set volume
  const setVolume = (newVolume: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = newVolume;
    setVolumeState(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume;
    } else {
      audioRef.current.volume = 0;
    }
    setIsMuted(!isMuted);
  };

  // Context value
  const value = {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    audioTracks,
    playTrack,
    togglePlay,
    setVolume,
    toggleMute,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};

// Custom hook to use the music context
export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

// Export useMusicContext as an alias for useMusic for backward compatibility
export const useMusicContext = useMusic; 