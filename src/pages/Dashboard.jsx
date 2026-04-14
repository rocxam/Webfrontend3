import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import GroupsIcon from "@mui/icons-material/Groups";
import EventIcon from "@mui/icons-material/Event";
import ExploreIcon from "@mui/icons-material/Explore";
import CardActionArea from "@mui/material/CardActionArea";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import API from "../services/api";
import { appTheme } from "../theme/appTheme";
import AppToolbar from "../components/AppToolbar";

function EmptyHint({ icon: Icon, title, body }) {
  return (
    <Box
      sx={{
        py: 4,
        px: 2,
        textAlign: "center",
        color: "text.secondary",
      }}
    >
      <Icon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
      <Typography variant="subtitle1" color="text.primary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ maxWidth: 320, mx: "auto" }}>
        {body}
      </Typography>
    </Box>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentGroups, setRecentGroups] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadErr(null);
      try {
        const [myRes, sessRes, recentRes] = await Promise.all([
          API.get("/groups/me"),
          API.get("/sessions/upcoming"),
          API.get("/groups/recent"),
        ]);
        if (!cancelled) {
          setMyGroups(Array.isArray(myRes.data) ? myRes.data : []);
          setUpcomingSessions(Array.isArray(sessRes.data) ? sessRes.data : []);
          setRecentGroups(Array.isArray(recentRes.data) ? recentRes.data : []);
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
          return;
        }
        if (!cancelled) {
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.sqlMessage ||
            err?.message ||
            "Failed to load dashboard";
          setLoadErr(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppToolbar subtitle="UCU · Easter 2026 · Your activity overview" />

        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" fontWeight={800}>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
              Your groups, upcoming study sessions, and recently created groups (course, faculty,
              description, location, member count).
            </Typography>
          </Stack>

          {loadErr && (
            <Alert severity="error" sx={{ mb: 3 }} variant="outlined">
              {loadErr}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Stack spacing={3}>
              <Box
                sx={{
                  display: "grid",
                  gap: 3,
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                }}
              >
                <Paper elevation={0} variant="outlined" sx={{ overflow: "hidden" }}>
                  <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <GroupsIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle1" fontWeight={700}>
                        Study groups you belong to
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Creator is group leader; join via POST <code>/api/groups/:id/join</code>.
                    </Typography>
                  </Box>
                  {myGroups.length === 0 ? (
                    <EmptyHint
                      icon={GroupsIcon}
                      title="No groups yet"
                      body="Create a group from the Groups page or join an existing one."
                    />
                  ) : (
                    <List disablePadding>
                      {myGroups.map((g) => (
                        <ListItem key={g.id} divider disablePadding>
                          <ListItemButton component={RouterLink} to={`/groups/${g.id}`}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: "primary.dark" }}>
                                <GroupsIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={g.name} secondary={g.course} />
                            <Chip size="small" label={g.role} variant="outlined" />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>

                <Paper elevation={0} variant="outlined" sx={{ overflow: "hidden" }}>
                  <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EventIcon color="secondary" fontSize="small" />
                      <Typography variant="subtitle1" fontWeight={700}>
                        Upcoming study sessions
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Pulled from your groups’ scheduled sessions (today onward).
                    </Typography>
                  </Box>
                  {upcomingSessions.length === 0 ? (
                    <EmptyHint
                      icon={EventIcon}
                      title="No upcoming sessions"
                      body="Sessions on or after today for groups you belong to appear here."
                    />
                  ) : (
                    <List disablePadding>
                      {upcomingSessions.map((s) => (
                        <ListItem key={s.id} alignItems="flex-start" divider>
                          <ListItemText
                            primary={s.title}
                            secondary={
                              <Stack component="span" spacing={0.5} sx={{ mt: 0.5 }}>
                                <Typography component="span" variant="body2" color="text.secondary">
                                  {s.group} · {s.date} at {s.time}
                                </Typography>
                                <Typography component="span" variant="body2" color="text.secondary">
                                  {s.location}
                                </Typography>
                              </Stack>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </Box>

              <Paper elevation={0} variant="outlined" sx={{ overflow: "hidden" }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                    <ExploreIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Recently created groups
                    </Typography>
                    <Chip size="small" label="Live" color="primary" variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Newest groups campus-wide — tap a card to open the group.
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  {recentGroups.length === 0 ? (
                    <EmptyHint
                      icon={ExploreIcon}
                      title="No groups in the repository yet"
                      body="Create a study group to populate the campus list."
                    />
                  ) : (
                    <Stack spacing={2}>
                      {recentGroups.map((g) => (
                        <Card key={g.id} variant="outlined" sx={{ bgcolor: "background.default" }}>
                          <CardActionArea component={RouterLink} to={`/groups/${g.id}`}>
                            <CardContent>
                              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "flex-start" }}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="h6" component="h2" fontWeight={700} gutterBottom>
                                    {g.title}
                                  </Typography>
                                  <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                                    <Chip size="small" label={g.course} />
                                    <Chip size="small" label={g.faculty} variant="outlined" />
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                                    {g.description || "—"}
                                  </Typography>
                                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
                                    <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                                      <LocationOnIcon sx={{ fontSize: 18 }} />
                                      <Typography variant="body2">{g.location}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                                      <PeopleIcon sx={{ fontSize: 18 }} />
                                      <Typography variant="body2">{g.members} members</Typography>
                                    </Stack>
                                  </Stack>
                                </Box>
                              </Stack>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Stack>
          )}

          <Divider sx={{ my: 4 }} />

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            Student Study Group Finder · Dashboard data from Express + MySQL.
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
