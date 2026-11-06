import { describe, expect, it } from 'vitest';
import { createSkinStore, currentSkin } from './skin';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('skin store', () => {
  it('is christmas when nothing is stored', () => {
    expect(createSkinStore(memoryStorage()).current()).toBe('christmas');
  });

  it('is christmas when the stored value is not a known skin', () => {
    const store = createSkinStore(memoryStorage({ 'tessl-carnival:skin': 'halloween' }));
    expect(store.current()).toBe('christmas');
  });

  it('returns the skin that was set', () => {
    const storage = memoryStorage();
    const store = createSkinStore(storage);
    store.set('carnival');
    expect(store.current()).toBe('carnival');
    expect(createSkinStore(storage).current()).toBe('carnival');
    store.set('christmas');
    expect(store.current()).toBe('christmas');
  });

  it('keeps the choice when storage refuses the write', () => {
    const store = createSkinStore({
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    });
    store.set('carnival');
    expect(store.current()).toBe('carnival');
  });

  it('defaults to christmas in a test run', () => {
    expect(currentSkin()).toBe('christmas');
  });
});
