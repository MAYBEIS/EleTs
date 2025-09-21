import * as si from 'systeminformation';
import { BaseService } from './BaseService';

/**
 * 硬件信息服务
 * 提供详细的硬件型号、规格等信息
 */
export class HardwareInfoService extends BaseService {
  readonly serviceName = 'HardwareInfo';
  readonly version = '1.0.0';
  readonly description = '硬件信息服务，提供详细的硬件规格和型号信息';

  private hardwareCache: any = {};
  private cacheExpiry = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    this.log('info', 'Initializing HardwareInfoService');
    
    // 预加载一些基础硬件信息
    await this.preloadHardwareInfo();
    
    this.log('info', 'HardwareInfoService initialized successfully');
 }

 /**
  * 销毁服务
  */
 async destroy(): Promise<void> {
   // 清理缓存
   this.hardwareCache = {};
   this.log('info', 'HardwareInfoService destroyed');
 }

 /**
   * 获取方法描述
   */
  protected getMethodDescription(methodName: string): string | undefined {
    const descriptions: Record<string, string> = {
      getCpuDetails: '获取CPU详细信息',
      getMemoryDetails: '获取内存模块详细信息',
      getGraphicsInfo: '获取显卡信息',
      getMotherboardInfo: '获取主板信息',
      getStorageDevices: '获取存储设备信息',
      getAudioDevices: '获取音频设备信息',
      getUsbDevices: '获取USB设备信息',
      getAllHardwareInfo: '获取所有硬件信息概览'
    };
    return descriptions[methodName];
  }

  /**
   * 预加载硬件信息
   */
  private async preloadHardwareInfo(): Promise<void> {
    try {
      // 预加载一些不经常变化的硬件信息
      const [cpu, baseboard, chassis] = await Promise.all([
        si.cpu(),
        si.baseboard(),
        si.chassis()
      ]);

      this.hardwareCache = {
        cpu,
        baseboard,
        chassis,
        timestamp: Date.now()
      };
    } catch (error) {
      this.log('error', 'Error preloading hardware info', error);
    }
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(key: string): boolean {
    const cached = this.hardwareCache[key];
    if (!cached || !cached.timestamp) return false;
    return (Date.now() - cached.timestamp) < this.cacheExpiry;
  }

  /**
   * 获取CPU详细信息
   */
  async getCpuDetails(): Promise<any> {
    try {
      const cpu = await si.cpu();
      const cpuFlags = await si.cpuFlags();
      const cpuCache = await si.cpuCache();

      return {
        basic: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          family: cpu.family,
          model: cpu.model,
          stepping: cpu.stepping,
          revision: cpu.revision,
          voltage: cpu.voltage,
          speed: cpu.speed,
          speedMin: cpu.speedMin,
          speedMax: cpu.speedMax,
          governor: cpu.governor,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          processors: cpu.processors,
          socket: cpu.socket,
          vendor: cpu.vendor,
          virtualization: cpu.virtualization
        },
        cache: {
          l1d: cpuCache.l1d,
          l1i: cpuCache.l1i,
          l2: cpuCache.l2,
          l3: cpuCache.l3
        },
        flags: cpuFlags,
        architecture: process.arch,
        endianness: require('os').endianness()
      };
    } catch (error) {
      this.log('error', 'Error getting CPU details', error);
      throw error;
    }
  }

  /**
   * 获取内存模块详细信息
   */
  async getMemoryDetails(): Promise<any> {
    try {
      const [memLayout, mem] = await Promise.all([
        si.memLayout(),
        si.mem()
      ]);

      return {
        total: mem.total,
        modules: memLayout.map((module: any) => ({
          size: module.size,
          bank: module.bank,
          type: module.type,
          clockSpeed: module.clockSpeed,
          formFactor: module.formFactor,
          manufacturer: module.manufacturer,
          partNum: module.partNum,
          serialNum: module.serialNum,
          voltageConfigured: module.voltageConfigured,
          voltageMin: module.voltageMin,
          voltageMax: module.voltageMax
        })),
        summary: {
          totalSlots: memLayout.length,
          totalCapacity: memLayout.reduce((sum: number, module: any) => sum + (module.size || 0), 0),
          types: [...new Set(memLayout.map((m: any) => m.type).filter(Boolean))],
          speeds: [...new Set(memLayout.map((m: any) => m.clockSpeed).filter(Boolean))]
        }
      };
    } catch (error) {
      this.log('error', 'Error getting memory details', error);
      throw error;
    }
  }

  /**
   * 获取显卡信息
   */
  async getGraphicsInfo(): Promise<any> {
    try {
      const graphics = await si.graphics();

      return {
        controllers: graphics.controllers.map((controller: any) => ({
          vendor: controller.vendor,
          model: controller.model,
          bus: controller.bus,
          vram: controller.vram,
          vramDynamic: controller.vramDynamic,
          subDeviceId: controller.subDeviceId,
          driverVersion: controller.driverVersion,
          name: controller.name,
          pciBus: controller.pciBus,
          memoryTotal: controller.memoryTotal,
          memoryUsed: controller.memoryUsed,
          memoryFree: controller.memoryFree,
          utilizationGpu: controller.utilizationGpu,
          utilizationMemory: controller.utilizationMemory,
          temperatureGpu: controller.temperatureGpu,
          fanSpeed: controller.fanSpeed,
          clockCore: controller.clockCore,
          clockMemory: controller.clockMemory
        })),
        displays: graphics.displays.map((display: any) => ({
          vendor: display.vendor,
          model: display.model,
          main: display.main,
          builtin: display.builtin,
          connection: display.connection,
          sizeX: display.sizeX,
          sizeY: display.sizeY,
          pixelDepth: display.pixelDepth,
          resolutionX: display.resolutionX,
          resolutionY: display.resolutionY,
          currentResX: display.currentResX,
          currentResY: display.currentResY,
          positionX: display.positionX,
          positionY: display.positionY,
          currentRefreshRate: display.currentRefreshRate
        }))
      };
    } catch (error) {
      this.log('error', 'Error getting graphics info', error);
      throw error;
    }
  }

  /**
   * 获取主板信息
   */
  async getMotherboardInfo(): Promise<any> {
    try {
      const [baseboard, bios, chassis] = await Promise.all([
        si.baseboard(),
        si.bios(),
        si.chassis()
      ]);

      return {
        baseboard: {
          manufacturer: baseboard.manufacturer,
          model: baseboard.model,
          version: baseboard.version,
          serial: baseboard.serial,
          assetTag: baseboard.assetTag,
          memMax: baseboard.memMax,
          memSlots: baseboard.memSlots
        },
        bios: {
          vendor: bios.vendor,
          version: bios.version,
          releaseDate: bios.releaseDate,
          revision: bios.revision,
          serial: bios.serial,
          language: bios.language,
          features: bios.features
        },
        chassis: {
          manufacturer: chassis.manufacturer,
          model: chassis.model,
          type: chassis.type,
          version: chassis.version,
          serial: chassis.serial,
          assetTag: chassis.assetTag,
          sku: chassis.sku
        }
      };
    } catch (error) {
      this.log('error', 'Error getting motherboard info', error);
      throw error;
    }
  }

  /**
   * 获取存储设备信息
   */
  async getStorageDevices(): Promise<any> {
    try {
      const [diskLayout, blockDevices] = await Promise.all([
        si.diskLayout(),
        si.blockDevices()
      ]);

      return {
        physicalDisks: diskLayout.map((disk: any) => ({
          device: disk.device,
          type: disk.type,
          name: disk.name,
          vendor: disk.vendor,
          size: disk.size,
          bytesPerSector: disk.bytesPerSector,
          totalCylinders: disk.totalCylinders,
          totalHeads: disk.totalHeads,
          totalSectors: disk.totalSectors,
          totalTracks: disk.totalTracks,
          tracksPerCylinder: disk.tracksPerCylinder,
          sectorsPerTrack: disk.sectorsPerTrack,
          firmwareRevision: disk.firmwareRevision,
          serialNum: disk.serialNum,
          interfaceType: disk.interfaceType,
          smartStatus: disk.smartStatus,
          temperature: disk.temperature
        })),
        blockDevices: blockDevices.map((device: any) => ({
          name: device.name,
          identifier: device.identifier,
          type: device.type,
          fsType: device.fsType,
          mount: device.mount,
          size: device.size,
          physical: device.physical,
          uuid: device.uuid,
          label: device.label,
          model: device.model,
          serial: device.serial,
          removable: device.removable,
          protocol: device.protocol
        }))
      };
    } catch (error) {
      this.log('error', 'Error getting storage devices', error);
      throw error;
    }
  }

  /**
   * 获取音频设备信息
   */
  async getAudioDevices(): Promise<any> {
    try {
      const audio = await si.audio();

      return audio.map((device: any) => ({
        name: device.name,
        manufacturer: device.manufacturer,
        revision: device.revision,
        driver: device.driver,
        default: device.default,
        channel: device.channel,
        type: device.type,
        in: device.in,
        out: device.out,
        status: device.status
      }));
    } catch (error) {
      this.log('error', 'Error getting audio devices', error);
      throw error;
    }
  }

  /**
   * 获取USB设备信息
   */
  async getUsbDevices(): Promise<any> {
    try {
      const usb = await si.usb();

      return usb.map((device: any) => ({
        id: device.id,
        bus: device.bus,
        deviceId: device.deviceId,
        name: device.name,
        type: device.type,
        removable: device.removable,
        vendor: device.vendor,
        manufacturer: device.manufacturer,
        maxPower: device.maxPower,
        // default: device.default,
        // serial: device.serial
      }));
    } catch (error) {
      this.log('error', 'Error getting USB devices', error);
      throw error;
    }
  }

  /**
   * 获取所有硬件信息概览
   */
  async getAllHardwareInfo(): Promise<any> {
    try {
      const [cpu, memory, graphics, motherboard, storage] = await Promise.all([
        this.getCpuDetails(),
        this.getMemoryDetails(),
        this.getGraphicsInfo(),
        this.getMotherboardInfo(),
        this.getStorageDevices()
      ]);

      return {
        cpu: {
          brand: cpu.basic.brand,
          model: cpu.basic.model,
          cores: cpu.basic.cores,
          speed: cpu.basic.speed
        },
        memory: {
          total: memory.total,
          modules: memory.summary.totalSlots,
          types: memory.summary.types
        },
        graphics: {
          controllers: graphics.controllers.length,
          primary: graphics.controllers[0]?.model || 'Unknown',
          displays: graphics.displays.length
        },
        motherboard: {
          manufacturer: motherboard.baseboard.manufacturer,
          model: motherboard.baseboard.model
        },
        storage: {
          devices: storage.physicalDisks.length,
          totalCapacity: storage.physicalDisks.reduce((sum: number, disk: any) => sum + (disk.size || 0), 0)
        }
      };
    } catch (error) {
      this.log('error', 'Error getting all hardware info', error);
      throw error;
    }
  }
}
