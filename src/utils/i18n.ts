import { createContext, useContext } from 'react'

// Supported languages
export enum Language {
  EN = 'en',
  JA = 'ja'
}

// Translation keys interface
export interface TranslationKeys {
  // Common
  'common.loading': string
  'common.error': string
  'common.success': string
  'common.cancel': string
  'common.confirm': string
  'common.save': string
  'common.close': string
  'common.copy': string
  'common.refresh': string
  'common.next': string
  'common.back': string
  'common.send': string
  'common.receive': string
  'common.connect': string
  'common.disconnect': string
  'common.unlock': string
  'common.lock': string
  'common.create': string
  'common.import': string
  'common.export': string
  'common.backup': string
  'common.restore': string
  'common.password': string
  'common.address': string
  'common.amount': string
  'common.balance': string
  'common.transaction': string
  'common.history': string
  'common.network': string
  'common.gas': string
  'common.fee': string
  'common.contract': string
  'common.deploy': string
  'common.verify': string
  
  // Wallet
  'wallet.welcome': string
  'wallet.createNew': string
  'wallet.createNewDesc': string
  'wallet.loadFromEnv': string
  'wallet.loadFromEnvDesc': string
  'wallet.connectMetaMask': string
  'wallet.connectMetaMaskDesc': string
  'wallet.connectWalletConnect': string
  'wallet.connectWalletConnectDesc': string
  'wallet.recoverWallet': string
  'wallet.recoverWalletDesc': string
  'wallet.unlockWallet': string
  'wallet.unlockWalletDesc': string
  'wallet.locked': string
  'wallet.unlocked': string
  'wallet.created': string
  'wallet.recovered': string
  'wallet.connected': string
  'wallet.disconnected': string
  'wallet.passwordRequired': string
  'wallet.passwordStrength': string
  'wallet.confirmPassword': string
  'wallet.passwordMismatch': string
  'wallet.mnemonicPhrase': string
  'wallet.mnemonicWarning': string
  'wallet.mnemonicSaved': string
  'wallet.privateKey': string
  'wallet.invalidPrivateKey': string
  'wallet.selectEnvFile': string
  'wallet.envFileFormat': string
  
  // Dashboard
  'dashboard.title': string
  'dashboard.quickActions': string
  'dashboard.recentTransactions': string
  'dashboard.noTransactions': string
  'dashboard.smartContracts': string
  'dashboard.contractDeploy': string
  'dashboard.contractVerify': string
  'dashboard.contractDesc': string
  
  // Transactions
  'transaction.send': string
  'transaction.receive': string
  'transaction.details': string
  'transaction.recipient': string
  'transaction.sender': string
  'transaction.hash': string
  'transaction.status': string
  'transaction.confirmations': string
  'transaction.gasLimit': string
  'transaction.gasPrice': string
  'transaction.gasFee': string
  'transaction.total': string
  'transaction.pending': string
  'transaction.confirmed': string
  'transaction.failed': string
  'transaction.estimating': string
  'transaction.broadcasting': string
  'transaction.success': string
  'transaction.invalidAddress': string
  'transaction.invalidAmount': string
  'transaction.insufficientBalance': string
  'transaction.summary': string
  'transaction.confirmAndSign': string
  'transaction.complete': string
  'transaction.qrCode': string
  'transaction.shareAddress': string
  'transaction.availableBalance': string
  
  // Errors
  'error.networkError': string
  'error.connectionFailed': string
  'error.transactionFailed': string
  'error.walletLocked': string
  'error.walletNotFound': string
  'error.invalidInput': string
  'error.gasEstimationFailed': string
  'error.insufficientGas': string
  'error.userRejected': string
  'error.contractCallFailed': string
  'error.unknownError': string
  'error.tryAgain': string
  'error.checkConnection': string
  'error.contactSupport': string
  
  // Settings
  'settings.language': string
  'settings.currency': string
  'settings.network': string
  'settings.theme': string
  'settings.security': string
  'settings.autoLock': string
  'settings.backup': string
  'settings.about': string
  'settings.version': string
  
