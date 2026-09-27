package com.healthreport.healthreportsystem.Service;

import com.healthreport.healthreportsystem.Entity.HealthReport;
import com.healthreport.healthreportsystem.Entity.TestResult;
import com.healthreport.healthreportsystem.Entity.User;
import com.healthreport.healthreportsystem.Repository.HealthReportRepository;
import com.healthreport.healthreportsystem.Repository.TestResultRepository;
import com.healthreport.healthreportsystem.Repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestResultService {

    private final TestResultRepository testResultRepository;
    private final HealthReportRepository healthReportRepository;
    private final UserRepository userRepository;

    public TestResultService(
            TestResultRepository testResultRepository,
            HealthReportRepository healthReportRepository,
            UserRepository userRepository
    ) {
        this.testResultRepository = testResultRepository;
        this.healthReportRepository = healthReportRepository;
        this.userRepository = userRepository;
    }

    // =========================
    // CREATE TEST RESULT
    // =========================

    public TestResult createTestResult(
            TestResult testResult,
            Authentication authentication
    ) {

        String role = getCurrentRole(authentication);
        Long currentUserId = getCurrentUserId(authentication);

        // TEMPORARY DEBUG

        if (!"LAB-TECHNICIAN".equals(role)) {
            throw new AccessDeniedException(
                    "Only lab technicians can add test results"
            );
        }

        if (testResult.getReportId() == null) {
            throw new IllegalArgumentException(
                    "reportId is required"
            );
        }

        HealthReport report = getReport(testResult.getReportId());

        System.out.println("DEBUG REPORT LAB TECHNICIAN ID = "
                + report.getLabTechnicianId());

        if (!currentUserId.equals(report.getLabTechnicianId())) {
            throw new AccessDeniedException(
                    "You are not allowed to add results to this report"
            );
        }

        return testResultRepository.save(testResult);
    }

    // =========================
    // GET RESULTS BY REPORT
    // =========================

    public List<TestResult> getResultsByReportId(
            Long reportId,
            Authentication authentication
    ) {

        HealthReport report = getReport(reportId);

        checkReportAccess(report, authentication);

        return testResultRepository.findByReportId(reportId);
    }

    // =========================
    // GET RESULTS BY PATIENT
    // =========================

    public List<TestResult> getResultsByPatientId(
            Long patientId,
            Authentication authentication
    ) {

        String role = getCurrentRole(authentication);
        Long currentUserId = getCurrentUserId(authentication);

        if ("PATIENT".equals(role)) {

            if (!currentUserId.equals(patientId)) {
                throw new AccessDeniedException(
                        "You are not allowed to access another patient's test results"
                );
            }
        }

        if (!"PATIENT".equals(role)
                && !"DOCTOR".equals(role)) {

            throw new AccessDeniedException(
                    "You are not allowed to access patient test results"
            );
        }

        List<HealthReport> reports =
                healthReportRepository.findByPatientId(patientId);

        List<Long> reportIds = reports.stream()
                .map(HealthReport::getId)
                .toList();

        if (reportIds.isEmpty()) {
            return List.of();
        }

        return testResultRepository.findByReportIdIn(reportIds);
    }

    // =========================
    // GET RESULTS BY CATEGORY
    // =========================

    public List<TestResult> getResultsByCategory(
            String category,
            Authentication authentication
    ) {

        String role = getCurrentRole(authentication);

        if ("DOCTOR".equals(role)) {
            return testResultRepository.findByCategory(category);
        }

        throw new AccessDeniedException(
                "You are not allowed to access test results by category"
        );
    }

    // =========================
    // GET TEST RESULT BY ID
    // =========================

    public TestResult getTestResultById(
            Long id,
            Authentication authentication
    ) {

        TestResult testResult = testResultRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Test result not found")
                );

        HealthReport report = getReport(testResult.getReportId());

        checkReportAccess(report, authentication);

        return testResult;
    }

    // =========================
    // DELETE TEST RESULT
    // =========================

    public void deleteTestResult(
            Long id,
            Authentication authentication
    ) {

        TestResult testResult = testResultRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Test result not found")
                );

        HealthReport report = getReport(testResult.getReportId());

        String role = getCurrentRole(authentication);
        Long currentUserId = getCurrentUserId(authentication);

        if ("PATIENT".equals(role)) {
            throw new AccessDeniedException(
                    "Patients are not allowed to delete test results"
            );
        }

        if ("LAB-TECHNICIAN".equals(role)) {

            if (!currentUserId.equals(report.getLabTechnicianId())) {
                throw new AccessDeniedException(
                        "You are not allowed to delete this test result"
                );
            }
        }

        if (!"DOCTOR".equals(role)
                && !"LAB-TECHNICIAN".equals(role)) {

            throw new AccessDeniedException(
                    "You are not allowed to delete test results"
            );
        }

        testResultRepository.deleteById(id);
    }

    // =========================
    // GET REPORT
    // =========================

    private HealthReport getReport(Long reportId) {

        if (reportId == null) {
            throw new IllegalArgumentException(
                    "Report ID cannot be null"
            );
        }

        return healthReportRepository.findById(reportId)
                .orElseThrow(() ->
                        new RuntimeException("Health report not found")
                );
    }

    // =========================
    // REPORT ACCESS CHECK
    // =========================

    private void checkReportAccess(
            HealthReport report,
            Authentication authentication
    ) {

        String role = getCurrentRole(authentication);
        Long currentUserId = getCurrentUserId(authentication);

        if ("DOCTOR".equals(role)) {
            return;
        }

        if ("PATIENT".equals(role)) {

            if (currentUserId.equals(report.getPatientId())) {
                return;
            }

            throw new AccessDeniedException(
                    "You are not allowed to access another patient's reports"
            );
        }

        if ("LAB-TECHNICIAN".equals(role)) {

            if (currentUserId.equals(report.getLabTechnicianId())) {
                return;
            }

            throw new AccessDeniedException(
                    "You are not allowed to access this report's test results"
            );
        }

        throw new AccessDeniedException(
                "You are not allowed to access test results"
        );
    }

    // =========================
    // GET CURRENT USER ID
    // =========================

    private Long getCurrentUserId(
            Authentication authentication
    ) {

        if (authentication == null) {
            throw new AccessDeniedException(
                    "Authentication is required"
            );
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found: " + email
                        )
                );

        return user.getId();
    }

    // =========================
    // GET CURRENT ROLE
    // =========================

    private String getCurrentRole(
            Authentication authentication
    ) {

        if (authentication == null) {
            throw new AccessDeniedException(
                    "Authentication is required"
            );
        }

        return authentication.getAuthorities()
                .stream()
                .findFirst()
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "User role not found"
                        )
                )
                .getAuthority()
                .replace("ROLE_", "")
                .toUpperCase();
    }
}