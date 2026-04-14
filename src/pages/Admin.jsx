import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import API from "../services/api";
import { appTheme } from "../theme/appTheme";
import AppToolbar from "../components/AppToolbar";

const PAGE = 50;

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState({ items: [], total: 0 });
  const [actionInput, setActionInput] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(
    async (offset, append) => {
      const params = { limit: PAGE, offset };
      if (actionFilter.trim()) params.action = actionFilter.trim();
      const { data } = await API.get("/admin/activity", { params });
      if (append) {
        setActivity((prev) => ({
          total: data.total,
          items: [...prev.items, ...data.items],
        }));
      } else {
        setActivity({ total: data.total, items: data.items || [] });
      }
    },
    [actionFilter]
  );

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      if (!cancelled) setActivity({ items: [], total: 0 });
      try {
        const sRes = await API.get("/admin/stats");
        if (!cancelled) setStats(sRes.data);
        await loadPage(0, false);
      } catch (e) {
        if (e?.response?.status === 401) {
          navigate("/");
          return;
        }
        if (!cancelled) {
          setErr(e?.response?.data?.message || "Could not load admin data (admin role required).");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, actionFilter, loadPage]);

  const applyActionFilter = () => {
    setActionFilter(actionInput.trim());
  };

  const loadMore = async () => {
    if (activity.items.length >= activity.total) return;
    setLoadingMore(true);
    try {
      await loadPage(activity.items.length, true);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load more activity");
    } finally {
      setLoadingMore(false);
    }
  };

  const fmtTime = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return String(iso);
    }
  };

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppToolbar subtitle="Administrator overview & activity (PDF §1c / §6)" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Admin dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set <code>ADMIN_EMAIL</code> in the backend <code>.env</code> to your account email (lowercase), restart the server,
            and sign in again. This page shows aggregate stats and a live <strong>activity log</strong> (registrations, logins,
            groups, join flow, posts, sessions).
          </Typography>

          {err && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {err}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && stats && (
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                  <Typography color="text.secondary" variant="overline">
                    Registered users
                  </Typography>
                  <Typography variant="h3">{stats.totalUsers}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                  <Typography color="text.secondary" variant="overline">
                    Study groups
                  </Typography>
                  <Typography variant="h3">{stats.totalStudyGroups}</Typography>
                </Paper>
              </Stack>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Most active courses (by number of groups)
                </Typography>
                {stats.mostActiveCourses?.length ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Course code</TableCell>
                        <TableCell align="right">Groups</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.mostActiveCourses.map((row) => (
                        <TableRow key={row.courseCode}>
                          <TableCell>{row.courseCode}</TableCell>
                          <TableCell align="right">{row.groupCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="text.secondary">No groups yet.</Typography>
                )}
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  System activity log
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Recent actions across the platform. Filter by part of the action key (e.g. <code>group.</code>,{" "}
                  <code>user.login</code>).
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: "center" }}>
                  <TextField
                    size="small"
                    label="Filter by action"
                    placeholder="e.g. group.join"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    sx={{ minWidth: 220 }}
                  />
                  <Button variant="outlined" onClick={applyActionFilter}>
                    Apply filter
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                    Showing {activity.items.length} of {activity.total} events
                  </Typography>
                </Stack>
                {activity.items.length === 0 ? (
                  <Typography color="text.secondary">No activity rows yet. Use the app (register, login, groups, posts) to populate the log.</Typography>
                ) : (
                  <>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Time</TableCell>
                          <TableCell>Actor</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Entity</TableCell>
                          <TableCell>Summary</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activity.items.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtTime(row.occurredAt)}</TableCell>
                            <TableCell>
                              {row.actorName || "—"}
                              {row.actorEmail && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {row.actorEmail}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <code>{row.action}</code>
                            </TableCell>
                            <TableCell>
                              {row.entityType || "—"}
                              {row.entityId != null ? ` #${row.entityId}` : ""}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 360 }}>{row.summary || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {activity.items.length < activity.total && (
                      <Button sx={{ mt: 2 }} onClick={loadMore} disabled={loadingMore} variant="outlined">
                        {loadingMore ? "Loading…" : "Load more"}
                      </Button>
                    )}
                  </>
                )}
              </Paper>
            </Stack>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
