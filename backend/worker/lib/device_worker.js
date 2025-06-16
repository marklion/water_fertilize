const modbusDev = require('./modbus_dev');
const LORA_TCP = require('./LORA_TCP');
const net = require('net');
class DeviceConnection {
    constructor(ip, port) {
        if (!ip || !port) {
            throw new Error(`ip或者端口异常: ${ip}:${port}`);
        }
        this.ip = ip;
        this.port = port;
        this.client = null;
        this.queue = [];
        this.status = 'disconnected';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.transactionId = 0;
        this.heartbeatInterval = null;
        this.buffer = Buffer.alloc(0);
    }

    async connect() {
        if (this.status === 'connected') return;

        this.status = 'connecting';

        if (this.client) {
            this.client.removeAllListeners();
            this.client = null;
        }

        this.client = new net.Socket();
        this.client.setNoDelay(true);

        try {
            await new Promise((resolve, reject) => {
                const connectHandler = () => {
                    console.log(`Connected to ${this.ip}:${this.port}`);
                    this.client.removeListener('error', errorHandler);
                    this.client.on('error', (err) => {
                        console.error(`Socket error: ${err.message}`);
                    });
                    resolve();
                };

                const errorHandler = (err) => {
                    this.client.removeAllListeners();
                    this.client = null;
                    reject(err);
                };

                this.client.connect(this.port, this.ip, connectHandler);
                this.client.on('error', errorHandler);
            });

            this.status = 'connected';
            this.reconnectAttempts = 0;
            this._listen();
            this.startHeartbeat();
        } catch (err) {
            this.status = 'disconnected';
            clearInterval(this.heartbeatInterval);
            console.error(`Connection failed: ${err.message}`);
            this._reconnect();
        }
    }

    _listen() {
        this.client.on('data', (data) => {
            this.buffer = Buffer.concat([this.buffer, data]);

            while (this.buffer.length >= 8) {
                const response = this.buffer.slice(0, 8);
                this.buffer = this.buffer.slice(8);

                if (this.queue.length > 0) {
                    const { resolve, timeout } = this.queue.shift();
                    clearTimeout(timeout);
                    resolve(response);
                }
            }
        });

        this.client.on('close', () => {
            console.log('Socket closed');
            this.status = 'disconnected';
            clearInterval(this.heartbeatInterval);
            this._reconnect();
        });

        this.client.on('error', (err) => {
            console.error(`Socket error: ${err.message}`);
        });
    }

    _reconnect() {
        // 拒绝未完成的请求
        this.queue.forEach(({ reject, timeout }) => {
            clearTimeout(timeout);
            reject(new Error('连接丢失 正在重连中...'));
        });
        this.queue = [];

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, 5000);
        } else {
            console.error(`连接失败`);
            this.status = 'disconnected';
            if (this.client) {
                this.client.removeAllListeners();
                this.client = null;
            }
        }
    }

    async sendCommand(command) {
        if (this.status !== 'connected') {
            await this.connect();
            if (this.status !== 'connected') {
                throw new Error('Failed to establish connection');
            }
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('命令超时'));
                const index = this.queue.findIndex(item => item.timeout === timeout);
                if (index > -1) {
                    this.queue.splice(index, 1);
                }
            }, 5000);

            this.queue.push({ resolve, reject, timeout });

            // 添加写入错误处理
            this.client.write(command, (err) => {
                if (err) {
                    console.error(`写入错误: ${err.message}`);
                    this._reconnect();
                }
            });
        });
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.status === 'connected') {
                const heartbeatCmd = Buffer.from('000000000000', 'hex');
                this.sendCommand(heartbeatCmd).catch(err => {
                    console.error(`Heartbeat failed: ${err.message}`);
                });
            }
        }, 30000);
    }
}

const connectionPool = {};

function getConnection(dev) {
    const { ip, port } = LORA_TCP.dev2tcp(dev);
    const key = `${ip}:${port}`;

    if (!connectionPool[key]) {
        connectionPool[key] = new DeviceConnection(ip, port);
    }

    return connectionPool[key];
}

async function processDevice(dev) {
    try {
        const command = await modbusDev.dev2cmd(dev);
        if (!command) {
            modbusDev.error2dev('空命令', dev);
            return;
        }

        const connection = getConnection(dev);
        const reply = await connection.sendCommand(command);

        modbusDev.reply2dev(reply, dev);
    } catch (err) {
        modbusDev.error2dev(err.message, dev);
    }
}

async function startDeviceWorker() {
    console.log('Starting device worker...');
    let sq = db_opt.get_sq();
    try {
        let devices = await sq.models.device.findAll();
        for (const dev of devices) {
            processDevice(dev);
        }
    } catch (err) {
        console.error('错误的设备:', err);
    }
}
exports.startDeviceWorker = startDeviceWorker;