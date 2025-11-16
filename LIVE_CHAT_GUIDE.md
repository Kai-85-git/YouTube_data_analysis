# YouTube Live Chat API 機能ガイド

YouTubeライブ配信のチャットコメントをリアルタイムで取得・表示する機能です。

## 🎯 機能概要

- **リアルタイムチャット取得**: YouTubeライブ配信のチャットメッセージをリアルタイムで取得
- **詳細情報表示**: 投稿者名、メッセージ内容、投稿時刻、バッジ情報を表示
- **Server-Sent Events**: SSEを使用したリアルタイムストリーミング
- **自動ポーリング**: YouTube APIの推奨間隔で自動的にメッセージを取得

## 🚀 使い方

### Web UI を使用する場合

1. アプリケーションを起動
```bash
npm start
```

2. ブラウザで以下のURLにアクセス
```
http://localhost:3000/live-chat.html
```

3. YouTubeライブ動画のURL または 動画IDを入力
   - URL例: `https://www.youtube.com/watch?v=VIDEO_ID`
   - ID例: `dQw4w9WgXcQ`

4. 「チャット開始」をクリック

5. リアルタイムでチャットメッセージが表示されます

### API を直接使用する場合

#### 1. ライブチャットの初期化

```javascript
POST /api/live-chat/init
Content-Type: application/json

{
  "videoIdOrUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "videoId": "VIDEO_ID",
    "liveChatId": "LIVE_CHAT_ID",
    "videoTitle": "動画タイトル",
    "channelTitle": "チャンネル名",
    "isLive": true,
    "concurrentViewers": "1234"
  }
}
```

#### 2. チャットメッセージの取得（単発）

```javascript
POST /api/live-chat/messages
Content-Type: application/json

{
  "liveChatId": "LIVE_CHAT_ID",
  "pageToken": "OPTIONAL_PAGE_TOKEN"
}
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "MESSAGE_ID",
        "type": "textMessageEvent",
        "publishedAt": "2024-01-01T12:00:00Z",
        "message": "こんにちは！",
        "authorName": "視聴者名",
        "authorChannelId": "CHANNEL_ID",
        "authorProfileImageUrl": "https://...",
        "isChatOwner": false,
        "isChatSponsor": false,
        "isChatModerator": false,
        "isVerified": false
      }
    ],
    "nextPageToken": "NEXT_PAGE_TOKEN",
    "pollingIntervalMillis": 5000,
    "messageCount": 10
  }
}
```

#### 3. リアルタイムストリーミング（SSE）

```javascript
GET /api/live-chat/stream/:liveChatId
```

**Server-Sent Events ストリーム例:**
```javascript
const eventSource = new EventSource('/api/live-chat/stream/LIVE_CHAT_ID');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'connected') {
    console.log('接続成功:', data.sessionId);
  } else if (data.type === 'messages') {
    console.log('新しいメッセージ:', data.messages);
  } else if (data.type === 'error') {
    console.error('エラー:', data.error);
  }
};

// 切断
eventSource.close();
```

## 📊 メッセージデータ構造

各チャットメッセージには以下の情報が含まれます:

| フィールド | 型 | 説明 |
|----------|-----|------|
| `id` | string | メッセージID |
| `type` | string | メッセージタイプ (`textMessageEvent`など) |
| `publishedAt` | string | 投稿時刻 (ISO 8601形式) |
| `message` | string | メッセージ内容 |
| `authorName` | string | 投稿者名 |
| `authorChannelId` | string | 投稿者のチャンネルID |
| `authorProfileImageUrl` | string | プロフィール画像URL |
| `isChatOwner` | boolean | 配信者かどうか |
| `isChatSponsor` | boolean | スポンサー（メンバー）かどうか |
| `isChatModerator` | boolean | モデレーターかどうか |
| `isVerified` | boolean | 認証済みアカウントかどうか |

## 🎨 表示されるバッジ

