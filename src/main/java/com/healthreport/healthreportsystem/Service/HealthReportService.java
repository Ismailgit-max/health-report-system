package com.healthreport.healthreportsystem.Service;

import com.healthreport.healthreportsystem.Entity.HealthReport;
import com.healthreport.healthreportsystem.Entity.User;
import com.healthreport.healthreportsystem.Repository.HealthReportRepository;
import com.healthreport.healthreportsystem.Repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class HealthReportService {

    private final HealthReportRepository healthReportRepository;
    private final UserRepository userRepository;

    public HealthReportService(
            HealthReportRepository healthReportRepository,
            UserRepository userRepository
    ) {
        this.healthReportRepository = healthReportRepository;
        this.userRepository = userRepository;
    }

    public HealthReport createReport(HealthReport report) {

        report.setUploadedAt(LocalDateTime.now());

        if (report.getReportStatus() == null ||
                report.getReportStatus().isBlank()) {

            report.setReportStatus("Completed");
        }

        return healthReportRepository.save(report);
    }

    public List<HealthReport> getReportsByPatientId(Long patientId) {

        return healthReportRepository.findByPatientId(patientId);
    }

    public List<HealthReport> getReportsByLabTechnicianId(
            Long labTechnicianId
    ) {

        return healthReportRepository
                .findByLabTechnicianId(labTechnicianId);
    }

    public List<HealthReport> getAllReports() {

        return healthReportRepository.findAll();
    }

    public HealthReport getReportById(Long id) {

        return healthReportRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Health report not found")
                );
    }

    public void deleteReport(Long id) {

        healthReportRepository.deleteById(id);
    }

    public Long getUserIdByEmail(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return user.getId();
    }
}