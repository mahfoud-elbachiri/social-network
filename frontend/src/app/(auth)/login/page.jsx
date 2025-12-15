'use client'

import { statuts } from '@/utils/statuts'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './login.module.css'

export default function LoginRegisterPage() {

  const [loginError, setLoginError] = useState("")

  const router = useRouter()

  useEffect(() => {
    const checkStatus = async () => {
      const data = await statuts();

      if (data?.status) {
        router.push('/Home');
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
      <div className={styles.container}>
        <div className={styles.infoSide}>
          <h2>Welcome back!</h2>
          <p>To social network</p>
        </div>
        <div className={styles.loginForm}>
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label>Nickname / Email</label>
              <input type="text" name="email" placeholder="Nickname or Email" required />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" required />
            </div>
            {loginError && <p className={styles.errorMessage}>{loginError}</p>}
            <button type="submit" className={styles.loginBtn}>Login</button>
            <div className={styles.registerLink}>
              Pas encore de compte? <button type="button" className={styles.registerBtn} onClick={redirect}>Create an account</button>
            </div>
          </form>
        </div>
      </div>

    </>
  )

}