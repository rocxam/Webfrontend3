import { useNavigate, Link as RouterLink } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import SchoolIcon from "@mui/icons-material/School";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

function storedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function AppToolbar({ subtitle }) {
  const navigate = useNavigate();
  const user = storedUser();
  const isAdmin = user?.role === "admin";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 1, flexWrap: "wrap" }}>
        <SchoolIcon color="primary" sx={{ display: { xs: "none", sm: "block" } }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 700 }}>
            Student Study Group Finder
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {subtitle || "UCU · Easter 2026"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
          <Button component={RouterLink} to="/dashboard" color="inherit" size="small" sx={{ textTransform: "none" }}>
            Dashboard
          </Button>
          <Button component={RouterLink} to="/groups" color="inherit" size="small" sx={{ textTransform: "none" }}>
            Groups
          </Button>
          <Button component={RouterLink} to="/profile" color="inherit" size="small" sx={{ textTransform: "none" }}>
            Profile
          </Button>
          {isAdmin && (
            <Button
              component={RouterLink}
              to="/admin"
              color="inherit"
              size="small"
              startIcon={<AdminPanelSettingsIcon />}
              sx={{ textTransform: "none" }}
            >
              Admin
            </Button>
          )}
          <Button color="inherit" size="small" startIcon={<LogoutIcon />} onClick={logout} sx={{ textTransform: "none" }}>
            Log out
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
