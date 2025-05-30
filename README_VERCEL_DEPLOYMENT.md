# Vercel Deployment Guide

このプロジェクトをVercelにデプロイする際の手順と注意事項です。

## セキュリティに関する重要な注意事項

### 1. 環境変数の安全な管理

**絶対にやってはいけないこと:**
- APIキーをコードに直接記述しない
- `.env`ファイルをGitHubにプッシュしない
- クライアントサイドのコードにAPIキーを含めない

**推奨される方法:**
1. Vercelダッシュボードで環境変数を設定する
2. GitHubリポジトリには`.env.example`のみを含める

### 2. Vercelでの環境変数設定

1. Vercelダッシュボードにログイン
2. プロジェクトの設定ページに移動
3. "Environment Variables"セクションで以下を追加:
   - `YOUTUBE_API_KEY`: YouTube Data API v3のキー
   - `GEMINI_API_KEY`: Gemini APIのキー

### 3. APIキーの取得方法

**YouTube API Key:**
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. YouTube Data API v3を有効化
4. 認証情報を作成（APIキー）

**Gemini API Key:**
1. [Google AI Studio](https://aistudio.google.com/app/apikey)にアクセス
2. APIキーを生成

## デプロイ手順

### 1. GitHubリポジトリの準備

```bash
# .gitignoreに.envが含まれていることを確認
cat .gitignore | grep .env

# 必要なファイルをコミット
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Vercelでのデプロイ

1. [Vercel](https://vercel.com)にログイン
2. "New Project"をクリック
3. GitHubリポジトリをインポート
4. 環境変数を設定
5. "Deploy"をクリック

### 3. デプロイ後の確認

- `/api/analyze`などのAPIエンドポイントが正常に動作することを確認
- ブラウザの開発者ツールでエラーがないことを確認

## トラブルシューティング

### 404エラーが発生する場合

1. `vercel.json`の設定を確認
2. APIファイルが`/api`ディレクトリに正しく配置されているか確認
3. 環境変数が正しく設定されているか確認

### APIキーエラーが発生する場合

1. Vercelダッシュボードで環境変数が設定されているか確認
2. 環境変数名が正しいか確認（`YOUTUBE_API_KEY`, `GEMINI_API_KEY`）
3. APIキーが有効であることを確認

## セキュリティベストプラクティス

1. **定期的なAPIキーのローテーション**: 3-6ヶ月ごとにAPIキーを更新
2. **APIキーの使用制限**: Google Cloud ConsoleでAPIキーの使用を制限
3. **HTTPSの使用**: Vercelは自動的にHTTPSを提供
4. **CORSの設定**: 必要に応じてCORSヘッダーを設定

## 追加の推奨事項

1. **レート制限の実装**: APIの過剰使用を防ぐ
2. **エラーログの監視**: Vercelのログ機能を活用
3. **パフォーマンスの最適化**: 静的アセットのキャッシュを活用

## 注意事項

- Vercelの無料プランには使用制限があります
- APIキーの露出を防ぐため、クライアントサイドからの直接的なAPI呼び出しは避けてください
- 本番環境では適切なエラーハンドリングとログ記録を実装してください