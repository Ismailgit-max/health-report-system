import './DoctorDashboard.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function DoctorDashboard() {

    const navigate = useNavigate()

    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const user = JSON.parse(localStorage.getItem('user'))

    useEffect(() => {

        const fetchPatients = async () => {

            try {

                const token = user?.token

                if (!token) {
                    throw new Error('Authentication token not found')
                }

                const response = await fetch(
                    'http://localhost:8080/api/users/patients',
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )

                if (!response.ok) {

                    if (response.status === 401) {
                        throw new Error('Session expired. Please login again.')
                    }

                    if (response.status === 403) {
                        throw new Error(
                            'You are not authorized to view patients.'
                        )
                    }

                    throw new Error('Failed to fetch patients')
                }

                const data = await response.json()

                console.log('Patients:', data)

                setPatients(data)

            } catch (error) {

                console.error('Patient fetch error:', error)

                setError(
                    error.message || 'Unable to load patients'
                )

            } finally {

                setLoading(false)

            }
        }

        fetchPatients()

    }, [])

    const handleLogout = () => {

        localStorage.removeItem('user')

        navigate('/')

    }

    return (
        <div className="doctor-dashboard">

            <header className="dashboard-header">

                <div className="dashboard-logo">
                    🏥
                    <span>Health Report System</span>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </header>

            <main className="dashboard-content">

                <div className="welcome-section">

                    <h1>
                        Welcome, Dr. {user?.fullName} 👋
                    </h1>

                    <p>
                        Manage your patients and health reports from one place.
                    </p>

                </div>

                <div className="stats-container">

                    <div className="stat-card">

                        <div className="stat-icon">
                            👥
                        </div>

                        <div>

                            <h3>Patients</h3>

                            <p>
                                {loading ? '...' : patients.length}
                            </p>

                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon">
                            📄
                        </div>

                        <div>

                            <h3>Reports</h3>

                            <p>0</p>

                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon">
                            🧪
                        </div>

                        <div>

                            <h3>Lab Reports</h3>

                            <p>0</p>

                        </div>

                    </div>

                </div>

                <section className="reports-section">

                    <div className="section-header">

                        <h2>Recent Patient Reports</h2>

                        <button className="view-button">
                            View All
                        </button>

                    </div>

                    <div className="empty-reports">

                        <div className="empty-icon">
                            📋
                        </div>

                        <h3>No reports available</h3>

                        <p>
                            Patient reports will appear here when they are uploaded.
                        </p>

                    </div>

                </section>

                <section className="quick-section">

                    <h2>Quick Actions</h2>

                    <div className="quick-actions">

                        <button
                            className="action-card"
                            onClick={() => navigate('/patients')}
                        >

                            <span>👥</span>

                            <strong>View Patients</strong>

                            <small>
                                View your patients
                            </small>

                        </button>

                        <button className="action-card">

                            <span>📄</span>

                            <strong>View Reports</strong>

                            <small>
                                Check patient reports
                            </small>

                        </button>

                        <button className="action-card">

                            <span>📊</span>

                            <strong>Analytics</strong>

                            <small>
                                View health analytics
                            </small>

                        </button>

                    </div>

                </section>

                {error && (
                    <p style={{
                        color: 'red',
                        textAlign: 'center',
                        marginTop: '20px'
                    }}>
                        {error}
                    </p>
                )}

            </main>

        </div>
    )
}

export default DoctorDashboard