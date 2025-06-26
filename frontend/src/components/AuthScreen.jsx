import React, { useState, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import { API_URL } from "../api";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserProvider";


const gradientBg = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #5b9cff 30%, #ffe066 70%)",
};


const roles = [
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Employee" },
];


const AuthScreen = ({ isUserAuthenticated }) => {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const { login }  = useContext(UserContext);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab === 0) {
      try {
        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            username: email,
            password: password,
          }),
        });
        const data = await res.json();
        
        if (!res.ok) 
          throw new Error(data.detail || "Login failed");

        if(remember){
          localStorage.setItem("token", data.access_token);
        } else {
          sessionStorage.setItem("token", data.access_token);
        }
        setSnackbar({ open: true, message: "Login successful!", severity: "success" });
        isUserAuthenticated(true);
        
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data));

        login({
          name: data.name,
          role: data.role,
          id: data.id
        }, remember)

        if(data.role === "manager")
          navigate("/manager/dashboard")
        else if(data.role === "employee")
          navigate("/employee/dashboard")

      } catch (err) {
        setSnackbar({ open: true, message: err.message, severity: "error" });
      }
    } else {
      try {
        const res = await fetch(`${API_URL}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            company,
            role,
          }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.detail || "Signup failed");
        setSnackbar({ open: true, message: "Signup successful! Please login.", severity: "success" });
        setTab(0);
      } catch (err) {
        setSnackbar({ open: true, message: err.message, severity: "error" });
      }
    }
  };

  return (
    <Box sx={gradientBg}>
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: 400,
          borderRadius: 3,
          background: "#fff",
        }}
      >
        <Typography
          variant="h5"
          align="center"
          color="#2563eb"
          fontWeight={700}
          fontSize={25}
          letterSpacing={1}
          sx={{
            background: "linear-gradient(210deg, #5b9cff, #ff4f81)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundSize: "200% 200%",
            animation: "shimmer 2s linear infinite",
            "@keyframes shimmer": {
              "0%": { backgroundPosition: "0% 50%" },
              "100%": { backgroundPosition: "100% 50%" },
            },
          }}
          gutterBottom
        >
          Workplace Vibe
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="#ff4f81"
          mb={2}
          fontWeight={500}
        >
          {tab === 0
            ? "Sign in to manage your team feedback"
            : "Create your account to get started"}
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            mb: 2,
            bgcolor: "#ffe8ee",
            color: "#ff4f81",
            border: "1px solid #ff4f81",
            borderRadius: 2,
            "& .Mui-selected": {
              color: "#ffe8ee !important",
              background: "#ff4f81",
              border: "1px solid #ffe8ee",
              borderRadius: 2,
            },
          }}
          TabIndicatorProps={{
            style: {
              display: "none",
            },
          }}
        >
          <Tab label="Login" />
          <Tab label="Sign Up" />
        </Tabs>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          {tab === 1 && (
            <>
              <Typography
                variant="body2"
                fontWeight={500}
                mb={0.5}
                color="#2563eb"
              >
                Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                margin="dense"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                sx={{
                  mb: 2,
                  "&:hover": {
                    borderColor: "#e11d48",
                  },
                }}
              />

              <Typography
                variant="body2"
                fontWeight={500}
                mb={0.5}
                color="#2563eb"
              >
                Company Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                margin="dense"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter your company name"
                sx={{
                  mb: 2,
                  "&:hover": {
                    borderColor: "#e11d48",
                  },
                }}
              />

              <Typography
                variant="body2"
                fontWeight={500}
                mb={0.5}
                color="#2563eb"
              >
                Role
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                margin="dense"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Select your role"
                sx={{
                  mb: 2,
                  "&:hover": {
                    borderColor: "#e11d48",
                  },
                }}
              >
                {roles.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

          <Typography variant="body2" fontWeight={500} mb={0.5} color="#2563eb">
            Email
          </Typography>
          <TextField
            fullWidth
            size="small"
            margin="dense"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            sx={{
              mb: 2,
              "&:hover": {
                borderColor: "#e11d48",
              },
            }}
          />

          <Typography variant="body2" fontWeight={500} mb={0.5} color="#2563eb">
            Password
          </Typography>
          <TextField
            fullWidth
            size="small"
            margin="dense"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            sx={{
              mb: tab === 0 ? 1 : 2,
              "&:hover": {
                borderColor: "#e11d48",
              },
            }}
          />

          {tab === 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  sx={{
                    color: "#2563eb",
                    "&.Mui-checked": { color: "#e11d48" },
                  }}
                />
              }
              label={
                <Typography variant="body2" fontWeight={500} color="#2563eb">
                  Remember me
                </Typography>
              }
              sx={{ mb: 2 }}
            />
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #5b9cff 30%, #ffe066 70%)",
              color: "#fff",
              fontWeight: 600,
              mb: 2,
              mt: 1,
              borderRadius: 2,
              boxShadow: "0 2px 8px #ffe06644",
              transition: "all 0.2s",
            }}
          >
            {tab === 0 ? "Sign In" : "Sign Up"}
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} elevation={6} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AuthScreen;
