# 🔧 セットアップガイド

## 必要なもの

- Node.js (v16以上)
- YouTube Data API v3キー

## 📋 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd YouTube_data_analysis
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. YouTube Data API キーの取得

1. [Google Cloud Console](https://console.developers.google.com/) にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択
3. **API とサービス** → **ライブラリ** に移動
4. **YouTube Data API v3** を検索して有効化
5. **認証情報** → **認証情報を作成** → **APIキー** を選択
6. 作成されたAPIキーをコピー

### 4. 環境変数の設定

1. `.env.example` ファイルを `.env` にコピー:
```bash
cp .env.example .env
```

2. `.env` ファイルを編集して、取得したAPIキーを設定:
```bash
YOUTUBE_API_KEY=your_actual_api_key_here
PORT=3000
```

### 5. アプリケーションの起動

#### Webアプリ版（推奨）
```bash
npm start
```
ブラウザで `http://localhost:3000` にアクセス

#### CLI版
```bash
npm run cli
```

## 🔒 セキュリティ注意事項

- **`.env` ファイルは絶対にGitにコミットしないでください**
- APIキーは他人と共有しないでください
- 本番環境では適切なAPI制限を設定してください

## 🚫 トラブルシューティング

### APIキーエラーが発生する場合
```
❌ YouTube API key is not configured!
```

1. `.env` ファイルが存在するか確認
2. `YOUTUBE_API_KEY` が正しく設定されているか確認
3. APIキーにスペースや改行が含まれていないか確認

### API制限エラーが発生する場合
```
quota exceeded
```

1. [Google Cloud Console](https://console.developers.google.com/) でクォータ使用量を確認
2. 必要に応じてクォータ制限の引き上げを申請
3. 時間をおいて再試行

### ポートエラーが発生する場合
```
EADDRINUSE: address already in use
```

1. 他のアプリケーションがポート3000を使用していないか確認
2. `.env` ファイルで別のポート番号を指定:
```bash
PORT=3001
```

## 📊 API使用制限について

YouTube Data API v3には以下の制限があります：
- 1日あたり10,000ユニット（デフォルト）
- チャンネル分析1回あたり約3-5ユニット消費

効率的な使用のため：
- 同じチャンネルの分析を短時間で何度も実行しない
- 必要に応じてキャッシュ機能の実装を検討