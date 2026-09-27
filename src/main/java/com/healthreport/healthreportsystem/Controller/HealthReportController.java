package com.healthreport.healthreportsystem.Controller;

import com.healthreport.healthreportsystem.Entity.HealthReport;
import com.healthreport.healthreportsystem.Service.FileStorageService;
import com.healthreport.healthreportsystem.Service.HealthReportService;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:5173")
public class HealthReportController {

    private final HealthReportService healthReportService;
    private final FileStorageService fileStorageService;

    public HealthReportController(
            HealthReportService healthReportService,
            FileStorageService fileStorageService
    ) {
        this.healthReportService = healthReportService;
        this.fileStorageService = fileStorageService;
    }

    // =========================================================
    // UPLOAD REPORT
    // =========================================================

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadReport(

            @RequestParam("patientId")
            Long patientId,

            @RequestParam("reportName")
            String reportName,

            @RequestParam("reportType")
            String reportType,

            @RequestParam("reportStatus")
            String reportStatus,

            @RequestParam("testDate")
            String testDate,

            @RequestParam(
                    value = "referringDoctor",
                    required = false
            )
            String referringDoctor,

            @RequestParam(
                    value = "laboratoryName",
                    required = false
            )
            String laboratoryName,

            @RequestParam(
                    value = "notes",
                    required = false
            )
            String notes,

            @RequestParam("file")
            MultipartFile file
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication required");
        }

        String role =
                authentication
                        .getAuthorities()
                        .stream()
                        .findFirst()
                        .map(authority ->
                                authority.getAuthority()
                        )
                        .orElse("");

