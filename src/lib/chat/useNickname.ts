"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "khm-chat-nickname";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

/** No servidor não há apelido: o gate de entrada é renderizado até a hidratação. */
function getServerSnapshot(): string | null {
  return null;
}

/**
 * Lê o apelido direto do localStorage via useSyncExternalStore — evita o
 * setState dentro de efeito e mantém abas abertas em sincronia.
 */
export function useNickname() {
  const nickname = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const save = useCallback((value: string) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    emit();
  }, []);

  const clear = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    emit();
  }, []);

  return { nickname, save, clear };
}
