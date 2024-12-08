// ipc.test.js
// TODO: test jtest
import { ipcMain } from 'electron';

// 我们需要在文件的开头定义要测试的 ipcMain.handle
ipcMain.handle('test:Voke', async (_, __) => {
  return "ok123";
});

describe('IPC Main Tests', () => {
  test('test:Voke should return "ok123"', async () => {
    const result = await ipcMain.invoke('test:Voke');
    expect(result).toBe("ok123");
  });
});