import { ipcMain } from 'electron'

/**
 * ipcMain
 * @description TEMP handler
 */
ipcMain.handle('W-version-1.1', () => {
    return "1.1"
})

