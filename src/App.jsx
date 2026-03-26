import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

// Context
import { useAuth } from "./context/AuthContext"

// Components
import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/ProtectedRoute"

// Pages
import HomePage from "./pages/HomePage"
import SignupPage from "./pages/SignupPage"
import LoginPage from "./pages/LoginPage"
import PricingPage from "./pages/PricingPage"
import CharitiesPage from "./pages/CharitiesPage"
import CharityDetailPage from "./pages/CharityDetailPage"
import DrawsPage from "./pages/DrawsPage"
import Dashboard from "./Dashboard"

// Admin
import AdminLayout from "./admin/AdminLayout"

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/charities/:id" element={<CharityDetailPage />} />
        <Route path="/draws" element={<DrawsPage />} />

        {/* Protected — User Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected — Admin Panel */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App