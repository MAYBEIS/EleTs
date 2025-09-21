/**
 * 性能监控工具
 */

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 性能计时器
export class PerformanceTimer {
  private startTime: number = 0
  private marks: Map<string, number> = new Map()
  
  start(label?: string): void {
    this.startTime = performance.now()
    if (label) {
      this.marks.set(label, this.startTime)
    }
  }
  
  mark(label: string): void {
    this.marks.set(label, performance.now())
  }
  
  measure(startLabel: string, endLabel?: string): number {
    const startTime = this.marks.get(startLabel) || this.startTime
    const endTime = endLabel ? this.marks.get(endLabel) || performance.now() : performance.now()
    return endTime - startTime
  }
  
  end(label?: string): number {
    const endTime = performance.now()
    const duration = endTime - this.startTime
    
    if (label && duration > 100) {
      console.warn(`Performance warning: ${label} took ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }
}

// 内存使用监控
export function getMemoryUsage(): any {
  if ('memory' in performance) {
    return (performance as any).memory
  }
  return null
}

// 帧率监控
export class FPSMonitor {
  private frames: number[] = []
  private lastTime: number = performance.now()
  
  update(): number {
    const now = performance.now()
    const delta = now - this.lastTime
    this.lastTime = now
    
    this.frames.push(1000 / delta)
    
    // 只保留最近60帧的数据
    if (this.frames.length > 60) {
      this.frames.shift()
    }
    
    return this.getAverageFPS()
  }
  
  getAverageFPS(): number {
    if (this.frames.length === 0) return 0
    const sum = this.frames.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.frames.length)
  }
}

// 缓存管理
export class SimpleCache<T> {
  private cache: Map<string, { data: T; timestamp: number; ttl: number }> = new Map()
  
  set(key: string, data: T, ttl: number = 5000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
}

// 批量DOM更新
export function batchDOMUpdates(callback: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback)
  })
}

// 检查页面可见性
export function isPageVisible(): boolean {
  return !document.hidden
}

// 添加页面可见性监听
export function onVisibilityChange(callback: (visible: boolean) => void): () => void {
  const handler = () => callback(!document.hidden)
  document.addEventListener('visibilitychange', handler)
  
  return () => document.removeEventListener('visibilitychange', handler)
}
