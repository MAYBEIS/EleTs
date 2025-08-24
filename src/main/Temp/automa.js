/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-08-24 09:59:34
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-08-24 09:59:49
 * @FilePath: \EleTs\src\renderer\src\jsTemp\automa.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const Title = automaRefData('variables', 'Title');
const ModelHref = automaRefData('variables', 'ModelHref');
const TriggerWords = automaRefData('variables', 'TriggerWords');
const UsageTips = automaRefData('variables', 'UsageTips');
const Hash = automaRefData('variables', 'Hash');
const Desc = automaRefData('variables', 'Desc');
const Version = automaRefData('variables', 'Version');
const Type_1 = automaRefData('variables', 'Type_1');
const currentUrl = window.location.href;


const Name1 = Title+"--"+Version+"--"+Hash
function convertToValidFilename(text) {
    // 先去除空格
    let result = text.replace(/\s+/g, '');
    
    // 替换非法文件名字符为下划线
    // Windows 文件名不允许包含 \ / : * ? " < > |
    result = result.replace(/[\\/:*?"<>|]+/g, '_');
    return result;
}
const Name = convertToValidFilename(Name1);
automaSetVariable('Name1', Name);
//$automa.variables.set('Name1', Name);
const TxtName = Name+".txt"
const text = Title+"\n\nC站网址：\n"+currentUrl+"\n模型ID:\n"+Hash+"\nVersion:\n"+"使用TIP："+UsageTips+"\n触发词：\n"+TriggerWords+"\n版本号："+Version+"\n\n\n"+Desc// 获取要写入的文本内容

// 创建 Blob 对象
const blob = new Blob([text], { type: 'text/plain' });

// 创建下载链接
const url = URL.createObjectURL(blob);

// 创建一个隐藏的<a>标签用于下载
const link = document.createElement('a');
link.href = url;
link.download = TxtName; // 设置文件名
link.style.display = 'none';

// 添加到文档中并触发点击
document.body.appendChild(link);
link.click();

// 清理
document.body.removeChild(link);
URL.revokeObjectURL(url);


// 生成 JSON 文件
const Title_json = Type_1
let triggerWordsString;
try {
    // 尝试将数组元素用逗号连接成字符串
    triggerWordsString = TriggerWords.join(',');
    triggerWordsString = " {"+triggerWordsString+"}"
} catch (error) {
    // 如果出现异常，将 triggerWordsString 赋值为空字符串
    triggerWordsString = "";
}
const jsonData = {
    "description": Title_json+triggerWordsString+"\n"+currentUrl,
    "activation text": triggerWordsString,
    "notes": Desc
};

// 将 JSON 对象转换为字符串
const jsonText = JSON.stringify(jsonData, null, 2);

// 生成 JSON 文件名
const JsonName = Name + ".json";

// 创建 JSON Blob 对象
const jsonBlob = new Blob([jsonText], { type: 'application/json' });

// 创建 JSON 下载链接
const jsonUrl = URL.createObjectURL(jsonBlob);

// 创建一个隐藏的 <a> 标签用于下载 JSON 文件
const jsonLink = document.createElement('a');
jsonLink.href = jsonUrl;
jsonLink.download = JsonName; // 设置 JSON 文件名
jsonLink.style.display = 'none';

// 添加到文档中并触发点击
document.body.appendChild(jsonLink);
jsonLink.click();

// 清理
document.body.removeChild(jsonLink);
URL.revokeObjectURL(jsonUrl);


automaNextBlock()