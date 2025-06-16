const express = require('express');
const json2md = require('json2md');
const moment = require('moment');
const dotenv = require('dotenv');
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.help_info = [];

let mkapi = require('./lib/api_utils');
const db_opt = require('./lib/db_opt');
const rbac_lib = require('./lib/rbac_lib');
const modbusDev = require('./worker/lib/modbus_dev');
const LORA_TCP = require('./worker/lib/LORA_TCP');
const net = require('net');
async function module_install(admin_role_id, app, module) {
    let mo = module;
    await rbac_lib.connect_role2module(admin_role_id, (await rbac_lib.add_module(mo.name, mo.description)).id);
    let need_rbac = true;
    Object.keys(mo.methods).forEach(itr => {
        let method_name = itr;
        let method = mo.methods[itr];
        if (mo.name === 'global') {
            need_rbac = method.need_rbac;
        }
        mkapi('/' + mo.name + '/' + method_name,
            mo.name, method.is_write, need_rbac,
            method.params, method.result, method.name,
            method.description, method.is_get_api).add_handler(
                method.func
            ).install(app);
    });
}

async function init_super_user() {
    await db_opt.install();
    let sq = db_opt.get_sq();
    let user_one = await sq.models.rbac_user.findOrCreate({
        where: { phone: '18911992582' },
        defaults: {
            name: 'admin',
            online_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        }
    });

    let role = await rbac_lib.add_role('admin', '超级管理员', false, null);
    if (user_one[0] && role) {
        await rbac_lib.connect_user2role(user_one[0].id, role.id);
    }
    await module_install(role.id, app, require('./module/global_module'));
    await module_install(role.id, app, require('./module/resource_management'));
    await module_install(role.id, app, require('./module/operator'));
    await module_install(role.id, app, require('./module/policy_module'));

    let all_modules = await sq.models.rbac_module.findAll();
    for (let index = 0; index < all_modules.length; index++) {
        const element = all_modules[index];
        mkapi('/rbac/verify_' + element.name + '_write', element.name, true, true, {}, {
            result: { type: Boolean, mean: '无意义', example: true }
        }, element.name + '权限读写校验', '验证是否有' + element.description + '的读写权限').add_handler(async (body, token) => {
            return { result: true };
        }).install(app);
        mkapi('/rbac/verify_' + element.name + '_read', element.name, false, true, {}, {
            result: { type: Boolean, mean: '无意义', example: true }
        }, element.name + '权限只读校验', '验证是否有' + element.description + '的读权限').add_handler(async (body, token) => {
            return { result: true };
        }).install(app);
    }
}
init_super_user();
app.get('/api/help', (req, res) => {
    let out_json = app.help_info;
    const MarkdownIt = require('markdown-it');
    const mdTocAndAnchor = require('markdown-it-toc-and-anchor').default;

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    });

    md.use(mdTocAndAnchor, {
        toc: true,
        tocFirstLevel: 1,
        tocLastLevel: 6,
        wrapHeadingTextInAnchor: true
    });

    let markdownText = json2md(out_json);
    markdownText =
        `
# 概述
+ 本文档中所有接口使用 POST 方法
+ 除登录接口之外，需要先调用登录接口获取 token，然后在请求头中带上 token 才能调用其他接口
+ 每个接口的参数和返回值都是 JSON 格式
+ 接口返回的对象中会携带两个字段，err_msg 和 result
+ err_msg 为空字符串表示成功，否则表示失败
+ result字段是真正的接口返回值，每个接口的返回值都不一样，具体参考接口文档
    ` + markdownText;
    const htmlContent = md.render(markdownText);
    const html = `
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@4.0.0/github-markdown.min.css">
    <title>接口文档</title>
    <style>
        #toc {
            position: fixed;
            left: 0;
            top: 0;
            width: 400px;
            height: 100%;
            overflow: auto;
            border-right: 1px solid #000;
        }
        #content {
            margin-left: 410px;
        }
        #toc a {
            display: block;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div id="toc"></div>
    <article class="markdown-body">
    <div id="content">${htmlContent}</div>
    </article>
    <script>
    window.onload = function() {
        const toc = document.getElementById('toc');
        const links = document.querySelectorAll('#content h1 a');
        let titels = [];
        links.forEach((link, index) => {
            const newLink = document.createElement('a');
            newLink.href = link.href;
            newLink.textContent = link.textContent;
            titels.push(newLink);
        });
        titels.sort((a, b) => {
            return a.textContent.localeCompare(b.textContent);
        });
        titels.forEach((link,index) => {
            link.textContent = (index + 1) + '. ' +link.textContent;
            toc.appendChild(link);
        });
    }
    </script>
</body>
</html>
`;
    res.send(html);
});

const g_timer_node_set = [];
function add_min_timer(min_count, func) {
    g_timer_node_set.push({
        min_last: min_count - 1,
        min_count: min_count - 1,
        func: func
    });
}
app.post('/api/v1/internal_timeout', async (req, res) => {
    let body = req.body;
    if (body.pwd = process.env.DEFAULT_PWD) {
        for (let index = 0; index < g_timer_node_set.length; index++) {
            const element = g_timer_node_set[index];
            if (element.min_last == 0) {
                element.func();
                element.min_last = element.min_count;
            }
            else {
                element.min_last--;
            }
        }
    }
    res.send({ err_msg: '' });
});

process.on('uncaughtException', (err) => {
    console.error('An uncaught error occurred!');
    console.error(err.stack);
});
let server = app.listen(parseInt(process.env.PORT), () => console.log('Server running on port ' + process.env.PORT));
process.on('SIGINT', () => {
    console.log('SIGINT signal received. Closing server...');
    server.close();
});

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

// 启动主循环
setInterval(startDeviceWorker, 10000);
//app.get