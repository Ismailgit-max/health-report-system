package com.healthreport.healthreportsystem.Repository;

import com.healthreport.healthreportsystem.Entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestResultRepository extends JpaRepository<TestResult, Long> {

    List<TestResult> findByReportId(Long reportId);

    List<TestResult> findByCategory(String category);

    List<TestResult> findByReportIdIn(List<Long> reportIds);
}