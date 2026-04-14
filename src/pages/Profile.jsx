import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import API from "../services/api";
import { appTheme } from "../theme/appTheme";
import AppToolbar from "../components/AppToolbar";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", program: "", year: "", role: "" });

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await API.get("/users/me");
        if (!cancelled) {
          setForm({
            name: data.name || "",
            email: data.email || "",
            program: data.program || "",
            year: data.year || "",
            role: data.role || "student",
          });
        }
      } catch (e) {
        if (e?.response?.status === 401) {
          navigate("/");
          return;
        }
        if (!cancelled) setErr("Could not load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const { data } = await API.patch("/users/me", {
        name: form.name,
        program: form.program,
        year: form.year,
      });
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          program: data.program,
          year: data.year,
          role: data.role,
        })
      );
      setForm((f) => ({ ...f, ...data }));
    } catch (e) {
      setErr(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppToolbar subtitle="Profile · name, program, year (PDF §1c)" />
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Your profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Email is read-only. Admins are assigned via <code>ADMIN_EMAIL</code> on the server.
          </Typography>

          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {err}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2}>
                <TextField
                  label="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  fullWidth
                />
                <TextField label="Email" value={form.email} fullWidth disabled />
                <TextField
                  label="Program of study"
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Year of study"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  fullWidth
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Chip size="small" label={form.role || "student"} />
                </Stack>
                <Button variant="contained" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </Stack>
            </Paper>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
