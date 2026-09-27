package com.healthreport.healthreportsystem.Service;

import com.healthreport.healthreportsystem.DTO.AuthResponse;
import com.healthreport.healthreportsystem.Entity.User;
import com.healthreport.healthreportsystem.Repository.UserRepository;
import com.healthreport.healthreportsystem.Security.JwtService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "patient",
            "doctor",
            "lab-technician"
    );

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // =========================
    // SIGNUP
    // =========================

    public User saveUser(User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException(
                    "Email is already registered"
            );
        }

        String role = user.getRole();

        if (role == null ||
                !ALLOWED_ROLES.contains(role.toLowerCase())) {

            throw new IllegalArgumentException(
                    "Invalid role. Allowed roles are: patient, doctor, lab-technician"
            );
        }

        user.setRole(role.toLowerCase());

        String encodedPassword =
                passwordEncoder.encode(user.getPassword());

        user.setPassword(encodedPassword);

        return userRepository.save(user);
    }

    // =========================
    // LOGIN
    // =========================

    public AuthResponse loginUser(
            String email,
            String password
    ) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        if (!passwordEncoder.matches(
                password,
                user.getPassword()
        )) {

            throw new RuntimeException(
                    "Invalid password"
            );
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }

    // =========================
    // GET PATIENTS
    // =========================

    public List<User> getPatients() {

        return userRepository.findByRole("patient");
    }

    // =========================
    // GET USER BY ID
    // =========================

    public User getPatientById(
            Long id,
            Authentication authentication
    ) {

        if (authentication == null) {
            throw new AccessDeniedException(
                    "Authentication is required"
            );
        }

        String currentEmail = authentication.getName();

        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Current user not found"
                        )
                );

        String role = currentUser.getRole();

        // Doctor can view patient profiles
        if ("doctor".equalsIgnoreCase(role)) {

            return userRepository.findById(id)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Patient not found"
                            )
                    );
        }

        // Patient can view only their own profile
        if ("patient".equalsIgnoreCase(role)) {

            if (!currentUser.getId().equals(id)) {
                throw new AccessDeniedException(
                        "You are not allowed to access another patient's profile"
                );
            }

            return currentUser;
        }

        // Lab technicians cannot access this endpoint
        throw new AccessDeniedException(
                "You are not allowed to access patient profiles"
        );
    }
}