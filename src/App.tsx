import { FC } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { WalletProvider } from './contexts/WalletContext'
import { I18nProvider } from './contexts/I18nContext'
import { ErrorBoundary } from './components/ErrorDisplay'
import MainLayout from './components/layouts/MainLayout'
import WalletConnection from './components/WalletConnection'
import Dashboard from './components/Dashboard'
import { useAutoLock } from './hooks/useAutoLock'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

const AppContent: FC = () => {
  useAutoLock()

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<WalletConnection />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MainLayout>
    </Router>
  )
}

const App: FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <I18nProvider>
          <WalletProvider>
            <AppContent />
          </WalletProvider>
        </I18nProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App