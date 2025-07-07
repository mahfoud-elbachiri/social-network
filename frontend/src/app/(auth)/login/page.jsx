'use client'

import { statuts } from '@/utils/statuts'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginRegisterPage() {

  const [loginError, setLoginError] = useState("")

  const router = useRouter()

  useEffect(() => {
    const checkStatus = async () => {
      const data = await statuts();

      if (data?.status) {
        router.push('/Home');
      } else if (!data?.login || data?.error) {
        router.push('/login');
      }
    }

    checkStatus()
  }, [])


  const handleLogin = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const res = await fetch("http://localhost:8080/login", {
      method: "POST",
      body: form,
      credentials: 'include'
    })
    const data = await res.json()
    if (data.status) {
      router.push('/Home')
    } else {
      setLoginError(data.error)
    }
  }

  const redirect = () => {
    router.push('/register')
  }



  return (
    <>
      <div id="login-container">
        <div className="info-side">
          <h2>Welcome back!</h2>
          <p>Log in to access your account</p>
          <p>Take advantage of all our exclusive services and features.</p>
        </div>
        <div className="login-form">
          <h1>Login</h1>
          <form id="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Nickname / Email</label>
              <input type="text" name="email" placeholder="Nickname or Email" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" required />
            </div>
            {loginError && <p id="error-log">{loginError}</p>}
            <button type="submit" id="login-btn" >Login</button>
            <div className="register-link">
              Pas encore de compte? <button type="button" id="resgesterlogin" onClick={redirect}>Create an account</button>
            </div>
          </form>
        </div>
      </div>

    </>
  )



}