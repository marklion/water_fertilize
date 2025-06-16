function getTcpParams(device) {
    let ret = {
        ip: '0.0.0.0',
        port: 0,
        prefix: '12345678'
    }
    let ck = JSON.parse(device.connection_key);
    if (ck.type == 'ip_lora') {
        ret.ip = ck.ip;
        ret.port = ck.port;
        ret.prefix = ck.prefix;
    }
    return ret;
}
module.exports = {
    dev2tcp: async function (device) {
        return getTcpParams(device);
    }
};