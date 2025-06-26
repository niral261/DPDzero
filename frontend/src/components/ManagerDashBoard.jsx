import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Paper, Avatar, Divider, Button } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import ChatIcon from "@mui/icons-material/Chat";
import SettingsIcon from "@mui/icons-material/Settings";
import NewFeedbackDialog from "./NewFeedbackDialog";
import HeaderBar from "./HeaderBar";
import VerticalSidebar from "./VerticalSidebar";
import { UserContext } from "../context/UserProvider";
import { API_URL } from "../api";
import SentimentTrendChart from "./SentimentTrendChart";

export default function ManagerDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, logout } = useContext(UserContext);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalFeedback: 0,
    responseRate: 0,
    avgSentiment: 0,
    pendingAck: 0,
    loading: true,
  });
  const [sentimentData, setSentimentData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingSentiment, setLoadingSentiment] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user || !user.id) return;
      setSummary((s) => ({ ...s, loading: true }));
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const [
          totalFeedbackRes,
          responseRateRes,
          avgSentimentRes,
          pendingAckRes,
        ] = await Promise.all([
          fetch(`${API_URL}/manager/${user.id}/feedbacks/count`, { headers }),
          fetch(`${API_URL}/manager/${user.id}/team/response-rate`, {
            headers,
          }),
          fetch(`${API_URL}/manager/${user.id}/feedbacks/average-sentiment`, {
            headers,
          }),
          fetch(`${API_URL}/manager/${user.id}/feedbacks/pending-ack`, {
            headers,
          }),
        ]);
        const totalFeedback =
          (await totalFeedbackRes.json()).total_feedback_given || 0;
        const responseRate = (await responseRateRes.json()).response_rate || 0;
        const avgSentiment =
          (await avgSentimentRes.json()).average_sentiment || 0;
        const pendingAck =
          (await pendingAckRes.json()).pending_acknowledgments || 0;
        setSummary({
          totalFeedback,
          responseRate,
          avgSentiment,
          pendingAck,
          loading: false,
        });
      } catch (err) {
        setSummary((summary) => ({ ...summary, loading: false }));
      }
    };
    fetchSummary();
  }, [user]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user || !user.id) return;
      try {
        const res = await fetch(`${API_URL}/manager/${user.id}/employees`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.detail || "Failed to fetch employees");
        setEmployees(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, [user]);

  useEffect(() => {
    if (!user || !user.id) return;
    setLoadingSentiment(true);
    fetch(`${API_URL}/manager/${user.id}/feedbacks/sentiment-trends`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setSentimentData(data))
      .catch(() => setSentimentData([]))
      .finally(() => setLoadingSentiment(false));
  }, [user]);


  useEffect(() => {
    if (!user || !user.id) 
      return;
    setLoadingActivities(true);
    fetch(`${API_URL}/manager/${user.id}/activities`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          setActivities([]);
        } else {
          setActivities(data);
        }
      })
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
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
            onClick={() => setDialogOpen(true)}
          >
            New Feedback
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
            Here's your team overview and feedback management dashboard
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
                border: "1px solid #2b2a61",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: 1,
              }}
            >
              <Typography variant="h4">
                {summary.loading ? "..." : summary.totalFeedback}
              </Typography>
              <Typography>Total Feedback Given</Typography>
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
                border: "1px solid #2b2a61",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: 1,
              }}
            >
              <Typography variant="h4">
                {summary.loading ? "..." : `${summary.responseRate}%`}
              </Typography>
              <Typography>Team Response Rate</Typography>
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
                {summary.responseRate > 90
                  ? "Excellent"
                  : summary.responseRate > 70
                  ? "Good"
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
                border: "1px solid #2b2a61",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: 1,
              }}
            >
              <Typography variant="h4">
                {summary.loading ? "..." : summary.avgSentiment}
              </Typography>
              <Typography>Average Sentiment Score</Typography>
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
                  ? "Above target"
                  : summary.avgSentiment > 3
                  ? "On target"
                  : "Below target"}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#f7f5fd",
                color: "#2b2a61",
                border: "1px solid #2b2a61",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
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
                {summary.pendingAck > 0 ? "Needs attention" : "All caught up"}
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
          }}
        >
          <Typography variant="h6" fontWeight={700} mt={2} mb={2} color="#ff4f81">
            Team Sentiment Trends
          </Typography>
          <Box
            sx={{
              ml: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "1000px",
              height: "500px",
            }}
          >
            {loadingSentiment ? (
              <Typography>Loading sentiment trends...</Typography>
            ) : (
              <SentimentTrendChart data={sentimentData} />
            )}
          </Box>
        </Box>

        
        <Typography variant="h6" fontWeight={700} mt={2} mb={2} color="#ff4f81">
          Team Members
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 3,
            mb: 4,
          }}
        >
          {error ? (
            <Typography color="error">{error}</Typography>
          ) : employees.length === 0 ? (
            <Typography>No employees found.</Typography>
          ) : (
            employees.map((emp) => (
              <Paper
                key={emp.id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #2b216a",
                  bgcolor: "#f7f5fd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: "#2563eb",
                      width: 40,
                      height: 40,
                      fontSize: 18,
                    }}
                  >
                    {emp.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Avatar>
                  <Box sx={{ ml: 2 }}>
                    <Typography fontWeight={700}>{emp.name}</Typography>
                  </Box>
                </Box>
                <Divider />

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography color="#22c55e" fontWeight={700}>
                      {emp.given_feedbacks}
                    </Typography>
                    <Typography fontSize={12} color="#22c55e">
                      FEEDBACK
                    </Typography>
                    <Typography fontSize={12} color="#22c55e">
                      GIVEN
                    </Typography>
                    <Typography color="#c62a2f" fontWeight={700} mt={1}>
                      {emp.pending_feedbacks}
                    </Typography>
                    <Typography fontSize={12} color="#c62a2f">
                      PENDING
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </Box>

        {/* Recent Activity */}
        <Box 
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            p: "20px",
            zIndex: 1000,
          }}
        >
          <Typography variant="h6" fontWeight={700} mt={3} mb={2} color="#ff4f81">
            Recent Activity
          </Typography>
          {loadingActivities ? (
            <Typography>Loading recent activities...</Typography>
          ) : activities.length === 0 ? (
            <Typography>No recent activities.</Typography>
          ) : (
            activities.map((act, idx) => {
              let icon = "●";
              let color = "#2563eb";
              let text = "";
              let bgcolor = "#fff";
              if (act.action === "sent_feedback") {
                icon = "●";
                color = "#2563eb";
                bgcolor = "#F7F5FD";
                text = `Feedback sent to ${act.target}`;
              } else if (act.action === "acknowledged_feedback") {
                icon = "✓";
                color = "#22c55e";
                bgcolor = "#22c55e22";
                text = `Feedback acknowledged by employee`;
              } else if (act.action === "requested_feedback") {
                icon = "⧗";
                color = "#ff4f81";
                bgcolor = "#ff4f8122";
                text = `Feedback requested from manager`;
              }
              const date = new Date(act.timestamp).toLocaleString();

              return (
                <Paper
                  key={act.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    m: 2,
                    borderRadius: 3,
                    border: `1px solid ${color}`,
                    bgcolor: bgcolor,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: color,
                      width: 32,
                      height: 32,
                      fontSize: 18,
                    }}
                  >
                    {icon}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={500}>{text}</Typography>
                    <Typography fontSize={13} color="#888">
                      {date}
                    </Typography>
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>
      </Box>
      <NewFeedbackDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        team={employees}
        employeeId={user.id}
      />
    </Box>
  );
}
