# Node.js LTS版を使用
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.json（存在する場合）をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションが使用するポートを公開
EXPOSE 8080

# Cloud Runはポート8080を期待するため、環境変数を設定
ENV PORT=8080

# ヘルスチェックを追加
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# アプリケーションを起動
CMD ["node", "server.js"]