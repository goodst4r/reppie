# 🎬 Reppie - ABリピート対応マルチプラットフォーム動画プレーヤー

**Reppie**は、語学学習やダンス練習、楽器の練習などに最適な、ABリピート機能を搭載したウェブベースの動画プレーヤーです。YouTube、Vimeo、Dailymotion、Twitch、HTML5動画など、複数のプラットフォームに対応しています。

## ✨ 主な機能

- 🔁 **精密なABリピート機能** - 動画の特定区間を繰り返し再生
- 🌐 **マルチプラットフォーム対応** - YouTube、Vimeo、Dailymotion、Twitch、HTML5動画
- 📱 **レスポンシブデザイン** - PC、タブレット、スマートフォンに完全対応
- 🌏 **多言語対応** - 日本語と英語のインターフェース
- ⚡ **高速ローディング** - Next.js 15による最適化された性能
- 🎨 **モダンなUI** - shadcn/uiとRadix UIによる美しいインターフェース
- ⌨️ **キーボードショートカット** - 効率的な操作が可能
- 🎚️ **再生速度調整** - 0.25倍速から2倍速まで調整可能
- 🔊 **音量コントロール** - 細かい音量調整が可能

## 🚀 クイックスタート

### 必要要件

- Node.js 18.0以降
- npm または pnpm

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/goodst4r/reppie.git
cd reppie

# 依存関係をインストール
npm install
# または
pnpm install
```

### 開発サーバーの起動

```bash
npm run dev
# または
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 📖 使用方法

1. **動画URLを入力**: ホームページのフォームに動画URLを貼り付けます
2. **再生開始**: 「再生開始」ボタンをクリック
3. **ABリピート設定**: 
   - A点設定: リピート開始位置で「A」ボタンをクリック
   - B点設定: リピート終了位置で「B」ボタンをクリック
   - リピート解除: 「Clear」ボタンをクリック
4. **再生速度調整**: スピードコントロールで0.25x〜2xまで調整
5. **音量調整**: ボリュームスライダーで音量を調整

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: [Next.js 15.2.4](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### 動画プレーヤー
- **Core**: [react-player](https://github.com/cookpete/react-player)

### フォーム管理
- **Forms**: [react-hook-form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)

### その他
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)
- **Animations**: [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)
- **Utilities**: [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge)

## 📁 プロジェクト構成

```
reppie/
├── app/                  # Next.js App Router
│   ├── page.tsx         # 英語版ホームページ
│   ├── jp/              # 日本語版ページ
│   │   └── page.tsx     
│   ├── player/          # プレーヤーページ
│   │   └── page.tsx     
│   ├── layout.tsx       # ルートレイアウト
│   └── globals.css      # グローバルスタイル
├── components/          # Reactコンポーネント
│   ├── ui/             # 再利用可能なUIコンポーネント
│   ├── hero.tsx        # ヒーローセクション
│   ├── video-player.tsx # ビデオプレーヤー本体
│   ├── features.tsx    # 機能紹介
│   ├── footer.tsx      # フッター
│   └── ...
├── lib/                # ユーティリティ関数
│   └── utils.ts        
├── hooks/              # カスタムフック
├── public/             # 静的ファイル
└── styles/             # 追加スタイル
```

## 🔧 開発

### 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番用ビルド
npm run build

# 本番サーバー起動
npm run start

# コード品質チェック
npm run lint

# 型チェック
npx tsc --noEmit
```

### ビルド設定

> ⚠️ **注意**: 開発速度を優先するため、`next.config.mjs`でビルド時のESLintとTypeScriptエラーチェックが無効化されています。コミット前に必ず`npm run lint`と`npx tsc --noEmit`を実行してください。

## 🌐 対応プラットフォーム

- ✅ YouTube
- ✅ Vimeo
- ✅ Dailymotion
- ✅ Twitch
- ✅ HTML5動画（MP4、WebM、OGG）
- ✅ HLS/DASH ストリーミング

## 📝 今後の予定

- [ ] プレイリスト機能
- [ ] ブックマーク機能
- [ ] 字幕サポート
- [ ] ショートカットキーのカスタマイズ
- [ ] 動画のダウンロード機能
- [ ] ソーシャル共有機能の拡張
- [ ] PWA対応
- [ ] ダークモード切り替え

## 🤝 貢献

プルリクエストは大歓迎です！大きな変更の場合は、まずissueを開いて変更内容について議論してください。

1. プロジェクトをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを開く

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 👤 作者

**goodst4r**

- GitHub: [@goodst4r](https://github.com/goodst4r)

## 🙏 謝辞

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - 美しいUIコンポーネント
- [react-player](https://github.com/cookpete/react-player) - 強力な動画プレーヤーライブラリ

---

⭐ このプロジェクトが気に入ったら、スターをお願いします！