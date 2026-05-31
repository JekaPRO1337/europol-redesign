import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AdminPage from './AdminPage'
import ProductsManager from './ProductsManager'
import './styles.css'

const hash = window.location.hash
const Root = hash === '#/admin' ? AdminPage : hash === '#/admin/products' ? ProductsManager : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
