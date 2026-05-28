/**
 * Utilitário para definir e usar a pasta local onde os arquivos de backup
 * (.json) serão salvos no computador da usuária.
 *
 * Usa a File System Access API (Chromium/Edge). Em navegadores sem suporte
 * (Firefox/Safari), faz fallback para a pasta de Downloads padrão do navegador.
 *
 * O FileSystemDirectoryHandle é persistido em IndexedDB (localStorage não
 * aceita esse tipo de objeto). O nome da pasta é guardado em localStorage
 * apenas para exibição.
 */

const DB_NAME = "cda-backup-prefs";
const STORE = "handles";
const KEY = "backupFolder";
const LS_NAME_KEY = "cda:backup:folderName";

function isFsApiSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as any).showDirectoryPicker === "function";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result ?? null) as T | null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, val: any): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

async function idbDel(key: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

export const backupLocation = {
  isSupported: isFsApiSupported,

  /** Nome amigável da pasta selecionada, se houver. */
  getSavedFolderName(): string | null {
    try { return localStorage.getItem(LS_NAME_KEY); } catch { return null; }
  },

  /** Retorna handle salvo (se ainda houver permissão). */
  async getSavedHandle(): Promise<any | null> {
    if (!isFsApiSupported()) return null;
    const handle = await idbGet<any>(KEY);
    try {
      const opts = { mode: "readwrite" as const };
      const perm: string = (await (handle as any).queryPermission?.(opts)) ?? "granted";
      if (perm === "granted") return handle;
      const req: string = (await (handle as any).requestPermission?.(opts)) ?? "denied";
      return req === "granted" ? handle : null;
    } catch {
      return null;
    }
  },

  /** Abre o seletor nativo de pasta e persiste a escolha. */
  async pickFolder(): Promise<{ name: string } | null> {
    if (!isFsApiSupported()) return null;
    try {
      const handle = await (window as any).showDirectoryPicker({ id: "cda-backup", mode: "readwrite" });
      await idbSet(KEY, handle);
      try { localStorage.setItem(LS_NAME_KEY, handle.name); } catch { /* ignore */ }
      return { name: handle.name };
    } catch (err: any) {
      // AbortError = usuária cancelou
      if (err?.name === "AbortError") return null;
      throw err;
    }
  },

  /** Remove a pasta escolhida (volta a usar Downloads do navegador). */
  async clearFolder(): Promise<void> {
    await idbDel(KEY);
    try { localStorage.removeItem(LS_NAME_KEY); } catch { /* ignore */ }
  },

  /**
   * Salva um arquivo. Se houver pasta configurada e suportada, escreve direto
   * nela. Caso contrário, dispara o download tradicional do navegador (vai para
   * a pasta de Downloads padrão do sistema).
   */
  async saveFile(filename: string, blob: Blob): Promise<"folder" | "download"> {
    const handle = await this.getSavedHandle();
    if (handle) {
      try {
        const fileHandle = await handle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return "folder";
      } catch {
        // Em caso de erro de permissão/IO, cai para download.
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return "download";
  },
};
