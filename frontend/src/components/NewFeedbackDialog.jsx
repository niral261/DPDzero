import React, { useState, useContext } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import { UserContext } from "../context/UserProvider";
import { API_URL, getTokenCookie } from "../api";

function NewFeedbackDialog({ open, onClose, team, employeeId }) {
  const { user } = useContext(UserContext);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [member, setMember] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvement, setImprovement] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [tags, setTags] = useState([]);

  const tagOptions = [
    "Communication",
    "Leadership",
    "Technical Skills",
    "Teamwork",
    "Problem Solving",
    "Creativity",
    "Time Management",
  ];

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async () => {
    if (!member || !strengths || !improvement || !sentiment) {
      setSnackbar({
        open: true,
        message: "Please fill all the fields apart from Tags",
        severity: "error",
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getTokenCookie()}`,
        },
        body: JSON.stringify({
          member,
          strengths,
          improvement,
          sentiment,
          tags,
          given_by: user.id,
          acknowledged: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to submit feedback");
      else {
        await fetch(`${API_URL}/feedback_request/complete`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getTokenCookie()}`,
          },
          body: JSON.stringify({ employee: member, manager_id: user.id }),
        });
      }
      setMember("");
      setStrengths("");
      setImprovement("");
      setSentiment("");
      setTags([]);
      onClose();
      setSnackbar({
        open: true,
        message: "Feedback submitted!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: "0 4px 24px #2563eb22",
          background: "#fff",
          width: 440,
          minWidth: 0,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: "#ff4f81",
          textAlign: "center",
          borderRadius: 3,
          pb: 1,
        }}
      >
        New Feedback
      </DialogTitle>
      <DialogContent dividers sx={{ borderRadius: 3, bgcolor: "#f9fafe" }}>
        <FormControl fullWidth required margin="dense">
          <InputLabel>Select Team Member</InputLabel>
          <Select
            value={member}
            onChange={(e) => setMember(e.target.value)}
            label="Select Team Member"
            sx={{ borderRadius: 2 }}
          >
            {team.map((m) => (
              <MenuItem key={m.name} value={m.name}>
                {m.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Choose a team member...</FormHelperText>
        </FormControl>
        <TextField
          label="Strengths"
          placeholder="What does this team member do exceptionally well?"
          fullWidth
          multiline
          rows={3}
          margin="dense"
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          sx={{ borderRadius: 2, mb: 2 }}
        />
        <TextField
          label="Areas for Improvement"
          placeholder="What areas could benefit from development?"
          fullWidth
          multiline
          rows={3}
          margin="dense"
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
          sx={{ borderRadius: 2, mb: 2 }}
        />
        <Box mt={2} mb={1}>
          <Typography color="#808080">Overall Sentiment</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          {["Positive", "Neutral", "Negative"].map((opt) => (
            <Button
              key={opt}
              variant={sentiment === opt ? "contained" : "outlined"}
              color={
                opt === "Positive"
                  ? "success"
                  : opt === "Neutral"
                  ? "warning"
                  : "error"
              }
              onClick={() => setSentiment(opt)}
            >
              {opt}
            </Button>
          ))}
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography mb={1} color="#808080">
            Tags
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {tagOptions.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                clickable
                variant={tags.includes(tag) ? "filled" : "outlined"}
                onClick={() => {
                  if (tags.includes(tag))
                    setTags(tags.filter((t) => t !== tag));
                  else setTags([...tags, tag]);
                }}
                sx={{
                  borderRadius: "16px",
                  borderColor: "#2563eb",
                  background: tags.includes(tag)
                    ? "linear-gradient(135deg, #2563eb, #ff4f81)"
                    : "#fff",
                  color: tags.includes(tag) ? "#fff" : "#808080",
                  "&:hover": {
                    backgroundColor: tags.includes(tag) ? "#1746a2" : "#f0f8ff",
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 2, color: "#2563eb", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            borderRadius: 2,
            bgcolor: "#ff4f81",
            color: "#fff",
            fontWeight: 600,
            boxShadow: "0 2px 8px #ff4f8144",
            "&:hover": { bgcolor: "#2563eb" },
          }}
        >
          Submit Feedback
        </Button>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
            elevation={6}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </DialogActions>
    </Dialog>
  );
}

export default NewFeedbackDialog;
