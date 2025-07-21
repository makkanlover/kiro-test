# Kiro Wallet API Documentation

## Overview
Kiro Walletは、Ethereum系ブロックチェーンネットワーク（Sepolia、Amoy）での分散型アプリケーション開発を支援するウォレットアプリケーションです。

## Core Services

### WalletService
ウォレットの作成、復元、管理を担当します。

#### Methods
- `createNewWallet(password: string)` - 新しいウォレットを作成
- `loadFromPrivateKey(privateKey: string, password: string)` - 秘密鍵からウォレットを復元
- `loadFromMnemonic(mnemonic: string, password: string)` - ニーモニックからウォレットを復元
- `loadFromEnvFile(envContent?: string)` - 環境ファイルからウォレットを読み込み
- `unlockWallet(password: string)` - ウォレットのロック解除
- `lockWallet()` - ウォレットのロック
- `switchNetwork(networkId: NetworkId)` - ネットワークの切り替え
- `getCurrentWallet()` - 現在のウォレット情報を取得
- `getProvider()` - プロバイダーを取得
- `getSigner()` - 署名者を取得

### TransactionService
トランザクションの送信、ガス推定、履歴管理を担当します。

#### Methods
- `sendTransaction(to: string, value: string, options?)` - トランザクション送信
- `estimateGas(to: string, value: string, data?: string)` - ガス推定
- `getGasPrice()` - ガス価格取得
- `getTransactionCount(address?: string)` - ナンス取得
- `waitForTransaction(txHash: string, confirmations?: number)` - トランザクション完了待機
- `getTransactionHistory(address: string, limit?: number)` - トランザクション履歴取得
- `getTransactionStatus(txHash: string)` - トランザクション状態確認

### BalanceService
残高の取得、監視、フォーマット機能を提供します。

#### Methods
- `getBalance(address?: string)` - ETH残高取得
- `getFormattedBalance(address?: string, decimals?: number, unit?: string)` - フォーマット済み残高取得
- `watchBalance(callback: Function, address?: string)` - 残高監視開始
- `stopWatching()` - 残高監視停止
- `getTokenBalance(address: string, tokenAddress: string)` - ERC-20トークン残高取得

### ContractService
スマートコントラクトのデプロイ、管理、呼び出し機能を提供します。

#### Methods
- `deployContract(bytecode: string, abi: any[], constructorArgs: any[])` - コントラクトデプロイ
- `getContract(address: string, abi: any[])` - コントラクトインスタンス取得
- `callContract(address: string, method: string, args: any[])` - コントラクトメソッド呼び出し
- `getContractInfo(address: string)` - コントラクト情報取得
- `verifyContract(deployment: any, sourceCode: string)` - コントラクト検証

### ContractVerificationService
ブロックエクスプローラーでのコントラクト検証機能を提供します。

#### Methods
- `verifyContract(chainId: string, request: VerificationRequest)` - コントラクト検証実行
- `getVerificationStatus(chainId: string, guid: string)` - 検証状態確認
- `getSupportedCompilerVersions()` - サポートされているコンパイラバージョン一覧

## Error Handling

### AppError Class
アプリケーション固有のエラー処理クラス

```typescript
class AppError extends Error {
  category: ErrorCategory
  code: ErrorCode
  userMessage: string
  timestamp: Date
  details?: string
}
```

### Error Categories
- `WALLET` - ウォレット関連エラー
- `NETWORK` - ネットワーク関連エラー
- `TRANSACTION` - トランザクション関連エラー
- `CONTRACT` - コントラクト関連エラー
- `VALIDATION` - 入力検証エラー
- `SYSTEM` - システムエラー

## Supported Networks

### Sepolia (Ethereum Testnet)
- Chain ID: 11155111
- RPC URL: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
- Block Explorer: https://sepolia.etherscan.io

### Amoy (Polygon Testnet)
- Chain ID: 80002
- RPC URL: https://rpc-amoy.polygon.technology
- Block Explorer: https://amoy.polygonscan.com

## Security Features

### Encryption
- AES-256暗号化による秘密鍵の保護
- パスワードベースの暗号化/復号化
- セキュアなキー導出（PBKDF2）

### Wallet Protection
- 自動ロック機能
- セッション管理
- パスワード検証

## Configuration

### Environment Variables
```bash
VITE_PRIVATE_KEY=your_private_key_here
VITE_INFURA_PROJECT_ID=your_infura_project_id
VITE_ETHERSCAN_API_KEY=your_etherscan_api_key
VITE_POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### Jest Configuration
テスト環境でのカバレッジターゲット：
- Statements: 90%
- Branches: 90%
- Functions: 90%
- Lines: 90%

## Development

### Testing
```bash
npm test                    # 全テスト実行
npm test -- --coverage     # カバレッジ付きテスト実行
npm run test:e2e           # E2Eテスト実行
```

### Build
```bash
npm run build              # プロダクションビルド
npm run dev                # 開発サーバー起動
npm run preview            # プレビューサーバー起動
```

## Best Practices

1. **セキュリティ**
   - 秘密鍵やAPI キーをコードに直接記述しない
   - .env ファイルは.gitignoreに追加
   - パスワードの最小要件を守る

2. **エラーハンドリング**
   - AppErrorクラスを使用してエラーを分類
   - ユーザーフレンドリーなエラーメッセージを提供
   - エラーログを適切に記録

3. **テスト**
   - 主要な機能には単体テストを必須
   - モック戦略を統一
   - カバレッジ目標を達成

4. **パフォーマンス**
   - 不要なre-renderを避ける
   - 適切なuseCallback/useMemoの使用
   - ガス価格の最適化