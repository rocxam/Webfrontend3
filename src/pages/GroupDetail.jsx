import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import API from "../services/api";
import { appTheme } from "../theme/appTheme";
import AppToolbar from "../components/AppToolbar";

function currentUserId() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").id;
  } catch {
    return null;
  }
}

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [err, setErr] = useState(null);
  const [postBody, setPostBody] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [sessForm, setSessForm] = useState({
    sessionDate: "",
    sessionTime: "",
    location: "",
    description: "",
  });
  const [joinRequests, setJoinRequests] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [infoMsg, setInfoMsg] = useState(null);

  const loadAll = useCallback(async () => {
    if (!id || !localStorage.getItem("token")) return;
    setErr(null);
    try {
      const { data: g } = await API.get(`/groups/${id}`);
      setGroup(g);
      if (g.isMember) {
        const promises = [
          API.get(`/groups/${id}/members`),
          API.get(`/groups/${id}/posts`),
          API.get(`/sessions/group/${id}`),
        ];
        if (g.isLeader) {
          promises.push(API.get(`/groups/${id}/join-requests`));
        }
        const results = await Promise.all(promises);
        setMembers(Array.isArray(results[0].data) ? results[0].data : []);
        setPosts(Array.isArray(results[1].data) ? results[1].data : []);
        setSessions(Array.isArray(results[2].data) ? results[2].data : []);
        if (g.isLeader && results[3]) {
          setJoinRequests(Array.isArray(results[3].data) ? results[3].data : []);
        } else {
          setJoinRequests([]);
        }
      } else {
        setMembers([]);
        setPosts([]);
        setSessions([]);
        setJoinRequests([]);
      }
    } catch (e) {
      if (e?.response?.status === 401) {
        navigate("/");
        return;
      }
      setGroup(null);
      setErr(e?.response?.data?.message || "Failed to load group");
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
      return;
    }
    loadAll();
  }, [loadAll, navigate]);

  const requestToJoin = async () => {
    try {
      await API.post(`/groups/${id}/request-join`);
      setInfoMsg("Join request sent. The leader can accept you from their dashboard.");
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Could not send join request");
    }
  };

  const acceptJoinRequest = async (requestId) => {
    try {
      await API.post(`/groups/${id}/join-requests/${requestId}/accept`);
      setInfoMsg("Member added to the group.");
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Accept failed");
    }
  };

  const rejectJoinRequest = async (requestId) => {
    try {
      await API.post(`/groups/${id}/join-requests/${requestId}/reject`);
      setInfoMsg("Request updated.");
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Reject failed");
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await API.post(`/groups/${id}/invites`, { email: inviteEmail.trim().toLowerCase() });
      setInviteEmail("");
      setInfoMsg("Invitation sent. They can accept from this group’s page.");
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Invite failed");
    }
  };

  const acceptInvitation = async () => {
    try {
      await API.post(`/groups/${id}/accept-invitation`);
      setInfoMsg("You have joined the group.");
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Could not accept invitation");
    }
  };

  const declineInvitation = async () => {
    try {
      await API.post(`/groups/${id}/decline-invitation`);
      setInfoMsg("Invitation declined.");
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Could not decline");
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm("Remove this member from the group?")) return;
    try {
      await API.delete(`/groups/${id}/members/${userId}`);
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Remove failed");
    }
  };

  const submitPost = async () => {
    if (!postBody.trim()) return;
    try {
      await API.post(`/groups/${id}/posts`, { body: postBody.trim() });
      setPostBody("");
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Post failed");
    }
  };

  const saveEdit = async () => {
    try {
      await API.put(`/groups/${id}`, editForm);
      setEditOpen(false);
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Update failed");
    }
  };

  const createSession = async () => {
    let t = sessForm.sessionTime;
    if (t && t.length === 5) t = `${t}:00`;
    try {
      await API.post(`/sessions/group/${id}`, {
        sessionDate: sessForm.sessionDate,
        sessionTime: t,
        location: sessForm.location,
        description: sessForm.description,
      });
      setSessForm({ sessionDate: "", sessionTime: "", location: "", description: "" });
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Could not create session");
    }
  };

  const openEdit = () => {
    if (!group) return;
    setEditForm({
      name: group.name,
      courseCode: group.courseCode,
      faculty: group.faculty,
      description: group.description || "",
      meetingLocation: group.meetingLocation,
    });
    setEditOpen(true);
  };

  if (!group) {
    return (
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
          <AppToolbar />
          <Container sx={{ py: 4 }}>
            {err ? (
              <Alert severity="error">{err}</Alert>
            ) : (
              <Typography>Loading…</Typography>
            )}
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppToolbar subtitle="Group details, members, sessions & posts" />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Button component={RouterLink} to="/groups" sx={{ mb: 2 }} size="small">
            ← Back to groups
          </Button>

          {err && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr(null)}>
              {err}
            </Alert>
          )}
          {infoMsg && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfoMsg(null)}>
              {infoMsg}
            </Alert>
          )}

          {group && (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-start" }} spacing={2}>
                <Box>
                  <Typography variant="h4" fontWeight={800}>
                    {group.name}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                    <Chip label={group.courseCode} size="small" />
                    <Chip label={group.faculty} size="small" variant="outlined" />
                    {group.isLeader && <Chip label="You are the leader" color="primary" size="small" />}
                    {group.isMember && !group.isLeader && <Chip label="Member" size="small" variant="outlined" />}
                    {!group.isMember && group.hasPendingJoinRequest && (
                      <Chip label="Join request pending" color="warning" size="small" />
                    )}
                    {!group.isMember && group.hasPendingInvite && (
                      <Chip label="Invitation pending" color="secondary" size="small" />
                    )}
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {!group.isMember && !group.hasPendingJoinRequest && !group.hasPendingInvite && (
                    <Button variant="contained" onClick={requestToJoin}>
                      Request to join
                    </Button>
                  )}
                  {!group.isMember && group.hasPendingInvite && (
                    <>
                      <Button variant="contained" color="success" onClick={acceptInvitation}>
                        Accept invitation
                      </Button>
                      <Button variant="outlined" color="inherit" onClick={declineInvitation}>
                        Decline
                      </Button>
                    </>
                  )}
                  {group.isLeader && (
                    <Button startIcon={<EditIcon />} variant="outlined" onClick={openEdit}>
                      Edit group
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                {group.description || "No description."}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Meeting:</strong> {group.meetingLocation}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {group.members} member{group.members === 1 ? "" : "s"}
              </Typography>

              <Divider sx={{ my: 3 }} />

              {group.isLeader && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "action.hover" }}>
                  <Typography variant="h6" gutterBottom>
                    Join requests & invitations
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Students who want to join must be accepted here. Invitations you send appear as “invite” until the
                    student accepts or declines.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: "center" }}>
                    <TextField
                      size="small"
                      label="Invite by email"
                      placeholder="student@university.edu"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <Button variant="contained" onClick={sendInvite}>
                      Send invite
                    </Button>
                  </Stack>
                  {joinRequests.length === 0 ? (
                    <Typography color="text.secondary">No pending requests.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Program / year</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {joinRequests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>
                              {r.name}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {r.email}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {r.program} · Year {r.year}
                            </TableCell>
                            <TableCell>
                              {r.kind === "apply" ? (
                                <Chip size="small" label="Requested to join" />
                              ) : (
                                <Stack spacing={0.5}>
                                  <Chip size="small" label="Invited" color="secondary" variant="outlined" />
                                  {r.invitedByName && (
                                    <Typography variant="caption" color="text.secondary">
                                      by {r.invitedByName}
                                    </Typography>
                                  )}
                                </Stack>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                                {r.kind === "apply" && (
                                  <Button size="small" variant="contained" color="success" onClick={() => acceptJoinRequest(r.id)}>
                                    Accept
                                  </Button>
                                )}
                                <Button size="small" variant="outlined" color="error" onClick={() => rejectJoinRequest(r.id)}>
                                  {r.kind === "apply" ? "Reject" : "Cancel invite"}
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Paper>
              )}

              {group.isMember && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Study sessions
                  </Typography>
                  {group.isLeader && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Schedule a session (leader)
                      </Typography>
                      <Stack spacing={2} direction={{ xs: "column", sm: "row" }} flexWrap="wrap" useFlexGap>
                        <TextField
                          type="date"
                          label="Date"
                          InputLabelProps={{ shrink: true }}
                          value={sessForm.sessionDate}
                          onChange={(e) => setSessForm({ ...sessForm, sessionDate: e.target.value })}
                          size="small"
                        />
                        <TextField
                          type="time"
                          label="Time"
                          InputLabelProps={{ shrink: true }}
                          value={sessForm.sessionTime}
                          onChange={(e) => setSessForm({ ...sessForm, sessionTime: e.target.value })}
                          size="small"
                        />
                        <TextField
                          label="Location / link"
                          value={sessForm.location}
                          onChange={(e) => setSessForm({ ...sessForm, location: e.target.value })}
                          size="small"
                          sx={{ minWidth: 180 }}
                        />
                        <TextField
                          label="Description"
                          value={sessForm.description}
                          onChange={(e) => setSessForm({ ...sessForm, description: e.target.value })}
                          size="small"
                          sx={{ flex: 1, minWidth: 200 }}
                        />
                        <Button variant="contained" onClick={createSession}>
                          Add session
                        </Button>
                      </Stack>
                    </Paper>
                  )}
                  {sessions.length === 0 ? (
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                      No sessions scheduled yet.
                    </Typography>
                  ) : (
                    <Stack spacing={1} sx={{ mb: 3 }}>
                      {sessions.map((s) => (
                        <Paper key={s.id} variant="outlined" sx={{ p: 1.5 }}>
                          <Typography fontWeight={600}>{s.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {s.date} at {s.time} · {s.location}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}

                  <Typography variant="h6" gutterBottom>
                    Members
                  </Typography>
                  <Table size="small" sx={{ mb: 3 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Program</TableCell>
                        <TableCell>Year</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {members.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            {m.name}
                            {m.isLeader && <Chip label="Leader" size="small" sx={{ ml: 1 }} />}
                          </TableCell>
                          <TableCell>{m.email}</TableCell>
                          <TableCell>{m.program}</TableCell>
                          <TableCell>{m.year}</TableCell>
                          <TableCell align="right">
                            {group.isLeader && !m.isLeader && m.id !== currentUserId() && (
                              <IconButton size="small" color="error" onClick={() => removeMember(m.id)} aria-label="remove member">
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Typography variant="h6" gutterBottom>
                    Group wall (announcements & questions)
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      placeholder="Share an announcement or ask a question…"
                      value={postBody}
                      onChange={(e) => setPostBody(e.target.value)}
                    />
                    <Button variant="contained" onClick={submitPost} sx={{ alignSelf: { sm: "flex-start" } }}>
                      Post
                    </Button>
                  </Stack>
                  <Stack spacing={1.5}>
                    {posts.length === 0 ? (
                      <Typography color="text.secondary">No posts yet.</Typography>
                    ) : (
                      posts.map((p) => (
                        <Paper key={p.id} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="primary">
                            {p.authorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(p.createdAt || p.created_at).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                            {p.body}
                          </Typography>
                        </Paper>
                      ))
                    )}
                  </Stack>
                </>
              )}

              {!group.isMember && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Request to join so the leader can accept you. If you were invited, use Accept or Decline above. Once you
                  are a member, you will see sessions, members, and the group wall.
                </Alert>
              )}
            </>
          )}

          <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Edit group</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField label="Name" fullWidth value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <TextField
                  label="Course code"
                  fullWidth
                  value={editForm.courseCode || ""}
                  onChange={(e) => setEditForm({ ...editForm, courseCode: e.target.value })}
                />
                <TextField label="Faculty" fullWidth value={editForm.faculty || ""} onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })} />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={2}
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <TextField
                  label="Meeting location"
                  fullWidth
                  value={editForm.meetingLocation || ""}
                  onChange={(e) => setEditForm({ ...editForm, meetingLocation: e.target.value })}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={saveEdit}>
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
