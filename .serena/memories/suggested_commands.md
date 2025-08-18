# Suggested Commands for reppie Project

## Development Commands
```bash
# 開発サーバー起動
npm run dev
# または
pnpm dev

# 本番ビルド
npm run build
# または
pnpm build

# 本番サーバー起動（ビルド後）
npm start
# または
pnpm start

# ESLintによるコード品質チェック
npm run lint
# または
pnpm lint
```

## Windows固有のユーティリティコマンド
```cmd
# ファイル一覧表示
dir
# または
ls (PowerShellの場合)

# ディレクトリ移動
cd <directory>

# ファイル内容表示
type <filename>
# または
cat <filename> (PowerShellの場合)

# ファイル検索
where <filename>
# または
Get-ChildItem -Recurse -Name "*pattern*" (PowerShell)

# テキスト検索
findstr "pattern" <filename>
# または
Select-String "pattern" <filename> (PowerShell)
```

## Git関連
```bash
git status
git add .
git commit -m "commit message"
git push
git pull
git branch
git checkout <branch>
git merge <branch>
```

## Package Management
```bash
# 依存関係インストール
npm install <package>
# または
pnpm add <package>

# 開発依存関係インストール
npm install -D <package>
# または
pnpm add -D <package>

# パッケージ削除
npm uninstall <package>
# または
pnpm remove <package>
```

## 重要な注意事項
- このプロジェクトはpnpmを推奨（pnpm-lock.yamlが存在）
- TypeScriptエラーは本番ビルド時に無視される設定（next.config.mjs）
- ESLintエラーも本番ビルド時に無視される設定