  // Contract
  'contract.address': string
  'contract.sourceCode': string
  'contract.compiler': string
  'contract.optimization': string
  'contract.bytecode': string
  'contract.verification': string
  'contract.verified': string
  'contract.notVerified': string
  'contract.deploymentCost': string
  'contract.deploymentSuccess': string
  'contract.deploymentFailed': string
  'contract.verificationSuccess': string
  'contract.verificationFailed': string
  'contract.selectFile': string
  'contract.uploadSource': string
  'contract.compilerVersion': string
  'contract.optimizationEnabled': string
  'contract.constructorArgs': string
  
  // Backup
  'backup.title': string
  'backup.description': string
  'backup.warning': string
  'backup.showMnemonic': string
  'backup.hideMnemonic': string
  'backup.copyMnemonic': string
  'backup.downloadBackup': string
  'backup.backupComplete': string
  'backup.keepSafe': string
  'backup.neverShare': string
  'backup.writeDown': string
  'backup.verifyBackup': string
  'backup.enterMnemonic': string
  'backup.mnemonicMismatch': string
  'backup.backupVerified': string
  
  // Time
  'time.now': string
  'time.minutesAgo': string
  'time.hoursAgo': string
  'time.daysAgo': string
  'time.weeksAgo': string
  'time.monthsAgo': string
  'time.yearsAgo': string
  
  // Units
  'units.eth': string
  'units.wei': string
  'units.gwei': string
  'units.usd': string
  'units.eur': string
  'units.jpy': string
  'units.btc': string
  'units.seconds': string
  'units.minutes': string
  'units.hours': string
  'units.days': string
  'units.weeks': string
  'units.months': string
  'units.years': string
}

