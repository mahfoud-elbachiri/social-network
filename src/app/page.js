"use client"
import { useState } from "react"

export default function LoginRegisterPage() {
  const [showRegister, setShowRegister] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [registerError, setRegisterError] = useState("")

  const toggleForm = () => {
    setShowRegister(!showRegister)
    setLoginError("")
    setRegisterError("")
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    console.log("Login form data:", Object.fromEntries(form.entries()))
    const res = await fetch("http://localhost:8080/login", {
      method: "POST",
      body: form,
      credentials: 'include'
    })
    const data = await res.json()
    console.log("Login response:", data)
    if (data.status) {
      window.location.href = "/Home"
    } else {
      setLoginError(data.error)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const payload = {
      FirstName: form.get("firstName"),
      LastName: form.get("lastName"),
      Email: form.get("email"),
      Password: form.get("password"),
      Age: form.get("age"),
      Gender: form.get("gender"),
      Nickname: form.get("nickname"),
    }
    
    const res = await fetch("http://localhost:8080/resgester", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
    const data = await res.json()
    if (data.success) {
      window.location.href = "/"
    } else {
      setRegisterError(data.message)
    }
  }

  return (
    <div>
      {showRegister ? (
        <div id="register-container">
          <div className="info-side">
            <h2>Create an account</h2>
            <p>Join us and enjoy all the benefits of our platform</p>
            <ul className="feature-list">
              <li>Customer Service 24/7</li>
              <li>Interface simple et intuitive</li>
              <li>Protection of your personal data</li>
              <li>Regular feature updates</li>
            </ul>
          </div>
          <div className="register">
            <h1>Create Your Account</h1>
            <form id="register-form" onSubmit={handleRegister}>
              <div className="name-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" name="firstName" placeholder="John" required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" name="lastName" placeholder="Doe" required />
                </div>
              </div>
              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age" placeholder="25" required />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" required>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nickname</label>
                <input type="text" name="nickname" placeholder="johndoe" required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" placeholder="john@example.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="••••••••" required />
              </div>
              {registerError && <p id="error-reg">{registerError}</p>}
              <button type="submit" id="creat-btn" >Create Account</button>
              <span className="have">Already have an account?</span>
              <button type="button" id="log" onClick={toggleForm}>Login</button>
            </form>
          </div>
        </div>
      ) : (
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
                Pas encore de compte? <button type="button" id="resgesterlogin" onClick={toggleForm}>Create an account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
