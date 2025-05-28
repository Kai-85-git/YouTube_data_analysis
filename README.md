# 🎯 YouTube Channel Analyzer

YouTubeチャンネルのURLを入力するだけで、チャンネルの詳細分析を行うモダンなWebアプリケーションです。

![YouTube Channel Analyzer](https://img.shields.io/badge/YouTube-Data%20API%20v3-red?style=for-the-badge&logo=youtube)
![Node.js](https://img.shields.io/badge/Node.js-v16+-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-black?style=for-the-badge&logo=express)

## ✨ 機能

### 📊 分析機能
- チャンネル基本情報の取得
- 登録者数、総再生回数、動画数の統計表示
- 最新動画一覧の表示（サムネイル付き）
- チャンネル概要の表示

### 🎨 UI/UX
- モダンでリッチなデザイン
- レスポンシブ対応（PC・タブレット・スマホ）
- アニメーション付き統計カウンター
- グラスモーフィズム効果
- スムーズなトランジション

### 💾 その他機能
- 分析データのJSONエクスポート
- エラーハンドリング
- ローディング表示
- キーボードショートカット対応

## 🔗 対応URL形式

- `https://www.youtube.com/channel/CHANNEL_ID`
- `https://www.youtube.com/@USERNAME`
- `https://www.youtube.com/c/CHANNEL_NAME`  
- `https://www.youtube.com/user/USERNAME`

## 🚀 クイックスタート

### 1. セットアップ
詳細な手順は [SETUP.md](./SETUP.md) を参照してください。

```bash
# リポジトリのクローン
git clone <repository-url>
cd YouTube_data_analysis

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルにYouTube API キーを設定

# アプリケーションの起動
npm start
```

### 2. アクセス
ブラウザで `http://localhost:3000` にアクセス

## 🔧 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `npm start` | Webアプリケーションを起動 |
| `npm run cli` | CLI版を起動 |
| `npm run dev` | 開発モードで起動 |

## 📋 必要な設定

### YouTube Data API キーの取得

1. [Google Cloud Console](https://console.developers.google.com/) にアクセス
2. プロジェクトを作成
3. YouTube Data API v3を有効化
4. APIキーを作成
5. `.env`ファイルに設定

詳細は [SETUP.md](./SETUP.md) を参照してください。

## 📊 取得データ

### チャンネル情報
- チャンネル名・ID
- 作成日
- チャンネル概要
- カスタムURL
- チャンネルアイコン

### 統計情報
- 登録者数
- 総再生回数  
- 動画数

### 動画情報
- 最新動画6本
- 動画タイトル
- 公開日
- サムネイル

## 🔒 セキュリティ

- APIキーは環境変数で管理
- `.env`ファイルは`.gitignore`に追加済み
- GitHub上にはAPIキーが含まれません

## 📱 動作環境

- **Node.js**: v16以上
- **ブラウザ**: Chrome, Firefox, Safari, Edge（最新版）
- **画面サイズ**: 320px〜（レスポンシブ対応）

## 🚫 制限事項

- YouTube Data API v3の使用制限（1日10,000ユニット）
- チャンネル分析1回あたり約3-5ユニット消費
- プライベートチャンネルは分析不可

## 🤝 コントリビューション

1. フォークしてください
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🆘 サポート

問題が発生した場合は：
1. [SETUP.md](./SETUP.md) のトラブルシューティングを確認
2. Issueを作成して報告

---

**Powered by YouTube Data API v3** 🎬