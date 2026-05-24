import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProductDetailPage } from './pages/ProductDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
