
import { createContext, useContext, useEffect, useState } from "react"

import { supabase } from "../api/supabase"

// Create the context object — components will read from this
export const AuthContext = createContext()

// ---- AuthProvider ----
// Wrap your entire app (in main.jsx) with this provider.
// All children will receive `user` and `loading` via context.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  // `loading` prevents UI flash — show nothing until session is resolved
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // DEBUG: Fetch the currently authenticated user on first render
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        // This typically means no active session — not a hard error
        console.warn("[AuthContext] getUser error (likely no session):", error.message)
      }
      console.log("[AuthContext] Initial user fetched:", data?.user?.email ?? "No user")
      setUser(data?.user ?? null)
      setLoading(false)
    })

    // DEBUG: Subscribe to auth state changes (login/logout/token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthContext] Auth state changed:", event, "| User:", session?.user?.email ?? "none")
      setUser(session?.user ?? null)
    })

    // Cleanup subscription on unmount to avoid memory leaks
    return () => {
      console.log("[AuthContext] Cleaning up auth listener")
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    // Expose `user` and `loading` to all children
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---- useAuth() ----
// Custom hook — shorthand so components don't need to import AuthContext directly
// Usage: const { user, loading } = useAuth()
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("[useAuth] Must be used inside <AuthProvider>")
  return ctx
}
