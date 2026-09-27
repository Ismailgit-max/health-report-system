import './Signup.css'
import { Link } from 'react-router-dom'
import { useState } from 'react'

function Signup() {

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ''
    })

    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        setMessage('')
        setError('')

        // Check password confirmation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        // Check role
        if (!formData.role) {
            setError('Please select a role')
            return
        }

        try {

            const response = await fetch(
                'http://localhost:8080/api/users/signup',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fullName: formData.fullName,
                        email: formData.email,
                        password: formData.password,
                        role: formData.role
                    })
                }
            )

            if (!response.ok) {
                throw new Error('Signup failed')
            }

            const data = await response.json()

            console.log('User created:', data)

            setMessage('Account created successfully!')

            // Clear form
            setFormData({
                fullName: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: ''
            })

        } catch (error) {

            console.error('Signup error:', error)

            setError(
                'Unable to create account. Please check the backend.'
            )
        }
    }

    return (
        <div className="signup-page">

            <div className="signup-card">

                <div className="logo">
                    🏥
                </div>

                <h1>Create Account</h1>

                <p className="subtitle">
                    Join Health Report System
                </p>

                {message && (
                    <p style={{ color: 'green', textAlign: 'center' }}>
                        {message}
                    </p>
                )}

                {error && (
                    <p style={{ color: 'red', textAlign: 'center' }}>
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit}>

                    <label>Full Name</label>

                    <input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                fullName: e.target.value
                            })
                        }
                    />

                    <label>Email</label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                email: e.target.value
                            })
                        }
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                password: e.target.value
                            })
                        }
                    />

                    <label>Confirm Password</label>

                    <input
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                confirmPassword: e.target.value
                            })
                        }
                    />

                    <label>Select Role</label>

                    <select
                        value={formData.role}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                role: e.target.value
                            })
                        }
                    >

                        <option value="">
                            Select your role
                        </option>

                        <option value="patient">
                            Patient
                        </option>

                        <option value="doctor">
                            Doctor
                        </option>

                        <option value="lab-technician">
                            Lab Technician
                        </option>

                    </select>

                    <button type="submit">
                        Create Account
                    </button>

                </form>

                <p className="login-text">

                    Already have an account?

                    <Link to="/">
                        Login
                    </Link>

                </p>

            </div>

        </div>
    )
}

export default Signup