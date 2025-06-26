import React, { useContext} from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { UserContext } from "../context/UserProvider";

export default function HeaderBar({ headerButton }) {
  const  { user, logout } = useContext(UserContext);

  return (
    <Box
      component="header"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        boxSizing: "border-box",
        px: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "#2b216a",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 10,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          fontSize: 25,
          letterSpacing: 1,
          background: "linear-gradient(210deg, #fcf4f4, #ff4f81)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundSize: "200% 200%",
          animation: "shimmer 2s linear infinite",
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '0% 50%' },
            '100%': { backgroundPosition: '100% 50%' },
          }
        }}
      >
        Workplace Vibe
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {headerButton}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box>
            <Typography fontWeight={600} color="#f1f1f1" fontSize={15}>
              {user.name}
            </Typography>
            <Typography fontSize={12} color="#d0d0d0" fontWeight={600}>
              {user.role}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              width: 40,
              height: 40,
              fontSize: 18,
            }}
          >
            {user.name.charAt(0)}
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
} 