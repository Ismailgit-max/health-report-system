import './PatientDetails.css'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function PatientDetails() {

    const navigate = useNavigate()
    const { id } = useParams()

    const [patient, setPatient] = useState(null)
    const [reports, setReports] = useState([])
    const [testResults, setTestResults] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {

        const fetchPatientDetails = async () => {

            try {

                const user = JSON.parse(localStorage.getItem('user'))
                const token = user?.token

                if (!token) {
                    throw new Error('Authentication token not found')
                }

                const authHeaders = {
                    'Authorization': `Bearer ${token}`
                }

                // Get patient information
                const patientResponse = await fetch(
                    `http://localhost:8080/api/users/${id}`,
                    {
                        method: 'GET',
                        headers: authHeaders
                    }
                )

                if (!patientResponse.ok) {
                    throw new Error('Patient not found')
                }

                const patientData = await patientResponse.json()
                setPatient(patientData)

                // Get patient's health reports
                const reportsResponse = await fetch(
                    `http://localhost:8080/api/reports/patient/${id}`,
                    {
                        method: 'GET',
                        headers: authHeaders
                    }
                )

                if (!reportsResponse.ok) {
                    throw new Error('Failed to fetch reports')
                }

                const reportsData = await reportsResponse.json()
                setReports(reportsData)

                // Get test results for every report
                const resultsByReport = {}

                for (const report of reportsData) {

                    const resultsResponse = await fetch(
                        `http://localhost:8080/api/test-results/report/${report.id}`,
                        {
                            method: 'GET',
                            headers: authHeaders
                        }
                    )

                    if (!resultsResponse.ok) {
                        throw new Error(
                            `Failed to fetch test results for report ${report.id}`
                        )
                    }

                    const resultsData = await resultsResponse.json()

                    resultsByReport[report.id] = resultsData
                }

                setTestResults(resultsByReport)

            } catch (error) {

                console.error('Patient details error:', error)

                setError(
                    error.message ||
                    'Unable to load patient details'
                )

            } finally {

                setLoading(false)

            }
        }

        fetchPatientDetails()

    }, [id])

    const handleViewPdf = async (reportId) => {

        const newWindow = window.open('', '_blank')

        try {

            const user = JSON.parse(localStorage.getItem('user'))
            const token = user?.token

            if (!token) {
                if (newWindow) newWindow.close()
                setError('Authentication token not found. Please login again.')
                return
            }

            const response = await fetch(
                `http://localhost:8080/api/reports/pdf/${reportId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            if (!response.ok) {

                if (newWindow) newWindow.close()

                if (response.status === 401) {
                    throw new Error('Session expired. Please login again.')
                }

                if (response.status === 403) {
                    throw new Error('You are not allowed to view this PDF.')
                }

                throw new Error('Unable to load PDF')
            }

            const blob = await response.blob()
            const pdfUrl = URL.createObjectURL(blob)

            if (newWindow) {
                newWindow.location.href = pdfUrl
            } else {
                window.open(pdfUrl, '_blank')
            }

            setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000)

        } catch (error) {

            console.error('PDF view error:', error)
            setError(error.message || 'Unable to open PDF')

        }
    }

    return (
        <div className="patient-details-page">

            {/* Header */}

            <header className="patient-details-header">

                <div className="patient-details-logo">
                    🏥
                    <span>Health Report System</span>
                </div>

                <button
                    className="back-button"
                    onClick={() => navigate('/patients')}
                >
                    ← Patients
                </button>

            </header>


            <main className="patient-details-content">

                {/* Loading */}

                {loading && (
                    <div className="details-message">
                        Loading patient details...
                    </div>
                )}


                {/* Error */}

                {error && (
                    <div className="details-error">
                        {error}
                    </div>
                )}


                {!loading && !error && patient && (

                    <>

                        {/* Page Title */}

                        <div className="details-title">

                            <h1>
                                Patient Details
                            </h1>

                            <p>
                                View patient information and complete health records.
                            </p>

                        </div>


                        {/* Patient Profile */}

                        <section className="patient-profile-card">

                            <div className="large-patient-icon">
                                👤
                            </div>

                            <div className="profile-info">

                                <h2>
                                    {patient.fullName}
                                </h2>

                                <div className="profile-details">

                                    <p>
                                        <strong>Patient ID</strong>
                                        <span>{patient.id}</span>
                                    </p>

                                    <p>
                                        <strong>Email</strong>
                                        <span>{patient.email}</span>
                                    </p>

                                    <p>
                                        <strong>Role</strong>
                                        <span>{patient.role}</span>
                                    </p>

                                </div>

                            </div>

                        </section>


                        {/* Health Reports */}

                        <section className="health-records-section">

                            <div className="section-heading">

                                <div>
                                    <h2>
                                        Health Reports
                                    </h2>

                                    <p>
                                        Complete medical reports uploaded by the laboratory.
                                    </p>
                                </div>

                                <div className="report-count">
                                    {reports.length} Report
                                    {reports.length !== 1 ? 's' : ''}
                                </div>

                            </div>


                            {reports.length === 0 ? (

                                <div className="records-empty">

                                    <div className="empty-icon">
                                        📋
                                    </div>

                                    <h3>
                                        No health reports yet
                                    </h3>

                                    <p>
                                        Patient health reports will appear here
                                        after they are uploaded.
                                    </p>

                                </div>

                            ) : (

                                <div className="reports-list">

                                    {reports.map((report) => (

                                        <article
                                            className="report-card"
                                            key={report.id}
                                        >

                                            {/* Report Header */}

                                            <div className="report-card-header">

                                                <div className="report-title-area">

                                                    <div className="report-icon">
                                                        🧪
                                                    </div>

                                                    <div>

                                                        <h3>
                                                            {report.reportName}
                                                        </h3>

                                                        <p>
                                                            Report ID: #{report.id}
                                                        </p>

                                                    </div>

                                                </div>

                                                <span className="status-badge">
                                                    {report.reportStatus || 'Unknown'}
                                                </span>

                                            </div>


                                            {/* Report Information */}

                                            <div className="report-information">

                                                <h4>
                                                    📄 Report Information
                                                </h4>

                                                <div className="information-grid">

                                                    <div className="information-item">

                                                        <span className="information-label">
                                                            Report Type
                                                        </span>

                                                        <strong>
                                                            {report.reportType || '-'}
                                                        </strong>

                                                    </div>


                                                    <div className="information-item">

                                                        <span className="information-label">
                                                            Test Date
                                                        </span>

                                                        <strong>
                                                            {report.testDate || '-'}
                                                        </strong>

                                                    </div>


                                                    <div className="information-item">

                                                        <span className="information-label">
                                                            Laboratory
                                                        </span>

                                                        <strong>
                                                            {report.laboratoryName || '-'}
                                                        </strong>

                                                    </div>


                                                    <div className="information-item">

                                                        <span className="information-label">
                                                            Referring Doctor
                                                        </span>

                                                        <strong>
                                                            {report.referringDoctor || '-'}
                                                        </strong>

                                                    </div>


                                                    <div className="information-item">

                                                        <span className="information-label">
                                                            Uploaded At
                                                        </span>

                                                        <strong>
                                                            {report.uploadedAt
                                                                ? new Date(
                                                                    report.uploadedAt
                                                                ).toLocaleString()
                                                                : '-'}
                                                        </strong>

                                                    </div>

                                                </div>

                                            </div>


                                            {/* Test Results */}

                                            <div className="test-results-display">

                                                <div className="test-results-title">

                                                    <div>

                                                        <h4>
                                                            🩸 Test Results
                                                        </h4>

                                                        <p>
                                                            Laboratory test values and reference ranges.
                                                        </p>

                                                    </div>

                                                    <span className="test-count">
                                                        {testResults[report.id]?.length || 0} Test
                                                        {(testResults[report.id]?.length || 0) !== 1
                                                            ? 's'
                                                            : ''}
                                                    </span>

                                                </div>


                                                {!testResults[report.id] ? (

                                                    <div className="results-loading">
                                                        Loading test results...
                                                    </div>

                                                ) : testResults[report.id].length === 0 ? (

                                                    <div className="no-test-results">
                                                        No individual test results were added to this report.
                                                    </div>

                                                ) : (

                                                    <div className="test-results-table-container">

                                                        <table className="test-results-table">

                                                            <thead>

                                                            <tr>

                                                                <th>
                                                                    Category
                                                                </th>

                                                                <th>
                                                                    Test Name
                                                                </th>

                                                                <th>
                                                                    Result
                                                                </th>

                                                                <th>
                                                                    Unit
                                                                </th>

                                                                <th>
                                                                    Reference Range
                                                                </th>

                                                                <th>
                                                                    Notes
                                                                </th>

                                                            </tr>

                                                            </thead>


                                                            <tbody>

                                                            {testResults[report.id].map(
                                                                (result) => (

                                                                    <tr
                                                                        key={result.id}
                                                                    >

                                                                        <td>
                                                                            <span className="category-badge">
                                                                                {result.category || '-'}
                                                                            </span>
                                                                        </td>

                                                                        <td>
                                                                            <strong>
                                                                                {result.testName || '-'}
                                                                            </strong>
                                                                        </td>

                                                                        <td className="result-value">
                                                                            {result.resultValue || '-'}
                                                                        </td>

                                                                        <td>
                                                                            {result.unit || '-'}
                                                                        </td>

                                                                        <td>
                                                                            {result.referenceRange || '-'}
                                                                        </td>

                                                                        <td>
                                                                            {result.notes || '-'}
                                                                        </td>

                                                                    </tr>

                                                                )
                                                            )}

                                                            </tbody>

                                                        </table>

                                                    </div>

                                                )}

                                            </div>


                                            {/* Additional Notes */}

                                            {report.notes && (

                                                <div className="additional-notes">

                                                    <h4>
                                                        📝 Additional Notes
                                                    </h4>

                                                    <p>
                                                        {report.notes}
                                                    </p>

                                                </div>

                                            )}


                                            {/* PDF */}

                                            {report.pdfFileName && (

                                                <div className="report-pdf-section">

                                                    <div className="pdf-information">

                                                        <div className="pdf-icon">
                                                            📄
                                                        </div>

                                                        <div>

                                                            <h4>
                                                                Medical Report PDF
                                                            </h4>

                                                            <p>
                                                                {report.pdfFileName}
                                                            </p>

                                                        </div>

                                                    </div>

                                                    <button
                                                        className="pdf-view-button"
                                                        onClick={() => handleViewPdf(report.id)}
                                                    >
                                                        📄 View Medical PDF
                                                    </button>

                                                </div>

                                            )}

                                        </article>

                                    ))}

                                </div>

                            )}

                        </section>

                    </>

                )}

            </main>

        </div>
    )
}

export default PatientDetails