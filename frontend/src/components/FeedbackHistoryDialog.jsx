import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { UserContext } from "../context/UserProvider";
import { getTokenCookie, API_URL } from "../api";

const sentimentOptions = [
  { value: "Positive", label: "Positive" },
  { value: "Neutral", label: "Neutral" },
  { value: "Negative", label: "Negative" },
];

export default function FeedbackHistoryDialog({ open, onClose, feedbacks }) {
  const { user } = useContext(UserContext);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleEditClick = (fb) => {
    setEditId(fb.id);
    setEditData({
      strengths: fb.strengths,
      improvement: fb.improvement,
      sentiment: fb.sentiment,
      tags: fb.tags ? fb.tags.join(", ") : "",
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (fb) => {
    const res = await fetch(`${API_URL}/feedback/${fb.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getTokenCookie()}`,
      },
      body: JSON.stringify({
        strengths: editData.strengths,
        improvement: editData.improvement,
        sentiment: editData.sentiment,
        tags: editData.tags.split(",").map((t) => t.trim()),
      }),
    });
    if (res.ok) {
      setEditId(null);
      if (typeof onClose === "function") onClose();
    }
  };

  const handleExportPDF = async (fb) => {
    try {
      const res = await fetch(`${API_URL}/feedback/${fb.id}/export-pdf`, {
        headers: {
          Authorization: `Bearer ${getTokenCookie()}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to export PDF");
      }
      const blob = await res.blob();
      let filename = `feedback_from_${fb.given_by}_to_${fb.member}.pdf`;
      const disposition = res.headers.get("Content-Disposition");
      if (disposition && disposition.indexOf("filename=") !== -1) {
        filename = disposition.split("filename=")[1].replace(/['"]/g, "");
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#FEF7F2",
          color: "#ED5F00",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Feedback History
        <IconButton onClick={onClose} size="small" sx={{ color: "#ED5F00" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: "#FEF7F2", minHeight: 400 }}>
        {!feedbacks || feedbacks.length === 0 ? (
          <Typography color="text.secondary" align="center" mt={4}>
            No feedbacks yet.
          </Typography>
        ) : (
          feedbacks.map((fb) => (
            <Paper
              key={fb.id}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#fcf4f4",
                color: "#000",
                mb: 4,
                border: "2px solid #ED5F00",
                boxShadow: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography fontSize={13} color="#888">
                  {user?.role === "manager"
                    ? `Employee: ${fb.member}`
                    : `From: ${fb.given_by}`}
                </Typography>
                <Typography
                  fontSize={14}
                  fontWeight={600}
                  color={
                    fb.sentiment === "Positive"
                      ? "#22c55e"
                      : fb.sentiment === "Negative"
                      ? "#ff4f81"
                      : "#ffe066"
                  }
                >
                  ● {fb.sentiment}
                </Typography>
              </Box>
              {editId === fb.id ? (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Strengths"
                    name="strengths"
                    value={editData.strengths}
                    onChange={handleEditChange}
                    fullWidth
                    margin="dense"
                  />
                  <TextField
                    label="Improvement"
                    name="improvement"
                    value={editData.improvement}
                    onChange={handleEditChange}
                    fullWidth
                    margin="dense"
                  />
                  <TextField
                    select
                    label="Sentiment"
                    name="sentiment"
                    value={editData.sentiment}
                    onChange={handleEditChange}
                    fullWidth
                    margin="dense"
                  >
                    {sentimentOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Tags (comma separated)"
                    name="tags"
                    value={editData.tags}
                    onChange={handleEditChange}
                    fullWidth
                    margin="dense"
                  />
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleEditSave(fb)}
                    >
                      Save
                    </Button>
                    <Button variant="outlined" onClick={() => setEditId(null)}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Typography mb={2}>
                    <b>Strengths:</b> {fb.strengths}
                    <br />
                    <b>Improvement:</b> {fb.improvement}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    {fb.tags &&
                      fb.tags.map((tag, idx) => (
                        <Button
                          key={idx}
                          size="small"
                          variant="outlined"
                          sx={{
                            bgcolor: "#f7f5fd",
                            color: "#2b2a61",
                            borderColor: "#2b216a",
                            borderRadius: 6,
                            fontWeight: 600,
                            px: 1.5,
                            py: 0.25,
                            pointerEvents: "none",
                          }}
                        >
                          {tag}
                        </Button>
                      ))}
                  </Box>
                </>
              )}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography fontSize={13} color="#888">
                  {(() => {
                    const d = new Date(fb.created_at);
                    return isNaN(d) ? "N/A" : d.toLocaleString();
                  })()}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 6,
                      fontWeight: 600,
                      color: "#9C2BAD",
                      borderColor: "#9C2BAD",
                    }}
                    onClick={() => handleExportPDF(fb)}
                  >
                    Export as PDF
                  </Button>
                  {user?.role === "manager" && (
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        borderRadius: 6,
                        fontWeight: 600,
                        bgcolor: "#FFC53D",
                        color: "#fff",
                        boxShadow: "none",
                        px: 2,
                        py: 0.5,
                      }}
                      onClick={() => handleEditClick(fb)}
                    >
                      Edit
                    </Button>
                  )}
                </Box>
              </Box>
              {fb.acknowledged && (
                <Typography fontSize={13} color="#22c55e" fontWeight={600}>
                  Acknowledged
                </Typography>
              )}
            </Paper>
          ))
        )}
      </DialogContent>
    </Dialog>
  );
}
