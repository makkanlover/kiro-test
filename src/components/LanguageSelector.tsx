import React, { useCallback, useMemo } from 'react'
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  Box,
  Typography,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material'
import { Language as LanguageIcon, Translate } from '@mui/icons-material'
import { Language, useI18n } from '../utils/i18n-optimized'

interface LanguageSelectorProps {
  variant?: 'select' | 'menu'
  size?: 'small' | 'medium'
  showLabel?: boolean
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'select',
  size = 'medium',
  showLabel = true 
}) => {
  const { language, setLanguage, t } = useI18n()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleLanguageChange = useCallback((event: SelectChangeEvent) => {
    setLanguage(event.target.value as Language)
  }, [setLanguage])

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleMenuItemClick = useCallback((lang: Language) => {
    setLanguage(lang)
    setAnchorEl(null)
  }, [setLanguage])

  const getLanguageLabel = (lang: Language): string => {
    switch (lang) {
      case Language.EN:
        return 'English'
      case Language.JA:
        return '日本語'
      default:
        return 'English'
    }
  }

  const getLanguageFlag = (lang: Language): string => {
    switch (lang) {
      case Language.EN:
        return '🇺🇸'
      case Language.JA:
        return '🇯🇵'
      default:
        return '🇺🇸'
    }
  }

  if (variant === 'menu') {
    return (
      <Box>
        <Tooltip title={t('settings.language')}>
          <IconButton
            onClick={handleMenuClick}
            size={size}
            color="inherit"
          >
            <LanguageIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {Object.values(Language).map((lang) => (
            <MenuItem
              key={lang}
              onClick={() => handleMenuItemClick(lang)}
              selected={lang === language}
            >
              <ListItemIcon>
                <Typography>{getLanguageFlag(lang)}</Typography>
              </ListItemIcon>
              <ListItemText primary={getLanguageLabel(lang)} />
            </MenuItem>
          ))}
        </Menu>
      </Box>
    )
  }

  return (
    <FormControl size={size} sx={{ minWidth: 120 }}>
      {showLabel && (
        <InputLabel id="language-select-label">
          {t('settings.language')}
        </InputLabel>
      )}
      <Select
        labelId="language-select-label"
        id="language-select"
        value={language}
        onChange={handleLanguageChange}
        label={showLabel ? t('settings.language') : undefined}
        renderValue={(value) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography>{getLanguageFlag(value)}</Typography>
            <Typography>{getLanguageLabel(value)}</Typography>
          </Box>
        )}
      >
        {Object.values(Language).map((lang) => (
          <MenuItem key={lang} value={lang}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>{getLanguageFlag(lang)}</Typography>
              <Typography>{getLanguageLabel(lang)}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default React.memo(LanguageSelector)