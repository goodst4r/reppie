# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Reppieは、ABリピート機能を持つ多プラットフォーム対応のビデオプレーヤーアプリケーションです。YouTube、Vimeo、Dailymotion、Twitch、HTML5動画に対応しています。

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev    # localhost:3000で起動

# 本番ビルド
npm run build  # .nextディレクトリにビルド

# リントチェック
npm run lint   # Next.js ESLintでコード品質チェック

# 本番サーバー起動
npm run start  # ビルド後の本番モードで起動
```

## アーキテクチャ

### 技術スタック
- **Framework**: Next.js 15.2.4 (App Router)
- **UI**: React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **Video**: react-player (マルチプラットフォーム対応)
- **Form**: react-hook-form + zod

### ディレクトリ構成とデータフロー

```
app/
├── page.tsx          # 英語版ホーム（デフォルト）
├── jp/page.tsx       # 日本語版ホーム
├── player/page.tsx   # ビデオプレーヤーページ（共通）
└── layout.tsx        # ルートレイアウト

components/
├── hero.tsx          # URLフォーム → /player?src=URL へ遷移
├── video-player.tsx  # ABリピート機能実装の中核
└── ui/              # shadcn/uiコンポーネント
```

### 重要な実装パターン

#### 1. 多言語対応
```typescript
// components/hero.tsx
const content = {
  en: { /* 英語コンテンツ */ },
  ja: { /* 日本語コンテンツ */ }
}

// 使用例
<Hero locale="ja" />  // app/jp/page.tsx
<Hero locale="en" />  // app/page.tsx
```

#### 2. URL遷移フロー
```typescript
// Hero → VideoPlayer への遷移
// 1. URLをフォームに入力
// 2. router.push(`/player?src=${encodeURIComponent(url)}`)
// 3. PlayerPageでsearchParamsからURLを取得
// 4. VideoPlayerコンポーネントで再生
```

#### 3. パスエイリアス
```typescript
// tsconfig.json
"@/*": ["./*"]  // プロジェクトルートからの絶対インポート
```

## ビルド設定の注意事項

**重要**: `next.config.mjs`で以下が設定されています：
```javascript
eslint: { ignoreDuringBuilds: true }      // ビルド時ESLintエラー無視
typescript: { ignoreBuildErrors: true }   // ビルド時TypeScriptエラー無視
```

これは開発速度を優先した設定のため、コード品質は手動で確認する必要があります：
- `npm run lint`でESLintチェック
- `npx tsc --noEmit`で型チェック

## コンポーネント命名規則

- **ファイル名**: ケバブケース（`video-player.tsx`）
- **コンポーネント名**: PascalCase（`VideoPlayer`）
- **イベントハンドラ**: handle*（`handleSubmit`）

## shadcn/ui設定

`components.json`で定義：
- **Style**: new-york
- **Base Color**: neutral
- **CSS Variables**: 有効
- **Icons**: lucide-react