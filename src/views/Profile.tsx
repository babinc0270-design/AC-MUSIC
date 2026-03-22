import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CameraIcon,
  EditIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  EyeOffIcon,
  LogOutIcon,
  SpinnerIcon,
  UserIcon,
} from '../components/Icons';

const IMGBB_API_KEY = '24f50a1261d7473c7f429e2a88c814fa';

interface ProfileProps {
  onSignOut: () => void;
}

export default function Profile({ onSignOut }: ProfileProps) {
  const { userProfile, signOut, updateUserProfile, changePassword } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Name edit state
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(userProfile?.displayName ?? '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  // Avatar upload state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Sign out
  const [signOutLoading, setSignOutLoading] = useState(false);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <SpinnerIcon className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // This guarantees the app always has a string to work with, preventing the crash!
  const safeName = userProfile.displayName || userProfile.email || 'User';
  const initials = safeName
    .split(' ')
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  /* ── Avatar upload ── */
  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 5 MB.');
      return;
    }
    setAvatarLoading(true);
    setAvatarError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (!json.success) throw new Error('ImgBB upload failed.');
      const url: string = json.data.display_url;
      await updateUserProfile({ photoURL: url });
    } catch {
      setAvatarError('Image upload failed. Please try again.');
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Name save ── */
  const handleNameSave = async () => {
    if (!nameValue.trim()) return setNameError('Name cannot be empty.');
    setNameLoading(true);
    setNameError('');
    try {
      await updateUserProfile({ displayName: nameValue.trim() });
      setEditingName(false);
    } catch {
      setNameError('Failed to update name.');
    } finally {
      setNameLoading(false);
    }
  };

  const cancelNameEdit = () => {
    setNameValue(userProfile.displayName ?? '');
    setEditingName(false);
    setNameError('');
  };

  /* ── Password change ── */
  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (newPwd.length < 6) return setPwdError('New password must be at least 6 characters.');
    if (newPwd !== confirmPwd) return setPwdError('Passwords do not match.');
    setPwdLoading(true);
    try {
      await changePassword(currentPwd, newPwd);
      setPwdSuccess('Password updated successfully!');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setPwdError('Current password is incorrect.');
      } else {
        setPwdError('Failed to update password. Please try again.');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    await signOut();
    onSignOut();
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>

      {/* ── Avatar Section ── */}
      <div className="flex items-center gap-6 mb-10">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-zinc-700 flex items-center justify-center ring-2 ring-zinc-700">
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-white">{initials}</span>
            )}
            {avatarLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                <SpinnerIcon className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            )}
          </div>
          {/* Camera overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition cursor-pointer"
            title="Change photo"
          >
            <CameraIcon className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div>
          <p className="text-white font-semibold text-lg">
            {userProfile.displayName || 'Anonymous'}
          </p>
          <p className="text-zinc-400 text-sm">{userProfile.email}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition"
          >
            Change photo
          </button>
          {avatarError && <p className="text-red-400 text-xs mt-1">{avatarError}</p>}
        </div>
      </div>

      {/* ── Display Name ── */}
      <section className="mb-8 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Display Name
          </h2>
          {!editingName && (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
            >
              <EditIcon className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        {editingName ? (
          <div className="space-y-3">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition"
              autoFocus
            />
            {nameError && <p className="text-red-400 text-xs">{nameError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleNameSave}
                disabled={nameLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black text-xs font-semibold rounded-lg transition"
              >
                {nameLoading ? <SpinnerIcon className="w-3.5 h-3.5 animate-spin" /> : <CheckIcon className="w-3.5 h-3.5" />}
                Save
              </button>
              <button
                onClick={cancelNameEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
              >
                <XIcon className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-white font-medium">{userProfile.displayName || '—'}</p>
        )}
      </section>

      {/* ── Email (read-only) ── */}
      <section className="mb-8 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Email
        </h2>
        <p className="text-white font-medium flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-zinc-500" />
          {userProfile.email}
        </p>
        <p className="text-xs text-zinc-600 mt-1">Email cannot be changed.</p>
      </section>

      {/* ── Change Password ── */}
      <section className="mb-8 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          {/* Current password */}
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="Current password"
              required
              className="w-full bg-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((p) => !p)}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition"
            >
              {showCurrent ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>

          {/* New password */}
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="New password (min. 6 chars)"
              required
              className="w-full bg-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowNew((p) => !p)}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition"
            >
              {showNew ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>

          {/* Confirm new password */}
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full bg-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition"
            >
              {showConfirm ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>

          {pwdError && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {pwdError}
            </p>
          )}
          {pwdSuccess && (
            <p className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              {pwdSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={pwdLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
          >
            {pwdLoading && <SpinnerIcon className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>
      </section>

      {/* ── Sign Out ── */}
      <button
        onClick={handleSignOut}
        disabled={signOutLoading}
        className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium rounded-xl transition"
      >
        {signOutLoading ? (
          <SpinnerIcon className="w-4 h-4 animate-spin" />
        ) : (
          <LogOutIcon className="w-4 h-4" />
        )}
        Sign Out
      </button>
    </div>
  );
}