        // Only lab technicians can upload reports
        if (!role.equals("ROLE_LAB-TECHNICIAN")) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "Only lab technicians can upload reports"
                    );
        }

        // Get logged-in lab technician ID
        Long loggedInUserId =
                extractUserIdFromAuthentication();

        if (loggedInUserId == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("User ID not found");
        }

        String storedFileName =
                fileStorageService.storePdf(file);

        HealthReport report = new HealthReport();

        report.setPatientId(patientId);

        // IMPORTANT:
        // Lab technician ID comes from authenticated user.
        report.setLabTechnicianId(loggedInUserId);

        report.setReportName(reportName);
        report.setReportType(reportType);
        report.setReportStatus(reportStatus);

        report.setTestDate(
                LocalDate.parse(testDate)
        );

        report.setReferringDoctor(referringDoctor);
        report.setLaboratoryName(laboratoryName);
        report.setNotes(notes);

        report.setPdfFileName(
                file.getOriginalFilename()
        );

        report.setPdfFilePath(storedFileName);

        return ResponseEntity.ok(
                healthReportService.createReport(report)
        );
    }

    // =========================================================
    // GET ALL REPORTS
    // =========================================================

    @GetMapping
    public ResponseEntity<?> getAllReports() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication required");
        }

        String role = getCurrentRole();

        /*
         * Only doctors can access the complete
         * collection of health reports.
         */
        if (!role.equals("ROLE_DOCTOR")) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "Only doctors can access all reports"
                    );
        }

        return ResponseEntity.ok(
                healthReportService.getAllReports()
        );
    }

    // =========================================================
    // GET SINGLE REPORT
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getReportById(
            @PathVariable Long id
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication required");
        }

        HealthReport report;

        try {

            report =
                    healthReportService.getReportById(id);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Health report not found");
        }

        if (!isAllowedToAccessReport(report)) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "You are not allowed to access this report"
                    );
        }

        return ResponseEntity.ok(report);
    }

    // =========================================================
    // GET REPORTS BY PATIENT
    // =========================================================

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getReportsByPatientId(
            @PathVariable Long patientId
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication required");
        }

        String role = getCurrentRole();

        /*
         * Patients can only access their own reports.
         */
        if (role.equals("ROLE_PATIENT")) {

            Long loggedInUserId =
                    extractUserIdFromAuthentication();

            if (loggedInUserId == null) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("User ID not found");
            }

            if (!loggedInUserId.equals(patientId)) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(
                                "You are not allowed to access another patient's reports"
                        );
            }
        }

        /*
         * Doctors can access patient reports.
         *
         * Lab technicians are not allowed to use
         * this endpoint.
         */
        if (role.equals("ROLE_LAB-TECHNICIAN")) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "Lab technicians must access their own uploaded reports"
                    );
        }

        if (!role.equals("ROLE_DOCTOR") &&
                !role.equals("ROLE_PATIENT")) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "You are not allowed to access patient reports"
                    );
        }

        return ResponseEntity.ok(
                healthReportService
                        .getReportsByPatientId(patientId)
        );
    }

    // =========================================================
    // GET REPORTS BY LAB TECHNICIAN
    // =========================================================

    @GetMapping("/lab/{labTechnicianId}")
    public ResponseEntity<?> getReportsByLabTechnicianId(
            @PathVariable Long labTechnicianId
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication required");
        }

        String role = getCurrentRole();

        /*
         * Only lab technicians can use this endpoint.
         */
        if (!role.equals("ROLE_LAB-TECHNICIAN")) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "Only lab technicians can access lab reports"
                    );
        }

        Long loggedInUserId =
                extractUserIdFromAuthentication();

        if (loggedInUserId == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("User ID not found");
        }

        /*
         * Technician can only access
         * their own uploaded reports.
         */
        if (!loggedInUserId.equals(labTechnicianId)) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "You are not allowed to access another technician's reports"
                    );
        }

        return ResponseEntity.ok(
                healthReportService
                        .getReportsByLabTechnicianId(
                                labTechnicianId
                        )
        );
    }

    // =========================================================
    // VIEW PDF
    // =========================================================

    @GetMapping("/pdf/{id}")
    public ResponseEntity<?> viewPdf(
            @PathVariable Long id
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication required");
        }

        HealthReport report;

        try {

            report =
                    healthReportService.getReportById(id);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Health report not found");
        }

        /*
         * Check authorization BEFORE
         * giving access to the PDF.
         */
        if (!isAllowedToAccessReport(report)) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "You are not allowed to access this PDF"
                    );
        }

        try {

            Path filePath = Paths.get(
                    "uploads/health-reports",
                    report.getPdfFilePath()
            );

            Resource resource =
                    new UrlResource(
                            filePath.toUri()
                    );

            if (!resource.exists()) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("PDF file not found");
            }

            return ResponseEntity
                    .ok()
                    .contentType(
                            MediaType.APPLICATION_PDF
                    )
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" +
                                    report.getPdfFileName() +
                                    "\""
                    )
                    .body(resource);

        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to open PDF");
        }
    }

    // =========================================================
    // DELETE REPORT
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(
            @PathVariable Long id
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication required");
        }

        HealthReport report;

        try {

            report =
                    healthReportService.getReportById(id);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Health report not found");
        }

        String role = getCurrentRole();

        /*
         * Doctors can delete reports.
         */
        if (role.equals("ROLE_DOCTOR")) {

            healthReportService.deleteReport(id);

            return ResponseEntity.ok(
                    "Health report deleted successfully"
            );
        }

        /*
         * Lab technician can delete only
         * reports uploaded by themselves.
         */
        if (role.equals("ROLE_LAB-TECHNICIAN")) {

            Long loggedInUserId =
                    extractUserIdFromAuthentication();

            if (loggedInUserId == null) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("User ID not found");
            }

            if (!loggedInUserId.equals(
                    report.getLabTechnicianId()
            )) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(
                                "You are not allowed to delete another technician's report"
                        );
            }

            healthReportService.deleteReport(id);

            return ResponseEntity.ok(
                    "Health report deleted successfully"
            );
        }

        /*
         * Patients cannot delete health reports.
         */
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(
                        "You are not allowed to delete reports"
                );
    }

    // =========================================================
    // CHECK REPORT ACCESS
    // =========================================================

    private boolean isAllowedToAccessReport(
            HealthReport report
    ) {

        String role = getCurrentRole();

        /*
         * Doctor:
         * Can access patient reports.
         */
        if (role.equals("ROLE_DOCTOR")) {
            return true;
        }

        /*
         * Patient:
         * Can access only their own reports.
         */
        if (role.equals("ROLE_PATIENT")) {

            Long loggedInUserId =
                    extractUserIdFromAuthentication();

            if (loggedInUserId == null) {
                return false;
            }

            return loggedInUserId.equals(
                    report.getPatientId()
            );
        }

        /*
         * Lab Technician:
         * Can access only reports uploaded
         * by themselves.
         */
        if (role.equals("ROLE_LAB-TECHNICIAN")) {

            Long loggedInUserId =
                    extractUserIdFromAuthentication();

            if (loggedInUserId == null) {
                return false;
            }

            return loggedInUserId.equals(
                    report.getLabTechnicianId()
            );
        }

        return false;
    }

    // =========================================================
    // GET CURRENT USER ROLE
    // =========================================================

    private String getCurrentRole() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null) {
            return "";
        }

        return authentication
                .getAuthorities()
                .stream()
                .findFirst()
                .map(authority ->
                        authority.getAuthority()
                )
                .orElse("");
    }

    // =========================================================
    // GET CURRENT USER ID
    // =========================================================

    private Long extractUserIdFromAuthentication() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null) {
            return null;
        }

        String email =
                authentication.getName();

        return healthReportService
                .getUserIdByEmail(email);
    }
}