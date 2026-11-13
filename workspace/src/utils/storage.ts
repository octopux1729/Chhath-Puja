const SOUND_MUTED_KEY = 'chhath_ghat_3d_muted_v1';

export function loadMutedPref(): boolean {
  try {
    return localStorage.getItem(SOUND_MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMutedPref(muted: boolean): void {
  try {
    localStorage.setItem(SOUND_MUTED_KEY, muted ? '1' : '0');
  } catch {
    // ignore
  }
}
