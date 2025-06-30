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
  
  // Validate form data
  const validationErrors = validateForm(form)
  if (validationErrors.length > 0) {
    setRegisterError(validationErrors.join('. '))
    return
  }

  // Clear any previous errors
  setRegisterError("")

  try {
    const res = await fetch("http://localhost:8080/resgester", {
      method: "POST",
      body: form,
      credentials: 'include'
    })
    
    const data = await res.json()
    
    if (data.success) {
      window.location.href = "/"
    } else {
      setRegisterError(data.message)
    }
  } catch (error) {
    setRegisterError("Network error. Please try again.")
  }
  }

const validateForm = (formData) => {
  const errors = []
  
  
  const firstName = formData.get('firstName')?.trim()
  const lastName = formData.get('lastName')?.trim()
  const email = formData.get('email')?.trim()
  const password = formData.get('password')
  const age = parseInt(formData.get('age'))
  const nickname = formData.get('nickname')?.trim()


  if (!firstName || firstName.length < 2 || firstName.length > 30 || !/^[a-zA-Z\s]+$/.test(firstName)) {
    errors.push('First name must be 2-30 letters only')
  }
  
  if (!lastName || lastName.length < 2 || lastName.length > 30 || !/^[a-zA-Z\s]+$/.test(lastName)) {
    errors.push('Last name must be 2-30 letters only')
  }


  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    errors.push('Please enter a valid email address')
  }


  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters')
  }


  if (!age || age < 13 || age > 120) {
    errors.push('Age must be between 13 and 120')
  }

 
  if (nickname && (nickname.length < 3 || nickname.length > 20 || !/^[a-zA-Z0-9_]+$/.test(nickname))) {
    errors.push('Nickname must be 3-20 characters (letters, numbers, underscore only)')
  }

  return errors
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
                <label>Nickname (Optional)</label>
                <input type="text" name="nickname" placeholder="johndoe" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" placeholder="john@example.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="••••••••" required />
              </div>
              <div className="form-group">
                <label>Avatar/Image (Optional)</label>
                <input type="file" name="avatar" accept="image/*" />
              </div>
              <div className="form-group">
                <label>About Me (Optional)</label>
                <textarea name="about_me" placeholder="Tell us about yourself..." rows="3" />
              </div>
              <div className="form-group">
                <label>Account Privacy :</label>
                <div className="radio-group-inline">
                  <label className="radio-option-inline">
                    <input type="radio" name="is_private" value="false" defaultChecked />
                    <span> Public</span>
                  </label>
                  <label className="radio-option-inline">
                    <input type="radio" name="is_private" value="true" />
                    <span> Private</span>
                  </label>
                </div>
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
