import React, { createContext, useContext, useState, useCallback } from 'react'

// Supported languages
export enum Language {
  EN = 'en',
  JA = 'ja'
}

// Optimized translation keys interface - reduced from 673 lines to ~100 essential keys
export interface TranslationKeys {
  // Common actions - most frequently used
  'common.loading': string
  'common.error': string
  'common.success': string
  'common.cancel': string
  'common.confirm': string
  'common.close': string
  'common.copy': string
  'common.refresh': string
  'common.send': string
  'common.receive': string
  'common.connect': string
  'common.unlock': string
  'common.lock': string
  'common.backup': string
  'common.password': string
  'common.address': string
  'common.amount': string
  'common.balance': string
  'common.history': string
  'common.network': string
  'common.contract': string
  
  // Wallet essentials
  'wallet.welcome': string
  'wallet.createNew': string
  'wallet.loadFromEnv': string
  'wallet.connectMetaMask': string
  'wallet.recoverWallet': string
  'wallet.unlockWallet': string
  'wallet.passwordRequired': string
  'wallet.mnemonicPhrase': string
  'wallet.mnemonicWarning': string
  'wallet.privateKey': string
  
  // Dashboard
  'dashboard.title': string
  'dashboard.recentTransactions': string
  'dashboard.noTransactions': string
  'dashboard.smartContracts': string
  
  // Transactions
  'transaction.send': string
  'transaction.receive': string
  'transaction.details': string
  'transaction.hash': string
  'transaction.status': string
  'transaction.gasFee': string
  
  // Balance
  'balance.current': string
  'balance.tokens': string
  'balance.refresh': string
  
  // Contract
  'contract.deploy': string
  'contract.verify': string
  'contract.address': string
  'contract.compiled': string
  
  // Settings
  'settings.language': string
  'settings.security': string
  'settings.backup': string
  'settings.autoLock': string
  
  // Errors
  'error.walletLocked': string
  'error.networkError': string
  'error.transactionFailed': string
  'error.invalidAddress': string
  'error.insufficientFunds': string
  
  // Success messages
  'success.transactionSent': string
  'success.walletConnected': string
  'success.contractDeployed': string
  'success.backupCreated': string
}

// English translations - optimized and essential only
export const enTranslations: TranslationKeys = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.close': 'Close',
  'common.copy': 'Copy',
  'common.refresh': 'Refresh',
  'common.send': 'Send',
  'common.receive': 'Receive',
  'common.connect': 'Connect',
  'common.unlock': 'Unlock',
  'common.lock': 'Lock',
  'common.backup': 'Backup',
  'common.password': 'Password',
  'common.address': 'Address',
  'common.amount': 'Amount',
  'common.balance': 'Balance',
  'common.history': 'History',
  'common.network': 'Network',
  'common.contract': 'Contract',
  
  // Wallet
  'wallet.welcome': 'Welcome to Web3 Wallet',
  'wallet.createNew': 'Create New Wallet',
  'wallet.loadFromEnv': 'Load from .env File',
  'wallet.connectMetaMask': 'Connect MetaMask',
  'wallet.recoverWallet': 'Recover Wallet',
  'wallet.unlockWallet': 'Unlock Wallet',
  'wallet.passwordRequired': 'Password is required',
  'wallet.mnemonicPhrase': 'Recovery Phrase',
  'wallet.mnemonicWarning': 'Save this phrase safely - it\'s your only way to recover your wallet',
  'wallet.privateKey': 'Private Key',
  
  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.recentTransactions': 'Recent Transactions',
  'dashboard.noTransactions': 'No transactions yet',
  'dashboard.smartContracts': 'Smart Contracts',
  
  // Transactions
  'transaction.send': 'Send Transaction',
  'transaction.receive': 'Receive Transaction',
  'transaction.details': 'Transaction Details',
  'transaction.hash': 'Transaction Hash',
  'transaction.status': 'Status',
  'transaction.gasFee': 'Gas Fee',
  
  // Balance
  'balance.current': 'Current Balance',
  'balance.tokens': 'Token Balances',
  'balance.refresh': 'Refresh Balance',
  
  // Contract
  'contract.deploy': 'Deploy Contract',
  'contract.verify': 'Verify Contract',
  'contract.address': 'Contract Address',
  'contract.compiled': 'Contract Compiled',
  
  // Settings
  'settings.language': 'Language',
  'settings.security': 'Security',
  'settings.backup': 'Backup',
  'settings.autoLock': 'Auto Lock',
  
  // Errors
  'error.walletLocked': 'Please unlock your wallet to continue',
  'error.networkError': 'Network connection failed',
  'error.transactionFailed': 'Transaction failed',
  'error.invalidAddress': 'Invalid address format',
  'error.insufficientFunds': 'Insufficient funds',
  
  // Success
  'success.transactionSent': 'Transaction sent successfully',
  'success.walletConnected': 'Wallet connected',
  'success.contractDeployed': 'Contract deployed successfully',
  'success.backupCreated': 'Backup created successfully'
}

