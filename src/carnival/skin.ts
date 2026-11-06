/** The carnival's looks. Each skin is a full set of theme values in `theme.ts`. */
export const SKIN_IDS = ['carnival', 'christmas'] as const;
export type SkinId = (typeof SKIN_IDS)[number];

/** The skin a player gets until they pick one. */
export const DEFAULT_SKIN: SkinId = 'christmas';

type SkinStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'tessl-carnival:skin';

function memoryStorage(): SkinStorage {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
  };
}

export function isSkinId(value: unknown): value is SkinId {
  return SKIN_IDS.includes(value as SkinId);
}

export function createSkinStore(storage: SkinStorage) {
  let store = storage;

  function current(): SkinId {
    try {
      const stored = store.getItem(STORAGE_KEY);
      return isSkinId(stored) ? stored : DEFAULT_SKIN;
    } catch {
      return DEFAULT_SKIN;
    }
  }

  function set(id: SkinId) {
    if (!isSkinId(id)) throw new Error(`Unknown skin: ${String(id)}`);
    try {
      store.setItem(STORAGE_KEY, id);
    } catch {
      // Storage can refuse a write. Keep the choice for this page load only.
      store = memoryStorage();
      store.setItem(STORAGE_KEY, id);
    }
  }

  return { current, set };
}

function browserStorage(): SkinStorage {
  try {
    return window.localStorage;
  } catch {
    // Private windows and test runs: keep the choice for this page load only.
    return memoryStorage();
  }
}

const skins = createSkinStore(browserStorage());

/** The skin the page uses. `theme` resolves to it when the page loads. */
export const currentSkin = skins.current;
/** Remembers a skin. It takes effect on the next page load. */
export const setSkin = skins.set;
