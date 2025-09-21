import * as si from 'systeminformation';
import { BaseService } from './BaseService';

/**
 * 系统监控服务
 * 提供CPU、内存、磁盘、网络等系统信息监控
 */
export class SystemMonitorService extends BaseService {
  readonly serviceName = 'SystemMonitor';
  readonly version = '1.0.0';
  readonly description = '系统监控服务，提供实时系统资源使用情况';

  private updateInterval: NodeJS.Timeout | null = null;
  private systemData: any = {};

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    this.log('info', 'Initializing SystemMonitorService');
    
    // 启动定时更新
    this.startPeriodicUpdate();
    
    // 初始化获取一次数据
    await this.updateSystemData();
    
    this.log('info', 'SystemMonitorService initialized successfully');
  }

  /**
   * 销毁服务
   */
  async destroy(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.log('info', 'SystemMonitorService destroyed');
  }

  /**
   * 获取方法描述
   */
  protected getMethodDescription(methodName: string): string | undefined {
    const descriptions: Record<string, string> = {
      getCpuInfo: '获取CPU信息和使用率',
      getMemoryInfo: '获取内存使用情况',
      getDiskInfo: '获取磁盘使用情况',
      getNetworkInfo: '获取网络接口信息',
      getSystemOverview: '获取系统概览信息',
      getRealTimeStats: '获取实时系统统计数据'
    };
    return descriptions[methodName];
  }

  /**
   * 启动定时更新
   */
  private startPeriodicUpdate(): void {
    // 延长更新间隔到10秒，减少系统负载
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateSystemData();
      } catch (error) {
        this.log('error', 'Failed to update system data', error);
      }
    }, 10000);
  }

  /**
   * 更新系统数据
   */
  private async updateSystemData(): Promise<void> {
    try {
      const [cpu, memory, disk, network] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats()
      ]);

      this.systemData = {
        cpu,
        memory,
        disk,
        network,
        timestamp: Date.now()
      };
    } catch (error) {
      this.log('error', 'Error updating system data', error);
      throw error;
    }
  }

  /**
   * 获取CPU信息和使用率
   */
  async getCpuInfo(): Promise<any> {
    try {
      const [cpuInfo, currentLoad, temperature] = await Promise.all([
        si.cpu(),
        si.currentLoad(),
        si.cpuTemperature().catch(() => ({ main: null })) // 温度可能获取失败
      ]);

      return {
        info: {
          manufacturer: cpuInfo.manufacturer,
          brand: cpuInfo.brand,
          family: cpuInfo.family,
          model: cpuInfo.model,
          speed: cpuInfo.speed,
          speedMin: cpuInfo.speedMin,
          speedMax: cpuInfo.speedMax,
          cores: cpuInfo.cores,
          physicalCores: cpuInfo.physicalCores,
          processors: cpuInfo.processors
        },
        usage: {
          currentLoad: Math.round(currentLoad.currentLoad * 100) / 100,
          currentLoadUser: Math.round(currentLoad.currentLoadUser * 100) / 100,
          currentLoadSystem: Math.round(currentLoad.currentLoadSystem * 100) / 100,
          currentLoadIdle: Math.round(currentLoad.currentLoadIdle * 100) / 100,
          cpus: currentLoad.cpus?.map(cpu => ({
            load: Math.round(cpu.load * 100) / 100,
            loadUser: Math.round(cpu.loadUser * 100) / 100,
            loadSystem: Math.round(cpu.loadSystem * 100) / 100,
            loadIdle: Math.round(cpu.loadIdle * 100) / 100
          }))
        },
        temperature: temperature.main
      };
    } catch (error) {
      this.log('error', 'Error getting CPU info', error);
      throw error;
    }
  }

  /**
   * 获取内存使用情况
   */
  async getMemoryInfo(): Promise<any> {
    try {
      const memory = await si.mem();
      
      return {
        total: memory.total,
        free: memory.free,
        used: memory.used,
        active: memory.active,
        available: memory.available,
        buffers: memory.buffers,
        cached: memory.cached,
        slab: memory.slab,
        buffcache: memory.buffcache,
        swaptotal: memory.swaptotal,
        swapused: memory.swapused,
        swapfree: memory.swapfree,
        usagePercent: Math.round((memory.used / memory.total) * 10000) / 100,
        availablePercent: Math.round((memory.available / memory.total) * 10000) / 100
      };
    } catch (error) {
      this.log('error', 'Error getting memory info', error);
      throw error;
    }
  }

  /**
   * 获取磁盘使用情况
   */
  async getDiskInfo(): Promise<any> {
    try {
      const disks = await si.fsSize();
      
      return disks.map(disk => ({
        fs: disk.fs,
        type: disk.type,
        size: disk.size,
        used: disk.used,
        available: disk.available,
        use: disk.use,
        mount: disk.mount,
        usagePercent: Math.round(disk.use * 100) / 100
      }));
    } catch (error) {
      this.log('error', 'Error getting disk info', error);
      throw error;
    }
  }

  /**
   * 获取网络接口信息
   */
  async getNetworkInfo(): Promise<any> {
    try {
      const [interfaces, stats] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats()
      ]);

      return {
        interfaces: interfaces.map(iface => ({
          iface: iface.iface,
          ifaceName: iface.ifaceName,
          ip4: iface.ip4,
          ip6: iface.ip6,
          mac: iface.mac,
          internal: iface.internal,
          virtual: iface.virtual,
          operstate: iface.operstate,
          type: iface.type,
          duplex: iface.duplex,
          mtu: iface.mtu,
          speed: iface.speed,
          dhcp: iface.dhcp,
          dnsSuffix: iface.dnsSuffix,
          ieee8021xAuth: iface.ieee8021xAuth,
          ieee8021xState: iface.ieee8021xState,
          carrierChanges: iface.carrierChanges
        })),
        stats: stats.map(stat => ({
          iface: stat.iface,
          operstate: stat.operstate,
          rx_bytes: stat.rx_bytes,
          rx_dropped: stat.rx_dropped,
          rx_errors: stat.rx_errors,
          tx_bytes: stat.tx_bytes,
          tx_dropped: stat.tx_dropped,
          tx_errors: stat.tx_errors,
          rx_sec: stat.rx_sec,
          tx_sec: stat.tx_sec,
          ms: stat.ms
        }))
      };
    } catch (error) {
      this.log('error', 'Error getting network info', error);
      throw error;
    }
  }

  /**
   * 获取系统概览信息
   */
  async getSystemOverview(): Promise<any> {
    try {
      const [system, osInfo, versions] = await Promise.all([
        si.system(),
        si.osInfo(),
        si.versions()
      ]);

      return {
        system: {
          manufacturer: system.manufacturer,
          model: system.model,
          version: system.version,
          serial: system.serial,
          uuid: system.uuid,
          sku: system.sku
        },
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          codename: osInfo.codename,
          kernel: osInfo.kernel,
          arch: osInfo.arch,
          hostname: osInfo.hostname,
          fqdn: osInfo.fqdn,
          codepage: osInfo.codepage,
          logofile: osInfo.logofile,
          serial: osInfo.serial,
          build: osInfo.build,
          servicepack: osInfo.servicepack,
          uefi: osInfo.uefi
        },
        versions: {
          node: versions.node,
          npm: versions.npm,
          electron: (versions as any).electron || process.versions.electron
        }
      };
    } catch (error) {
      this.log('error', 'Error getting system overview', error);
      throw error;
    }
  }

  /**
   * 获取实时系统统计数据
   */
  async getRealTimeStats(): Promise<any> {
    return {
      ...this.systemData,
      uptime: si.time()
    };
  }
}
