# Project Overview: reppie

## Purpose
reppieは動画URLを入力してAB（区間リピート）再生機能を提供するWebアプリケーションです。YouTube、Vimeo、Dailymotion、Twitch、HTML5動画に対応し、語学学習や楽器練習などで特定の区間を繰り返し再生したいユーザーをターゲットとしています。

## Tech Stack
- **Framework**: Next.js 15.2.4 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI コンポーネント群
- **Video Player**: react-player (latest)
- **Package Manager**: pnpm (pnpm-lock.yamlが存在)
- **Development**: Node.js環境

## Key Features
- 動画URL入力でプレイヤーページ（/player）にリダイレクト
- ABリピート機能（区間指定ループ再生）
- キーボードショートカット対応
- 多言語対応（英語/日本語）
- レスポンシブデザイン
- リンク共有機能

## Current Architecture
- **app/**: Next.js App Router構成
  - `page.tsx`: ランディングページ
  - `player/page.tsx`: 動画プレイヤーページ
  - `jp/page.tsx`: 日本語版ページ
- **components/**: 再利用可能コンポーネント
  - `video-player.tsx`: メインの動画プレイヤーコンポーネント
  - `hero.tsx`: ヒーローセクション（URL入力フォーム）
  - `ui/`: Radix UIベースのUIコンポーネント群