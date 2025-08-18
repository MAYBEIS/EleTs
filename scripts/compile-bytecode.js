const bytenode = require('bytenode');
const path = require('path');
const fs = require('fs');

// 编译主进程文件为字节码
function compileMainProcess() {
  const outDir = path.join(__dirname, '../out');
  
  // 确保out目录存在
  if (!fs.existsSync(outDir)) {
    console.log('请先运行 npm run build 构建项目');
    process.exit(1);
  }

  const mainIndexPath = path.join(outDir, 'main/index.js');
  const mainBytecodePath = path.join(outDir, 'main/index.jsc');

  // 检查主进程JS文件是否存在
  if (!fs.existsSync(mainIndexPath)) {
    console.log('未找到主进程文件，请先运行 npm run build 构建项目');
    process.exit(1);
  }

  console.log('正在编译主进程文件为字节码...');
  try {
    bytenode.compileFile({
      filename: mainIndexPath,
      output: mainBytecodePath,
      electron: true
    });
    console.log('主进程字节码编译完成:', mainBytecodePath);
    return true;
  } catch (error) {
    console.error('主进程字节码编译失败:', error);
    return false;
  }
}

// 创建一个启动字节码的包装器
function createBytecodeLauncher() {
  const launcherContent = `
const { app } = require('electron');
const bytenode = require('bytenode');

// 启动字节码版本的应用
require('./index.jsc');
`;

  const launcherPath = path.join(__dirname, '../out/main/launcher.js');
  fs.writeFileSync(launcherPath, launcherContent);
  console.log('已创建字节码启动器:', launcherPath);
}

// 更新package.json中的main字段指向启动器
function updatePackageJson() {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  // 保存原始main字段以便恢复
  if (!packageJson._main_original) {
    packageJson._main_original = packageJson.main;
  }

  // 设置main字段为启动器
  packageJson.main = './out/main/launcher.js';

  // 写回package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('已更新package.json的main字段指向启动器');
}

// 主函数
function main() {
  console.log('开始字节码编译过程...');
  
  // 编译主进程
  if (compileMainProcess()) {
    createBytecodeLauncher();
    updatePackageJson();
    console.log('\n字节码编译完成！现在可以使用 npm start 命令运行加密后的应用。');
  } else {
    console.log('\n字节码编译失败！');
    process.exit(1);
  }
}

main();