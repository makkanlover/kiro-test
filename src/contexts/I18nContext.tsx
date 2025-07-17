import React, { createContext, useContext, useState, useCallback } from 'react'

export type Language = 'en' | 'ja'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
  formatDate: (date: Date) => string
  formatNumber: (num: number) => string
  formatCurrency: (amount: number, currency?: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Simple translations
const translations = {
  en: {
    'wallet.welcome': 'Welcome to Web3 Wallet',
    'wallet.createNew': 'Create New Wallet',
    'wallet.createNewDesc': 'Generate a new wallet with a secure mnemonic phrase',
    'wallet.loadEnv': 'Load from .env File',
    'wallet.loadEnvDesc': 'Import wallet from environment variable file',
    'wallet.connectMetaMask': 'Connect MetaMask',
    'wallet.connectMetaMaskDesc': 'Connect your existing MetaMask wallet',
    'wallet.walletConnect': 'WalletConnect',
    'wallet.walletConnectDesc': 'Connect your mobile wallet via QR code',
    'wallet.recover': 'Recover Wallet',
    'wallet.recoverDesc': 'Restore your wallet using mnemonic phrase',
    'wallet.unlock': 'Unlock Wallet',
    'wallet.unlockDesc': 'Unlock your stored wallet with password',
    'common.cancel': 'Cancel',
    'common.password': 'Password',
    'common.confirmPassword': 'Confirm Password',
    'common.unlock': 'Unlock',
    'common.create': 'Create Wallet',
    'common.connect': 'Connect',
    'common.loading': 'Loading...',
    'error.invalidPassword': 'Invalid password',
    'error.passwordMismatch': 'Passwords do not match'
  },
  ja: {
    'wallet.welcome': 'Web3ウォレットへようこそ',
    'wallet.createNew': '新しいウォレットを作成',
    'wallet.createNewDesc': '安全なニーモニックフレーズで新しいウォレットを生成',
    'wallet.loadEnv': '.envファイルから読み込み',
    'wallet.loadEnvDesc': '環境変数ファイルからウォレットをインポート',
    'wallet.connectMetaMask': 'MetaMaskに接続',
    'wallet.connectMetaMaskDesc': '既存のMetaMaskウォレットに接続',
    'wallet.walletConnect': 'WalletConnect',
    'wallet.walletConnectDesc': 'QRコードでモバイルウォレットに接続',
    'wallet.recover': 'ウォレットを復元',
    'wallet.recoverDesc': 'ニーモニックフレーズを使用してウォレットを復元',
    'wallet.unlock': 'ウォレットのロック解除',
    'wallet.unlockDesc': 'パスワードで保存されたウォレットのロックを解除',
    'common.cancel': 'キャンセル',
    'common.password': 'パスワード',
    'common.confirmPassword': 'パスワード確認',
    'common.unlock': 'ロック解除',
    'common.create': 'ウォレット作成',
    'common.connect': '接続',
    'common.loading': '読み込み中...',
    'error.invalidPassword': '無効なパスワード',
    'error.passwordMismatch': 'パスワードが一致しません'
  }
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en')

  const t = useCallback((key: string, params?: Record<string, any>) => {
    let translation = translations[language][key] || key
    
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{{${param}}}`, params[param])
      })
    }
    
    return translation
  }, [language])

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')
  }, [language])

  const formatNumber = useCallback((num: number) => {
    return num.toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US')
  }, [language])

  const formatCurrency = useCallback((amount: number, currency = 'ETH') => {
    const formatted = formatNumber(amount)
    return `${formatted} ${currency}`
  }, [formatNumber])

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    formatDate,
    formatNumber,
    formatCurrency
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}