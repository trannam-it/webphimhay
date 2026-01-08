import { Dialog, Box, Typography, TextField, Button, IconButton, Alert, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MovieIcon from '@mui/icons-material/Movie';
import { useState } from 'react';
import axios from 'axios';

export default function LoginDialog({ open, onClose, onRegister, onForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username: email, password });
      localStorage.setItem('user', JSON.stringify(res.data));
      onClose();
      window.location.reload();
    } catch (err) {
      setError(
        err.response?.data?.message === 'Invalid credentials'
          ? 'Tài khoản không chính xác!'
          : err.response?.data?.message || 'Đăng nhập thất bại'
      );
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, p: 0, overflow: 'hidden', bgcolor: '#232a3b' } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 400 }}>
          <Box sx={{ flex: 1, bgcolor: '#232a3b', display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}>
            <MovieIcon sx={{ fontSize: 80, color: '#FFD600' }} />
          </Box>
          <Box sx={{ flex: 1.2, p: 4, bgcolor: '#232a3b', position: 'relative' }}>
            <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}>
              <CloseIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={700} mb={2} color="#fff">Đăng nhập</Typography>
            <Typography variant="body2" mb={2} color="#aaa">
              Nếu bạn chưa có tài khoản, <Button variant="text" sx={{ color: '#FFD600', p: 0, minWidth: 0 }} onClick={onRegister}>đăng ký ngay</Button>
            </Typography>
            <form onSubmit={handleLogin}>
              <TextField label="Email hoặc tên đăng nhập" fullWidth margin="normal" variant="filled" sx={{ bgcolor: '#20263a', borderRadius: 1, input: { color: '#fff' } }} value={email} onChange={e => setEmail(e.target.value)} />
              <TextField label="Mật khẩu" type="password" fullWidth margin="normal" variant="filled" sx={{ bgcolor: '#20263a', borderRadius: 1, input: { color: '#fff' } }} value={password} onChange={e => setPassword(e.target.value)} />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, bgcolor: '#FFD600', color: '#232a3b', fontWeight: 700 }}>Đăng nhập</Button>
            </form>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Button variant="text" sx={{ color: '#FFD600' }} onClick={onForgot}>Quên mật khẩu?</Button>
            </Box>
          </Box>
        </Box>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
} 