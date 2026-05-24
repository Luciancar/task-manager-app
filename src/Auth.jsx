import { useState } from 'react'
import { auth } from './firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import './Auth.css'

const googleProvider = new GoogleAuthProvider()

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Email hoặc mật khẩu không đúng.')
          break
        case 'auth/email-already-in-use':
          setError('Email này đã được đăng ký.')
          break
        case 'auth/weak-password':
          setError('Mật khẩu phải có ít nhất 6 ký tự.')
          break
        case 'auth/invalid-email':
          setError('Email không hợp lệ.')
          break
        default:
          setError('Có lỗi xảy ra, vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Đăng nhập Google thất bại, vui lòng thử lại.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h1>📝 Todo App</h1>
        <h2>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h2>

        {/* Google Sign In */}
        <button className="google-btn" onClick={handleGoogle} disabled={googleLoading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          {googleLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
        </button>

        <div className="divider"><span>hoặc</span></div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email"
          />
          <input
            type="password"
            placeholder="Mật khẩu (ít nhất 6 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Mật khẩu"
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button onClick={() => { setIsLogin(!isLogin); setError('') }}>
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  )
}
