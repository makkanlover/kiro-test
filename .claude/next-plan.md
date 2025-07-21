# Kiro Wallet コンパクト化・リファクタリング計画

## 現状分析

### プロジェクト規模
- **総ソースファイル数**: 53個のTypeScript/TSXファイル
- **重複ファイル**: 9個の`.corrected`, `.final`, `.final2`ファイル
- **テストファイル**: 12個のテストファイル
- **主要コンポーネント**: 17個のReactコンポーネント
- **サービス層**: 6個のサービスクラス
- **ユーティリティ**: 4個のユーティリティモジュール

### 問題点
1. **ファイル重複**: 開発過程で生成された重複ファイルが散乱
2. **コンポーネント分散**: 小さな機能が多数のファイルに分散
3. **設定ファイル重複**: 複数のJest設定ファイル
4. **未使用コード**: WalletConnectServiceなど未完成機能
5. **i18n肥大化**: 673行の多言語対応ファイル（使用率低）

## コンパクト化戦略

### Phase 1: クリーンアップ（即座に実行可能）

#### 1.1 重複ファイル削除
```bash
# 削除対象ファイル
src/components/ErrorDisplay.corrected.tsx
src/components/ErrorDisplay.final.tsx
src/__tests__/ContractService.test.corrected.ts
src/__tests__/ContractService.test.final.ts
src/__tests__/ContractService.test.final2.ts
src/__tests__/crypto.test.corrected.ts
src/__tests__/crypto.test.final.ts
src/__tests__/WalletConnection.test.corrected.tsx
src/__tests__/WalletConnection.test.final.tsx
jest.config.final.js
jest.config.fixed.js
jest.config.old.js
```

#### 1.2 設定ファイル統合
- Jest設定ファイルを1つに統合
- 不要なTransformerファイル削除
- Viteの重複設定削除

### Phase 2: アーキテクチャ整理

#### 2.1 コンポーネント統合案

**現在 → 統合後**

```
17個のコンポーネント → 8個のコンポーネント

統合対象:
1. WalletConnection + WalletRecovery → WalletManager
2. SendTransaction + ReceiveTransaction → TransactionManager  
3. TokenBalance + TransactionHistory → BalanceManager
4. ContractDeployment + ContractVerification → ContractManager
5. BackupWallet + LanguageSelector → SettingsManager
6. ErrorDisplay + PerformanceMonitor → SystemManager
7. Dashboard (メイン画面として維持)
8. MainLayout (レイアウトとして維持)
```

#### 2.2 サービス層最適化

**現在 → 統合後**

```
6個のサービス → 4個のサービス

統合案:
1. WalletService (維持 - コア機能)
2. TransactionService + BalanceService → BlockchainService
3. ContractService + ContractVerificationService → ContractService
4. WalletConnectService (削除 - 未実装)
```

#### 2.3 Hooks統合

```
4個のhooks → 2個のhooks

統合案:
1. useWallet (useAutoLock + useErrorHandler統合)
2. useBlockchain (useBalance + usePerformance統合)
```

### Phase 3: 機能簡素化

#### 3.1 国際化の簡素化
```typescript
// 現在: 673行のi18n.ts
// 統合後: 100行程度の最小限対応

// 対応言語: 日本語 + 英語のみ
// 翻訳対象: エラーメッセージ + UIラベルのみ
```

#### 3.2 TypeScript型定義の統合
```typescript
// 現在: types/global.d.ts + types/index.ts
// 統合後: types.ts (1ファイル)

// 不要な型定義削除
// 重複する型定義統合
```

#### 3.3 ユーティリティ関数の統合
```typescript
// 現在: utils/ 4ファイル
// 統合後: utils.ts (1ファイル) + errorHandler.ts

// crypto.ts + networks.ts → utils.ts
// errorHandler.ts (維持 - 重要機能)
// i18n.ts → utils.ts内に簡素化版統合
```

### Phase 4: 新しいフォルダ構造

