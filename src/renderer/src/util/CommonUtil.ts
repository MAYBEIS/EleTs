const ipcRenderer = window.electron.ipcRenderer

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param duration 防抖时间
 */
export function debounce(fn: (...arg: unknown[]) => unknown, duration: number = 300) {
  let timer = -1
  return function (this: unknown, ...args: unknown[]) {
    if (timer > -1) {
      clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      fn.bind(this)(...args)
      timer = -1
    }, duration)
  }
}

/**
 * 获取主题颜色
 * @param color 颜色值
 */
export function getThemeColor(color: string) {
  /**
   * 要求：
   * 给定一个颜色值, 分别返回在白色背景下 100%, 60%, 95%, 50% 透明度下的颜色值
   * 返回对应 primaryColor, primaryColorHover, primaryColorPressed, primaryColorSuppl
   * 不能用带透明度的颜色值
   */
  const white = '#FFFFFF'

  // 计算不同透明度的颜色值
  const primaryColor = color
  const primaryColorHover = mixColors(color, white, 0.6) // 60% 透明度
  const primaryColorPressed = mixColors(color, white, 0.95) // 95% 透明度
  const primaryColorSuppl = mixColors(color, white, 0.5) // 50% 透明度

  return {
    primaryColor,
    primaryColorHover,
    primaryColorPressed,
    primaryColorSuppl
  }
}

/**
 * 混合两个颜色值
 * @param color1
 * @param color2
 * @param weight
 */
function mixColors(color1: string, color2: string, weight: number): string {
  const d2h = (d: number) => d.toString(16).padStart(2, '0') // 数字转十六进制
  const h2d = (h: string) => parseInt(h, 16) // 十六进制转数字
  return (
    '#' +
    d2h(
      Math.floor(h2d(color1.substring(1, 3)) * weight + h2d(color2.substring(1, 3)) * (1 - weight))
    ) +
    d2h(
      Math.floor(h2d(color1.substring(3, 5)) * weight + h2d(color2.substring(3, 5)) * (1 - weight))
    ) +
    d2h(
      Math.floor(h2d(color1.substring(5, 7)) * weight + h2d(color2.substring(5, 7)) * (1 - weight))
    )
  )
}

/**
 * 获取文件夹下的所有 .var 文件路径
 */
export async function getVarsFromPath(dir: string) {
  return await ipcRenderer.invoke('fs:get-all-files', dir, 'var')
}

/**
 * 通过“文件路径”获取“文件名”（不带后缀）
 * @param path 文件路径
 * @parm ext 文件后缀
 * @returns {string} 文件名
 */
export function getVarNameFromPath(path: string, ext = 'var'): string {
  const dotExt = '.' + ext
  const index = path.lastIndexOf('\\')
  let result = path.substring(index + 1)
  if (result.endsWith(dotExt)) {
    result = result.substring(0, result.length - dotExt.length) // 去掉 .ext 文件后缀
  }
  return result
}

/**
 * 通过“文件路径”获取“文件名”（带后缀）
 * @param path 文件路径
 * @returns {string} 文件名
 */
export function getFileNameWithExtension(path: string): string {
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1]
}

/**
 * 通过“文件路径”获取“文件名”（不带后缀）
 * @param path 文件路径
 * @returns {string} 文件名
 */
export function getFileNameWithoutExtension(path: string): string {
  const fileName = getFileNameWithExtension(path)
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex === -1 ? fileName : fileName.substring(0, dotIndex)
}

/**
 * 通过“文件夹路径”获取“文件夹名”
 * @param path 文件夹路径
 * @returns {string} 文件夹名
 */
export function getFolderNameFromPath(path: string): string {
  const index = path.lastIndexOf('\\')
  return path.substring(index + 1)
}

/**
 * 格式化文件大小
 * @param size 文件大小
 * @returns {string} 格式化文本后的大小字符串
 */
export function formatSize(size: number | null | undefined): string {
  if (size === null || size === undefined) return '无信息'
  const totalGB = size / 1024 / 1024 / 1024
  const totalMB = size / 1024 / 1024
  const totalKB = size / 1024
  let totalSize = ''
  if (totalGB > 1) {
    totalSize = `${totalGB.toFixed(2)}GB`
  } else if (totalMB > 1) {
    totalSize = `${totalMB.toFixed(2)}MB`
  } else {
    totalSize = `${totalKB.toFixed(2)}KB`
  }
  // const totalSize = totalMB > 1 ? `${totalMB.toFixed(2)}MB` : `${totalKB.toFixed(2)}KB`
  return totalSize
}

/**
 * 用浏览器打开链接
 * @param url 链接
 */
export function openUrl(url: string | null) {
  if (!url) return
  window.electron.ipcRenderer.invoke('open-url', url)
}

/**
 * 格式化时间文本
 * @param time
 * @returns {string} 格式化后的时间文本
 */
export function formatTime(time: number): string {
  /**
   * 要求：
   * 给定时间戳, 返回格式化后的时间
   * 如果在1分钟内, 返回 '刚刚'
   * 如果在1小时内, 返回 'xx分钟前'
   * 如果在24小时内, 返回 'xx小时前'
   * 如果在7天内, 返回 'xx天前'
   * 如果是今年内, 返回 'xx月xx日'
   * 否则返回 'xxxx年xx月xx日'
   */
  const now = new Date().getTime()
  const diff = now - time

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    const minutesAgo = Math.floor(diff / minute)
    return `${minutesAgo}分钟前`
  } else if (diff < day) {
    const hoursAgo = Math.floor(diff / hour)
    return `${hoursAgo}小时前`
  } else if (diff < week) {
    const daysAgo = Math.floor(diff / day)
    return `${daysAgo}天前`
  } else {
    const nowDate = new Date()
    const timeDate = new Date(time)

    if (nowDate.getFullYear() === timeDate.getFullYear()) {
      return `${timeDate.getMonth() + 1}月${timeDate.getDate()}日`
    } else {
      return `${timeDate.getFullYear()}年${timeDate.getMonth() + 1}月${timeDate.getDate()}日`
    }
  }
}

/**
 * 拼合路径
 * @param paths 路径数组
 * @returns {string} 拼合后的路径
 */
export function joinPath(...paths: string[]): string {
  const separator = '\\'
  const replaceRegex = new RegExp(`\\${separator}{1,}`, 'g')

  return paths
    .map((path) => path.replace(/[/\\]+/g, separator))
    .join(separator)
    .replace(replaceRegex, separator)
}

/**
 * 获取文件后缀名
 * @param filePath 文件路径
 * @returns {string} 文件后缀名
 */
export function getFileExt(filePath: string): string {
  return filePath.split('.').pop() || ''
}

/**
 * 分批赋值
 * @param targetArray
 * @param sourceArray
 * @param batchSize
 */
export function batchAssign<T>(
  targetArray: T[],
  sourceArray: T[],
  batchSize: number = 50
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0

    function loadBatch() {
      const batch = sourceArray.slice(index, index + batchSize)
      targetArray.push(...batch) // 添加当前批次数据

      index += batchSize // 更新索引

      if (index < sourceArray.length) {
        setTimeout(loadBatch, 0) // 延迟调用下一批
      } else {
        resolve() // 数据全部加载完成后，完成 Promise
      }
    }

    loadBatch() // 开始加载第一批数据
  })
}
