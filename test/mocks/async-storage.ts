const store = new Map<string, string>();

export default {
  setItem: jest.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
  getItem: jest.fn(async (key: string) => store.get(key) ?? null),
  removeItem: jest.fn(async (key: string) => {
    store.delete(key);
  }),
  clear: jest.fn(async () => {
    store.clear();
  }),
  getAllKeys: jest.fn(async () => [...store.keys()]),
};