// English translations
export const enTranslations: TranslationKeys = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.close': 'Close',
  'common.copy': 'Copy',
  'common.refresh': 'Refresh',
  'common.next': 'Next',
  'common.back': 'Back',
  'common.send': 'Send',
  'common.receive': 'Receive',
  'common.connect': 'Connect',
  'common.disconnect': 'Disconnect',
  'common.unlock': 'Unlock',
  'common.lock': 'Lock',
  'common.create': 'Create',
  'common.import': 'Import',
  'common.export': 'Export',
  'common.backup': 'Backup',
  'common.restore': 'Restore',
  'common.password': 'Password',
  'common.address': 'Address',
  'common.amount': 'Amount',
  'common.balance': 'Balance',
  'common.transaction': 'Transaction',
  'common.history': 'History',
  'common.network': 'Network',
  'common.gas': 'Gas',
  'common.fee': 'Fee',
  'common.contract': 'Contract',
  'common.deploy': 'Deploy',
  'common.verify': 'Verify',
  
  // Wallet
  'wallet.welcome': 'Welcome to Web3 Wallet',
  'wallet.createNew': 'Create New Wallet',
  'wallet.createNewDesc': 'Generate a new wallet with a secure mnemonic phrase',
  'wallet.loadFromEnv': 'Load from .env File',
  'wallet.loadFromEnvDesc': 'Import wallet from environment variable file',
  'wallet.connectMetaMask': 'Connect MetaMask',
  'wallet.connectMetaMaskDesc': 'Connect your existing MetaMask wallet',
  'wallet.connectWalletConnect': 'WalletConnect',
  'wallet.connectWalletConnectDesc': 'Connect your mobile wallet via QR code',
  'wallet.recoverWallet': 'Recover Wallet',
  'wallet.recoverWalletDesc': 'Restore your wallet using mnemonic phrase',
  'wallet.unlockWallet': 'Unlock Existing Wallet',
  'wallet.unlockWalletDesc': 'Unlock your stored wallet with password',
  'wallet.locked': 'Locked',
  'wallet.unlocked': 'Unlocked',
  'wallet.created': 'Wallet created successfully',
  'wallet.recovered': 'Wallet recovered successfully',
  'wallet.connected': 'Wallet connected successfully',
  'wallet.disconnected': 'Wallet disconnected',
  'wallet.passwordRequired': 'Password is required',
  'wallet.passwordStrength': 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  'wallet.confirmPassword': 'Confirm Password',
  'wallet.passwordMismatch': 'Passwords do not match',
  'wallet.mnemonicPhrase': 'Mnemonic Phrase',
  'wallet.mnemonicWarning': 'Save this mnemonic phrase in a safe place. You will need it to recover your wallet.',
  'wallet.mnemonicSaved': 'I have saved the mnemonic',
  'wallet.privateKey': 'Private Key',
  'wallet.invalidPrivateKey': 'Invalid private key format',
  'wallet.selectEnvFile': 'Select .env File',
  'wallet.envFileFormat': 'Make sure your .env file contains: PRIVATE_KEY=your_private_key_here',
  
  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.quickActions': 'Quick Actions',
  'dashboard.recentTransactions': 'Recent Transactions',
  'dashboard.noTransactions': 'No transactions yet',
  'dashboard.smartContracts': 'Smart Contracts',
  'dashboard.contractDeploy': 'Deploy Contract',
  'dashboard.contractVerify': 'Verify Contract',
  'dashboard.contractDesc': 'Deploy and verify smart contracts on the blockchain',
  
  // Transactions
  'transaction.send': 'Send Transaction',
  'transaction.receive': 'Receive Transaction',
  'transaction.details': 'Transaction Details',
  'transaction.recipient': 'Recipient',
  'transaction.sender': 'Sender',
  'transaction.hash': 'Transaction Hash',
  'transaction.status': 'Status',
  'transaction.confirmations': 'Confirmations',
  'transaction.gasLimit': 'Gas Limit',
  'transaction.gasPrice': 'Gas Price',
  'transaction.gasFee': 'Gas Fee',
  'transaction.total': 'Total',
  'transaction.pending': 'Pending',
  'transaction.confirmed': 'Confirmed',
  'transaction.failed': 'Failed',
  'transaction.estimating': 'Estimating...',
  'transaction.broadcasting': 'Broadcasting...',
  'transaction.success': 'Transaction sent successfully!',
  'transaction.invalidAddress': 'Invalid address format',
  'transaction.invalidAmount': 'Invalid amount',
  'transaction.insufficientBalance': 'Insufficient balance',
  'transaction.summary': 'Transaction Summary',
  'transaction.confirmAndSign': 'Confirm & Sign',
  'transaction.complete': 'Complete',
  'transaction.qrCode': 'QR Code',
  'transaction.shareAddress': 'Share Address',
  'transaction.availableBalance': 'Available Balance',
  
  // Errors
  'error.networkError': 'Network connection error. Please check your internet connection.',
  'error.connectionFailed': 'Connection failed. Please try again.',
  'error.transactionFailed': 'Transaction failed. Please try again.',
  'error.walletLocked': 'Wallet is locked. Please unlock it first.',
  'error.walletNotFound': 'Wallet not found. Please connect a wallet.',
  'error.invalidInput': 'Invalid input. Please check your data.',
  'error.gasEstimationFailed': 'Gas estimation failed. Please try again.',
  'error.insufficientGas': 'Insufficient gas for transaction.',
  'error.userRejected': 'Transaction was rejected by user.',
  'error.contractCallFailed': 'Contract call failed.',
  'error.unknownError': 'An unknown error occurred.',
  'error.tryAgain': 'Please try again.',
  'error.checkConnection': 'Please check your connection.',
  'error.contactSupport': 'Please contact support if the problem persists.',
  
  // Settings
  'settings.language': 'Language',
  'settings.currency': 'Currency',
  'settings.network': 'Network',
  'settings.theme': 'Theme',
  'settings.security': 'Security',
  'settings.autoLock': 'Auto Lock',
  'settings.backup': 'Backup',
  'settings.about': 'About',
  'settings.version': 'Version',
  
  // Contract
  'contract.address': 'Contract Address',
  'contract.sourceCode': 'Source Code',
  'contract.compiler': 'Compiler',
  'contract.optimization': 'Optimization',
  'contract.bytecode': 'Bytecode',
  'contract.verification': 'Verification',
  'contract.verified': 'Verified',
  'contract.notVerified': 'Not Verified',
  'contract.deploymentCost': 'Deployment Cost',
  'contract.deploymentSuccess': 'Contract deployed successfully',
  'contract.deploymentFailed': 'Contract deployment failed',
  'contract.verificationSuccess': 'Contract verified successfully',
  'contract.verificationFailed': 'Contract verification failed',
  'contract.selectFile': 'Select File',
  'contract.uploadSource': 'Upload Source Code',
  'contract.compilerVersion': 'Compiler Version',
  'contract.optimizationEnabled': 'Optimization Enabled',
  'contract.constructorArgs': 'Constructor Arguments',
  
  // Backup
  'backup.title': 'Backup Wallet',
  'backup.description': 'Backup your wallet to keep it safe',
  'backup.warning': 'Warning: Keep your backup safe and never share it with anyone',
  'backup.showMnemonic': 'Show Mnemonic',
  'backup.hideMnemonic': 'Hide Mnemonic',
  'backup.copyMnemonic': 'Copy Mnemonic',
  'backup.downloadBackup': 'Download Backup',
  'backup.backupComplete': 'Backup completed successfully',
  'backup.keepSafe': 'Keep your backup safe',
  'backup.neverShare': 'Never share your mnemonic phrase',
  'backup.writeDown': 'Write down your mnemonic phrase',
  'backup.verifyBackup': 'Verify Backup',
  'backup.enterMnemonic': 'Enter your mnemonic phrase',
  'backup.mnemonicMismatch': 'Mnemonic phrases do not match',
  'backup.backupVerified': 'Backup verified successfully',
  
  // Time
  'time.now': 'Now',
  'time.minutesAgo': 'minutes ago',
  'time.hoursAgo': 'hours ago',
  'time.daysAgo': 'days ago',
  'time.weeksAgo': 'weeks ago',
  'time.monthsAgo': 'months ago',
  'time.yearsAgo': 'years ago',
  
  // Units
  'units.eth': 'ETH',
  'units.wei': 'Wei',
  'units.gwei': 'Gwei',
  'units.usd': 'USD',
  'units.eur': 'EUR',
  'units.jpy': 'JPY',
  'units.btc': 'BTC',
  'units.seconds': 'seconds',
  'units.minutes': 'minutes',
  'units.hours': 'hours',
  'units.days': 'days',
  'units.weeks': 'weeks',
  'units.months': 'months',
  'units.years': 'years',
}