// Japanese translations - optimized
export const jaTranslations: TranslationKeys = {
  // Common
  'common.loading': '読み込み中...',
  'common.error': 'エラー',
  'common.success': '成功',
  'common.cancel': 'キャンセル',
  'common.confirm': '確認',
  'common.close': '閉じる',
  'common.copy': 'コピー',
  'common.refresh': '更新',
  'common.send': '送信',
  'common.receive': '受信',
  'common.connect': '接続',
  'common.unlock': 'ロック解除',
  'common.lock': 'ロック',
  'common.backup': 'バックアップ',
  'common.password': 'パスワード',
  'common.address': 'アドレス',
  'common.amount': '金額',
  'common.balance': '残高',
  'common.history': '履歴',
  'common.network': 'ネットワーク',
  'common.contract': 'コントラクト',
  
  // Wallet
  'wallet.welcome': 'Web3ウォレットへようこそ',
  'wallet.createNew': '新しいウォレットを作成',
  'wallet.loadFromEnv': '.envファイルから読み込み',
  'wallet.connectMetaMask': 'MetaMaskに接続',
  'wallet.recoverWallet': 'ウォレットを復旧',
  'wallet.unlockWallet': 'ウォレットのロック解除',
  'wallet.passwordRequired': 'パスワードが必要です',
  'wallet.mnemonicPhrase': 'リカバリーフレーズ',
  'wallet.mnemonicWarning': 'このフレーズを安全に保存してください - ウォレットを復旧する唯一の方法です',
  'wallet.privateKey': '秘密鍵',
  
  // Dashboard
  'dashboard.title': 'ダッシュボード',
  'dashboard.recentTransactions': '最近のトランザクション',
  'dashboard.noTransactions': 'トランザクションはありません',
  'dashboard.smartContracts': 'スマートコントラクト',
  
  // Transactions
  'transaction.send': 'トランザクション送信',
  'transaction.receive': 'トランザクション受信',
  'transaction.details': 'トランザクション詳細',
  'transaction.hash': 'トランザクションハッシュ',
  'transaction.status': 'ステータス',
  'transaction.gasFee': 'ガス料金',
  
  // Balance
  'balance.current': '現在の残高',
  'balance.tokens': 'トークン残高',
  'balance.refresh': '残高を更新',
  
  // Contract
  'contract.deploy': 'コントラクトをデプロイ',
  'contract.verify': 'コントラクトを検証',
  'contract.address': 'コントラクトアドレス',
  'contract.compiled': 'コントラクトコンパイル済み',
  
  // Settings
  'settings.language': '言語',
  'settings.security': 'セキュリティ',
  'settings.backup': 'バックアップ',
  'settings.autoLock': '自動ロック',
  
  // Errors
  'error.walletLocked': '続行するにはウォレットのロックを解除してください',
  'error.networkError': 'ネットワーク接続に失敗しました',
  'error.transactionFailed': 'トランザクションに失敗しました',
  'error.invalidAddress': '無効なアドレス形式です',
  'error.insufficientFunds': '残高不足です',
  
  // Success
  'success.transactionSent': 'トランザクションを送信しました',
  'success.walletConnected': 'ウォレットが接続されました',
  'success.contractDeployed': 'コントラクトのデプロイが完了しました',
  'success.backupCreated': 'バックアップが作成されました'
}

// Translation map
const translations = {
  [Language.EN]: enTranslations,
  [Language.JA]: jaTranslations
}

// Translation function
export const getTranslation = (language: Language, key: keyof TranslationKeys): string => {
  return translations[language][key] || key
}

// Translation hook
export const useTranslation = (language: Language) => {
  const t = (key: keyof TranslationKeys): string => {
    return getTranslation(language, key)
  }

  return { t }
}

// I18n Context
export interface I18nContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: keyof TranslationKeys) => string
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined)

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// I18n Provider Component for React integration
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get saved language from localStorage
    const saved = localStorage.getItem('app_language')
    if (saved && Object.values(Language).includes(saved as Language)) {
      return saved as Language
    }
    // Default to browser language or Japanese
    return getBrowserLanguage()
  })

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('app_language', lang)
  }, [])

  const t = useCallback((key: keyof TranslationKeys, params?: Record<string, string>) => {
    return getTranslation(language, key)
  }, [language])

  const formatDateIntl = useCallback((date: Date) => {
    return formatDate(date, language)
  }, [language])

  const formatNumberIntl = useCallback((num: number) => {
    return formatNumber(num, language)
  }, [language])

  const formatCurrencyIntl = useCallback((amount: number, currency = 'ETH') => {
    return formatCurrency(amount, currency, language)
  }, [language])

  const value: I18nContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    formatDate: formatDateIntl,
    formatNumber: formatNumberIntl,
    formatCurrency: formatCurrencyIntl
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

// Export the getBrowserLanguage function
export const getBrowserLanguage = (): Language => {
  if (typeof navigator === 'undefined') return Language.EN
  
  const browserLang = navigator.language.split('-')[0]
  return Object.values(Language).includes(browserLang as Language) 
    ? (browserLang as Language)
    : Language.EN
}