package com.healthreport.healthreportsystem.Entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_reports")
public class HealthReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;

    private Long labTechnicianId;

    private String reportName;

    private String reportType;

    private String reportStatus;

    private LocalDate testDate;

    private String referringDoctor;

    private String laboratoryName;

    @Column(length = 2000)
    private String notes;

    private String pdfFileName;

    private String pdfFilePath;

    private LocalDateTime uploadedAt;

    public HealthReport() {
    }

    public HealthReport(
            Long id,
            Long patientId,
            Long labTechnicianId,
            String reportName,
            String reportType,
            String reportStatus,
            LocalDate testDate,
            String referringDoctor,
            String laboratoryName,
            String notes,
            String pdfFileName,
            String pdfFilePath,
            LocalDateTime uploadedAt
    ) {
        this.id = id;
        this.patientId = patientId;
        this.labTechnicianId = labTechnicianId;
        this.reportName = reportName;
        this.reportType = reportType;
        this.reportStatus = reportStatus;
        this.testDate = testDate;
        this.referringDoctor = referringDoctor;
        this.laboratoryName = laboratoryName;
        this.notes = notes;
        this.pdfFileName = pdfFileName;
        this.pdfFilePath = pdfFilePath;
        this.uploadedAt = uploadedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getLabTechnicianId() {
        return labTechnicianId;
    }

    public void setLabTechnicianId(Long labTechnicianId) {
        this.labTechnicianId = labTechnicianId;
    }

    public String getReportName() {
        return reportName;
    }

    public void setReportName(String reportName) {
        this.reportName = reportName;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getReportStatus() {
        return reportStatus;
    }

    public void setReportStatus(String reportStatus) {
        this.reportStatus = reportStatus;
    }

    public LocalDate getTestDate() {
        return testDate;
    }

    public void setTestDate(LocalDate testDate) {
        this.testDate = testDate;
    }

    public String getReferringDoctor() {
        return referringDoctor;
    }

    public void setReferringDoctor(String referringDoctor) {
        this.referringDoctor = referringDoctor;
    }

    public String getLaboratoryName() {
        return laboratoryName;
    }

    public void setLaboratoryName(String laboratoryName) {
        this.laboratoryName = laboratoryName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getPdfFileName() {
        return pdfFileName;
    }

    public void setPdfFileName(String pdfFileName) {
        this.pdfFileName = pdfFileName;
    }

    public String getPdfFilePath() {
        return pdfFilePath;
    }

    public void setPdfFilePath(String pdfFilePath) {
        this.pdfFilePath = pdfFilePath;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}