import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const register = async (id, email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: id },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) return { error: '이미 사용 중인 이메일입니다.' }
      return { error: error.message }
    }

    return { ok: true }
  }

  const login = async (id, password) => {
    // 아이디로 이메일 조회
    const { data: email, error: rpcError } = await supabase.rpc('get_email_by_username', { p_username: id })
    if (rpcError || !email) return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    return { ok: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, isLoggedIn: !!session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
