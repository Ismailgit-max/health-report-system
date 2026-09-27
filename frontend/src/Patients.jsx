import './Patients.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Patients() {

    const navigate = useNavigate()

    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {

        const fetchPatients = async () => {

            try {

                const user = JSON.parse(localStorage.getItem('user'))
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
                        throw new Error('You are not authorized to view patients.')
                    }

                    throw new Error('Failed to fetch patients')
                }

                const data = await response.json()

                setPatients(data)

            } catch (error) {

                console.error('Error fetching patients:', error)

                setError(
                    error.message || 'Unable to load patients'
                )

            } finally {

                setLoading(false)

            }
        }

        fetchPatients()

    }, [])

    return (
        <div className="patients-page">

            <header className="patients-header">

                <div className="patients-logo">
                    🏥
                    <span>Health Report System</span>
                </div>

                <button
                    className="back-button"
                    onClick={() => navigate('/doctor-dashboard')}
                >
                    ← Dashboard
                </button>

            </header>

            <main className="patients-content">

                <div className="patients-title">

                    <h1>My Patients</h1>

                    <p>
                        View and manage your patients.
                    </p>

                </div>

                {loading && (
                    <div className="patients-message">
                        Loading patients...
                    </div>
                )}

                {error && (
                    <div className="patients-error">
                        {error}
                    </div>
                )}

                {!loading && !error && patients.length === 0 && (
                    <div className="patients-empty">

                        <div className="empty-patient-icon">
                            👥
                        </div>

                        <h2>No Patients Found</h2>

                        <p>
                            There are currently no patients registered.
                        </p>

                    </div>
                )}

                {!loading && !error && patients.length > 0 && (

                    <div className="patients-grid">

                        {patients.map((patient) => (

                            <div
                                className="patient-card"
                                key={patient.id}
                            >

                                <div className="patient-icon">
                                    👤
                                </div>

                                <div className="patient-info">

                                    <h2>
                                        {patient.fullName}
                                    </h2>

                                    <p>
                                        📧 {patient.email}
                                    </p>

                                    <span className="patient-role">
                                        {patient.role}
                                    </span>

                                </div>

                                <button
                                    className="patient-view-button"
                                    onClick={() =>
                                        navigate(
                                            `/patient-details/${patient.id}`
                                        )
                                    }
                                >
                                    View Details
                                </button>

                            </div>

                        ))}

                    </div>

                )}

            </main>

        </div>
    )
}

export default Patients