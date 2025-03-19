import { ipcMain } from 'electron'

/**
 * ipcMain
 * @description TEMP handler
 */
ipcMain.handle('T:Name1', async (_, params: string) => {
    return "nihao"
})