// Japanese translations
export const jaTranslations: TranslationKeys = {
  // Common
  'common.loading': '読み込み中...',
  'common.error': 'エラー',
  'common.success': '成功',
  'common.cancel': 'キャンセル',
  'common.confirm': '確認',
  'common.save': '保存',
  'common.close': '閉じる',
  'common.copy': 'コピー',
  'common.refresh': '更新',
  'common.next': '次へ',
  'common.back': '戻る',
  'common.send': '送金',
  'common.receive': '受金',
  'common.connect': '接続',
  'common.disconnect': '切断',
  'common.unlock': 'ロック解除',
  'common.lock': 'ロック',
  'common.create': '作成',
  'common.import': 'インポート',
  'common.export': 'エクスポート',
  'common.backup': 'バックアップ',
  'common.restore': '復元',
  'common.password': 'パスワード',
  'common.address': 'アドレス',
  'common.amount': '金額',
  'common.balance': '残高',
  'common.transaction': 'トランザクション',
  'common.history': '履歴',
  'common.network': 'ネットワーク',
  'common.gas': 'ガス',
  'common.fee': '手数料',
  'common.contract': 'コントラクト',
  'common.deploy': 'デプロイ',
  'common.verify': '検証',
  
  // Wallet
  'wallet.welcome': 'Web3ウォレットへようこそ',
  'wallet.createNew': '新しいウォレットを作成',
  'wallet.createNewDesc': 'セキュアなニーモニックフレーズで新しいウォレットを生成',
  'wallet.loadFromEnv': '.envファイルから読み込み',
  'wallet.loadFromEnvDesc': '環境変数ファイルからウォレットをインポート',
  'wallet.connectMetaMask': 'MetaMaskに接続',
  'wallet.connectMetaMaskDesc': '既存のMetaMaskウォレットに接続',
  'wallet.connectWalletConnect': 'WalletConnect',
  'wallet.connectWalletConnectDesc': 'QRコードでモバイルウォレットに接続',
  'wallet.recoverWallet': 'ウォレットを復元',
  'wallet.recoverWalletDesc': 'ニーモニックフレーズを使用してウォレットを復元',
  'wallet.unlockWallet': '既存のウォレットをロック解除',
  'wallet.unlockWalletDesc': 'パスワードで保存されたウォレットをロック解除',
  'wallet.locked': 'ロック中',
  'wallet.unlocked': 'ロック解除済み',
  'wallet.created': 'ウォレットが正常に作成されました',
  'wallet.recovered': 'ウォレットが正常に復元されました',
  'wallet.connected': 'ウォレットが正常に接続されました',
  'wallet.disconnected': 'ウォレットが切断されました',
  'wallet.passwordRequired': 'パスワードが必要です',
  'wallet.passwordStrength': 'パスワードは8文字以上で、大文字、小文字、数字、記号を含む必要があります',
  'wallet.confirmPassword': 'パスワードを確認',
  'wallet.passwordMismatch': 'パスワードが一致しません',
  'wallet.mnemonicPhrase': 'ニーモニックフレーズ',
  'wallet.mnemonicWarning': 'このニーモニックフレーズを安全な場所に保存してください。ウォレットの復元に必要です。',
  'wallet.mnemonicSaved': 'ニーモニックを保存しました',
  'wallet.privateKey': '秘密鍵',
  'wallet.invalidPrivateKey': '無効な秘密鍵形式',
  'wallet.selectEnvFile': '.envファイルを選択',
  'wallet.envFileFormat': '.envファイルに以下が含まれていることを確認してください: PRIVATE_KEY=your_private_key_here',
  
  // Dashboard
  'dashboard.title': 'ダッシュボード',
  'dashboard.quickActions': 'クイックアクション',
  'dashboard.recentTransactions': '最近のトランザクション',
  'dashboard.noTransactions': 'まだトランザクションがありません',
  'dashboard.smartContracts': 'スマートコントラクト',
  'dashboard.contractDeploy': 'コントラクトをデプロイ',
  'dashboard.contractVerify': 'コントラクトを検証',
  'dashboard.contractDesc': 'ブロックチェーンにスマートコントラクトをデプロイ・検証',
  
  // Transactions
  'transaction.send': 'トランザクション送信',
  'transaction.receive': 'トランザクション受信',
  'transaction.details': 'トランザクション詳細',
  'transaction.recipient': '受信者',
  'transaction.sender': '送信者',
  'transaction.hash': 'トランザクションハッシュ',
  'transaction.status': 'ステータス',
  'transaction.confirmations': '確認数',
  'transaction.gasLimit': 'ガス制限',
  'transaction.gasPrice': 'ガス価格',
  'transaction.gasFee': 'ガス手数料',
  'transaction.total': '合計',
  'transaction.pending': '保留中',
  'transaction.confirmed': '確認済み',
  'transaction.failed': '失敗',
  'transaction.estimating': '見積もり中...',
  'transaction.broadcasting': '送信中...',
  'transaction.success': 'トランザクションが正常に送信されました！',
  'transaction.invalidAddress': '無効なアドレス形式',
  'transaction.invalidAmount': '無効な金額',
  'transaction.insufficientBalance': '残高不足',
  'transaction.summary': 'トランザクション概要',
  'transaction.confirmAndSign': '確認・署名',
  'transaction.complete': '完了',
  'transaction.qrCode': 'QRコード',
  'transaction.shareAddress': 'アドレスを共有',
  'transaction.availableBalance': '利用可能残高',
  
  // Errors
  'error.networkError': 'ネットワーク接続エラー。インターネット接続を確認してください。',
  'error.connectionFailed': '接続に失敗しました。もう一度お試しください。',
  'error.transactionFailed': 'トランザクションに失敗しました。もう一度お試しください。',
  'error.walletLocked': 'ウォレットがロックされています。まずロックを解除してください。',
  'error.walletNotFound': 'ウォレットが見つかりません。ウォレットを接続してください。',
  'error.invalidInput': '無効な入力です。データを確認してください。',
  'error.gasEstimationFailed': 'ガス見積もりに失敗しました。もう一度お試しください。',
  'error.insufficientGas': 'トランザクションに必要なガスが不足しています。',
  'error.userRejected': 'トランザクションがユーザーによって拒否されました。',
  'error.contractCallFailed': 'コントラクト呼び出しに失敗しました。',
  'error.unknownError': '不明なエラーが発生しました。',
  'error.tryAgain': 'もう一度お試しください。',
  'error.checkConnection': '接続を確認してください。',
  'error.contactSupport': '問題が続く場合はサポートにお問い合わせください。',
  
  // Settings
  'settings.language': '言語',
  'settings.currency': '通貨',
  'settings.network': 'ネットワーク',
  'settings.theme': 'テーマ',
  'settings.security': 'セキュリティ',
  'settings.autoLock': '自動ロック',
  'settings.backup': 'バックアップ',
  'settings.about': '情報',
  'settings.version': 'バージョン',
  
  // Contract
  'contract.address': 'コントラクトアドレス',
  'contract.sourceCode': 'ソースコード',
  'contract.compiler': 'コンパイラ',
  'contract.optimization': '最適化',
  'contract.bytecode': 'バイトコード',
  'contract.verification': '検証',
  'contract.verified': '検証済み',
  'contract.notVerified': '未検証',
  'contract.deploymentCost': 'デプロイ費用',
  'contract.deploymentSuccess': 'コントラクトが正常にデプロイされました',
  'contract.deploymentFailed': 'コントラクトのデプロイに失敗しました',
  'contract.verificationSuccess': 'コントラクトが正常に検証されました',
  'contract.verificationFailed': 'コントラクトの検証に失敗しました',
  'contract.selectFile': 'ファイルを選択',
  'contract.uploadSource': 'ソースコードをアップロード',
  'contract.compilerVersion': 'コンパイラバージョン',
  'contract.optimizationEnabled': '最適化が有効',
  'contract.constructorArgs': 'コンストラクタ引数',
  
  // Backup
  'backup.title': 'ウォレットバックアップ',
  'backup.description': 'ウォレットをバックアップして安全に保管',
  'backup.warning': '警告: バックアップを安全に保管し、誰にも共有しないでください',
  'backup.showMnemonic': 'ニーモニックを表示',
  'backup.hideMnemonic': 'ニーモニックを非表示',
  'backup.copyMnemonic': 'ニーモニックをコピー',
  'backup.downloadBackup': 'バックアップをダウンロード',
  'backup.backupComplete': 'バックアップが正常に完了しました',
  'backup.keepSafe': 'バックアップを安全に保管してください',
  'backup.neverShare': 'ニーモニックフレーズを決して共有しないでください',
  'backup.writeDown': 'ニーモニックフレーズを書き留めてください',
  'backup.verifyBackup': 'バックアップを検証',
  'backup.enterMnemonic': 'ニーモニックフレーズを入力してください',
  'backup.mnemonicMismatch': 'ニーモニックフレーズが一致しません',
  'backup.backupVerified': 'バックアップが正常に検証されました',
  
  // Time
  'time.now': '今',
  'time.minutesAgo': '分前',
  'time.hoursAgo': '時間前',
  'time.daysAgo': '日前',
  'time.weeksAgo': '週間前',
  'time.monthsAgo': 'ヶ月前',
  'time.yearsAgo': '年前',
  
  // Units
  'units.eth': 'ETH',
  'units.wei': 'Wei',
  'units.gwei': 'Gwei',
  'units.usd': 'USD',
  'units.eur': 'EUR',
  'units.jpy': '円',
  'units.btc': 'BTC',
  'units.seconds': '秒',
  'units.minutes': '分',
  'units.hours': '時間',
  'units.days': '日',
  'units.weeks': '週',
  'units.months': '月',
  'units.years': '年',
}

