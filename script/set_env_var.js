const fs = require('fs');
const process = require('process');
const path = require('path');
const readline = require('readline');
const envFile = path.join(__dirname, '../backend/.env.development');
const VAR_NAME = 'DB_PASS';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function change_file(answer) {
    let content = '';
    if (fs.existsSync(envFile)) {
        content = fs.readFileSync(envFile, 'utf8');
        // 替换已有变量
        if (content.match(new RegExp(`^${VAR_NAME}=.*$`, 'm'))) {
            content = content.replace(new RegExp(`^${VAR_NAME}=.*$`, 'm'), `${VAR_NAME}=${answer}`);
        } else {
            // 追加变量
            content += `\n${VAR_NAME}=${answer}\n`;
        }
    } else {
        content = `${VAR_NAME}=${answer}\n`;
    }
    fs.writeFileSync(envFile, content, 'utf8');
    console.log(`Set ${VAR_NAME} in .env.development`);
}

if (process.argv.length > 2) {
    // 如果命令行参数中有密码，直接使用
    const answer = process.argv[2];
    change_file(answer);
    process.exit(0);
}

rl.question('Please enter your password: ', (answer) => {
    change_file(answer);
    rl.close();
});