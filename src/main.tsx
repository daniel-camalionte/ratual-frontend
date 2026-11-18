import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@/assets/fonts/poppins/poppins.css'
import '@/assets/fonts/roboto/roboto.css'
import '@/assets/css/template.css'
import '@/assets/css/icons.css'
import '@/assets/css/app.css'
import { App } from '@/App'
import { AuthProvider } from '@/lib/auth'
import { applyTheme, getTheme } from '@/lib/theme'

applyTheme(getTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
