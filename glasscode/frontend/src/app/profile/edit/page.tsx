'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { useProfile } from '../../../components/ProfileProvider';

const presetAvatars: { id: string; emoji: string }[] = [
  { id: 'cat', emoji: '🐱' },
  { id: 'dog', emoji: '🐶' },
  { id: 'rocket', emoji: '🚀' },
  { id: 'book', emoji: '📘' },
  { id: 'code', emoji: '💻' },
];

export default function EditProfilePage() {
  const { profile, setDisplayName, setAvatarImage, setPresetAvatar } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizePx = 96;

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
        <div className="flex items-center space-x-4 mb-6">
          {profile.avatarUrl ? (
            <Image src={profile.avatarUrl} alt="Profile" className="rounded-full object-cover" width={sizePx} height={sizePx} />
          ) : (
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl" style={{ width: sizePx, height: sizePx }}>
              <span>{profile.avatarPresetId ? presetAvatars.find(a => a.id === profile.avatarPresetId)?.emoji : '👤'}</span>
            </div>
          )}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              defaultValue={profile.displayName || ''}
              onBlur={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Enter display name"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="block w-full text-sm" />
          <p className="text-xs text-gray-500 mt-1">Images are stored locally in your browser for now.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Or select a preset avatar</label>
          <div className="flex gap-2 flex-wrap">
            {presetAvatars.map(a => (
              <button
                key={a.id}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border ${profile.avatarPresetId === a.id ? 'border-blue-600' : 'border-gray-300 dark:border-gray-700'} bg-gray-100 dark:bg-gray-700`}
                onClick={() => setPresetAvatar(a.id)}
                aria-label={`Select avatar ${a.emoji}`}
              >
                {a.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}