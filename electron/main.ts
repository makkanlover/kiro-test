import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { readFile } from 'fs/promises'
import Store from 'electron-store'

const store = new Store()
const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    },
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../assets/icon.png')
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist-renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for secure file operations
ipcMain.handle('select-env-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Environment Files', extensions: ['env'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  if (result.canceled) return null
  
  try {
    const content = await readFile(result.filePaths[0], 'utf-8')
    return content
  } catch (error) {
    console.error('Error reading env file:', error)
    return null
  }
})

// Secure storage operations
ipcMain.handle('store-get', async (_, key: string) => {
  return store.get(key)
})

ipcMain.handle('store-set', async (_, key: string, value: any) => {
  store.set(key, value)
})

ipcMain.handle('store-delete', async (_, key: string) => {
  store.delete(key)
})

ipcMain.handle('store-clear', async () => {
  store.clear()
})