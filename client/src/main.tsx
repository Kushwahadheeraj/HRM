import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CurrencyProvider } from './lib/currency.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  // </StrictMode>,
)
