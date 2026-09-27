package com.healthreport.healthreportsystem.Controller;

import com.healthreport.healthreportsystem.DTO.AuthResponse;
import com.healthreport.healthreportsystem.Entity.User;
import com.healthreport.healthreportsystem.Service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // =========================
    // SIGNUP
    // =========================

    @PostMapping("/signup")
    public User signup(
            @Valid @RequestBody User user
    ) {

        return userService.saveUser(user);
    }

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public AuthResponse login(
            @RequestBody LoginRequest request
    ) {

        return userService.loginUser(
                request.getEmail(),
                request.getPassword()
        );
    }

    // =========================
    // GET PATIENTS
    // =========================

    @GetMapping("/patients")
    public List<User> getPatients() {

        return userService.getPatients();
    }

    // =========================
    // GET USER BY ID
    // =========================

    @GetMapping("/{id}")
    public User getPatientById(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return userService.getPatientById(
                id,
                authentication
        );
    }

    // =========================
    // LOGIN REQUEST
    // =========================

    public static class LoginRequest {

        private String email;

        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}