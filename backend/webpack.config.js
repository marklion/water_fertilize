const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const mode = process.env.NODE_ENV || 'development';
const isDev = mode === 'development';

// 通过命令行指定环境变量，例如：API_URL=https://api.example.com webpack --mode=production
const envVars = {};
if (!isDev) {
    // 只在生产打包时通过命令行传递环境变量
    ['PORT', 'DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME', 'DEFAULT_PWD'].forEach((key) => {
        envVars[key] = JSON.stringify(process.env[key] || '');
    });
} else {
    envVars['PORT'] = JSON.stringify(43000); // 开发模式默认端口
    envVars['DB_HOST'] = JSON.stringify('rm-2ze6222dda7fe8427eo.mysql.rds.aliyuncs.com'); // 开发模式默认数据库主机
    envVars['DB_USER'] = JSON.stringify('sysadmin');
    envVars['DB_PASS'] = JSON.stringify(process.env.DB_PASS || ''); // 开发模式默认数据库密码
    envVars['DB_NAME'] = JSON.stringify('wf_test');
}

module.exports = {
    entry: './index.js', // 你的后端入口文件
    target: 'node',
    mode,
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'server.js',
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': envVars,
        }), {
            apply: (compiler) => {
                compiler.hooks.beforeRun.tapAsync('CheckChangesPlugin', (compilation, callback) => {
                    const vueFilesDir = path.resolve(__dirname);
                    const lastBuildFile = path.resolve(__dirname, 'last-build-time.txt');
                    let lastBuildTime = 0;

                    if (fs.existsSync(lastBuildFile)) {
                        lastBuildTime = fs.readFileSync(lastBuildFile, 'utf-8');
                    }

                    let filesChanged = false;
                    const checkFiles = (dir) => {
                        const files = fs.readdirSync(dir);
                        for (let file of files) {
                            const filePath = path.join(dir, file);
                            const stat = fs.statSync(filePath);

                            if (stat.isDirectory()) {
                                checkFiles(filePath);
                            } else if (stat.mtimeMs > lastBuildTime &&
                                path.resolve(filePath) != path.resolve(lastBuildFile) &&
                                !filePath.endsWith('package-lock.json')) {
                                filesChanged = true;
                                console.log(filePath);
                                break;
                            }
                        }
                    };

                    checkFiles(vueFilesDir);

                    if (!filesChanged) {
                        console.log('No relevant changes detected, skipping build.');
                        process.exit(0); // Exit the process to skip the build
                    } else {
                        fs.writeFileSync(lastBuildFile, Date.now().toString());
                    }

                    callback();
                });
            }
        }
    ],
    watch: isDev, // 开发模式下启用watch
    watchOptions: {
        ignored: /node_modules/,
    },
    resolve: {
        modules: ['node_modules', path.resolve(__dirname, 'node_modules')],
    },
    devtool: isDev ? 'inline-source-map' : false,
};