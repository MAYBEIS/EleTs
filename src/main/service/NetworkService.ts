import * as si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseService } from './BaseService';

const execAsync = promisify(exec);

/**
 * 网络监控服务
 * 提供网络连接、延迟、带宽等监控信息
 */
export class NetworkService extends BaseService {
  readonly serviceName = 'Network';
  readonly version = '1.0.0';
  readonly description = '网络监控服务，提供网络连接状态、延迟、带宽等信息';

  private networkStats: any = {};
  private pingResults: Map<string, any> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    this.log('info', 'Initializing NetworkService');
    
    // 启动定时更新网络统计
    this.startNetworkMonitoring();
    
    this.log('info', 'NetworkService initialized successfully');
  }

  /**
   * 销毁服务
   */
  async destroy(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.log('info', 'NetworkService destroyed');
  }

  /**
   * 获取方法描述
   */
  protected getMethodDescription(methodName: string): string | undefined {
    const descriptions: Record<string, string> = {
      getNetworkInterfaces: '获取网络接口详细信息',
      getNetworkStats: '获取网络统计数据',
      pingHost: '测试到指定主机的延迟',
      getConnectionInfo: '获取网络连接信息',
      getWifiInfo: '获取WiFi连接信息',
      getNetworkSpeed: '获取网络速度测试结果',
      getActiveConnections: '获取活动网络连接',
      getNetworkOverview: '获取网络状态概览'
    };
    return descriptions[methodName];
  }

  /**
   * 启动网络监控
   */
  private startNetworkMonitoring(): void {
    // 延长更新间隔到8秒，减少系统负载
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateNetworkStats();
      } catch (error) {
        this.log('error', 'Failed to update network stats', error);
      }
    }, 8000);
  }

  /**
   * 更新网络统计数据
   */
  private async updateNetworkStats(): Promise<void> {
    try {
      const stats = await si.networkStats();
      this.networkStats = {
        stats,
        timestamp: Date.now()
      };
    } catch (error) {
      this.log('error', 'Error updating network stats', error);
    }
  }

  /**
   * 获取网络接口详细信息
   */
  async getNetworkInterfaces(): Promise<any> {
    try {
      const interfaces = await si.networkInterfaces();
      
      return interfaces.map(iface => ({
        name: iface.iface,
        displayName: iface.ifaceName,
        type: iface.type,
        speed: iface.speed,
        duplex: iface.duplex,
        mtu: iface.mtu,
        mac: iface.mac,
        ipv4: iface.ip4,
        ipv6: iface.ip6,
        netmask: iface.ip4subnet,
        gateway: (iface as any).gateway,
        dhcp: iface.dhcp,
        dnsSuffix: iface.dnsSuffix,
        operationalStatus: iface.operstate,
        internal: iface.internal,
        virtual: iface.virtual,
        ieee8021xAuth: iface.ieee8021xAuth,
        ieee8021xState: iface.ieee8021xState,
        carrierChanges: iface.carrierChanges
      }));
    } catch (error) {
      this.log('error', 'Error getting network interfaces', error);
      throw error;
    }
  }

  /**
   * 获取网络统计数据
   */
  async getNetworkStats(): Promise<any> {
    try {
      const stats = await si.networkStats();
      
      return stats.map(stat => ({
        interface: stat.iface,
        operationalStatus: stat.operstate,
        bytesReceived: stat.rx_bytes,
        bytesSent: stat.tx_bytes,
        packetsReceived: stat.rx_dropped,
        packetsSent: stat.tx_dropped,
        errorsReceived: stat.rx_errors,
        errorsSent: stat.tx_errors,
        receiveSpeed: stat.rx_sec, // bytes per second
        transmitSpeed: stat.tx_sec, // bytes per second
        timestamp: stat.ms
      }));
    } catch (error) {
      this.log('error', 'Error getting network stats', error);
      throw error;
    }
  }

  /**
   * 测试到指定主机的延迟
   */
  async pingHost(params: { host: string; count?: number }): Promise<any> {
    const { host, count = 4 } = params;
    
    try {
      const isWindows = process.platform === 'win32';
      const pingCommand = isWindows 
        ? `ping -n ${count} ${host}`
        : `ping -c ${count} ${host}`;

      const { stdout, stderr } = await execAsync(pingCommand);
      
      if (stderr) {
        throw new Error(`Ping failed: ${stderr}`);
      }

      // 解析ping结果
      const result = this.parsePingOutput(stdout, isWindows);
      
      // 缓存结果
      this.pingResults.set(host, {
        ...result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      this.log('error', `Error pinging host ${host}`, error);
      throw error;
    }
  }

  /**
   * 解析ping输出
   */
  private parsePingOutput(output: string, isWindows: boolean): any {
    const lines = output.split('\n');
    const times: number[] = [];
    let packetsTransmitted = 0;
    let packetsReceived = 0;

    if (isWindows) {
      // Windows ping输出解析
      for (const line of lines) {
        if (line.includes('时间=') || line.includes('time=')) {
          const timeMatch = line.match(/时间[=<](\d+)ms|time[=<](\d+)ms/);
          if (timeMatch) {
            times.push(parseInt(timeMatch[1] || timeMatch[2]));
          }
        }
        if (line.includes('已发送') || line.includes('Packets:')) {
          const sentMatch = line.match(/已发送 = (\d+)|Sent = (\d+)/);
          const receivedMatch = line.match(/已接收 = (\d+)|Received = (\d+)/);
          if (sentMatch) packetsTransmitted = parseInt(sentMatch[1] || sentMatch[2]);
          if (receivedMatch) packetsReceived = parseInt(receivedMatch[1] || receivedMatch[2]);
        }
      }
    } else {
      // Linux/macOS ping输出解析
      for (const line of lines) {
        if (line.includes('time=')) {
          const timeMatch = line.match(/time=(\d+\.?\d*)/);
          if (timeMatch) {
            times.push(parseFloat(timeMatch[1]));
          }
        }
        if (line.includes('packets transmitted')) {
          const match = line.match(/(\d+) packets transmitted, (\d+) received/);
          if (match) {
            packetsTransmitted = parseInt(match[1]);
            packetsReceived = parseInt(match[2]);
          }
        }
      }
    }

    const packetLoss = packetsTransmitted > 0 
      ? ((packetsTransmitted - packetsReceived) / packetsTransmitted) * 100 
      : 0;

    return {
      packetsTransmitted,
      packetsReceived,
      packetLoss: Math.round(packetLoss * 100) / 100,
      times,
      min: times.length > 0 ? Math.min(...times) : null,
      max: times.length > 0 ? Math.max(...times) : null,
      avg: times.length > 0 ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 100) / 100 : null,
      successful: packetsReceived > 0
    };
  }

  /**
   * 获取网络连接信息
   */
  async getConnectionInfo(): Promise<any> {
    try {
      const [connections, gateway] = await Promise.all([
        si.networkConnections(),
        si.networkGatewayDefault()
      ]);

      return {
        activeConnections: connections.length,
        connections: connections.map(conn => ({
          protocol: conn.protocol,
          localAddress: conn.localAddress,
          localPort: conn.localPort,
          peerAddress: conn.peerAddress,
          peerPort: conn.peerPort,
          state: conn.state,
          pid: conn.pid,
          process: conn.process
        })),
        defaultGateway: gateway
      };
    } catch (error) {
      this.log('error', 'Error getting connection info', error);
      throw error;
    }
  }

  /**
   * 获取WiFi连接信息
   */
  async getWifiInfo(): Promise<any> {
    try {
      const wifi = await si.wifiNetworks();
      
      return wifi.map(network => ({
        ssid: network.ssid,
        bssid: network.bssid,
        mode: network.mode,
        channel: network.channel,
        frequency: network.frequency,
        signalLevel: network.signalLevel,
        quality: network.quality,
        security: network.security,
        wpaFlags: network.wpaFlags,
        rsnFlags: network.rsnFlags
      }));
    } catch (error) {
      this.log('error', 'Error getting WiFi info', error);
      throw error;
    }
  }

  /**
   * 获取网络速度测试结果
   */
  async getNetworkSpeed(): Promise<any> {
    try {
      // 获取当前网络统计作为基准
      const stats1 = await si.networkStats();
      
      // 等待1秒
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 再次获取网络统计
      const stats2 = await si.networkStats();
      
      // 计算速度
      const speedResults = stats1.map((stat1, index) => {
        const stat2 = stats2[index];
        if (!stat2 || stat1.iface !== stat2.iface) return null;
        
        const timeDiff = (stat2.ms - stat1.ms) / 1000; // 转换为秒
        const downloadSpeed = (stat2.rx_bytes - stat1.rx_bytes) / timeDiff; // bytes/s
        const uploadSpeed = (stat2.tx_bytes - stat1.tx_bytes) / timeDiff; // bytes/s
        
        return {
          interface: stat1.iface,
          downloadSpeed: Math.max(0, downloadSpeed), // bytes/s
          uploadSpeed: Math.max(0, uploadSpeed), // bytes/s
          downloadSpeedMbps: Math.max(0, (downloadSpeed * 8) / (1024 * 1024)), // Mbps
          uploadSpeedMbps: Math.max(0, (uploadSpeed * 8) / (1024 * 1024)) // Mbps
        };
      }).filter(Boolean);
      
      return speedResults;
    } catch (error) {
      this.log('error', 'Error getting network speed', error);
      throw error;
    }
  }

  /**
   * 获取活动网络连接
   */
  async getActiveConnections(): Promise<any> {
    try {
      const connections = await si.networkConnections();
      
      // 过滤活动连接
      const activeConnections = connections.filter(conn => 
        conn.state === 'ESTABLISHED' || conn.state === 'LISTEN'
      );
      
      return {
        total: connections.length,
        active: activeConnections.length,
        listening: connections.filter(conn => conn.state === 'LISTEN').length,
        established: connections.filter(conn => conn.state === 'ESTABLISHED').length,
        connections: activeConnections.map(conn => ({
          protocol: conn.protocol,
          localAddress: conn.localAddress,
          localPort: conn.localPort,
          peerAddress: conn.peerAddress,
          peerPort: conn.peerPort,
          state: conn.state,
          process: conn.process
        }))
      };
    } catch (error) {
      this.log('error', 'Error getting active connections', error);
      throw error;
    }
  }

  /**
   * 获取网络状态概览
   */
  async getNetworkOverview(): Promise<any> {
    try {
      const [interfaces, stats, gateway] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats(),
        si.networkGatewayDefault()
      ]);

      const activeInterfaces = interfaces.filter(iface => 
        iface.operstate === 'up' && !iface.internal
      );

      const totalBytesReceived = stats.reduce((sum, stat) => sum + (stat.rx_bytes || 0), 0);
      const totalBytesSent = stats.reduce((sum, stat) => sum + (stat.tx_bytes || 0), 0);

      return {
        totalInterfaces: interfaces.length,
        activeInterfaces: activeInterfaces.length,
        primaryInterface: activeInterfaces[0]?.iface || 'None',
        defaultGateway: gateway,
        totalTraffic: {
          received: totalBytesReceived,
          sent: totalBytesSent,
          total: totalBytesReceived + totalBytesSent
        },
        interfaces: activeInterfaces.map(iface => ({
          name: iface.iface,
          type: iface.type,
          ip: iface.ip4,
          speed: iface.speed,
          status: iface.operstate
        }))
      };
    } catch (error) {
      this.log('error', 'Error getting network overview', error);
      throw error;
    }
  }
}
