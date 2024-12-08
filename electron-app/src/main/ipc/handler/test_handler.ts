import { ipcMain } from 'electron'
/**
 * ipcMain
 * @description 获取目录下的 catalog-items
 */
ipcMain.handle('get-catalog-items', async (_, folderPath: string) => {
return "await AddonService.getCatalogItems(folderPath)"
})