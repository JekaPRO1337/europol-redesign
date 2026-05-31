import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AdminPage from './AdminPage'
import ProductsManager from './ProductsManager'
import './styles.css'

// Handle GitHub Pages redirect
const redirect = sessionStorage.redirect
delete sessionStorage.redirect
if (redirect && redirect !== location.href) {
  history.replaceState(null, '', redirect)
}

const hash = window.location.hash
const Root = hash === '#/admin' ? AdminPage : hash === '#/admin/products' ? ProductsManager : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
