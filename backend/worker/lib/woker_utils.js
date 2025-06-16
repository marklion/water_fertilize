module.exports = {
    hexStringToUint8Array: function (hexString) {
        // 移除字符串中的空格（如果有），并转为小写（可选）
        const cleanedHex = hexString.replace(/\s/g, '').toLowerCase();

        // 验证是否为有效的十六进制字符串
        if (!/^[0-9a-f]*$/i.test(cleanedHex)) {
            throw new Error('输入包含非十六进制字符');
        }

        // 处理奇数长度：在开头补零
        const paddedHex = cleanedHex.length % 2 !== 0 ? '0' + cleanedHex : cleanedHex;

        // 计算字节长度并初始化 Uint8Array
        const byteLen = paddedHex.length / 2;
        const buffer = new Uint8Array(byteLen);

        // 每两个字符解析为一个字节
        for (let i = 0; i < byteLen; i++) {
            const byteHex = paddedHex.substring(i * 2, i * 2 + 2);
            buffer[i] = parseInt(byteHex, 16);
        }

        return buffer;
    },
    uint8ArrayToHexString: function (uint8Array) {
        return Array.from(uint8Array)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }
}