```
src/
├── components/
│   ├── WalletManager.tsx          # ウォレット管理統合
│   ├── TransactionManager.tsx     # 取引管理統合
│   ├── BalanceManager.tsx         # 残高管理統合
│   ├── ContractManager.tsx        # コントラクト管理統合
│   ├── SettingsManager.tsx        # 設定管理統合
│   ├── SystemManager.tsx          # システム管理統合
│   ├── Dashboard.tsx              # メインダッシュボード
│   └── Layout.tsx                 # レイアウト
├── services/
│   ├── WalletService.ts           # ウォレット中核機能
│   ├── BlockchainService.ts       # ブロックチェーン操作
│   └── ContractService.ts         # コントラクト操作
├── hooks/
│   ├── useWallet.ts               # ウォレット関連hooks
│   └── useBlockchain.ts           # ブロックチェーン関連hooks
├── utils/
│   ├── utils.ts                   # 汎用ユーティリティ
│   └── errorHandler.ts            # エラーハンドリング
├── types.ts                       # 型定義統合
├── App.tsx                        # アプリケーションルート
└── main.tsx                       # エントリーポイント
```

### Phase 5: パフォーマンス最適化

#### 5.1 バンドルサイズ削減
- **現在予想サイズ**: ~2MB
- **目標サイズ**: ~800KB

**削減方法:**
1. Tree-shakingの最適化
2. 動的インポートの活用
3. 不要な依存関係の削除
4. Material-UIの部分インポート

#### 5.2 メモリ使用量最適化
```typescript
// コンポーネントのメモ化強化
const WalletManager = memo(({ ... }) => { ... })

// 不要なstate削除
// useCallback/useMemoの適切な使用
```

### Phase 6: テスト戦略の見直し

#### 6.1 統合テスト中心へ移行
```
現在: 12個の細かいテストファイル
統合後: 6個の統合テストファイル

1. WalletService.test.ts
2. BlockchainService.test.ts  
3. ContractService.test.ts
4. utils.test.ts
5. errorHandler.test.ts
6. integration.test.ts (E2E補完)
```

#### 6.2 テストカバレッジ戦略
- **目標カバレッジ**: 85% (現実的な目標)
- **重点領域**: サービス層 (90%+)
- **軽量化領域**: UI層 (70%+)

### Phase 7: 開発体験の向上

#### 7.1 設定の簡素化
```javascript
// 統合後の設定ファイル数
- package.json (依存関係整理)
- vite.config.ts (1ファイル統合)
- jest.config.js (1ファイル統合)  
- tsconfig.json (設定最適化)
- playwright.config.ts (E2E設定)
```

#### 7.2 ビルド時間短縮
- **現在**: ~30秒
- **目標**: ~15秒

## 実装優先度

### 🔴 高優先度 (即座に実行)
1. 重複ファイル削除
2. 設定ファイル統合
3. 未使用コード削除

### 🟡 中優先度 (1週間以内)
1. コンポーネント統合
2. サービス層リファクタリング
3. hooks統合

### 🟢 低優先度 (長期的改善)
1. 国際化簡素化
2. パフォーマンス最適化
3. テスト戦略見直し

## 期待効果

### 開発効率
- **ファイル数**: 53 → 25 (50%削減)
- **メンテナンス性**: 大幅向上
- **新機能追加速度**: 2倍向上

### アプリケーション性能
- **バンドルサイズ**: 60%削減
- **起動時間**: 40%短縮
- **メモリ使用量**: 30%削減

### コード品質
- **重複コード**: ほぼ削除
- **型安全性**: 向上
- **テスト保守性**: 大幅向上

## リスク管理

### 注意事項
1. **段階的実行**: 一度にすべてを変更しない
2. **バックアップ**: 各フェーズ前にブランチ作成
3. **テスト確認**: 各段階でテスト実行確認
4. **機能確認**: 既存機能の動作確認

### 回避策
- Git履歴の保持
- 段階的マージ戦略
- 継続的テスト実行
- 機能フラグによる切り替え

## 結論

このコンパクト化計画により、Kiro Walletは保守性が高く、パフォーマンスに優れた効率的なアプリケーションに進化します。特に開発体験の向上と長期的な保守性の確保が主要な目標です。

実装は段階的に行い、各フェーズでの機能確認を怠らないことが成功の鍵となります。