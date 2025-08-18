# Task Completion Workflow

## タスク完了時の必須チェック項目

### 1. コード品質チェック
```bash
# ESLintによる構文・品質チェック
npm run lint
# または
pnpm lint
```

### 2. ビルドテスト
```bash
# 本番ビルドが成功するかテスト
npm run build
# または
pnpm build
```

### 3. 開発サーバー動作確認
```bash
# 開発サーバー起動して動作確認
npm run dev
# または
pnpm dev
```

### 4. 型チェック（TypeScriptプロジェクトの場合）
```bash
# TypeScript型チェック（設定では本番時無視されるが開発時は確認推奨）
npx tsc --noEmit
```

## 注意事項
- このプロジェクトでは`next.config.mjs`でTypeScriptエラーとESLintエラーが本番ビルド時に無視される設定になっている
- しかし、コード品質維持のため開発時はエラーを修正することを推奨
- 特に型安全性を重視するため、TypeScriptエラーは可能な限り解消する

## コミット前のチェックリスト
1. [ ] `npm run lint` または `pnpm lint` でESLintエラーがないか確認
2. [ ] `npm run build` または `pnpm build` でビルドが成功するか確認
3. [ ] ブラウザで動作確認（特に変更した機能）
4. [ ] レスポンシブデザインの確認（モバイル・デスクトップ両方）
5. [ ] アクセシビリティの基本チェック（キーボード操作など）

## テスト関連
- 現在専用のテストフレームワークは設定されていない
- 必要に応じて後でJest + Testing Libraryなどの導入を検討