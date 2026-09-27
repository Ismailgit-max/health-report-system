package com.healthreport.healthreportsystem.Repository;

import com.healthreport.healthreportsystem.Entity.HealthReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthReportRepository
        extends JpaRepository<HealthReport, Long> {

    List<HealthReport> findByPatientId(Long patientId);

    List<HealthReport> findByLabTechnicianId(Long labTechnicianId);
}