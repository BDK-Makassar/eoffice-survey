"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "eoffice_admin_key";

export function useAdminKey() {
  const [key, setKeyState] = useState<string | null | undefined>(undefined); // undefined = belum dibaca

  useEffect(() => {
    setKeyState(localStorage.getItem(STORAGE_KEY));
  }, []);

  const setKey = useCallback((k: string) => {
    localStorage.setItem(STORAGE_KEY, k);
    setKeyState(k);
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setKeyState(null);
  }, []);

  const adminFetch = useCallback(
    (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (key) headers.set("x-admin-key", key);
      return fetch(input, { ...init, headers });
    },
    [key]
  );

  return { key, setKey, clearKey, adminFetch };
}
