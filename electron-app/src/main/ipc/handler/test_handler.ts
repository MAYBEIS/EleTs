import { ipcMain } from 'electron'
/**
 * ipcMain
 * @description 获取目录下的 catalog-items
 */
ipcMain.handle('test:Voke', async (_,) => {
return "ok123"
})