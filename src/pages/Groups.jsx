import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import AddIcon from "@mui/icons-material/Add";
import API from "../services/api";
import { appTheme } from "../theme/appTheme";
import AppToolbar from "../components/AppToolbar";

export default function Groups() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [faculty, setFaculty] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    courseCode: "",
    faculty: "Computing & Technology",
    description: "",
    meetingLocation: "",
  });
  const [createErr, setCreateErr] = useState(null);

  const search = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const { data } = await API.get("/groups/search", {
        params: {
          q: q.trim() || undefined,
          course: course.trim() || undefined,
          faculty: faculty.trim() || undefined,
          limit: 30,
        },
      });
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.response?.status === 401) {
        navigate("/");
        return;
      }
      setErr(e?.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const createGroup = async () => {
    setCreateErr(null);
    try {
      await API.post("/groups", createForm);
      setCreateOpen(false);
      setCreateForm({
        name: "",
        courseCode: "",
        faculty: "Computing & Technology",
        description: "",
        meetingLocation: "",
      });
      await search();
    } catch (e) {
      setCreateErr(e?.response?.data?.message || "Could not create group");
    }
  };

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppToolbar subtitle="Browse & search study groups (PDF §3)" />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight={800}>
              Group repository
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Create group
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Filter by course, faculty, or keywords in the title / description.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Keywords (title, course, …)" value={q} onChange={(e) => setQ(e.target.value)} fullWidth size="small" />
                <TextField label="Course code" value={course} onChange={(e) => setCourse(e.target.value)} fullWidth size="small" />
                <TextField label="Faculty" value={faculty} onChange={(e) => setFaculty(e.target.value)} fullWidth size="small" />
              </Stack>
              <Button variant="outlined" onClick={search} disabled={loading}>
                {loading ? "Searching…" : "Search"}
              </Button>
            </Stack>
          </Paper>

          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {err}
            </Alert>
          )}

          <Stack spacing={2}>
            {results.length === 0 && !loading ? (
              <Typography color="text.secondary">No groups match your filters yet.</Typography>
            ) : (
              results.map((g) => (
                <Card key={g.id} variant="outlined">
                  <CardActionArea component={RouterLink} to={`/groups/${g.id}`}>
                    <CardContent>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                      {g.title}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ my: 1 }}>
                      <Chip size="small" label={g.course} />
                      <Chip size="small" label={g.faculty} variant="outlined" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {g.description || "—"}
                    </Typography>
                    <Stack direction="row" spacing={2} color="text.secondary">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LocationOnIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">{g.location}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <PeopleIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">{g.members} members</Typography>
                      </Stack>
                    </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))
            )}
          </Stack>
        </Container>

        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create study group</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {createErr && <Alert severity="error">{createErr}</Alert>}
              <TextField label="Group name" fullWidth value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
              <TextField
                label="Course code or name"
                fullWidth
                value={createForm.courseCode}
                onChange={(e) => setCreateForm({ ...createForm, courseCode: e.target.value })}
              />
              <TextField label="Faculty" fullWidth value={createForm.faculty} onChange={(e) => setCreateForm({ ...createForm, faculty: e.target.value })} />
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
              <TextField
                label="Meeting location (physical or online)"
                fullWidth
                value={createForm.meetingLocation}
                onChange={(e) => setCreateForm({ ...createForm, meetingLocation: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={createGroup}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