UIでは以下のバッジが表示されます:

- 🔴 **配信者** - チャンネルオーナー
- 🔵 **モデレーター** - モデレーター
- 🟢 **スポンサー** - チャンネルメンバー
- 🟣 **認証済み** - YouTube認証済みアカウント

## ⚠️ 注意事項

### YouTube Data API v3 の制限

1. **APIクォータ**: ライブチャットメッセージの取得は1リクエストあたり5ユニット消費
2. **ポーリング間隔**: APIレスポンスに含まれる`pollingIntervalMillis`を守る必要があります（通常5秒程度）
3. **ライブ配信のみ**: この機能は現在ライブ配信中またはプレミア公開中の動画でのみ使用可能

### 対応する動画

- ✅ 現在ライブ配信中の動画
- ✅ プレミア公開中の動画
- ✅ ライブチャットが有効な動画
- ❌ 通常の動画（ライブ配信ではない）
- ❌ ライブチャットが無効化されている動画
- ❌ プライベート動画

## 🔧 技術詳細

### バックエンド

- **LiveChatService**: ライブチャット管理サービス
  - `initializeLiveChat()`: ライブチャットIDの取得と動画情報の取得
  - `getChatMessages()`: チャットメッセージの取得
  - `startPolling()`: 自動ポーリングの開始
  - `stopPolling()`: ポーリングの停止

- **YouTube API メソッド**:
  - `videos.list`: 動画詳細とライブチャットIDの取得
  - `liveChatMessages.list`: ライブチャットメッセージの取得

### フロントエンド

- **Server-Sent Events (SSE)**: リアルタイム通信
- **自動スクロール**: 新しいメッセージが来ると自動的に最下部にスクロール
- **アニメーション**: メッセージが追加される際のスムーズなアニメーション

## 📝 使用例

### 例1: 特定のライブ配信のチャットを表示

```bash
# Web UIで以下のURLを入力
https://www.youtube.com/watch?v=jfKfPfyJRdk
```

### 例2: プログラムから利用

```javascript
// 1. ライブチャットを初期化
const initResponse = await fetch('/api/live-chat/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoIdOrUrl: 'jfKfPfyJRdk'
  })
});

const { data } = await initResponse.json();
const liveChatId = data.liveChatId;

// 2. SSEでリアルタイムにメッセージを受信
const eventSource = new EventSource(`/api/live-chat/stream/${liveChatId}`);

eventSource.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'messages') {
    msg.messages.forEach(message => {
      console.log(`${message.authorName}: ${message.message}`);
    });
  }
};
```

## 🐛 トラブルシューティング

### エラー: "This video does not have an active live chat"

**原因**: 動画がライブ配信ではないか、ライブチャットが無効

**解決策**:
- ライブ配信中の動画URLを使用してください
- ライブチャットが有効になっているか確認してください

### エラー: "YouTube APIキーが必要です"

**原因**: YouTube API キーが設定されていない

**解決策**:
- `.env`ファイルに`YOUTUBE_API_KEY`を設定してください
- または、リクエストボディに`youtubeApiKey`を含めてください

### 接続が頻繁に切断される

**原因**: APIクォータ制限に達した可能性

**解決策**:
- [Google Cloud Console](https://console.cloud.google.com/)でAPIクォータを確認
- ポーリング間隔を長くする
- 別のAPIキーを使用する

## 📚 関連リソース

- [YouTube Data API v3 - Live Chat Messages](https://developers.google.com/youtube/v3/live/docs/liveChatMessages)
- [YouTube Data API v3 - クォータ](https://developers.google.com/youtube/v3/determine_quota_cost)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🤝 サポート

問題が発生した場合:
1. このガイドのトラブルシューティングセクションを確認
2. [SETUP.md](./SETUP.md)でAPIキーの設定を確認
3. GitHubでIssueを作成

---

**Powered by YouTube Data API v3** 🎬
