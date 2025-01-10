import Application from 'spectron';
import { app } from 'electron';
import * as path from 'path';

const appPath = path.join(__dirname, '../src');
const application = new Application({
  path: app.getPath('exe'), // 或者直接指定你的 electron 可执行文件路径
});

describe('IPC Integration Tests', () => {
  beforeAll(() => application.start());
  afterAll(() => application.stop());

  it('should respond with a greeting from IPC', async () => {
    const sendButton = await application.client.$('#send');
    await sendButton.click();

    const response = await application.client.$('#response');
    const responseText = await response.getText();

    expect(responseText).toBe('Hello, World');
  });
});