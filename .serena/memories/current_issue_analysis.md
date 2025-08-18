# Current Issue Analysis: ページ遷移と2カラムレイアウトの改善

## ユーザーの要求
1. **動画URL入力後のページ遷移を廃止**: 現在はHeroコンポーネントで`router.push('/player?src=...')`によりページ遷移している
2. **2カラムレイアウト実装**: 左に動画、右にコントロールパネルを配置

## 現在の実装分析

### Hero Component (components/hero.tsx:54)
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  if (url.trim()) {
    router.push(`/player?src=${encodeURIComponent(url.trim())}`) // ページ遷移発生
  }
}
```

### VideoPlayer Component (components/video-player.tsx)
- 現在は縦積みレイアウト（動画の下にコントロール）
- 1カラムの設計で実装されている

## 解決すべき課題
1. **同一ページでの表示**: URL入力時にページ遷移せず、その場で動画プレイヤーを表示
2. **レイアウト変更**: 現在の縦積みレイアウトを2カラム（左動画、右コントロール）に変更
3. **レスポンシブ対応**: モバイルでは縦積み、デスクトップでは2カラムなど

## 実装アプローチ
1. Heroコンポーネント内で状態管理してVideoPlayerを条件付きレンダリング
2. VideoPlayerコンポーネントのレイアウトを2カラム対応に変更
3. 既存のプレイヤーページ(/player)との互換性維持