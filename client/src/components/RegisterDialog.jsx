import { Dialog, Box, Typography, TextField, Button, IconButton, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MovieIcon from '@mui/icons-material/Movie';
import { useState } from 'react';
import axios from 'axios';

export default function RegisterDialog({ open, onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password !== confirm) {
      setError('Mật khẩu không khớp');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/auth/register', { username, password, email });
      setSuccess('Đăng ký thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" PaperProps={{ sx: { borderRadius: 4, p: 0, overflow: 'hidden', bgcolor: '#232a3b' } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 440 }}>
        <Box sx={{ flex: 1, bgcolor: '#232a3b', display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}>
          <MovieIcon sx={{ fontSize: 80, color: '#FFD600' }} />
        </Box>
        <Box sx={{ flex: 1.2, p: 4, bgcolor: '#232a3b', position: 'relative' }}>
          <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={700} mb={2} color="#fff">Tạo tài khoản mới</Typography>
          <Typography variant="body2" mb={2} color="#aaa">
            Nếu bạn đã có tài khoản, <Button variant="text" sx={{ color: '#FFD600', p: 0, minWidth: 0 }} onClick={onLogin}>đăng nhập</Button>
          </Typography>
          <form onSubmit={handleRegister}>
            <TextField label="Tên hiển thị" fullWidth margin="normal" variant="filled" sx={{ bgcolor: '#20263a', borderRadius: 1, input: { color: '#fff' } }} value={username} onChange={e => setUsername(e.target.value)} />
            <TextField label="Email" fullWidth margin="normal" variant="filled" sx={{ bgcolor: '#20263a', borderRadius: 1, input: { color: '#fff' } }} value={email} onChange={e => setEmail(e.target.value)} />
            <TextField label="Mật khẩu" type="password" fullWidth margin="normal" variant="filled" sx={{ bgcolor: '#20263a', borderRadius: 1, input: { color: '#fff' } }} value={password} onChange={e => setPassword(e.target.value)} />
            <TextField label="Nhập lại mật khẩu" type="password" fullWidth margin="normal" variant="filled" sx={{ bgcolor: '#20263a', borderRadius: 1, input: { color: '#fff' } }} value={confirm} onChange={e => setConfirm(e.target.value)} />
            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, bgcolor: '#FFD600', color: '#232a3b', fontWeight: 700 }}>Đăng ký</Button>
          </form>
        </Box>
      </Box>
    </Dialog>
  );
} 