# Web3 Wallet Application

A standalone Web3 wallet application built with Electron, React, and TypeScript. This application provides secure wallet management with support for multiple connection methods and blockchain networks.

## Features

- **Multiple Wallet Connection Methods**:
  - Create new wallet with mnemonic phrase
  - Import from .env file
  - MetaMask integration
  - WalletConnect support (planned)

- **Blockchain Network Support**:
  - Sepolia Testnet
  - Polygon Amoy Testnet

- **Security Features**:
  - Password-protected encrypted storage
  - Secure mnemonic phrase generation
  - Auto-lock functionality
  - Local-only storage (no external dependencies)

- **Core Functionality**:
  - Balance checking
  - Send/receive transactions
  - Transaction history
  - Smart contract deployment and verification
  - QR code generation for addresses

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run the application in development mode:

```bash
npm run dev
```

This will start both the Electron main process and the React renderer process.

## Building

To build the application for production:

```bash
npm run build
```

## Testing

Run tests with:

```bash
npm test
```

Run end-to-end tests:

```bash
npm run e2e
```

## Usage

### Creating a New Wallet

1. Launch the application
2. Click "Create New Wallet"
3. Set a secure password
4. Save the generated mnemonic phrase securely
5. Access your wallet dashboard

### Importing from .env File

1. Create a `.env` file with your private key:
   ```
   PRIVATE_KEY=0xyourprivatekeyhere
   ```
2. Click "Load from .env File"
3. Select your `.env` file
4. Access your wallet dashboard

### Using MetaMask

1. Ensure MetaMask is installed and unlocked
2. Click "Connect MetaMask"
3. Approve the connection request
4. Access your wallet dashboard

## Security Considerations

- **Never share your private keys or mnemonic phrases**
- **Use strong passwords for wallet encryption**
- **Keep your mnemonic phrase in a secure, offline location**
- **This application is for educational/testing purposes on testnets**

## Supported Networks

- **Sepolia Testnet**: Ethereum testnet for development
- **Polygon Amoy Testnet**: Polygon testnet for development

## File Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts
├── services/           # Business logic services
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── hooks/             # Custom React hooks

electron/
├── main.ts            # Electron main process
└── preload.ts         # Electron preload script
```

## License

MIT License - see LICENSE file for details

## Contributing

This project is part of a learning exercise. Feel free to explore and modify the code for educational purposes.

## Disclaimer

This software is provided for educational and testing purposes only. Do not use with real funds or on mainnet without proper security auditing.