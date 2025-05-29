# 🎯 YouTube Channel Analyzer

YouTubeチャンネルのURLを入力するだけで、チャンネルの詳細分析を行うモダンなWebアプリケーションです。

![YouTube Channel Analyzer](https://img.shields.io/badge/YouTube-Data%20API%20v3-red?style=for-the-badge&logo=youtube)
![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-blue?style=for-the-badge&logo=google)
![Node.js](https://img.shields.io/badge/Node.js-v16+-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-black?style=for-the-badge&logo=express)

## ✨ 機能

### 📊 チャンネル分析
- チャンネル基本情報の取得
- 登録者数、総再生回数、動画数の統計表示
- 最新動画・人気動画一覧の表示（サムネイル付き）
- チャンネル概要と詳細分析
- 成長推移チャートの表示

### 💬 コメント分析
- チャンネル内全動画のコメント収集・分析
- 人気コメント（いいね数順）の表示
- 建設的なコメントの抽出
- 改善提案コメントの特定
- コメント統計情報の算出

### 🎯 AI動画アイデア生成 (NEW!)
- **視聴者ニーズ分析**: コメントから視聴者が求める動画内容をAI分析
- **人気パターン学習**: 過去の成功動画から効果的なパターンを学習
- **動画アイデア提案**: 
  - 📹 今すぐ作れる動画（制作時間2-4時間）
  - 📚 シリーズ化提案（継続的な視聴習慣構築）
  - 🔥 トレンド動画（緊急度の高いタイムリーな内容）
- **最適化提案**: 投稿タイミング、タイトル形式、動画時間の最適化
- **Gemini AI搭載**: Google Gemini APIによる高精度な分析

### 🎨 UI/UX
- モダンでリッチなデザイン
- レスポンシブ対応（PC・タブレット・スマホ）
- アニメーション付き統計カウンター
- グラスモーフィズム効果
- スムーズなトランジション

### 📤 データエクスポート
- 分析結果のJSONファイルエクスポート
- 詳細データの保存機能
- エラーハンドリング
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
# .envファイルにYouTube API キーとGemini API キーを設定

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
5. `.env`ファイルの`YOUTUBE_API_KEY`に設定

### Gemini API キーの取得 (AI機能用)

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. APIキーを作成
4. `.env`ファイルの`GEMINI_API_KEY`に設定

詳細は [SETUP.md](./SETUP.md) を参照してください。

## 📊 取得データ

### チャンネル情報
- チャンネル名・ID・作成日
- チャンネル概要・カスタムURL
- チャンネルアイコン・統計情報

### 動画データ
- 最新動画・人気動画一覧
- 動画タイトル・公開日・サムネイル
- 再生回数・いいね数・コメント数

### AI分析データ
- 視聴者ニーズ分析結果
- 成功パターンの学習結果
- 具体的な動画アイデア提案
- 最適化レコメンデーション

## 🔒 セキュリティ

- YouTube・Gemini APIキーは環境変数で管理
- `.env`ファイルは`.gitignore`に追加済み
- GitHub上にはAPIキーが含まれません
- APIキー検証機能でセキュリティを確保

## 📱 動作環境

- **Node.js**: v16以上
- **ブラウザ**: Chrome, Firefox, Safari, Edge（最新版）
- **画面サイズ**: 320px〜（レスポンシブ対応）

## 🚫 制限事項

- **YouTube Data API v3**: 1日10,000ユニット制限
- **Gemini API**: 使用量に応じた料金体系
- チャンネル分析1回あたり約3-5ユニット消費
- AI分析機能は追加でGemini APIを使用
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

**Powered by YouTube Data API v3 & Google Gemini AI** 🎬🤖