const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Lấy pool kết nối từ app.locals
function getDb(req) {
  return req.app.locals.db;
}

// Đăng ký
router.post('/auth/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) return res.status(400).json({ message: 'Missing fields' });
  try {
    const db = getDb(req);
    const hash = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hash, email]);
    res.json({ message: 'Register success' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Đăng nhập
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ message: 'Thông tin đăng nhập không hợp lệ' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Thông tin đăng nhập không hợp lệ' });
    res.json({ id: user.id, username: user.username, email: user.email, is_admin: user.is_admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách phim kèm genres và countries
router.get('/movies', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM movies ORDER BY created_at DESC');

    // Lấy genres và countries cho tất cả movies
    const movieIds = rows.map(row => row.id);
    let genresMap = {};
    let countriesMap = {};
    if (movieIds.length > 0) {
      // Genres
      const [genreRows] = await db.query(
        `SELECT mg.movie_id, g.name
         FROM movie_genres mg
         JOIN genres g ON mg.genre_id = g.id
         WHERE mg.movie_id IN (${movieIds.map(() => '?').join(',')})`,
        movieIds
      );
      genresMap = genreRows.reduce((acc, cur) => {
        if (!acc[cur.movie_id]) acc[cur.movie_id] = [];
        acc[cur.movie_id].push(cur.name);
        return acc;
      }, {});

      // Countries
      const [countryRows] = await db.query(
        `SELECT mc.movie_id, c.name
         FROM movie_countries mc
         JOIN countries c ON mc.country_id = c.id
         WHERE mc.movie_id IN (${movieIds.map(() => '?').join(',')})`,
        movieIds
      );
      countriesMap = countryRows.reduce((acc, cur) => {
        if (!acc[cur.movie_id]) acc[cur.movie_id] = [];
        acc[cur.movie_id].push(cur.name);
        return acc;
      }, {});
    }

    // Gắn genres và countries vào từng movie, đồng thời đảm bảo các trường cần thiết luôn có mặt
    const moviesWithGenresAndCountries = rows.map(row => ({
      ...row,
      age_limit: row.age_limit,
      original_title: row.original_title,
      release_year: row.release_year,
      is_series: row.is_series,
      imdb_rating: row.imdb_rating,
      quality: row.quality,
      genres: genresMap[row.id] || [],
      countries: countriesMap[row.id] || [],
    }));

    res.json(moviesWithGenresAndCountries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm phim (admin)
router.post('/movies', async (req, res) => {
  const { title, description, poster_url, age_limit, original_title, release_year, duration, is_series, trailer_url, imdb_rating, quality } = req.body;
  try {
    const db = getDb(req);
    await db.execute(
      'INSERT INTO movies (title, description, poster_url, age_limit, original_title, release_year, duration, is_series, trailer_url, imdb_rating, quality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, poster_url, age_limit, original_title, release_year, duration, is_series, trailer_url, imdb_rating, quality]
    );
    res.json({ message: 'Movie added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sửa phim (admin)
router.put('/movies/:id', async (req, res) => {
  const { title, description, poster_url, age_limit, original_title, release_year, duration, is_series, trailer_url, imdb_rating, quality, is_admin } = req.body;
  if (!is_admin) return res.status(403).json({ message: 'Admin only' });
  try {
    const db = getDb(req);
    await db.execute(
      'UPDATE movies SET title=?, description=?, poster_url=?, age_limit=?, original_title=?, release_year=?, duration=?, is_series=?, trailer_url=?, imdb_rating=?, quality=? WHERE id=?',
      [title, description, poster_url, age_limit, original_title, release_year, duration, is_series, trailer_url, imdb_rating, quality, req.params.id]
    );
    res.json({ message: 'Movie updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xóa phim (admin)
router.delete('/movies/:id', async (req, res) => {
  const is_admin = req.query.is_admin === 'true';
  if (!is_admin) return res.status(403).json({ message: 'Admin only' });
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM movies WHERE id=?', [req.params.id]);
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Đặt vé
router.post('/bookings', async (req, res) => {
  const { user_id, movie_id } = req.body;
  try {
    const db = getDb(req);
    await db.execute('INSERT INTO bookings (user_id, movie_id) VALUES (?, ?)', [user_id, movie_id]);
    res.json({ message: 'Booking successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy vé của user
router.get('/bookings/:user_id', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT b.*, m.title FROM bookings b JOIN movies m ON b.movie_id = m.id WHERE b.user_id = ?', [req.params.user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách quốc gia
router.get('/countries', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM countries ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm quốc gia mới
router.post('/countries', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Missing name' });
  try {
    const db = getDb(req);
    // Kiểm tra trùng tên
    const [rows] = await db.execute('SELECT id FROM countries WHERE name = ?', [name]);
    if (rows.length > 0) return res.status(400).json({ message: 'Tên quốc gia đã tồn tại' });
    await db.execute('INSERT INTO countries (name) VALUES (?)', [name]);
    res.json({ message: 'Thêm quốc gia thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sửa quốc gia
router.put('/countries/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Missing name' });
  try {
    const db = getDb(req);
    // Kiểm tra trùng tên (trừ chính nó)
    const [rows] = await db.execute('SELECT id FROM countries WHERE name = ? AND id != ?', [name, req.params.id]);
    if (rows.length > 0) return res.status(400).json({ message: 'Tên quốc gia đã tồn tại' });
    const [result] = await db.execute('UPDATE countries SET name = ? WHERE id = ?', [name, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Quốc gia không tồn tại' });
    res.json({ message: 'Cập nhật quốc gia thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xóa quốc gia
router.delete('/countries/:id', async (req, res) => {
  try {
    const db = getDb(req);
    // Kiểm tra quốc gia có đang được liên kết với phim không
    const [used] = await db.execute('SELECT 1 FROM movie_countries WHERE country_id = ? LIMIT 1', [req.params.id]);
    if (used.length > 0) return res.status(400).json({ message: 'Không thể xóa: Quốc gia đang được sử dụng cho phim!' });
    const [result] = await db.execute('DELETE FROM countries WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Quốc gia không tồn tại' });
    res.json({ message: 'Đã xóa quốc gia thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách thể loại
router.get('/genres', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM genres ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm thể loại mới
router.post('/genres', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Missing name' });
  try {
    const db = getDb(req);
    // Kiểm tra trùng tên
    const [rows] = await db.execute('SELECT id FROM genres WHERE name = ?', [name]);
    if (rows.length > 0) return res.status(400).json({ message: 'Tên thể loại đã tồn tại' });
    await db.execute('INSERT INTO genres (name) VALUES (?)', [name]);
    res.json({ message: 'Thêm thể loại thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sửa thể loại
router.put('/genres/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Missing name' });
  try {
    const db = getDb(req);
    // Kiểm tra trùng tên (trừ chính nó)
    const [rows] = await db.execute('SELECT id FROM genres WHERE name = ? AND id != ?', [name, req.params.id]);
    if (rows.length > 0) return res.status(400).json({ message: 'Tên thể loại đã tồn tại' });
    const [result] = await db.execute('UPDATE genres SET name = ? WHERE id = ?', [name, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Thể loại không tồn tại' });
    res.json({ message: 'Cập nhật thể loại thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xóa thể loại
router.delete('/genres/:id', async (req, res) => {
  try {
    const db = getDb(req);
    // Kiểm tra thể loại có đang được liên kết với phim không
    const [used] = await db.execute('SELECT 1 FROM movie_genres WHERE genre_id = ? LIMIT 1', [req.params.id]);
    if (used.length > 0) return res.status(400).json({ message: 'Không thể xóa: Thể loại đang được sử dụng cho phim!' });
    const [result] = await db.execute('DELETE FROM genres WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Thể loại không tồn tại' });
    res.json({ message: 'Đã xóa thể loại thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy phim theo thể loại
router.get('/genres/:id/movies', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute(`
      SELECT DISTINCT m.* 
      FROM movies m 
      JOIN movie_genres mg ON m.id = mg.movie_id 
      WHERE mg.genre_id = ?
      ORDER BY m.created_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy thể loại theo tên (tìm kiếm)
router.get('/genres/search/:name', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute(`
      SELECT * FROM genres 
      WHERE name LIKE ? 
      ORDER BY name
    `, [`%${req.params.name}%`]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Quên mật khẩu (giả lập)
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  // Có thể kiểm tra email trong DB, gửi mail thực tế nếu muốn
  res.json({ message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi!' });
});

// Lấy tối đa 6 banner mới nhất, kèm thông tin phim và genres
router.get('/banners', async (req, res) => {
  try {
    const db = getDb(req);
    // Join banners with movies
    const [rows] = await db.execute(`
      SELECT b.*, m.imdb_rating, m.quality, m.age_limit, m.release_year, m.duration, m.description, m.title as movie_title, m.id as movie_id
      FROM banners b
      JOIN movies m ON b.movie_id = m.id
      ORDER BY b.id DESC
      LIMIT 6
    `);

    // Get all movie_ids for banners
    const movieIds = rows.map(row => row.movie_id);
    let genresMap = {};
    if (movieIds.length > 0) {
      // Get genres for all movies in one query
      const [genreRows] = await db.query(`
        SELECT mg.movie_id, g.name
        FROM movie_genres mg
        JOIN genres g ON mg.genre_id = g.id
        WHERE mg.movie_id IN (${movieIds.map(() => '?').join(',')})
      `, movieIds);

      // Group genres by movie_id
      genresMap = genreRows.reduce((acc, cur) => {
        if (!acc[cur.movie_id]) acc[cur.movie_id] = [];
        acc[cur.movie_id].push(cur.name);
        return acc;
      }, {});
    }

    // Xử lý badges: loại bỏ trường sx nếu có
    const cleanRows = rows.map(row => {
      let badges = [];
      try {
        badges = JSON.parse(row.badges || '[]').map(b => {
          if (typeof b === 'object' && b !== null) {
            const { sx, ...rest } = b;
            return rest;
          }
          return b;
        });
      } catch (e) {}
      return {
        ...row,
        badges,
        genres: genresMap[row.movie_id] || [],
      };
    });

    res.json(cleanRows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm banner mới
router.post('/banners', async (req, res) => {
  const { movie_id, bg_url, title_url, thumbnails } = req.body;
  if (!movie_id || !bg_url) return res.status(400).json({ message: 'Missing required fields' });
  try {
    const db = getDb(req);
    await db.execute(
      'INSERT INTO banners (movie_id, bg_url, title_url, thumbnails) VALUES (?, ?, ?, ?)',
      [movie_id, bg_url, title_url || null, JSON.stringify(thumbnails || [])]
    );
    res.json({ message: 'Banner added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy chi tiết phim
router.get('/movie/:id', async (req, res) => {
  try {
    const db = getDb(req);
    const movieId = req.params.id;

    // 1. Thông tin phim chính
    const [movieRows] = await db.execute(
      'SELECT * FROM movies WHERE id = ?', [movieId]
    );
    if (!movieRows.length) return res.status(404).json({ message: 'Movie not found' });
    const movie = movieRows[0];

    // 2. Banner/bg
    const [bannerRows] = await db.execute(
      'SELECT bg_url FROM banners WHERE movie_id = ? LIMIT 1', [movieId]
    );
    const bg_url = bannerRows.length ? bannerRows[0].bg_url : null;

    // 3. Genres
    const [genreRows] = await db.execute(
      `SELECT g.name FROM movie_genres mg JOIN genres g ON mg.genre_id = g.id WHERE mg.movie_id = ?`, [movieId]
    );
    const genres = genreRows.map(g => g.name);

    // 4. Countries
    const [countryRows] = await db.execute(
      `SELECT c.name FROM movie_countries mc JOIN countries c ON mc.country_id = c.id WHERE mc.movie_id = ?`, [movieId]
    );
    const countries = countryRows.map(c => c.name);

    // 5. Producers
    const [producerRows] = await db.execute(
      `SELECT p.name FROM movie_producer mp JOIN producers p ON mp.producer_id = p.id WHERE mp.movie_id = ?`, [movieId]
    );
    const producers = producerRows.map(p => p.name);

    // 6. Directors
    const [directorRows] = await db.execute(
      `SELECT d.name FROM movie_directors md JOIN directors d ON md.director_id = d.id WHERE md.movie_id = ?`, [movieId]
    );
    const directors = directorRows.map(d => d.name);

    // 7. Episodes
    const [episodeRows] = await db.execute(
      `SELECT episode_number, title, video_url, subtitle_url FROM episodes WHERE movie_id = ? ORDER BY episode_number ASC`, [movieId]
    );

    // 8. Actors
    const [actorRows] = await db.execute(
      `SELECT a.id, a.name, a.profile_pic_url, a.bio FROM movie_actors ma JOIN actors a ON ma.actor_id = a.id WHERE ma.movie_id = ?`, [movieId]
    );

    // 9. Suggested movies (top imdb_rating, trừ phim hiện tại)
    const [suggestedRows] = await db.execute(
      `SELECT id, title, poster_url, imdb_rating FROM movies WHERE id != ? ORDER BY imdb_rating DESC LIMIT 12`, [movieId]
    );

    // 10. Kết quả trả về
    res.json({
      id: movie.id,
      title: movie.title,
      poster_url: movie.poster_url,
      bg_url,
      age_limit: movie.age_limit,
      release_year: movie.release_year,
      duration: movie.duration,
      description: movie.description,
      imdb_rating: movie.imdb_rating,
      genres,
      countries,
      producers,
      directors,
      episodes: episodeRows,
      actors: actorRows,
      suggested: suggestedRows
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API: /api/watch/:id - Trả về thông tin phim, genres, danh sách tập
router.get('/watch/:id', async (req, res) => {
  try {
    const db = getDb(req);
    const movieId = req.params.id;

    // 1. Thông tin phim
    const [movieRows] = await db.execute('SELECT * FROM movies WHERE id = ?', [movieId]);
    if (!movieRows.length) return res.status(404).json({ message: 'Movie not found' });
    const movie = movieRows[0];

    // 2. Genres
    const [genreRows] = await db.execute(
      `SELECT g.id, g.name FROM movie_genres mg JOIN genres g ON mg.genre_id = g.id WHERE mg.movie_id = ?`, [movieId]
    );

    // 3. Danh sách tập
    const [episodeRows] = await db.execute(
      `SELECT id, episode_number, title, video_url FROM episodes WHERE movie_id = ? ORDER BY episode_number ASC`, [movieId]
    );

    res.json({
      movie,
      genres: genreRows,
      episodes: episodeRows
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API filter phim
router.get('/movies/filter', async (req, res) => {
  try {
    const db = getDb(req);
    const {
      country, // tên quốc gia
      genre,   // tên thể loại
      type,    // 'Phim lẻ', 'Phim bộ', 'Tất cả'
      rating,  // age_limit
      year,    // năm sản xuất
      sort     // sắp xếp
    } = req.query;

    let sql = `SELECT DISTINCT m.* FROM movies m`;
    let joins = [];
    let wheres = [];
    let params = [];

    // Join với bảng liên quan nếu cần
    if (country && country.length > 0 && country !== 'Tất cả') {
      let countries = country;
      if (typeof countries === 'string') {
        // Nếu là chuỗi có dấu phẩy, tách ra array
        if (countries.includes(',')) {
          countries = countries.split(',').map(s => s.trim());
        } else {
          countries = [countries];
        }
      }
      joins.push('JOIN movie_countries mc ON m.id = mc.movie_id');
      joins.push('JOIN countries c ON mc.country_id = c.id');
      wheres.push(`c.name IN (${countries.map(() => '?').join(',')})`);
      params.push(...countries);
    }
    if (genre && genre.length > 0) {
      // Đảm bảo genre là array
      let genres = genre;
      if (typeof genres === 'string') {
        if (genres.includes(',')) {
          genres = genres.split(',').map(s => s.trim());
        } else {
          genres = [genres];
        }
      }
      joins.push('JOIN movie_genres mg ON m.id = mg.movie_id');
      joins.push('JOIN genres g ON mg.genre_id = g.id');
      wheres.push(`g.name IN (${genres.map(() => '?').join(',')})`);
      params.push(...genres);
    }
    if (type && type !== 'Tất cả') {
      if (type === 'Phim lẻ') {
        wheres.push('(m.is_series = 0 OR m.is_series IS NULL)');
      } else if (type === 'Phim bộ') {
        wheres.push('m.is_series = 1');
      }
    }
    if (rating && rating.length > 0 && rating !== 'Tất cả') {
      let ratings = rating;
      if (typeof ratings === 'string') {
        if (ratings.includes(',')) {
          ratings = ratings.split(',').map(s => s.trim());
        } else {
          ratings = [ratings];
        }
      }
      wheres.push(`m.age_limit IN (${ratings.map(() => '?').join(',')})`);
      params.push(...ratings);
    }
    if (year && year.length > 0 && year !== 'Tất cả') {
      let years = year;
      if (typeof years === 'string') {
        if (years.includes(',')) {
          years = years.split(',').map(s => s.trim());
        } else {
          years = [years];
        }
      }
      wheres.push(`m.release_year IN (${years.map(() => '?').join(',')})`);
      params.push(...years);
    }

    // Ghép các join và where
    if (joins.length) sql += ' ' + joins.join(' ');
    if (wheres.length) sql += ' WHERE ' + wheres.join(' AND ');

    // Sau khi ghép where, thêm GROUP BY m.id nếu có filter thể loại để tránh duplicate
    if (joins.some(j => j.includes('movie_genres'))) {
      sql += ' GROUP BY m.id';
    }

    // Sắp xếp
    let order = 'm.created_at DESC';
    if (sort) {
      if (sort === 'Mới nhất') order = 'm.release_year DESC, m.created_at DESC';
      else if (sort === 'Mới cập nhật') order = 'm.created_at DESC';
      else if (sort === 'Điểm IMDb') order = 'm.imdb_rating DESC';
      else if (sort === 'Lượt xem') order = 'm.views DESC'; // nếu có trường views
    }
    sql += ` ORDER BY ${order}`;

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách diễn viên
router.get('/actors', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM actors ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách tập phim cho 1 movie
router.get('/movies/:id/episodes', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM episodes WHERE movie_id = ? ORDER BY episode_number ASC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm tập phim mới cho phim
router.post('/movies/:id/episodes', async (req, res) => {
  const { episode_number, title, video_url, subtitle_url } = req.body;
  if (!episode_number || !title || !video_url) {
    return res.status(400).json({ message: 'Thiếu thông tin tập phim' });
  }
  try {
    const db = getDb(req);
    await db.execute(
      'INSERT INTO episodes (movie_id, episode_number, title, video_url, subtitle_url) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, episode_number, title, video_url, subtitle_url || null]
    );
    res.json({ message: 'Đã thêm tập phim' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sửa tập phim
router.put('/episodes/:id', async (req, res) => {
  const { episode_number, title, video_url, subtitle_url } = req.body;
  try {
    const db = getDb(req);
    await db.execute(
      'UPDATE episodes SET episode_number=?, title=?, video_url=?, subtitle_url=? WHERE id=?',
      [episode_number, title, video_url, subtitle_url || null, req.params.id]
    );
    res.json({ message: 'Episode updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xóa tập phim
router.delete('/episodes/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM episodes WHERE id=?', [req.params.id]);
    res.json({ message: 'Episode deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== CRUD ACTORS =====
router.post('/actors', async (req, res) => {
  const { name, profile_pic_url, bio } = req.body;
  if (!name) return res.status(400).json({ message: 'Missing name' });
  try {
    const db = getDb(req);
    await db.execute('INSERT INTO actors (name, profile_pic_url, bio) VALUES (?, ?, ?)', [name, profile_pic_url || null, bio || null]);
    res.json({ message: 'Actor added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/actors/:id', async (req, res) => {
  const { name, profile_pic_url, bio } = req.body;
  try {
    const db = getDb(req);
    await db.execute('UPDATE actors SET name=?, profile_pic_url=?, bio=? WHERE id=?', [name, profile_pic_url || null, bio || null, req.params.id]);
    res.json({ message: 'Actor updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete('/actors/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM actors WHERE id=?', [req.params.id]);
    res.json({ message: 'Actor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== CRUD DIRECTORS =====
router.get('/directors', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM directors ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post('/directors', async (req, res) => {
  const { name, profile_pic_url, bio } = req.body;
  if (!name) return res.status(400).json({ message: 'Missing name' });
  try {
    const db = getDb(req);
    await db.execute('INSERT INTO directors (name, profile_pic_url, bio) VALUES (?, ?, ?)', [name, profile_pic_url || null, bio || null]);
    res.json({ message: 'Director added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/directors/:id', async (req, res) => {
  const { name, profile_pic_url, bio } = req.body;
  try {
    const db = getDb(req);
    await db.execute('UPDATE directors SET name=?, profile_pic_url=?, bio=? WHERE id=?', [name, profile_pic_url || null, bio || null, req.params.id]);
    res.json({ message: 'Director updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete('/directors/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM directors WHERE id=?', [req.params.id]);
    res.json({ message: 'Director deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== CRUD BANNERS (update, delete) =====
router.put('/banners/:id', async (req, res) => {
  const { movie_id, bg_url, title_url, thumbnails } = req.body;
  try {
    const db = getDb(req);
    await db.execute('UPDATE banners SET movie_id=?, bg_url=?, title_url=?, thumbnails=? WHERE id=?', [movie_id, bg_url, title_url, JSON.stringify(thumbnails || []), req.params.id]);
    res.json({ message: 'Banner updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete('/banners/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM banners WHERE id=?', [req.params.id]);
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== MOVIE RELATIONSHIP API =====
// Gắn thể loại cho phim
router.post('/movies/:id/genres', async (req, res) => {
  const { genre_ids } = req.body; // array
  if (!Array.isArray(genre_ids)) return res.status(400).json({ message: 'genre_ids must be array' });
  try {
    const db = getDb(req);
    // Xóa hết genre cũ
    await db.execute('DELETE FROM movie_genres WHERE movie_id=?', [req.params.id]);
    // Thêm mới
    for (const gid of genre_ids) {
      await db.execute('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)', [req.params.id, gid]);
    }
    res.json({ message: 'Genres updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Gắn quốc gia cho phim
router.post('/movies/:id/countries', async (req, res) => {
  const { country_ids } = req.body;
  if (!Array.isArray(country_ids)) return res.status(400).json({ message: 'country_ids must be array' });
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM movie_countries WHERE movie_id=?', [req.params.id]);
    for (const cid of country_ids) {
      await db.execute('INSERT INTO movie_countries (movie_id, country_id) VALUES (?, ?)', [req.params.id, cid]);
    }
    res.json({ message: 'Countries updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Gắn diễn viên cho phim
router.post('/movies/:id/actors', async (req, res) => {
  const { actor_ids } = req.body;
  if (!Array.isArray(actor_ids)) return res.status(400).json({ message: 'actor_ids must be array' });
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM movie_actors WHERE movie_id=?', [req.params.id]);
    for (const aid of actor_ids) {
      await db.execute('INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)', [req.params.id, aid]);
    }
    res.json({ message: 'Actors updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Gắn đạo diễn cho phim
router.post('/movies/:id/directors', async (req, res) => {
  const { director_ids } = req.body;
  if (!Array.isArray(director_ids)) return res.status(400).json({ message: 'director_ids must be array' });
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM movie_directors WHERE movie_id=?', [req.params.id]);
    for (const did of director_ids) {
      await db.execute('INSERT INTO movie_directors (movie_id, director_id) VALUES (?, ?)', [req.params.id, did]);
    }
    res.json({ message: 'Directors updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ====== PROFILE API ======
// Lấy thông tin profile user
router.get('/user/profile', async (req, res) => {
  try {
    // Lấy user_id từ query hoặc session (ở đây giả lập lấy từ query)
    const user_id = req.query?.user_id || req.body?.user_id || req.headers?.['x-user-id'];
    if (!user_id) return res.status(401).json({ error: 'Chưa đăng nhập' });
    const db = getDb(req);
    const [rows] = await db.execute('SELECT id, username, email, gender FROM users WHERE id = ?', [user_id]);
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy user' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật thông tin profile user
router.put('/user/profile', async (req, res) => {
  try {
    // Lấy user_id từ body hoặc headers (giả lập)
    const user_id = req.body?.user_id || req.headers?.['x-user-id'];
    if (!user_id) return res.status(401).json({ error: 'Chưa đăng nhập' });
    const { username, gender } = req.body;
    if (!username) return res.status(400).json({ error: 'Thiếu tên hiển thị' });
    const db = getDb(req);
    await db.execute('UPDATE users SET username = ?, gender = ? WHERE id = ?', [username, gender || 'other', user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đổi mật khẩu
router.post('/user/change-password', async (req, res) => {
  try {
    const user_id = req.body?.user_id || req.headers?.['x-user-id'];
    const { oldPassword, newPassword } = req.body;
    if (!user_id || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Thiếu thông tin' });
    }
    const db = getDb(req);
    // Lấy user
    const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [user_id]);
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy user' });
    const user = rows[0];
    // So sánh mật khẩu cũ
    const match = await require('bcrypt').compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Mật khẩu cũ không đúng' });
    // Hash mật khẩu mới
    const hash = await require('bcrypt').hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CRUD PRODUCERS =====
router.get('/producers', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM producers ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post('/producers', async (req, res) => {
  const { name, country_id } = req.body;
  if (!name) return res.status(400).json({ message: 'Missing name' });
  try {
    const db = getDb(req);
    await db.execute('INSERT INTO producers (name, country_id) VALUES (?, ?)', [name, country_id || null]);
    res.json({ message: 'Producer added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/producers/:id', async (req, res) => {
  const { name, country_id } = req.body;
  try {
    const db = getDb(req);
    await db.execute('UPDATE producers SET name=?, country_id=? WHERE id=?', [name, country_id || null, req.params.id]);
    res.json({ message: 'Producer updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete('/producers/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM producers WHERE id=?', [req.params.id]);
    res.json({ message: 'Producer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== USER MANAGEMENT (ADMIN) =====
// Lấy danh sách user
router.get('/users', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT id, username, email, is_admin, gender, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Cập nhật quyền admin
router.put('/users/:id/admin', async (req, res) => {
  const { is_admin } = req.body;
  try {
    const db = getDb(req);
    await db.execute('UPDATE users SET is_admin=? WHERE id=?', [is_admin ? 1 : 0, req.params.id]);
    res.json({ message: 'Cập nhật quyền admin thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Xóa user
router.delete('/users/:id', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sửa thông tin user
router.put('/users/:id', async (req, res) => {
  const { username, email, gender } = req.body;
  try {
    const db = getDb(req);
    await db.execute('UPDATE users SET username=?, email=?, gender=? WHERE id=?', [username, email, gender, req.params.id]);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== ADMIN DASHBOARD STATS =====
router.get('/admin/stats', async (req, res) => {
  try {
    const db = getDb(req);
    const [[{ total_movies }]] = await db.query('SELECT COUNT(*) as total_movies FROM movies');
    const [[{ total_genres }]] = await db.query('SELECT COUNT(*) as total_genres FROM genres');
    const [[{ total_countries }]] = await db.query('SELECT COUNT(*) as total_countries FROM countries');
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ ongoing_movies }]] = await db.query("SELECT COUNT(*) as ongoing_movies FROM movies WHERE status='ongoing'");
    const [[{ completed_movies }]] = await db.query("SELECT COUNT(*) as completed_movies FROM movies WHERE status='completed'");
    const [recent_movies] = await db.query('SELECT id, title, poster_url, created_at FROM movies ORDER BY created_at DESC LIMIT 8');
    res.json({
      total_movies,
      total_genres,
      total_countries,
      total_users,
      ongoing_movies,
      completed_movies,
      recent_movies
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== CATEGORIES API ====================

// Lấy tất cả danh mục
router.get('/categories', async (req, res) => {
  try {
    const db = getDb(req);
    const [rows] = await db.execute('SELECT * FROM categories ORDER BY id DESC');
    
    // Lấy thông tin genres và countries cho từng category
    const categoriesWithDetails = await Promise.all(rows.map(async (category) => {
      // Lấy genres của category
      const [genres] = await db.execute(
        `SELECT g.* FROM genres g
         JOIN category_genres cg ON g.id = cg.genre_id
         WHERE cg.category_id = ?`,
        [category.id]
      );
      
      // Lấy countries của category (thử-catch để tránh lỗi nếu bảng chưa tồn tại)
      let countries = [];
      try {
        const [countryRows] = await db.execute(
          `SELECT c.* FROM countries c
           JOIN category_countries cc ON c.id = cc.country_id
           WHERE cc.category_id = ?`,
          [category.id]
        );
        countries = countryRows;
      } catch (err) {
        console.log('Bảng category_countries chưa tồn tại:', err.message);
      }
      
      return {
        ...category,
        genres,
        countries
      };
    }));
    
    res.json(categoriesWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm danh mục mới
router.post('/categories', async (req, res) => {
  const { name, genreIds, countryIds } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' });
  
  try {
    const db = getDb(req);
    const [result] = await db.execute('INSERT INTO categories (name, created_at) VALUES (?, NOW())', [name]);
    const categoryId = result.insertId;
    
    // Thêm liên kết với thể loại nếu có
    if (Array.isArray(genreIds) && genreIds.length > 0) {
      for (const genreId of genreIds) {
        await db.execute('INSERT INTO category_genres (category_id, genre_id) VALUES (?, ?)', [categoryId, genreId]);
      }
    }
    
    // Thêm liên kết với quốc gia nếu có
    try {
      if (Array.isArray(countryIds) && countryIds.length > 0) {
        for (const countryId of countryIds) {
          await db.execute('INSERT INTO category_countries (category_id, country_id) VALUES (?, ?)', [categoryId, countryId]);
        }
      }
    } catch (err) {
      console.log('Bảng category_countries chưa tồn tại, bỏ qua xử lý quốc gia:', err.message);
    }
    
    res.json({ success: true, id: categoryId, message: 'Thêm danh mục thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sửa danh mục
router.put('/categories/:id', async (req, res) => {
  const { name, genreIds, countryIds } = req.body;
  const categoryId = req.params.id;
  
  console.log('PUT /categories/:id', { categoryId, name, genreIds, countryIds });
  
  if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' });
  
  try {
    const db = getDb(req);
    await db.execute('UPDATE categories SET name = ? WHERE id = ?', [name, categoryId]);
    
    // Xóa các liên kết thể loại cũ
    await db.execute('DELETE FROM category_genres WHERE category_id = ?', [categoryId]);
    
    // Thêm lại các liên kết thể loại mới
    if (Array.isArray(genreIds) && genreIds.length > 0) {
      for (const genreId of genreIds) {
        await db.execute('INSERT INTO category_genres (category_id, genre_id) VALUES (?, ?)', [categoryId, genreId]);
      }
    }
    
    // Xóa các liên kết quốc gia cũ (nếu bảng tồn tại)
    try {
      await db.execute('DELETE FROM category_countries WHERE category_id = ?', [categoryId]);
      
      // Thêm lại các liên kết quốc gia mới
      if (Array.isArray(countryIds) && countryIds.length > 0) {
        for (const countryId of countryIds) {
          await db.execute('INSERT INTO category_countries (category_id, country_id) VALUES (?, ?)', [categoryId, countryId]);
        }
      }
    } catch (err) {
      console.log('Bảng category_countries chưa tồn tại, bỏ qua xử lý quốc gia:', err.message);
    }
    
    res.json({ success: true, message: 'Cập nhật danh mục thành công' });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ message: err.message });
  }
});

// Xóa danh mục
router.delete('/categories/:id', async (req, res) => {
  const categoryId = req.params.id;
  
  try {
    const db = getDb(req);
    // Xóa các liên kết trước khi xóa category
    await db.execute('DELETE FROM category_genres WHERE category_id = ?', [categoryId]);
    
    // Xóa liên kết quốc gia nếu bảng tồn tại
    try {
      await db.execute('DELETE FROM category_countries WHERE category_id = ?', [categoryId]);
    } catch (err) {
      console.log('Bảng category_countries chưa tồn tại, bỏ qua:', err.message);
    }
    
    await db.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
    res.json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy thể loại của danh mục
router.get('/categories/:id/genres', async (req, res) => {
  const categoryId = req.params.id;
  
  try {
    const db = getDb(req);
    const [rows] = await db.execute(
      `SELECT g.* FROM genres g
       JOIN category_genres cg ON g.id = cg.genre_id
       WHERE cg.category_id = ?`,
      [categoryId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy quốc gia của danh mục
router.get('/categories/:id/countries', async (req, res) => {
  const categoryId = req.params.id;
  
  try {
    const db = getDb(req);
    const [rows] = await db.execute(
      `SELECT c.* FROM countries c
       JOIN category_countries cc ON c.id = cc.country_id
       WHERE cc.category_id = ?`,
      [categoryId]
    );
    res.json(rows);
  } catch (err) {
    console.log('Lỗi khi lấy quốc gia của danh mục:', err.message);
    // Trả về mảng rỗng nếu bảng chưa tồn tại
    res.json([]);
  }
});

// Lấy phim theo danh mục (dựa trên các thể loại và quốc gia của danh mục)
router.get('/categories/:id/movies', async (req, res) => {
  const categoryId = req.params.id;
  
  try {
    const db = getDb(req);
    
    // Lấy các genre_id của category này
    const [genres] = await db.execute(
      'SELECT genre_id FROM category_genres WHERE category_id = ?',
      [categoryId]
    );
    
    // Lấy các country_id của category này
    const [countries] = await db.execute(
      'SELECT country_id FROM category_countries WHERE category_id = ?',
      [categoryId]
    );
    
    if (genres.length === 0 && countries.length === 0) {
      return res.json([]);
    }
    
    const genreIds = genres.map(g => g.genre_id);
    const countryIds = countries.map(c => c.country_id);
    
    let sql = 'SELECT DISTINCT m.* FROM movies m';
    let params = [];
    let conditions = [];
    
    // Thêm điều kiện genre nếu có
    if (genreIds.length > 0) {
      sql += ' JOIN movie_genres mg ON m.id = mg.movie_id';
      conditions.push(`mg.genre_id IN (${genreIds.map(() => '?').join(',')})`);
      params.push(...genreIds);
    }
    
    // Thêm điều kiện country nếu có
    if (countryIds.length > 0) {
      sql += ' JOIN movie_countries mc ON m.id = mc.movie_id';
      conditions.push(`mc.country_id IN (${countryIds.map(() => '?').join(',')})`);
      params.push(...countryIds);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY m.created_at DESC';
    
    const [movies] = await db.execute(sql, params);
    
    // Thêm thông tin genres và countries cho từng phim
    const moviesWithDetails = await Promise.all(movies.map(async (movie) => {
      // Lấy genres của phim
      const [movieGenres] = await db.execute(
        `SELECT g.* FROM genres g
         JOIN movie_genres mg ON g.id = mg.genre_id
         WHERE mg.movie_id = ?`,
        [movie.id]
      );
      
      // Lấy countries của phim
      const [movieCountries] = await db.execute(
        `SELECT c.* FROM countries c
         JOIN movie_countries mc ON c.id = mc.country_id
         WHERE mc.movie_id = ?`,
        [movie.id]
      );
      
      return {
        ...movie,
        genres: movieGenres,
        countries: movieCountries
      };
    }));
    
    res.json(moviesWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API để tạo bảng category_countries (chỉ dùng một lần)
router.post('/setup/category-countries', async (req, res) => {
  try {
    const db = getDb(req);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`category_countries\` (
        \`category_id\` int(11) NOT NULL,
        \`country_id\` int(11) NOT NULL,
        PRIMARY KEY (\`category_id\`, \`country_id\`),
        FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`country_id\`) REFERENCES \`countries\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    res.json({ success: true, message: 'Bảng category_countries đã được tạo thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 