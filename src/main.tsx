import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AdminPage from './AdminPage'
import ProductsManager from './ProductsManager'
import './styles.css'

function getRootComponent() {
  const hash = window.location.hash
  return hash === '#/admin' ? AdminPage : hash === '#/admin/products' ? ProductsManager : App
}

const root = createRoot(document.getElementById('root')!)
const RootComponent = getRootComponent()
root.render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
)

// Listen for hash changes to update the component
window.addEventListener('hashchange', () => {
  const NewRootComponent = getRootComponent()
  root.render(
    <StrictMode>
      <NewRootComponent />
    </StrictMode>,
  )
})
