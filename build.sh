#!/bin/bash
SRC_DIR=$(dirname "$0")
PORT=${1}
DB_HOST=${2}
DB_USER=${3}
DB_PASS=${4}
DB_NAME=${5}
DEFAULT_PWD=${6}
if [ -z "$PORT" ] || [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$DB_NAME" ] || [ -z "$DEFAULT_PWD" ]; then
    echo "Usage: $0 <port> <db_host> <db_user> <db_pass> <db_name> <default_pwd>"
    exit 1
fi
install_first() {
    if [ ! -d "node_modules" ]; then
        echo "检测到缺少 node_modules 目录，执行 npm install..."
        npm install
        if [ $? -ne 0 ]; then
            echo "npm install 失败！"
            exit 1
        fi
    else
        echo "依赖已是最新，跳过 npm install"
    fi
}
pushd $SRC_DIR/backend/
    install_first
    PORT=$PORT DB_HOST=$DB_HOST DB_USER=$DB_USER DB_PASS=$DB_PASS DB_NAME=$DB_NAME DEFAULT_PWD=$DEFAULT_PWD npm run build
popd
pushd $SRC_DIR/pc_gui/
    install_first
    npm run build:prod
popd

if [ -d "$SRC_DIR/build" ]; then
    echo "清理旧的 build 目录..."
    rm -rf $SRC_DIR/build
fi
mkdir -p $SRC_DIR/build/backend
mkdir -p $SRC_DIR/build/pc_gui
cp -r $SRC_DIR/backend/dist/* $SRC_DIR/build/backend/
cp -r $SRC_DIR/pc_gui/dist/* $SRC_DIR/build/pc_gui/
zip -r $SRC_DIR/build.zip $SRC_DIR/build