// Translation data
export const translations = {
  [Language.EN]: enTranslations,
  [Language.JA]: jaTranslations,
}

// I18n Context
export interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof TranslationKeys, params?: Record<string, string>) => string
  formatDate: (date: Date) => string
  formatNumber: (num: number) => string
  formatCurrency: (amount: number, currency?: string) => string
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Hook to use i18n
export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Get browser language
export const getBrowserLanguage = (): Language => {
  if (typeof navigator === 'undefined') return Language.EN
  
  const browserLang = navigator.language.split('-')[0]
  return Object.values(Language).includes(browserLang as Language) 
    ? (browserLang as Language)
    : Language.EN
}

// Format number according to locale
export const formatNumber = (num: number, locale: Language): string => {
  const localeMap = {
    [Language.EN]: 'en-US',
    [Language.JA]: 'ja-JP',
  }
  
  return num.toLocaleString(localeMap[locale])
}

// Format currency according to locale
export const formatCurrency = (amount: number, currency: string, locale: Language): string => {
  const localeMap = {
    [Language.EN]: 'en-US',
    [Language.JA]: 'ja-JP',
  }
  
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

// Format date according to locale
export const formatDate = (date: Date, locale: Language): string => {
  const localeMap = {
    [Language.EN]: 'en-US',
    [Language.JA]: 'ja-JP',
  }
  
  return date.toLocaleDateString(localeMap[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}