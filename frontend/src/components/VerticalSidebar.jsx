import React, { useState, useContext } from "react";
import { Box, Tooltip } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import ChatIcon from "@mui/icons-material/Chat";
import LogoutIcon from "@mui/icons-material/Logout";
import FeedbackHistoryDialog from "./FeedbackHistoryDialog";
import { UserContext } from "../context/UserProvider";
import { API_URL, getTokenCookie, removeTokenCookie } from "../api";

const sidebarItems = [
  {
    icon: <DashboardIcon fontSize="small" />,
    label: "Dashboard",
  },
  {
    icon: <GroupIcon fontSize="small" />,
    label: "Team",
  },
  {
    icon: <ChatIcon fontSize="small" />,
    label: "Feedback",
    isFeedback: true,
  },
  {
    icon: <LogoutIcon fontSize="small" />,
    label: "Logout",
    isLogout: true,
  },
];

const handleLogout = () => {
  removeTokenCookie();
  window.location.reload();
};

export default function VerticalSidebar({ activeIndex = 0 }) {
  const { user } = useContext(UserContext);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFeedbackClick = async () => {
    if (!user) return;
    setLoading(true);
    let url = "";
    if (user.role === "employee") {
      url = `${API_URL}/employee/${encodeURIComponent(user.name)}/feedbacks`;
    } else if (user.role === "manager") {
      url = `${API_URL}/manager/${user.id}/feedbacks-given`;
    }
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getTokenCookie()}` },
      });
      const data = await res.json();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
      setFeedbackDialogOpen(true);
    }
  };

  return (
    <>
      <Box
        component="nav"
        sx={{
          position: "fixed",
          top: 64,
          left: 0,
          bottom: 0,
          width: 72,
          bgcolor: "#fff",
          borderRight: "1px solid #eee",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 2,
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          zIndex: 1300,
        }}
      >
        {sidebarItems.map((item, idx) => (
          <Tooltip key={item.label} title={item.label} placement="right">
            <Box
              sx={{
                width: 32,
                height: 32,
                bgcolor: idx === activeIndex ? "#ff4f81" : "#f5f5f5",
                color: idx === activeIndex ? "#fff" : "#bdbdbd",
                borderRadius: 2,
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "none",
              }}
              onClick={
                item.isLogout
                  ? handleLogout
                  : item.isFeedback
                  ? handleFeedbackClick
                  : undefined
              }
            >
              {item.icon}
            </Box>
          </Tooltip>
        ))}
      </Box>
      <FeedbackHistoryDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        feedbacks={[...feedbacks].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )}
        loading={loading}
      />
    </>
  );
}
