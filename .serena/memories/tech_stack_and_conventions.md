# Tech Stack & Code Conventions

## Tech Stack
- **Next.js 15.2.4**: App Routerを使用
- **React 19**: 最新版
- **TypeScript 5**: 厳密な型チェック有効
- **Tailwind CSS 4.1.9**: ユーティリティファーストCSS
- **Radix UI**: アクセシブルなUIプリミティブ
- **react-player**: 動画プレイヤーライブラリ
- **Lucide React**: アイコンライブラリ
- **class-variance-authority**: コンポーネントバリアントの管理
- **tailwind-merge**: Tailwindクラスのマージ

## Code Style & Conventions

### TypeScript
- 厳密な型チェック有効 (`strict: true`)
- `any`や`unknown`型は使用禁止
- クラスの使用は最小限（Error拡張など特別な場合のみ）
- インターフェースで型定義

### React/Next.js
- `"use client"`ディレクティブでクライアントコンポーネント指定
- App Routerパターン使用
- Suspenseでローディング状態管理
- useSearchParamsでURL パラメータ取得

### Naming Conventions
- **Components**: PascalCase (例: `VideoPlayer`, `Hero`)
- **Files**: kebab-case (例: `video-player.tsx`)
- **Functions**: camelCase (例: `handleSubmit`, `formatTime`)
- **Constants**: UPPER_SNAKE_CASE (オブジェクトはcamelCase)

### Component Structure
```typescript
"use client" // クライアントコンポーネントの場合

import { ... } from "react"
import { ... } from "next/..."
import { ... } from "@/components/ui/..."

interface ComponentProps {
  // プロパティ定義
}

export function ComponentName({ prop }: ComponentProps) {
  // hooks
  // handlers
  // effects
  
  return (
    // JSX
  )
}
```

### Import Organization
1. React/Next.js関連
2. 外部ライブラリ
3. 内部コンポーネント（@/components）
4. 型定義

### Styling
- Tailwind CSSクラス使用
- `cn()` 関数（tailwind-merge）でクラス結合
- レスポンシブ対応（`md:`プレフィックスなど）
- アクセシビリティ考慮