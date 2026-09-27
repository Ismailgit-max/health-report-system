package com.healthreport.healthreportsystem.Controller;

import com.healthreport.healthreportsystem.Entity.TestResult;
import com.healthreport.healthreportsystem.Service.TestResultService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-results")
@CrossOrigin(origins = "http://localhost:5173")
public class TestResultController {

    private final TestResultService testResultService;

    public TestResultController(TestResultService testResultService) {
        this.testResultService = testResultService;
    }

    @PostMapping
    public TestResult createTestResult(
            @RequestBody TestResult testResult,
            Authentication authentication
    ) {
        return testResultService.createTestResult(
                testResult,
                authentication
        );
    }

    @GetMapping("/report/{reportId}")
    public List<TestResult> getResultsByReportId(
            @PathVariable Long reportId,
            Authentication authentication
    ) {
        return testResultService.getResultsByReportId(
                reportId,
                authentication
        );
    }

    // =========================
    // GET RESULTS BY PATIENT
    // =========================

    @GetMapping("/patient/{patientId}")
    public List<TestResult> getResultsByPatientId(
            @PathVariable Long patientId,
            Authentication authentication
    ) {
        return testResultService.getResultsByPatientId(
                patientId,
                authentication
        );
    }

    @GetMapping("/category/{category}")
    public List<TestResult> getResultsByCategory(
            @PathVariable String category,
            Authentication authentication
    ) {
        return testResultService.getResultsByCategory(
                category,
                authentication
        );
    }

    @GetMapping("/{id}")
    public TestResult getTestResultById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return testResultService.getTestResultById(
                id,
                authentication
        );
    }

    @DeleteMapping("/{id}")
    public String deleteTestResult(
            @PathVariable Long id,
            Authentication authentication
    ) {
        testResultService.deleteTestResult(
                id,
                authentication
        );

        return "Test result deleted successfully";
    }
}