'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Profile = {
  displayName?: string;
  avatarUrl?: string; // data URL or remote URL
  avatarPresetId?: string; // identifier for preset avatar
};

type ProfileContextType = {
  profile: Profile;
  setProfile: (p: Profile) => void;
  setDisplayName: (name: string) => void;
  setAvatarImage: (dataUrl: string) => void;
  setPresetAvatar: (presetId: string) => void;
  clearAvatar: () => void;
};

const defaultProfile: Profile = {};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = (): ProfileContextType => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
};

export default function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(defaultProfile);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('profile-data');
      if (raw) {
        const parsed = JSON.parse(raw) as Profile;
        setProfileState({ ...defaultProfile, ...parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('profile-data', JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  const setProfile = (p: Profile) => setProfileState(p);
  const setDisplayName = (name: string) => setProfileState(prev => ({ ...prev, displayName: name }));
  const setAvatarImage = (dataUrl: string) => setProfileState(prev => ({ ...prev, avatarUrl: dataUrl, avatarPresetId: undefined }));
  const setPresetAvatar = (presetId: string) => setProfileState(prev => ({ ...prev, avatarPresetId: presetId, avatarUrl: undefined }));
  const clearAvatar = () => setProfileState(prev => ({ ...prev, avatarUrl: undefined, avatarPresetId: undefined }));

  return (
    <ProfileContext.Provider value={{ profile, setProfile, setDisplayName, setAvatarImage, setPresetAvatar, clearAvatar }}>
      {children}
    </ProfileContext.Provider>
  );
}