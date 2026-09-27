package com.healthreport.healthreportsystem.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDirectory =
            Paths.get("uploads/health-reports");

    public FileStorageService() {
        try {
            Files.createDirectories(uploadDirectory);
        } catch (IOException e) {
            throw new RuntimeException(
                    "Could not create upload directory",
                    e
            );
        }
    }

    public String storePdf(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("PDF file is required");
        }

        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null ||
                !originalFileName.toLowerCase().endsWith(".pdf")) {

            throw new RuntimeException(
                    "Only PDF files are allowed"
            );
        }

        String storedFileName =
                UUID.randomUUID() + ".pdf";

        try {

            Path targetLocation =
                    uploadDirectory.resolve(storedFileName);

            Files.copy(
                    file.getInputStream(),
                    targetLocation,
                    StandardCopyOption.REPLACE_EXISTING
            );

            return storedFileName;

        } catch (IOException e) {

            throw new RuntimeException(
                    "Could not store PDF file",
                    e
            );
        }
    }
}