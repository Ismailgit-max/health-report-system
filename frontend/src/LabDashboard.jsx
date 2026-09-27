import './LabDashboard.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function LabDashboard() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user'))
    const token = user?.token

    const [patients, setPatients] = useState([])
    const [reports, setReports] = useState([])

    const [loadingPatients, setLoadingPatients] = useState(true)
    const [loadingReports, setLoadingReports] = useState(true)
    const [uploading, setUploading] = useState(false)

    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const [selectedCategory, setSelectedCategory] = useState('Blood')

    const [formData, setFormData] = useState({
        patientId: '',
        reportName: '',
        reportType: '',
        reportStatus: 'Completed',
        testDate: '',
        referringDoctor: '',
        laboratoryName: '',
        notes: ''
    })

    const [testResults, setTestResults] = useState([
        {
            category: 'Blood',
            testName: '',
            resultValue: '',
            unit: '',
            referenceRange: '',
            notes: ''
        }
    ])

    const [pdfFile, setPdfFile] = useState(null)

    const categories = [
        'Blood',
        'Diabetes',
        'Lipid',
        'Liver',
        'Kidney',
        'Thyroid',
        'Urine',
        'Vitals',
        'Other'
    ]

    useEffect(() => {
        fetchPatients()
        fetchReports()
    }, [])

    const fetchPatients = async () => {
        try {
            const response = await fetch(
                'http://localhost:8080/api/users/patients',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (!response.ok) {
                throw new Error('Failed to fetch patients')
            }

            const data = await response.json()
            setPatients(data)
        } catch (error) {
            console.error('Patient fetch error:', error)
            setError('Unable to load patients')
        } finally {
            setLoadingPatients(false)
        }
    }

    const fetchReports = async () => {
        try {
            if (!user?.id) {
                setLoadingReports(false)
                return
            }

            const response = await fetch(
                `http://localhost:8080/api/reports/lab/${user.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (!response.ok) {
                throw new Error('Failed to fetch reports')
            }

            const data = await response.json()
            setReports(data)
        } catch (error) {
            console.error('Report fetch error:', error)
            setError('Unable to load reports')
        } finally {
            setLoadingReports(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }))
    }

    const handleCategoryChange = (category) => {
        setSelectedCategory(category)

        setTestResults([
            {
                category: category,
                testName: '',
                resultValue: '',
                unit: '',
                referenceRange: '',
                notes: ''
            }
        ])
    }

    const handleTestChange = (index, field, value) => {
        setTestResults((previous) => {
            const updatedResults = [...previous]

            updatedResults[index] = {
                ...updatedResults[index],
                [field]: value
            }

            return updatedResults
        })
    }

    const addTestResult = () => {
        setTestResults((previous) => [
            ...previous,
            {
                category: selectedCategory,
                testName: '',
                resultValue: '',
                unit: '',
                referenceRange: '',
                notes: ''
            }
        ])
    }

    const removeTestResult = (index) => {
        if (testResults.length === 1) {
            return
        }

        setTestResults((previous) =>
            previous.filter((_, i) => i !== index)
        )
    }

    const handlePdfChange = (e) => {
        const file = e.target.files[0]

        if (!file) {
            setPdfFile(null)
            return
        }

        if (file.type !== 'application/pdf') {
            setError('Please select a PDF file only')
            e.target.value = ''
            setPdfFile(null)
            return
        }

        setError('')
        setPdfFile(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Important:
        // If an upload is already running, do nothing.
        if (uploading) {
            return
        }

        setMessage('')
        setError('')

        if (!user?.id) {
            setError('Lab technician session not found. Please login again.')
            return
        }

        if (!formData.patientId) {
            setError('Please select a patient')
            return
        }

        if (!formData.reportName.trim()) {
            setError('Please enter the report name')
            return
        }

        if (!formData.reportType.trim()) {
            setError('Please enter the report type')
            return
        }

        if (!formData.testDate) {
            setError('Please select the test date')
            return
        }

        if (!pdfFile) {
            setError('Please upload the medical report PDF')
            return
        }

        // Lock the upload button immediately.
        setUploading(true)

        try {
            const form = new FormData()

            form.append('patientId', formData.patientId)
            form.append('labTechnicianId', user.id)
            form.append('reportName', formData.reportName)
            form.append('reportType', formData.reportType)
            form.append('reportStatus', formData.reportStatus)
            form.append('testDate', formData.testDate)
            form.append('referringDoctor', formData.referringDoctor)
            form.append('laboratoryName', formData.laboratoryName)
            form.append('notes', formData.notes)
            form.append('file', pdfFile)

            console.log('Uploading health report...')

            const response = await fetch(
                'http://localhost:8080/api/reports/upload',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: form
                }
            )

            if (!response.ok) {
                const errorText = await response.text()

                throw new Error(
                    errorText || 'Failed to upload health report'
                )
            }

            const savedReport = await response.json()

            console.log('Health report created:', savedReport)

            // Save individual test results.
            for (const result of testResults) {
                if (!result.testName.trim()) {
                    continue
                }

                const testResponse = await fetch(
                    'http://localhost:8080/api/test-results',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            reportId: savedReport.id,
                            category: result.category,
                            testName: result.testName,
                            resultValue: result.resultValue,
                            unit: result.unit,
                            referenceRange: result.referenceRange,
                            notes: result.notes
                        })
                    }
                )

                if (!testResponse.ok) {
                    const testError = await testResponse.text()

                    throw new Error(
                        testError || 'Failed to save test result'
                    )
                }
            }

            setMessage(
                'Health report uploaded successfully!'
            )

            // Reset report form.
            setFormData({
                patientId: '',
                reportName: '',
                reportType: '',
                reportStatus: 'Completed',
                testDate: '',
                referringDoctor: '',
                laboratoryName: '',
                notes: ''
            })

            // Reset category.
            setSelectedCategory('Blood')

            // Reset test results.
            setTestResults([
                {
                    category: 'Blood',
                    testName: '',
                    resultValue: '',
                    unit: '',
                    referenceRange: '',
                    notes: ''
                }
            ])

            // Reset PDF.
            setPdfFile(null)

            const pdfInput = document.getElementById('pdf-upload')

            if (pdfInput) {
                pdfInput.value = ''
            }

            // Refresh reports.
            await fetchReports()

        } catch (error) {
            console.error('Report upload error:', error)

            setError(
                error.message ||
                'Unable to upload report. Please check the backend.'
            )

        } finally {
            // Unlock the button after the whole process finishes.
            setUploading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('user')
        navigate('/')
    }

    return (
        <div className="lab-dashboard">

            <header className="lab-header">
                <div className="lab-logo">
                    🏥
                    <span>Health Report System</span>
                </div>

                <button
                    className="lab-logout-button"
                    onClick={handleLogout}
                    disabled={uploading}
                >
                    Logout
                </button>
            </header>

            <main className="lab-content">

                <section className="lab-welcome">
                    <h1>
                        Welcome, {user?.fullName} 👋
                    </h1>

                    <p>
                        Create, upload and manage patient health reports.
                    </p>
                </section>

                <section className="lab-stats">

                    <div className="lab-stat-card">
                        <div className="lab-stat-icon">👥</div>

                        <div>
                            <h3>Patients</h3>
                            <p>
                                {loadingPatients
                                    ? '...'
                                    : patients.length}
                            </p>
                        </div>
                    </div>

                    <div className="lab-stat-card">
                        <div className="lab-stat-icon">🧪</div>

                        <div>
                            <h3>My Reports</h3>
                            <p>
                                {loadingReports
                                    ? '...'
                                    : reports.length}
                            </p>
                        </div>
                    </div>

                    <div className="lab-stat-card">
                        <div className="lab-stat-icon">📄</div>

                        <div>
                            <h3>PDF Reports</h3>
                            <p>
                                {reports.filter(
                                    (report) => report.pdfFileName
                                ).length}
                            </p>
                        </div>
                    </div>

                </section>

                <section className="upload-section">

                    <div className="section-title">
                        <h2>Create Health Report</h2>

                        <p>
                            Enter patient test information and upload
                            the official medical PDF.
                        </p>
                    </div>

                    {message && (
                        <div className="success-message">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form
                        className="report-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="form-group">
                            <label>Patient *</label>

                            <select
                                name="patientId"
                                value={formData.patientId}
                                onChange={handleChange}
                                disabled={uploading}
                            >
                                <option value="">
                                    Select Patient
                                </option>

                                {patients.map((patient) => (
                                    <option
                                        key={patient.id}
                                        value={patient.id}
                                    >
                                        {patient.fullName} - {patient.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Report Name *</label>

                            <input
                                type="text"
                                name="reportName"
                                placeholder="Example: Complete Health Checkup"
                                value={formData.reportName}
                                onChange={handleChange}
                                disabled={uploading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Report Type *</label>

                            <input
                                type="text"
                                name="reportType"
                                placeholder="Example: Complete Blood Test"
                                value={formData.reportType}
                                onChange={handleChange}
                                disabled={uploading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Test Date *</label>

                            <input
                                type="date"
                                name="testDate"
                                value={formData.testDate}
                                onChange={handleChange}
                                disabled={uploading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Referring Doctor</label>

                            <input
                                type="text"
                                name="referringDoctor"
                                placeholder="Example: Dr. John Smith"
                                value={formData.referringDoctor}
                                onChange={handleChange}
                                disabled={uploading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Laboratory Name</label>

                            <input
                                type="text"
                                name="laboratoryName"
                                placeholder="Example: Apollo Diagnostics"
                                value={formData.laboratoryName}
                                onChange={handleChange}
                                disabled={uploading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Report Status</label>

                            <select
                                name="reportStatus"
                                value={formData.reportStatus}
                                onChange={handleChange}
                                disabled={uploading}
                            >
                                <option value="Completed">
                                    Completed
                                </option>

                                <option value="Pending">
                                    Pending
                                </option>

                                <option value="Processing">
                                    Processing
                                </option>
                            </select>
                        </div>

                        <div className="category-section">

                            <h3>Test Category</h3>

                            <div className="category-buttons">

                                {categories.map((category) => (
                                    <button
                                        type="button"
                                        key={category}
                                        className={
                                            selectedCategory === category
                                                ? 'category-button active'
                                                : 'category-button'
                                        }
                                        onClick={() =>
                                            handleCategoryChange(category)
                                        }
                                        disabled={uploading}
                                    >
                                        {category}
                                    </button>
                                ))}

                            </div>

                        </div>

                        <div className="test-results-section">

                            <div className="test-results-header">

                                <div>
                                    <h3>
                                        {selectedCategory} Test Results
                                    </h3>

                                    <p>
                                        Add individual test values.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="add-test-button"
                                    onClick={addTestResult}
                                    disabled={uploading}
                                >
                                    + Add Test
                                </button>

                            </div>

                            {testResults.map((result, index) => (

                                <div
                                    className="test-result-row"
                                    key={index}
                                >

                                    <div className="form-group">
                                        <label>Test Name</label>

                                        <input
                                            type="text"
                                            placeholder="Example: Hemoglobin"
                                            value={result.testName}
                                            onChange={(e) =>
                                                handleTestChange(
                                                    index,
                                                    'testName',
                                                    e.target.value
                                                )
                                            }
                                            disabled={uploading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Result</label>

                                        <input
                                            type="text"
                                            placeholder="13.5"
                                            value={result.resultValue}
                                            onChange={(e) =>
                                                handleTestChange(
                                                    index,
                                                    'resultValue',
                                                    e.target.value
                                                )
                                            }
                                            disabled={uploading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Unit</label>

                                        <input
                                            type="text"
                                            placeholder="g/dL"
                                            value={result.unit}
                                            onChange={(e) =>
                                                handleTestChange(
                                                    index,
                                                    'unit',
                                                    e.target.value
                                                )
                                            }
                                            disabled={uploading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Reference Range</label>

                                        <input
                                            type="text"
                                            placeholder="13 - 17"
                                            value={result.referenceRange}
                                            onChange={(e) =>
                                                handleTestChange(
                                                    index,
                                                    'referenceRange',
                                                    e.target.value
                                                )
                                            }
                                            disabled={uploading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Notes</label>

                                        <input
                                            type="text"
                                            placeholder="Normal"
                                            value={result.notes}
                                            onChange={(e) =>
                                                handleTestChange(
                                                    index,
                                                    'notes',
                                                    e.target.value
                                                )
                                            }
                                            disabled={uploading}
                                        />
                                    </div>

                                    {testResults.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-test-button"
                                            onClick={() =>
                                                removeTestResult(index)
                                            }
                                            disabled={uploading}
                                        >
                                            ✕
                                        </button>
                                    )}

                                </div>

                            ))}

                        </div>

                        <div className="form-group full-width">

                            <label>
                                Additional Notes
                            </label>

                            <textarea
                                name="notes"
                                placeholder="Enter additional information about this report..."
                                value={formData.notes}
                                onChange={handleChange}
                                rows="4"
                                disabled={uploading}
                            />

                        </div>

                        <div className="pdf-upload-section">

                            <label>
                                Medical Report PDF *
                            </label>

                            <div className="pdf-upload-box">

                                <div className="pdf-icon">
                                    📄
                                </div>

                                <div>
                                    <h3>
                                        Upload Medical Report
                                    </h3>

                                    <p>
                                        PDF files only
                                    </p>
                                </div>

                                <input
                                    id="pdf-upload"
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={handlePdfChange}
                                    disabled={uploading}
                                />

                            </div>

                            {pdfFile && (
                                <div className="selected-file">
                                    <span>📄</span>

                                    <strong>
                                        {pdfFile.name}
                                    </strong>

                                    <span>
                                        (
                                        {(pdfFile.size / 1024 / 1024).toFixed(2)}
                                        {' '}MB)
                                    </span>
                                </div>
                            )}

                        </div>

                        <button
                            className="upload-button"
                            type="submit"
                            disabled={uploading}
                        >
                            {uploading
                                ? '⏳ Uploading Report...'
                                : '📤 Upload Complete Health Report'}
                        </button>

                    </form>

                </section>

                <section className="my-reports-section">

                    <div className="section-title">

                        <h2>
                            My Uploaded Reports
                        </h2>

                        <p>
                            Health reports uploaded by you.
                        </p>

                    </div>

                    {loadingReports ? (

                        <div className="reports-message">
                            Loading reports...
                        </div>

                    ) : reports.length === 0 ? (

                        <div className="reports-empty">

                            <div className="empty-report-icon">
                                📋
                            </div>

                            <h3>
                                No Reports Yet
                            </h3>

                            <p>
                                Uploaded health reports will appear here.
                            </p>

                        </div>

                    ) : (

                        <div className="reports-table-container">

                            <table className="reports-table">

                                <thead>

                                <tr>
                                    <th>Report</th>
                                    <th>Patient ID</th>
                                    <th>Type</th>
                                    <th>Test Date</th>
                                    <th>Status</th>
                                    <th>PDF</th>
                                </tr>

                                </thead>

                                <tbody>

                                {reports.map((report) => (

                                    <tr key={report.id}>

                                        <td>
                                            {report.reportName}
                                        </td>

                                        <td>
                                            #{report.patientId}
                                        </td>

                                        <td>
                                            {report.reportType}
                                        </td>

                                        <td>
                                            {report.testDate || '-'}
                                        </td>

                                        <td>
                                                <span className="status-badge">
                                                    {report.reportStatus}
                                                </span>
                                        </td>

                                        <td>

                                            {report.pdfFileName ? (

                                                <a
                                                    className="pdf-view-button"
                                                    href={`http://localhost:8080/api/reports/pdf/${report.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    📄 View PDF
                                                </a>

                                            ) : (
                                                '-'
                                            )}

                                        </td>

                                    </tr>

                                ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>
    )
}

export default LabDashboard