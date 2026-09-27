import { renderToString } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext'
import { CartProvider } from '../src/context/CartContext'
import { CompareProvider } from '../src/context/CompareContext'
import ProtectedRoute from '../src/components/layout/ProtectedRoute'
import Home from '../src/pages/public/HomePage'
import Collections from '../src/pages/public/CollectionsPage'
import Products from '../src/pages/public/ProductsPage'
import Product from '../src/pages/public/ProductDetailPage'
import Compare from '../src/pages/public/ComparePage'
import Markets from '../src/pages/public/MarketsPage'
import Market from '../src/pages/public/MarketDetailPage'
import Trip from '../src/pages/public/PlanTripPage'
import Cart from '../src/pages/customer/CartPage'
import Checkout from '../src/pages/customer/PickupCheckoutPage'
import Farmer from '../src/pages/public/FarmerDetailPage'
import CustomerDashboard from '../src/pages/customer/CustomerDashboard'
import FarmerDashboard from '../src/pages/farmer/FarmerDashboard'
import AdminDashboard from '../src/pages/admin/AdminDashboard'
import Order from '../src/pages/customer/CustomerOrderDetailPage'
import Navbar from '../src/components/layout/Navbar'
import api from '../src/api'

export function renderChecks(assert) {
  const db = api.snapshot()
  const cases = [
    ['/', '/', Home, null, 'MarketLink'], ['/collections', '/collections', Collections, null, 'BY CATEGORY'],
    ['/products?category=Eggs', '/products', Products, null, 'Eggs'], ['/products/p-1', '/products/:id', Product, null, 'Compare prices'],
    ['/products/p-6', '/products/:id', Product, null, 'Notify me'], ['/compare/p-9', '/compare/:productId', Compare, null, 'Notify Me'],
    ['/markets', '/markets', Markets, null, 'Map View'], ['/markets/m-1', '/markets/:id', Market, null, 'Get directions'],
    ['/trip', '/trip', Trip, null, 'Find Market'], ['/cart', '/cart', Cart, null, 'YOU MAY ALSO'],
    ['/checkout', '/checkout', Checkout, 'customer', 'Pickup Date'], ['/farmers/f-1', '/farmers/:id', Farmer, null, 'Favorite Farmer'],
    ['/customer/dashboard', '/customer/dashboard', CustomerDashboard, 'customer', 'Logout'],
    ['/farmer/dashboard', '/farmer/dashboard', FarmerDashboard, 'farmer', 'Logout'],
    ['/admin/dashboard', '/admin/dashboard', AdminDashboard, 'admin', 'Logout'],
    ['/customer/orders/ML-1048', '/customer/orders/:id', Order, 'customer', 'Confirm collected'],
    ['/customer/orders/ML-1012', '/customer/orders/:id', Order, 'customer', 'Submit review'],
  ]
  localStorage.setItem('marketlink_cart', JSON.stringify([{ ...db.products[0], quantity: 1 }]))
  for (const [url, path, Page, role, expected] of cases) {
    if (role) localStorage.setItem('marketlink_session', JSON.stringify({ user: db.users.find((user) => user.role === role) }))
    else localStorage.removeItem('marketlink_session')
    const html = renderToString(<MemoryRouter initialEntries={[url]}><AuthProvider><CartProvider><CompareProvider><Navbar /><Routes><Route path={path} element={role ? <ProtectedRoute role={role}><Page /></ProtectedRoute> : <Page />} /></Routes></CompareProvider></CartProvider></AuthProvider></MemoryRouter>)
    assert(html.includes(expected), url + ' missing ' + expected)
    assert(!html.includes('NaN'), url + ' has invalid numeric output')
    console.log('PASS render ' + url)
  }
  for (const role of ['customer', 'farmer', 'admin']) {
    localStorage.removeItem('marketlink_session')
    const html = renderToString(<MemoryRouter><AuthProvider><ProtectedRoute role={role}><p>PRIVATE DASHBOARD CONTENT</p></ProtectedRoute></AuthProvider></MemoryRouter>)
    assert(!html.includes('PRIVATE DASHBOARD CONTENT'))
  }
  console.log('PASS protected dashboards render no private content without a session')
}

