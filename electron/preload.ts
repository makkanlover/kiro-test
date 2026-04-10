import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // File operations
  selectEnvFile: () => ipcRenderer.invoke('select-env-file'),
  
  // Secure storage
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store-delete', key),
    clear: () => ipcRenderer.invoke('store-clear')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI