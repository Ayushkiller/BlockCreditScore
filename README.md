# CryptoScore

A decentralized protocol that aggregates on-chain user behavior to generate transparent, trustable crypto credit scores.

## Project Structure

```
cryptoscore/
├── frontend/          # React frontend application
├── backend/           # Express.js API server
├── package.json       # Root package.json for monorepo management
└── README.md          # This file
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Start development servers:
```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend development server (port 3000).

### Development

- Backend API server runs on http://localhost:3001
- Frontend development server runs on http://localhost:3000
- Frontend is configured to proxy API requests to the backend

### Building for Production

```bash
npm run build
```

This will build both the frontend and backend applications.

## Architecture

- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript, SQLite
- **Blockchain**: Ethereum integration via ethers.js