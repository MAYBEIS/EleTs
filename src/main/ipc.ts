import { ipcMain } from 'electron';

export function setupIpc() {
  ipcMain.handle('some-channel', async (event, arg) => {
    console.log(`Received from renderer: ${arg}`);
    return `Hello, ${arg}`;
  });

  ipcMain.handle('another-channel', async (event, arg) => {
    console.log(`Another channel received: ${arg}`);
    return `You called another channel with argument: ${arg}`;
  });
}