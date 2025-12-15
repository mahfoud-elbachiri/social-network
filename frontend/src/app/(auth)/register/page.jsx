"use client"
import { statuts } from "@/utils/statuts"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import styles from './register.module.css'

export default function LoginRegisterPage() {
    const [registerError, setRegisterError] = useState("")

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


    const redirect = () => {
        router.push('/login')
    }


    return (
        <div>
            <div className={styles.container}>
                <div className={styles.infoSide}>
                    <h2>Create an account</h2>
                    <p>Join the social network</p>
                    <ul className={styles.featureList}>

                    </ul>
                </div>
                <div className={styles.registerForm}>
                    <h1>Create Your Account</h1>
                    <form onSubmit={handleRegister}>
                        <div className={styles.nameRow}>
                            <div className={styles.formGroup}>
                                <label>First Name</label>
                                <input type="text" name="firstName" placeholder="John" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Last Name</label>
                                <input type="text" name="lastName" placeholder="Doe" required />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Age</label>
                            <input type="number" name="age" placeholder="25" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Gender</label>
                            <select name="gender" required>
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Nickname (Optional)</label>
                            <input type="text" name="nickname" placeholder="johndoe" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email Address</label>
                            <input type="email" name="email" placeholder="john@example.com" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Password</label>
                            <input type="password" name="password" placeholder="••••••••" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Avatar/Image (Optional)</label>
                            <input type="file" name="avatar" accept="image/*" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>About Me (Optional)</label>
                            <textarea name="about_me" placeholder="Tell us about yourself..." rows="3" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Account Privacy :</label>
                            <div className={styles.radioGroupInline}>
                                <label className={styles.radioOptionInline}>
                                    <input type="radio" name="is_private" value="false" defaultChecked />
                                    <span> Public</span>
                                </label>
                                <label className={styles.radioOptionInline}>
                                    <input type="radio" name="is_private" value="true" />
                                    <span> Private</span>
                                </label>
                            </div>
                        </div>
                        {registerError && <p className={styles.errorMessage}>{registerError}</p>}
                        <button type="submit" className={styles.createBtn} >Create Account</button>
                        <span className={styles.haveAccount}>Already have an account?</span>
                        <button type="button" className={styles.loginBtn} onClick={redirect}>Login</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

