import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
  Chip
} from '@mui/material'
import {
  ContentCopy,
  QrCode2
} from '@mui/icons-material'
import QRCode from 'qrcode'
import { useWallet } from '../contexts/WalletContext'
import { SUPPORTED_NETWORKS } from '../utils/networks'

interface ReceiveTransactionProps {
  open: boolean
  onClose: () => void
}

const ReceiveTransaction: React.FC<ReceiveTransactionProps> = ({ open, onClose }) => {
  const { wallet, currentNetwork } = useWallet()
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState(false)

  const network = SUPPORTED_NETWORKS[currentNetwork]

  useEffect(() => {
    if (wallet && open) {
      generateQRCode()
    }
  }, [wallet, open])

  const generateQRCode = async () => {
    if (!wallet) return

    try {
      const dataUrl = await QRCode.toDataURL(wallet.address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const copyToClipboard = async () => {
    if (!wallet) return

    try {
      await navigator.clipboard.writeText(wallet.address)
      setCopySuccess(true)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  const handleSnackbarClose = () => {
    setCopySuccess(false)
  }

  if (!wallet) {
    return null
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode2 />
            Receive {network.nativeCurrency.symbol}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Wallet Address
                </Typography>
                
                <Chip
                  label={network.name}
                  color="primary"
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 1,
                  mb: 2
                }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      wordBreak: 'break-all',
                      bgcolor: 'grey.100',
                      p: 1,
                      borderRadius: 1,
                      flexGrow: 1
                    }}
                  >
                    {wallet.address}
                  </Typography>
                  <IconButton
                    onClick={copyToClipboard}
                    size="small"
                    title="Copy address"
                  >
                    <ContentCopy />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Scan QR code or copy address above
                </Typography>
                
                {qrCodeDataUrl && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Wallet Address QR Code"
                      style={{ 
                        maxWidth: '100%',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px'
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
            
            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Important:</strong> Only send {network.nativeCurrency.symbol} and {network.name} 
                compatible tokens to this address. Sending other cryptocurrencies may result in permanent loss.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Address copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  )
}

export default ReceiveTransaction