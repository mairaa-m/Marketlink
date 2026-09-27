import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AIChatbot from './components/shared/AIChatbot'
import CompareDrawer from './components/shared/CompareDrawer'
import Loader from './components/shared/Loader'
import api from './api'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CompareProvider } from './context/CompareContext'
import AdminDashboard from './pages/admin/AdminDashboard'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/PickupCheckoutPage'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerOrderDetailPage from './pages/customer/CustomerOrderDetailPage'
import FarmerDashboard from './pages/farmer/FarmerDashboard'
import ProductFormPage from './pages/farmer/ProductFormPage'
import AboutPage from './pages/public/AboutPage'
import CollectionsPage from './pages/public/CollectionsPage'
import ComparePage from './pages/public/ComparePage'
import ContactPage from './pages/public/ContactPage'
import FarmerDetailPage from './pages/public/FarmerDetailPage'
import FarmersPage from './pages/public/FarmersPage'
import HomePage from './pages/public/HomePage'
import LoginPage from './pages/public/LoginPage'
import MarketDetailPage from './pages/public/MarketDetailPage'
import MarketsPage from './pages/public/MarketsPage'
import PlanTripPage from './pages/public/PlanTripPage'
import ProductDetailPage from './pages/public/ProductDetailPage'
import ProductsPage from './pages/public/ProductsPage'
import RegisterPage from './pages/public/RegisterPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function AppShell() {
  const [, refresh] = useState(0)
  useEffect(() => { const update = () => refresh((value) => value + 1); window.addEventListener('marketlink:data', update); window.addEventListener('storage', update); return () => { window.removeEventListener('marketlink:data', update); window.removeEventListener('storage', update) } }, [])
  const [loaded, setLoaded] = useState(false)
  const { pathname, search } = useLocation()
  const immersive = ['/login', '/register'].includes(pathname)
  const portal = pathname === '/farmer/dashboard' || pathname === '/admin/dashboard'

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    void api.syncRemoteSnapshot?.().then(() => refresh((value) => value + 1))
  }, [])

  return <>
    <Loader done={loaded} />
    <ScrollToTop />
    {!immersive && !portal && <Navbar />}
    <a className="skip-link" href="#page-content">Skip to content</a><div id="page-content" tabIndex={-1}><Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/collections" element={<CollectionsPage />} />
      <Route path="/products" element={<ProductsPage key={search} />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/compare/:productId" element={<ComparePage />} />
      <Route path="/trip" element={<PlanTripPage />} />
      <Route path="/markets" element={<MarketsPage />} />
      <Route path="/markets/:id" element={<MarketDetailPage />} />
      <Route path="/farmers" element={<FarmersPage />} />
      <Route path="/farmers/:id" element={<FarmerDetailPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<ProtectedRoute role="customer"><CheckoutPage /></ProtectedRoute>} />
      <Route path="/customer/dashboard" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/orders/:id" element={<ProtectedRoute role="customer"><CustomerOrderDetailPage /></ProtectedRoute>} />
      <Route path="/farmer/dashboard" element={<ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>} />
      <Route path="/farmer/products/new" element={<ProtectedRoute role="farmer"><ProductFormPage /></ProtectedRoute>} />
      <Route path="/farmer/products/:id/edit" element={<ProtectedRoute role="farmer"><ProductFormPage /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="*" element={<HomePage />} />
    </Routes></div>
    {!immersive && !portal && <CompareDrawer />}
    {!immersive && !portal && <Footer />}
    {!immersive && !portal && <AIChatbot />}
    <Toaster position="top-right" richColors />
  </>
}

export default function App() {
  return <BrowserRouter><ErrorBoundary><AuthProvider><CartProvider><CompareProvider><AppShell /></CompareProvider></CartProvider></AuthProvider></ErrorBoundary></BrowserRouter>
}
