const fs = require('fs');
const path = require('path');

// 恢复package.json中的main字段
const packagePath = path.join(__dirname, '../package.json');
const packageJson = require(packagePath);

// 检查是否存在原始main字段
if (packageJson._main_original) {
  packageJson.main = packageJson._main_original;
  delete packageJson._main_original;
  
  // 写回package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('已恢复package.json的main字段为原始JS文件');
} else {
  console.log('未找到原始main字段，无需恢复');
}

console.log('已恢复原始配置，现在可以正常开发了。');