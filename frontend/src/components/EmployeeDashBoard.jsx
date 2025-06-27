import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Paper, Button, Snackbar, Alert } from "@mui/material";
import HeaderBar from "./HeaderBar";
import VerticalSidebar from "./VerticalSidebar";
import { UserContext } from "../context/UserProvider";
import { API_URL, getTokenCookie } from "../api";
import FeedbackHistoryDialog from "./FeedbackHistoryDialog";

export default function EmployeeDashboard() {
  const { user, logout } = useContext(UserContext);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [feedbacksError, setFeedbacksError] = useState(null);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);
  const [summary, setSummary] = useState({
    feedbackReceived: 0,
    pendingAck: 0,
    ackRate: 0,
    avgSentiment: 0,
    loading: true,
  });
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchSummary = async () => {
    if (!user || !user.id) return;
    setSummary((s) => ({ ...s, loading: true }));
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getTokenCookie()}`,
      };
      const [
        feedbackReceivedRes,
        pendingAckRes,
        ackRateRes,
        avgSentimentRes,
      ] = await Promise.all([
        fetch(`${API_URL}/employee/${user.id}/feedbacks/count`, { headers }),
        fetch(`${API_URL}/employee/${user.id}/feedbacks/pending-ack`, { headers }),
        fetch(`${API_URL}/employee/${user.id}/feedbacks/ack-rate`, { headers }),
        fetch(`${API_URL}/employee/${user.id}/feedbacks/average-sentiment`, { headers }),
      ]);
      const feedbackReceived = (await feedbackReceivedRes.json()).feedback_received || 0;
      const pendingAck = (await pendingAckRes.json()).pending_acknowledgments || 0;
      const ackRate = (await ackRateRes.json()).acknowledgment_rate || 0;
      const avgSentiment = (await avgSentimentRes.json()).average_sentiment || 0;
      setSummary({
        feedbackReceived,
        pendingAck,
        ackRate,
        avgSentiment,
        loading: false,
      });
    } catch (err) {
      setSummary((summary) => ({ ...summary, loading: false }));
    }
  };

  const fetchFeedbacks = async () => {
    if (!user || !user.name) return;
    setLoadingFeedbacks(true);
    try {
      const res = await fetch(
        `${API_URL}/employee/${encodeURIComponent(user.name)}/feedbacks`,
        {
          headers: {
            Authorization: `Bearer ${getTokenCookie()}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch feedbacks");
      setFeedbacks(data);
      setFeedbacksError(null);
    } catch (err) {
      setFeedbacksError(err.message);
      setFeedbacks([]);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleRequestFeedback = async () => {
    try {
      const res = await fetch(`${API_URL}/feedback/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getTokenCookie()}`,
        },
        body: JSON.stringify({ member: user.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Request failed");
      setSnackbar({
        open: true,
        message: "Feedback request sent!",
        severity: "success",
      });
      fetchSummary();
      fetchFeedbacks();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleAcknowledge = async (feedbackId) => {
    try {
      const res = await fetch(`${API_URL}/feedback/${feedbackId}/acknowledge`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getTokenCookie()}`,
        },
      });
      if (!res.ok) throw new Error("Failed to acknowledge feedback");
      setFeedbacks((fbs) =>
        fbs.map((fb) =>
          fb.id === feedbackId ? { ...fb, acknowledged: true } : fb
        )
      );
      setSnackbar({
        open: true,
        message: "Feedback acknowledged!",
        severity: "success",
      });
      fetchSummary();
      fetchFeedbacks();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleExportPDF = async (feedbackId) => {
    try {
      const res = await fetch(`${API_URL}/feedback/${feedbackId}/export-pdf`, {
        headers: {
          Authorization: `Bearer ${getTokenCookie()}`,
        },
      });
      if (!res.ok) throw new Error("Failed to export PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback_${feedbackId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    fetchFeedbacks();
    // eslint-disable-next-line
  }, [user]);

  return (
    <Box sx={{ bgcolor: "#fff", height: "100vh", overflow: "hidden" }}>
      <HeaderBar
        headerButton={
          <Button
            variant="contained"
            sx={{
              bgcolor: "#ff4f81",
              color: "#fff",
              fontWeight: 600,
              borderRadius: 6,
              px: 2,
              boxShadow: "0 2px 8px #ff4f8122",
              textTransform: "none",
              fontSize: 16,
              ml: 2,
            }}
            onClick={handleRequestFeedback}
          >
            Request Feedback
          </Button>
        }
      />

      <VerticalSidebar activeIndex={0} />

      <Box
        component="main"
        sx={{
          marginTop: 10,
          marginLeft: 10,
          p: 4,
          border: "1px solid #e0e0e0",
          borderRadius: 3,
          height: "calc(100vh - 124px)",
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 3,
          },
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0,0,0,0.2) transparent",
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            color="#C11C5E"
            gutterBottom
          >
            Welcome, {user.name}! 👔
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Here's your overview and feedback management dashboard
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
              gap: 3,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#f7f5fd",
                color: "#2b2a61",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "1px solid #2b2a61",
                boxShadow: 1,
              }}
            >
              <Typography variant="h4">
                {summary.loading ? "..." : summary.feedbackReceived}
              </Typography>
              <Typography>Feedback Received</Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#22c55e",
                  fontWeight: 600,
                  bgcolor: "#22c55e22",
                  borderRadius: 3,
                  px: 1,
                  py: 0.5,
                }}
              >
                +3 this month
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#f7f5fd",
                color: "#2b2a61",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "1px solid #2b2a61",
                boxShadow: 1,
              }}
            >
              <Typography variant="h4">
                {summary.loading ? "..." : summary.pendingAck}
              </Typography>
              <Typography>Pending Acknowledgments</Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#22c55e",
                  fontWeight: 600,
                  bgcolor: "#22c55e22",
                  borderRadius: 3,
                  px: 1,
                  py: 0.5,
                }}
              >
                {summary.pendingAck === 0 ? "All caught up!" : "Pending"}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#f7f5fd",
                color: "#2b2a61",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "1px solid #2b2a61",
                boxShadow: 1,
              }}
            >
              <Typography variant="h4">
                {summary.loading ? "..." : `${summary.ackRate}%`}
              </Typography>
              <Typography>Acknowledgment Rate</Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#22c55e",
                  fontWeight: 600,
                  bgcolor: "#22c55e22",
                  borderRadius: 3,
                  px: 1,
                  py: 0.5,
                }}
              >
                {summary.ackRate > 90
                  ? "Excellent"
                  : summary.ackRate > 70
                  ? "Above average"
                  : "Needs Improvement"}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#f7f5fd",
                color: "#2b2a61",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "1px solid #2b216a",
                boxShadow: 1,
              }}
            >
              <Typography variant="h4">
                {summary.loading ? "..." : summary.avgSentiment}
              </Typography>
              <Typography>Average Rating</Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#22c55e",
                  fontWeight: 600,
                  bgcolor: "#22c55e22",
                  borderRadius: 3,
                  px: 1,
                  py: 0.5,
                }}
              >
                {summary.avgSentiment > 4
                  ? "Excellent"
                  : summary.avgSentiment > 3
                  ? "Good"
                  : "Needs Improvement"}
              </Typography>
            </Paper>
          </Box>
        </Box>

        <Box
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            p: "20px",
            zIndex: 1000,
            mb: 4,
            mt: 4,
          }}
        >
          <Typography variant="h6" fontWeight={700} mb={2} color="#ff4f81">
            Feedback Timeline
          </Typography>
          {loadingFeedbacks ? (
            <Typography>Loading feedbacks...</Typography>
          ) : feedbacksError ? (
            <Typography color="error">{feedbacksError}</Typography>
          ) : feedbacks.length === 0 ? (
            <Typography>No feedbacks yet.</Typography>
          ) : (
            <>
              {(showAllFeedbacks ? feedbacks : feedbacks.slice(0, 2)).map(
                (fb) => (
                  <Paper
                    key={fb.id}
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: "#fcf4f4",
                      color: "#000",
                      mb: 4,
                      border: "1px solid #c62a2f",
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
                        From: {fb.given_by}
                      </Typography>
                      <Typography
                        fontSize={14}
                        fontWeight={600}
                        color={
                          fb.sentiment === "Positive"
                            ? "#22c55e"
                            : fb.sentiment === "Negative"
                            ? "#C11C5E"
                            : "#ffe066"
                        }
                      >
                        ● {fb.sentiment}
                      </Typography>
                    </Box>
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
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          borderRadius: 6,
                          fontWeight: 600,
                          color: "#9C2BAD",
                          borderColor: "#9C2BAD",
                        }}
                        onClick={() => handleExportPDF(fb.id)}
                      >
                        Export as PDF
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          borderRadius: 6,
                          fontWeight: 600,
                          bgcolor: "#22c55e",
                          color: "#fff",
                          boxShadow: "none",
                          px: 2,
                          py: 0.5,
                        }}
                        onClick={() => handleAcknowledge(fb.id)}
                      >
                        {fb.acknowledged ? "Acknowledged" : "Acknowledge"}
                      </Button>
                    </Box>
                  </Paper>
                )
              )}
              {feedbacks.length > 2 && !showAllFeedbacks && (
                <Button
                  onClick={() => setShowAllFeedbacks(true)}
                  sx={{
                    px: 0,
                    py: 0,
                    minWidth: 0,
                    mt: -2,
                    mb: 2,
                    fontWeight: 600,
                    color: "#2563eb",
                    background: "none",
                    boxShadow: "none",
                  }}
                >
                  Show All
                </Button>
              )}
              {feedbacks.length > 2 && showAllFeedbacks && (
                <Button
                  onClick={() => setShowAllFeedbacks(false)}
                  sx={{
                    px: 0,
                    py: 0,
                    minWidth: 0,
                    mt: -2,
                    mb: 2,
                    fontWeight: 600,
                    color: "#2563eb",
                    background: "none",
                    boxShadow: "none",
                  }}
                >
                  Show Less
                </Button>
              )}
            </>
          )}
        </Box>

        <Typography variant="h6" fontWeight={700} mb={2} color="#ff4f81">
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "#FFF7E2",
              color: "#000",
              border: "2px solid #FFC53D",
              boxShadow: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1} color="#FFC53D">
              Request Feedback
            </Typography>
            <Typography color="#888" mb={2} align="center">
              Request feedback from your manager or peers
            </Typography>
            <Button
              variant="contained"
              sx={{
                bgcolor: "#FFC53D !important",
                color: "#FFF",
                fontWeight: 600,
                borderRadius: 6,
                px: 3,
                py: 1,
                boxShadow: "0 2px 8px #FFC53D22",
                textTransform: "none",
              }}
              onClick={handleRequestFeedback}
            >
              Request Feedback
            </Button>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "#FEF7F2",
              color: "#000",
              border: "2px solid #ED5F00",
              boxShadow: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1} color="#ED5F00">
              View History
            </Typography>
            <Typography color="#888" mb={2} align="center">
              Browse your complete feedback history
            </Typography>
            <Button
              variant="contained"
              sx={{
                color: "#FFF",
                bgcolor: "#ED5F00",
                fontWeight: 600,
                borderRadius: 6,
                px: 3,
                py: 1,
                textTransform: "none",
              }}
              onClick={() => setHistoryOpen(true)}
            >
              View All History
            </Button>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <FeedbackHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        feedbacks={[...feedbacks].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )}
      />
    </Box>
  );
}
