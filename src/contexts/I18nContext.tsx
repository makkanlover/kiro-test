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
    'common.close': 'Close',
    'common.next': 'Next',
    'common.send': 'Send',
    'common.receive': 'Receive',
    'common.copy': 'Copy',
    'common.amount': 'Amount',
    'common.address': 'Address',
    'common.balance': 'Balance',
    'common.history': 'History',
    'common.backup': 'Backup',
    'dashboard.title': 'Dashboard',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.recentTransactions': 'Recent Transactions',
    'dashboard.noTransactions': 'No transactions yet',
    'dashboard.smartContracts': 'Smart Contracts',
    'dashboard.contractDeploy': 'Deploy Contract',
    'dashboard.contractVerify': 'Verify Contract',
    'dashboard.contractDesc': 'Deploy and verify smart contracts on the blockchain',
    'transaction.send': 'Send Transaction',
    'transaction.receive': 'Receive Transaction',
    'transaction.details': 'Transaction Details',
    'transaction.recipient': 'Recipient',
    'transaction.summary': 'Transaction Summary',
    'transaction.confirmAndSign': 'Confirm & Sign',
    'transaction.complete': 'Complete',
    'transaction.gasLimit': 'Gas Limit',
    'transaction.gasPrice': 'Gas Price',
    'transaction.gasFee': 'Gas Fee',
    'transaction.total': 'Total',
    'transaction.hash': 'Transaction Hash',
    'transaction.success': 'Transaction sent successfully!',
    'transaction.invalidAddress': 'Invalid address format',
    'transaction.invalidAmount': 'Invalid amount',
    'transaction.availableBalance': 'Available Balance',
    'transaction.shareAddress': 'Scan QR code or copy address above',
    'transaction.qrCode': 'Wallet Address QR Code',
    'error.invalidPassword': 'Invalid password',
    'error.passwordMismatch': 'Passwords do not match',
    'error.walletLocked': 'Please connect or unlock your wallet to access the dashboard',
    'wallet.passwordRequired': 'Enter your wallet password to sign the transaction'
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
    'common.close': '閉じる',
    'common.next': '次へ',
    'common.send': '送金',
    'common.receive': '受金',
    'common.copy': 'コピー',
    'common.amount': '金額',
    'common.address': 'アドレス',
    'common.balance': '残高',
    'common.history': '履歴',
    'common.backup': 'バックアップ',
    'dashboard.title': 'ダッシュボード',
    'dashboard.quickActions': 'クイックアクション',
    'dashboard.recentTransactions': '最近のトランザクション',
    'dashboard.noTransactions': 'まだトランザクションがありません',
    'dashboard.smartContracts': 'スマートコントラクト',
    'dashboard.contractDeploy': 'コントラクトをデプロイ',
    'dashboard.contractVerify': 'コントラクトを検証',
    'dashboard.contractDesc': 'ブロックチェーンにスマートコントラクトをデプロイ・検証',
    'transaction.send': 'トランザクション送信',
    'transaction.receive': 'トランザクション受信',
    'transaction.details': 'トランザクション詳細',
    'transaction.recipient': '受信者',
    'transaction.summary': 'トランザクション概要',
    'transaction.confirmAndSign': '確認・署名',
    'transaction.complete': '完了',
    'transaction.gasLimit': 'ガス制限',
    'transaction.gasPrice': 'ガス価格',
    'transaction.gasFee': 'ガス手数料',
    'transaction.total': '合計',
    'transaction.hash': 'トランザクションハッシュ',
    'transaction.success': 'トランザクションが正常に送信されました！',
    'transaction.invalidAddress': '無効なアドレス形式',
    'transaction.invalidAmount': '無効な金額',
    'transaction.availableBalance': '利用可能残高',
    'transaction.shareAddress': 'QRコードをスキャンするか、上のアドレスをコピーしてください',
    'transaction.qrCode': 'ウォレットアドレスQRコード',
    'error.invalidPassword': '無効なパスワード',
    'error.passwordMismatch': 'パスワードが一致しません',
    'error.walletLocked': 'ダッシュボードにアクセスするにはウォレットを接続またはロック解除してください',
    'wallet.passwordRequired': 'トランザクションに署名するためのウォレットパスワードを入力してください'
  }
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ja')

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