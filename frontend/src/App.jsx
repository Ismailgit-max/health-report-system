import './App.css'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import Signup from './Signup.jsx'
import DoctorDashboard from './DoctorDashboard.jsx'
import Patients from './Patients.jsx'
import PatientDetails from './PatientDetails.jsx'
import LabDashboard from './LabDashboard.jsx'
import PatientDashboard from './PatientDashboard.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'


function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')


  const handleLogin = async (e) => {

    e.preventDefault()

    setMessage('')
    setError('')

    if (!role) {
      setError('Please select your role')
      return
    }

    try {

      const response = await fetch(
          'http://localhost:8080/api/users/login',
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              email: email,
              password: password
            })
          }
      )

      if (!response.ok) {
        throw new Error('Invalid email or password')
      }

      const data = await response.json()

      console.log('Login successful:', data)

      // Check selected role against actual account role
      if (data.role !== role) {

        setError(
            'Selected role does not match your account role'
        )

        return
      }

      setMessage('Login successful!')

      // Store authenticated user
      localStorage.setItem(
          'user',
          JSON.stringify(data)
      )


      // Redirect according to role

      if (data.role === 'doctor') {

        navigate('/doctor-dashboard')

      } else if (data.role === 'patient') {

        navigate('/patient-dashboard')

      } else if (data.role === 'lab-technician') {

        navigate('/lab-dashboard')

      }

    } catch (error) {

      console.error(
          'Login error:',
          error
      )

      setError(
          'Invalid email or password'
      )
    }
  }


  return (
      <div className="app">

        <div className="login-card">

          <div className="logo">
            🏥
          </div>

          <h1>
            Health Report System
          </h1>

          <p className="subtitle">
            Secure access to your health records
          </p>


          {/* ROLE SELECTION */}

          <div className="role-container">

            <button
                type="button"
                className={`role-card ${
                    role === 'doctor'
                        ? 'active'
                        : ''
                }`}
                onClick={() => setRole('doctor')}
            >
            <span className="role-icon">
              👨‍⚕️
            </span>

              <span>
              Doctor
            </span>

            </button>


            <button
                type="button"
                className={`role-card ${
                    role === 'lab-technician'
                        ? 'active'
                        : ''
                }`}
                onClick={() =>
                    setRole('lab-technician')
                }
            >

            <span className="role-icon">
              🧪
            </span>

              <span>
              Lab Technician
            </span>

            </button>


            <button
                type="button"
                className={`role-card ${
                    role === 'patient'
                        ? 'active'
                        : ''
                }`}
                onClick={() =>
                    setRole('patient')
                }
            >

            <span className="role-icon">
              👤
            </span>

              <span>
              Patient
            </span>

            </button>

          </div>


          <div className="divider">
          <span>
            Login to continue
          </span>
          </div>


          {/* SUCCESS MESSAGE */}

          {message && (

              <p
                  style={{
                    color: 'green',
                    textAlign: 'center',
                    marginBottom: '15px'
                  }}
              >
                {message}
              </p>

          )}


          {/* ERROR MESSAGE */}

          {error && (

              <p
                  style={{
                    color: 'red',
                    textAlign: 'center',
                    marginBottom: '15px'
                  }}
              >
                {error}
              </p>

          )}


          {/* LOGIN FORM */}

          <form onSubmit={handleLogin}>

            <label>
              Email
            </label>

            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
            />


            <label>
              Password
            </label>

            <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                    setPassword(e.target.value)
                }
            />


            <div className="options">

              <label className="remember">

                <input
                    type="checkbox"
                />

                Remember me

              </label>


              <a href="#">
                Forgot Password?
              </a>

            </div>


            <button
                className="login-button"
                type="submit"
            >
              Login
            </button>

          </form>


          {/* SIGNUP */}

          <p className="signup">

            Don't have an account?

            <Link to="/signup">
              Sign Up
            </Link>

          </p>

        </div>

      </div>
  )
}


function App() {

  return (

      <Routes>

        {/* PUBLIC ROUTES */}

        <Route
            path="/"
            element={<Login />}
        />

        <Route
            path="/signup"
            element={<Signup />}
        />


        {/* DOCTOR */}

        <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute
                  allowedRole="doctor"
              >
                <DoctorDashboard />
              </ProtectedRoute>
            }
        />


        {/* DOCTOR PATIENT LIST */}

        <Route
            path="/patients"
            element={
              <ProtectedRoute
                  allowedRole="doctor"
              >
                <Patients />
              </ProtectedRoute>
            }
        />


        {/* PATIENT DETAILS */}

        <Route
            path="/patient-details/:id"
            element={
              <ProtectedRoute
                  allowedRole="doctor"
              >
                <PatientDetails />
              </ProtectedRoute>
            }
        />


        {/* LAB TECHNICIAN */}

        <Route
            path="/lab-dashboard"
            element={
              <ProtectedRoute
                  allowedRole="lab-technician"
              >
                <LabDashboard />
              </ProtectedRoute>
            }
        />


        {/* PATIENT */}

        <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute
                  allowedRole="patient"
              >
                <PatientDashboard />
              </ProtectedRoute>
            }
        />

      </Routes>
  )
}

export default App