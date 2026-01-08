import { AppBar, Toolbar, Typography, InputBase, Box, IconButton, Menu, MenuItem, Avatar, Button, ListItemIcon, ListItemText, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
// import MovieIcon from '@mui/icons-material/Movie';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import React, { useState, useRef, useEffect } from 'react';
import LoginDialog from './LoginDialog';
import RegisterDialog from './RegisterDialog';
import ForgotPasswordDialog from './ForgotPasswordDialog';
import Fade from '@mui/material/Fade';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import BarChartIcon from '@mui/icons-material/BarChart';

const menuItems = [
  { label: 'Thể loại', children: ['Hành động', 'Tình cảm', 'Kinh dị', 'Hoạt hình', 'Phiêu lưu', 'Hài', 'Tâm lý', 'Viễn tưởng'] },
  { label: 'Phim Lẻ' },
  { label: 'Phim Bộ' },
  { label: 'Lịch chiếu' },
  { label: 'Quốc gia', children: ['Việt Nam', 'Hàn Quốc', 'Trung Quốc', 'Mỹ', 'Nhật Bản', 'Thái Lan'] },
  { label: 'Diễn viên', children: ['Lee Min Ho', 'Triệu Lệ Dĩnh', 'Tom Cruise', 'Dương Tử', 'Song Hye Kyo'] },
];

export default function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [submenu, setSubmenu] = useState(null);
  const [userMenu, setUserMenu] = useState(null);
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);
  const [openForgot, setOpenForgot] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const submenuCloseTimeout = useRef();
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notificationTab, setNotificationTab] = useState(0);
  const [genreMenuAnchor, setGenreMenuAnchor] = useState(null);
  const [countryMenuAnchor, setCountryMenuAnchor] = useState(null);
  const [countries, setCountries] = useState([]);
  const [genres, setGenres] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState(() => localStorage.getItem('searchInputValue') || "");

  // Lưu giá trị input vào localStorage mỗi khi thay đổi
  useEffect(() => {
    // Nếu không phải trang /search thì lưu, còn /search thì không lưu
    if (!location.pathname.startsWith('/search')) {
      localStorage.setItem('searchInputValue', searchValue);
    }
  }, [searchValue, location.pathname]);

  // Khi chuyển sang /search thì reset input và xóa localStorage
  useEffect(() => {
    if (location.pathname.startsWith('/search')) {
      setSearchValue("");
      localStorage.removeItem('searchInputValue');
    }
  }, [location.pathname]);

  useEffect(() => {
    // Fetch countries
    fetch('http://localhost:5000/api/countries')
      .then(res => res.json())
      .then(data => setCountries(data))
      .catch(err => console.error('Lỗi lấy quốc gia:', err));
    
    // Fetch genres
    fetch('http://localhost:5000/api/genres')
      .then(res => res.json())
      .then(data => setGenres(data))
      .catch(err => console.error('Lỗi lấy thể loại:', err));
  }, []);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleUserMenu = (event) => setUserMenu(event.currentTarget);
  const handleUserClose = () => setUserMenu(null);
  const handleSubmenu = (event, children) => {
    clearTimeout(submenuCloseTimeout.current);
    setSubmenu({ anchor: event.currentTarget, items: children });
  };
  const handleSubmenuClose = () => {
    submenuCloseTimeout.current = setTimeout(() => setSubmenu(null), 120); // delay 120ms
  };
  const handleSubmenuListEnter = () => {
    clearTimeout(submenuCloseTimeout.current);
  };
  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };
  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };
  const handleNotificationTab = (event, newValue) => {
    setNotificationTab(newValue);
  };
  const handleGenreMenuClick = (event) => {
    setGenreMenuAnchor(event.currentTarget);
  };
  const handleGenreMenuClose = () => {
    setGenreMenuAnchor(null);
  };
  const handleCountryMenuClick = (event) => {
    setCountryMenuAnchor(event.currentTarget);
  };
  const handleCountryMenuClose = () => {
    setCountryMenuAnchor(null);
  };

  const handleGenreClick = (genre) => {
    handleGenreMenuClose();
    navigate(`/movies?genre=${encodeURIComponent(genre.name || genre)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMoviesTypeClick = (isSeries) => {
    navigate(`/movies?is_series=${isSeries ? 1 : 0}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCountryClick = (country) => {
    handleCountryMenuClose();
    navigate(`/movies?country=${encodeURIComponent(country.name || country)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActorClick = () => {
    navigate('/movies?tab=actor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Thêm hàm xử lý Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
    handleUserClose();
  };

  return (
    <AppBar position="fixed" color="default" className="header-appbar">
      <Toolbar disableGutters className="header-toolbar">
        {/* Cụm trái: Logo + Search */}
        <Box className="header-left">
          {/* <MovieIcon style={{ marginRight: 8 }} /> */}
          <PlayCircleIcon sx={{ fontSize: 40, color: '#FFD600' }} />
          <Typography
            variant="h6"
            className="header-logo"
            component={RouterLink}
            to="/"
            onClick={handleLogoClick}
          >
            MovieExpress
          </Typography>
          <Box className="header-search">
            <SearchIcon className="header-search-icon" />
            <InputBase
              placeholder="Tìm kiếm phim, diễn viên"
              className="header-search-input"
              inputProps={{ className: "header-search-input-real" }}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </Box>
        </Box>
        {/* Cụm phải: Menu + Thành viên */}
        <Box className="header-right">
          <Box className="header-menu">
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              {menuItems.map((item) => (
                item.label === 'Phim Lẻ' ? (
                  <Button
                    key={item.label}
                    className="header-menu-btn"
                    onClick={() => handleMoviesTypeClick(false)}
                  >
                    {item.label}
                  </Button>
                ) : item.label === 'Phim Bộ' ? (
                  <Button
                    key={item.label}
                    className="header-menu-btn"
                    onClick={() => handleMoviesTypeClick(true)}
                  >
                    {item.label}
                  </Button>
                ) : item.label === 'Thể loại' ? (
                  <Box key={item.label}>
                    <Button
                      className="header-menu-btn"
                      endIcon={<ExpandMoreIcon />}
                      onClick={handleGenreMenuClick}
                    >
                      {item.label}
                    </Button>
                    <Menu
                      anchorEl={genreMenuAnchor}
                      open={Boolean(genreMenuAnchor)}
                      onClose={handleGenreMenuClose}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      PaperProps={{
                        sx: {
                          bgcolor: '#232a3b',
                          color: '#fff',
                          minWidth: 320,
                          maxWidth: 370,
                          borderRadius: 3,
                          mt: 1.5,
                          boxShadow: 6,
                          p: 1.5,
                          overflow: 'visible',
                        }
                      }}
                    >
                      <Grid container spacing={0} columns={3} sx={{ minWidth: 320 }}>
                        {genres.map((genre) => (
                          <Grid item xs={1} key={genre.id} sx={{ py: 0.2, px: 0.5, width: 1/3 }}>
                            <Box sx={{
                              cursor: 'pointer',
                              color: '#fff',
                              fontSize: 13.5,
                              lineHeight: 1.7,
                              maxWidth: 110,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              transition: 'none',
                              '&:hover': {
                                color: '#FFD600'
                              }
                            }} onClick={() => handleGenreClick(genre)}>
                              {genre.name}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Menu>
                  </Box>
                ) : item.label === 'Quốc gia' ? (
                  <Box key={item.label}>
                    <Button
                      className="header-menu-btn"
                      endIcon={<ExpandMoreIcon />}
                      onClick={handleCountryMenuClick}
                    >
                      {item.label}
                    </Button>
                    <Menu
                      anchorEl={countryMenuAnchor}
                      open={Boolean(countryMenuAnchor)}
                      onClose={handleCountryMenuClose}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      PaperProps={{
                        sx: {
                          bgcolor: '#232a3b',
                          color: '#fff',
                          minWidth: 160,
                          maxWidth: 200,
                          borderRadius: 2,
                          mt: 1.5,
                          boxShadow: 6,
                          p: 0.5,
                          overflow: 'visible',
                        }
                      }}
                    >
                      {countries.map((country) => (
                        <Box
                          key={country.id}
                          sx={{
                            color: '#fff',
                            fontSize: 15,
                            px: 2,
                            py: 0.7,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'none',
                            bgcolor: 'transparent',
                            '&:hover': { bgcolor: 'transparent', color: '#FFA726' },
                            '&.Mui-selected': { color: '#FFA726' }
                          }}
                          onClick={() => handleCountryClick(country)}
                        >
                          {country.name}
                        </Box>
                      ))}
                    </Menu>
                  </Box>
                ) : item.label === 'Diễn viên' ? (
                  <Button
                    key={item.label}
                    className="header-menu-btn"
                    onClick={item.label === 'Diễn viên' ? handleActorClick : undefined}
                  >
                    {item.label}
                  </Button>
                ) : item.children ? (
                  <Box key={item.label} onMouseLeave={handleSubmenuClose}>
                    <Button
                      className="header-menu-btn"
                      endIcon={<ExpandMoreIcon />}
                      onMouseEnter={e => handleSubmenu(e, item.children)}
                    >
                      {item.label}
                    </Button>
                    <Menu
                      anchorEl={submenu?.anchor}
                      open={submenu && submenu.items === item.children}
                      onClose={() => setSubmenu(null)}
                      MenuListProps={{ onMouseEnter: handleSubmenuListEnter, onMouseLeave: handleSubmenuClose }}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      TransitionComponent={Fade}
                      transitionDuration={220}
                      disableScrollLock
                    >
                      {item.children.map((child) => (
                        <MenuItem key={child} onClick={() => setSubmenu(null)}>{child}</MenuItem>
                      ))}
                    </Menu>
                  </Box>
                ) : (
                  <Button
                    className="header-menu-btn"
                  >
                    {item.label}
                  </Button>
                )
              ))}
            </Box>
            {/* Menu mobile */}
            <Box className="header-menu-mobile">
              <IconButton color="inherit" onClick={handleMenu}>
                <MenuIcon />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                {menuItems.map((item) => (
                  item.children ? (
                    <Box key={item.label}>
                      <MenuItem disabled>{item.label}</MenuItem>
                      {item.children.map((child) => (
                        <MenuItem key={child} sx={{ pl: 4 }}>{child}</MenuItem>
                      ))}
                      <Divider />
                    </Box>
                  ) : (
                    <MenuItem key={item.label}>{item.label}</MenuItem>
                  )
                ))}
              </Menu>
            </Box>
          </Box>
          <Box className="header-user">
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              {user && user.username ? (
                <>
                  <IconButton
                    className="header-notification-btn"
                    onClick={handleNotificationClick}
                  >
                    <NotificationsNoneIcon />
                  </IconButton>
                  <IconButton onClick={handleUserMenu} className="header-avatar-btn">
                    <Avatar
                      src={user.avatar || undefined}
                      className="header-avatar"
                    >
                      {!user.avatar && (user.username ? user.username[0].toUpperCase() : <PersonIcon />)}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={userMenu}
                    open={Boolean(userMenu)}
                    onClose={handleUserClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                      sx: {
                        bgcolor: '#232a3b',
                        color: '#fff',
                        minWidth: 200,
                        borderRadius: 3,
                        mt: 1.5,
                        boxShadow: 3,
                        p: 0,
                        overflow: 'visible',
                      }
                    }}
                  >
                    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                      <Typography variant="body2" color="#aaa">Chào,</Typography>
                      <Typography variant="body1" fontWeight={700} color="#FFD600">{user.username}</Typography>
                    </Box>
                    <Divider sx={{ bgcolor: '#333' }} />
                    <MenuItem sx={{ py: 1.2 }}><FavoriteBorderIcon sx={{ mr: 1 }} /> Yêu thích</MenuItem>
                    <MenuItem sx={{ py: 1.2 }}><AddIcon sx={{ mr: 1 }} /> Danh sách</MenuItem>
                    <MenuItem sx={{ py: 1.2 }}><HistoryIcon sx={{ mr: 1 }} /> Xem tiếp</MenuItem>
                    <MenuItem sx={{ py: 1.2 }} onClick={() => navigate('/user/profile')}>
                      <AccountCircleIcon sx={{ mr: 1, color: '#fff' }} /> Tài khoản
                    </MenuItem>
                    {Boolean(user.is_admin) && (
                      <>
                        <Divider sx={{ bgcolor: '#333' }} />
                        <MenuItem sx={{ py: 1.2 }} onClick={() => { navigate('/admin'); handleUserClose(); }}>
                          <BarChartIcon sx={{ mr: 1, color: '#fff' }} /> Admin Dashboard
                        </MenuItem>
                      </>
                    )}
                    <Divider sx={{ bgcolor: '#333' }} />
                    <MenuItem sx={{ py: 1.2, color: '#fff', transition: 'color 0.18s', '&:hover': { color: '#FFD600', bgcolor: 'transparent' } }} onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1, color: '#fff' }} /> Thoát
                    </MenuItem>
                  </Menu>
                  <Menu
                    anchorEl={notificationAnchor}
                    open={Boolean(notificationAnchor)}
                    onClose={handleNotificationClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                      sx: {
                        bgcolor: '#232a3b',
                        color: '#fff',
                        minWidth: 340,
                        maxWidth: 360,
                        borderRadius: 3,
                        mt: 1.5,
                        boxShadow: 6,
                        p: 0,
                        overflow: 'visible',
                      }
                    }}
                  >
                    <Box sx={{ px: 2, pt: 2, pb: 0 }}>
                      <Tabs
                        value={notificationTab}
                        onChange={handleNotificationTab}
                        textColor="inherit"
                        TabIndicatorProps={{ sx: { bgcolor: '#FFD600', height: 3, borderRadius: 2 } }}
                        sx={{ minHeight: 36, mb: 1 }}
                      >
                        <Tab label="Phim" sx={{ color: notificationTab === 0 ? '#FFD600' : '#fff', fontWeight: 600, minWidth: 80 }} />
                        <Tab label="Cộng đồng" sx={{ color: notificationTab === 1 ? '#FFD600' : '#fff', fontWeight: 600, minWidth: 110 }} />
                        <Tab label="Đã đọc" sx={{ color: notificationTab === 2 ? '#FFD600' : '#fff', fontWeight: 600, minWidth: 90 }} />
                      </Tabs>
                    </Box>
                    <Divider sx={{ bgcolor: '#333', mb: 0.5 }} />
                    <Box sx={{ px: 2, py: 3, textAlign: 'center', color: '#bdbdbd', fontSize: 16, minHeight: 60 }}>
                      Không có thông báo nào
                    </Box>
                    <Divider sx={{ bgcolor: '#333', mt: 0.5 }} />
                    <Box sx={{ py: 1.5, textAlign: 'center', cursor: 'pointer', color: '#FFD600', fontWeight: 600, fontSize: 16, borderRadius: 0, transition: 'background 0.2s', '&:hover': { bgcolor: '#23242a' } }}>
                      Xem toàn bộ
                    </Box>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setOpenLogin(true)}
                  startIcon={<PersonIcon />}
                  className="header-member-btn"
                >
                  Thành viên
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Toolbar>
      <LoginDialog open={openLogin} onClose={() => setOpenLogin(false)} onRegister={() => { setOpenLogin(false); setOpenRegister(true); }} onForgot={() => { setOpenLogin(false); setOpenForgot(true); }} />
      <RegisterDialog open={openRegister} onClose={() => setOpenRegister(false)} onLogin={() => { setOpenRegister(false); setOpenLogin(true); }} />
      <ForgotPasswordDialog open={openForgot} onClose={() => setOpenForgot(false)} onLogin={() => { setOpenForgot(false); setOpenLogin(true); }} />
    </AppBar>
  );
} 