import './PatientDashboard.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts'

function PatientDashboard() {

    const navigate = useNavigate()

    const [user, setUser] = useState(null)
    const [reports, setReports] = useState([])
    const [testResults, setTestResults] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {

        const loadDashboard = async () => {

            try {

                const storedUser = localStorage.getItem('user')

                if (!storedUser) {
                    navigate('/')
                    return
                }

                const loggedInUser = JSON.parse(storedUser)

                if (!loggedInUser.id) {
                    throw new Error('Invalid user information')
                }

                if (!loggedInUser.token) {
                    throw new Error(
                        'Authentication token not found. Please login again.'
                    )
                }

                if (loggedInUser.role !== 'patient') {
                    throw new Error('Access denied')
                }

                setUser(loggedInUser)

                const token = loggedInUser.token

                // =========================
                // GET PATIENT REPORTS
                // =========================

                const reportsResponse = await fetch(
                    `http://localhost:8080/api/reports/patient/${loggedInUser.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )

                if (!reportsResponse.ok) {

                    if (reportsResponse.status === 401) {
                        throw new Error(
                            'Session expired. Please login again.'
                        )
                    }

                    if (reportsResponse.status === 403) {
                        throw new Error(
                            'You are not allowed to access these reports.'
                        )
                    }

                    throw new Error('Failed to load health reports')
                }

                const reportsData = await reportsResponse.json()

                setReports(reportsData)

                // =========================
                // GET TEST RESULTS
                // =========================

                const resultsByReport = {}

                for (const report of reportsData) {

                    const resultsResponse = await fetch(
                        `http://localhost:8080/api/test-results/report/${report.id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    )

                    if (resultsResponse.ok) {

                        const resultsData =
                            await resultsResponse.json()

                        resultsByReport[report.id] = resultsData

                    } else {

                        resultsByReport[report.id] = []

                    }
                }

                setTestResults(resultsByReport)

            } catch (error) {

                console.error(
                    'Patient dashboard error:',
                    error
                )

                setError(
                    error.message ||
                    'Unable to load dashboard'
                )

            } finally {

                setLoading(false)

            }
        }

        loadDashboard()

    }, [navigate])


    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        localStorage.removeItem('user')

        navigate('/')

    }


    // =========================
    // VIEW PDF
    // =========================

    const handleViewPdf = async (reportId) => {

        let pdfWindow = null

        try {

            const storedUser = localStorage.getItem('user')

            if (!storedUser) {
                navigate('/')
                return
            }

            const loggedInUser = JSON.parse(storedUser)

            if (!loggedInUser.token) {
                alert(
                    'Authentication token not found. Please login again.'
                )
                navigate('/')
                return
            }

            pdfWindow = window.open('', '_blank')

            if (!pdfWindow) {
                alert(
                    'Please allow pop-ups for this website to view the PDF.'
                )
                return
            }

            pdfWindow.document.write(`
                <html>
                    <head>
                        <title>Loading Medical PDF...</title>
                    </head>
                    <body style="
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    ">
                        <h2>Loading Medical PDF...</h2>
                    </body>
                </html>
            `)

            const response = await fetch(
                `http://localhost:8080/api/reports/pdf/${reportId}`,
                {
                    headers: {
                        'Authorization':
                            `Bearer ${loggedInUser.token}`
                    }
                }
            )

            if (!response.ok) {

                pdfWindow.close()

                if (response.status === 401) {
                    alert(
                        'Your session has expired. Please login again.'
                    )
                    navigate('/')
                    return
                }

                if (response.status === 403) {
                    alert(
                        'You are not allowed to access this PDF.'
                    )
                    return
                }

                if (response.status === 404) {
                    alert('PDF file not found.')
                    return
                }

                alert('Unable to open the PDF.')
                return
            }

            const blob = await response.blob()

            const pdfUrl = URL.createObjectURL(blob)

            pdfWindow.location.href = pdfUrl

            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl)
            }, 60000)

        } catch (error) {

            console.error(
                'PDF error:',
                error
            )

            if (pdfWindow) {
                pdfWindow.close()
            }

            alert(
                'Unable to open the medical PDF.'
            )
        }
    }


    // =========================
    // TOTAL TESTS
    // =========================

    const getTotalTests = () => {

        return Object.values(testResults)
            .reduce(
                (total, results) =>
                    total + results.length,
                0
            )

    }


    // =========================
    // PREPARE ANALYTICS DATA
    // =========================

    const getAnalyticsGroups = () => {

        const groups = {}

        Object.entries(testResults).forEach(
            ([reportId, results]) => {

                const report = reports.find(
                    item =>
                        item.id === Number(reportId)
                )

                results.forEach(result => {

                    const numericValue =
                        parseFloat(result.resultValue)

                    if (Number.isNaN(numericValue)) {
                        return
                    }

                    const testName =
                        result.testName || 'Unknown Test'

                    if (!groups[testName]) {

                        groups[testName] = {
                            testName,
                            unit: result.unit || '',
                            referenceRange:
                                result.referenceRange || '',
                            data: []
                        }

                    }

                    groups[testName].data.push({
                        date:
                            report?.testDate ||
                            'Unknown date',

                        value: numericValue,

                        unit:
                            result.unit || '',

                        referenceRange:
                            result.referenceRange || '',

                        reportId:
                            report?.id || reportId
                    })

                })

            }
        )

        Object.values(groups).forEach(group => {

            group.data.sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            )

        })

        return Object.values(groups)

    }


    const analyticsGroups =
        getAnalyticsGroups()


    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (
            <div className="patient-dashboard-page">

                <div className="dashboard-loading">

                    <div className="loading-icon">
                        🏥
                    </div>

                    <h2>
                        Loading Dashboard...
                    </h2>

                    <p>
                        Please wait while we load your health records.
                    </p>

                </div>

            </div>
        )

    }


    // =========================
    // ERROR
    // =========================

    if (error) {

        return (
            <div className="patient-dashboard-page">

                <header className="patient-dashboard-header">

                    <div className="dashboard-logo">
                        🏥
                        <span>
                            Health Report System
                        </span>
                    </div>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </header>

                <main className="patient-dashboard-content">

                    <div className="dashboard-error">

                        <div className="error-icon">
                            ⚠️
                        </div>

                        <h2>
                            Unable to Load Dashboard
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            onClick={() =>
                                window.location.reload()
                            }
                        >
                            Try Again
                        </button>

                    </div>

                </main>

            </div>
        )

    }


    return (

        <div className="patient-dashboard-page">

            {/* =========================
                HEADER
            ========================= */}

            <header className="patient-dashboard-header">

                <div className="dashboard-logo">
                    🏥
                    <span>
                        Health Report System
                    </span>
                </div>

                <div className="header-right">

                    <div className="patient-header-name">
                        👤 {user?.fullName}
                    </div>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            <main className="patient-dashboard-content">

                {/* =========================
                    WELCOME
                ========================= */}

                <section className="welcome-section">

                    <div>

                        <p className="welcome-label">
                            Patient Dashboard
                        </p>

                        <h1>
                            Welcome, {user?.fullName}
                        </h1>

                        <p>
                            View your health reports, test results,
                            and medical documents in one place.
                        </p>

                    </div>

                </section>


                {/* =========================
                    PATIENT PROFILE
                ========================= */}

                <section className="patient-profile-card">

                    <div className="profile-icon">
                        👤
                    </div>

                    <div className="profile-info">

                        <h2>
                            {user?.fullName}
                        </h2>

                        <p>
                            {user?.email}
                        </p>

                        <span>
                            Patient ID: #{user?.id}
                        </span>

                    </div>

                </section>


                {/* =========================
                    STATISTICS
                ========================= */}

                <section className="statistics-grid">

                    <div className="stat-card">

                        <div className="stat-icon">
                            📋
                        </div>

                        <div>

                            <span>
                                Total Reports
                            </span>

                            <strong>
                                {reports.length}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            🧪
                        </div>

                        <div>

                            <span>
                                Total Tests
                            </span>

                            <strong>
                                {getTotalTests()}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            📄
                        </div>

                        <div>

                            <span>
                                Medical PDFs
                            </span>

                            <strong>
                                {
                                    reports.filter(
                                        report =>
                                            report.pdfFileName
                                    ).length
                                }
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =========================
                    HEALTH ANALYTICS
                ========================= */}

                <section className="analytics-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                📊 Health Analytics
                            </h2>

                            <p>
                                Track individual test values over time.
                            </p>

                        </div>

                    </div>


                    {analyticsGroups.length === 0 ? (

                        <div className="empty-reports">

                            <div className="empty-icon">
                                📊
                            </div>

                            <h3>
                                No Analytics Data Yet
                            </h3>

                            <p>
                                Analytics will appear when numerical
                                test results are available.
                            </p>

                        </div>

                    ) : (

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(400px, 1fr))',
                                gap: '20px'
                            }}
                        >

                            {analyticsGroups.map(
                                (group) => (

                                    <div
                                        key={group.testName}
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '16px',
                                            padding: '20px',
                                            boxShadow:
                                                '0 8px 24px rgba(0, 0, 0, 0.06)'
                                        }}
                                    >

                                        <div
                                            style={{
                                                marginBottom: '10px'
                                            }}
                                        >

                                            <h3
                                                style={{
                                                    margin:
                                                        '0 0 5px 0'
                                                }}
                                            >
                                                🧪 {group.testName}
                                            </h3>

                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: '#666'
                                                }}
                                            >
                                                Unit: {
                                                group.unit ||
                                                '-'
                                            }
                                            </p>

                                            <p
                                                style={{
                                                    margin:
                                                        '4px 0 0',
                                                    color: '#666'
                                                }}
                                            >
                                                Reference range: {
                                                group.referenceRange ||
                                                '-'
                                            }
                                            </p>

                                        </div>


                                        <div
                                            style={{
                                                width: '100%',
                                                height: '300px'
                                            }}
                                        >

                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >

                                                <LineChart
                                                    data={group.data}
                                                    margin={{
                                                        top: 20,
                                                        right: 20,
                                                        left: 10,
                                                        bottom: 20
                                                    }}
                                                >

                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                    />

                                                    <XAxis
                                                        dataKey="date"
                                                    />

                                                    <YAxis />

                                                    <Tooltip
                                                        formatter={(
                                                            value,
                                                            name,
                                                            props
                                                        ) => [
                                                            `${value} ${
                                                                props
                                                                    ?.payload
                                                                    ?.unit ||
                                                                ''
                                                            }`,
                                                            'Result'
                                                        ]}
                                                    />

                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        name="Result"
                                                        strokeWidth={3}
                                                        dot={{
                                                            r: 5
                                                        }}
                                                        activeDot={{
                                                            r: 7
                                                        }}
                                                    />

                                                </LineChart>

                                            </ResponsiveContainer>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>


                {/* =========================
                    HEALTH REPORTS
                ========================= */}

                <section className="reports-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                My Health Reports
                            </h2>

                            <p>
                                Your laboratory reports and test results.
                            </p>

                        </div>

                        <div className="report-count">

                            {reports.length}
                            {' '}
                            Report
                            {reports.length !== 1 ? 's' : ''}

                        </div>

                    </div>


                    {reports.length === 0 ? (

                        <div className="empty-reports">

                            <div className="empty-icon">
                                📋
                            </div>

                            <h3>
                                No Health Reports Yet
                            </h3>

                            <p>
                                Your health reports will appear here
                                after the laboratory uploads them.
                            </p>

                        </div>

                    ) : (

                        <div className="reports-list">

                            {reports.map((report) => (

                                <article
                                    className="patient-report-card"
                                    key={report.id}
                                >

                                    {/* Report Header */}

                                    <div className="report-header">

                                        <div className="report-title">

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
                                            {
                                                report.reportStatus ||
                                                'Unknown'
                                            }
                                        </span>

                                    </div>


                                    {/* Report Information */}

                                    <div className="report-information">

                                        <h4>
                                            📄 Report Information
                                        </h4>

                                        <div className="information-grid">

                                            <div className="information-item">

                                                <span>
                                                    Report Type
                                                </span>

                                                <strong>
                                                    {
                                                        report.reportType ||
                                                        '-'
                                                    }
                                                </strong>

                                            </div>


                                            <div className="information-item">

                                                <span>
                                                    Test Date
                                                </span>

                                                <strong>
                                                    {
                                                        report.testDate ||
                                                        '-'
                                                    }
                                                </strong>

                                            </div>


                                            <div className="information-item">

                                                <span>
                                                    Laboratory
                                                </span>

                                                <strong>
                                                    {
                                                        report.laboratoryName ||
                                                        '-'
                                                    }
                                                </strong>

                                            </div>


                                            <div className="information-item">

                                                <span>
                                                    Referring Doctor
                                                </span>

                                                <strong>
                                                    {
                                                        report.referringDoctor ||
                                                        '-'
                                                    }
                                                </strong>

                                            </div>


                                            <div className="information-item">

                                                <span>
                                                    Uploaded At
                                                </span>

                                                <strong>
                                                    {
                                                        report.uploadedAt
                                                            ? new Date(
                                                                report.uploadedAt
                                                            ).toLocaleString()
                                                            : '-'
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    {/* Test Results */}

                                    <div className="test-results-section">

                                        <div className="test-results-heading">

                                            <div>

                                                <h4>
                                                    🩸 Test Results
                                                </h4>

                                                <p>
                                                    Laboratory test values
                                                    and reference ranges.
                                                </p>

                                            </div>

                                            <span className="test-count">

                                                {
                                                    testResults[report.id]
                                                        ?.length || 0
                                                }
                                                {' '}
                                                Test
                                                {
                                                    (
                                                        testResults[
                                                            report.id
                                                            ]?.length || 0
                                                    ) !== 1
                                                        ? 's'
                                                        : ''
                                                }

                                            </span>

                                        </div>


                                        {!testResults[report.id] ? (

                                            <div className="results-loading">
                                                Loading test results...
                                            </div>

                                        ) : testResults[report.id].length === 0 ? (

                                            <div className="no-test-results">
                                                No individual test results
                                                were added to this report.
                                            </div>

                                        ) : (

                                            <div className="table-wrapper">

                                                <table>

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

                                                    {
                                                        testResults[
                                                            report.id
                                                            ].map(
                                                            (result) => (

                                                                <tr
                                                                    key={
                                                                        result.id
                                                                    }
                                                                >

                                                                    <td>

                                                                        <span className="category-badge">
                                                                            {
                                                                                result.category ||
                                                                                '-'
                                                                            }
                                                                        </span>

                                                                    </td>

                                                                    <td>

                                                                        <strong>
                                                                            {
                                                                                result.testName ||
                                                                                '-'
                                                                            }
                                                                        </strong>

                                                                    </td>

                                                                    <td className="result-value">
                                                                        {
                                                                            result.resultValue ||
                                                                            '-'
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            result.unit ||
                                                                            '-'
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            result.referenceRange ||
                                                                            '-'
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            result.notes ||
                                                                            '-'
                                                                        }
                                                                    </td>

                                                                </tr>

                                                            )
                                                        )
                                                    }

                                                    </tbody>

                                                </table>

                                            </div>

                                        )}

                                    </div>


                                    {/* Notes */}

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

                                        <div className="pdf-section">

                                            <div className="pdf-info">

                                                <div className="pdf-icon">
                                                    📄
                                                </div>

                                                <div>

                                                    <h4>
                                                        Medical Report PDF
                                                    </h4>

                                                    <p>
                                                        {
                                                            report.pdfFileName
                                                        }
                                                    </p>

                                                </div>

                                            </div>


                                            <button
                                                className="view-pdf-button"
                                                onClick={() =>
                                                    handleViewPdf(
                                                        report.id
                                                    )
                                                }
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

            </main>

        </div>

    )

}

export default PatientDashboard