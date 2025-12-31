/**
 * ADELE - Node.js Express Server for AWS EC2 Deployment
 * Converts Cloudflare Worker API to standard Node.js/Express
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for SPA
}));
app.use(compression());
app.use(cors({
  origin: process.env.APP_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    } catch (error) {
      // Token invalid, continue without user
    }
  }
  next();
};

// ==========================================
// Health Check
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: process.env.VERSION || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// ==========================================
// Authentication Routes
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, 'user') 
       RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name]
    );

    const user = result.rows[0];

    // Create default settings
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1)`,
      [user.id]
    );

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last signed in
    await pool.query('UPDATE users SET last_signed_in = NOW() WHERE id = $1', [user.id]);

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    // Get subscription
    const subResult = await pool.query(
      'SELECT plan, status, current_period_end, cancel_at_period_end FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        avatarUrl: req.user.avatar_url,
        emailVerified: req.user.email_verified,
        createdAt: req.user.created_at
      },
      subscription: subResult.rows[0] || { plan: 'free', status: 'active' }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    
    if (result.rows.length > 0) {
      // TODO: Send password reset email
      console.log(`Password reset requested for: ${email}`);
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ==========================================
// Projects Routes
// ==========================================
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const filesResult = await pool.query(
      'SELECT * FROM generated_files WHERE project_id = $1 ORDER BY path',
      [id]
    );

    const tasksResult = await pool.query(
      'SELECT * FROM agent_tasks WHERE project_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      project: projectResult.rows[0],
      files: filesResult.rows,
      tasks: tasksResult.rows
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { name, description, type, techStack } = req.body;

    const result = await pool.query(
      `INSERT INTO projects (user_id, name, description, type, tech_stack, status)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING *`,
      [req.user.id, name, description || '', type || 'custom', JSON.stringify(techStack || [])]
    );

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.patch('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, description, status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ==========================================
// Chat Routes
// ==========================================
app.get('/api/chat/:projectId/messages', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project ownership
    const projectResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.post('/api/chat/:projectId/messages', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;

    // Verify project ownership
    const projectResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Save user message
    const userMessageResult = await pool.query(
      `INSERT INTO chat_messages (project_id, role, content)
       VALUES ($1, 'user', $2)
       RETURNING *`,
      [projectId, content]
    );

    // Generate AI response (placeholder - integrate with OpenAI)
    const aiResponse = `I understand you want to: "${content}". Let me help you with that. This is a placeholder response - please configure your OpenAI API key for actual AI responses.`;

    // Save assistant message
    const assistantMessageResult = await pool.query(
      `INSERT INTO chat_messages (project_id, role, content)
       VALUES ($1, 'assistant', $2)
       RETURNING *`,
      [projectId, aiResponse]
    );

    res.json({
      userMessage: userMessageResult.rows[0],
      assistantMessage: assistantMessageResult.rows[0]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==========================================
// Templates Routes
// ==========================================
app.get('/api/templates', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM app_templates WHERE is_active = true ORDER BY usage_count DESC'
    );
    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

app.get('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM app_templates WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// ==========================================
// User Profile Routes
// ==========================================
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const settingsResult = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.id]
    );

    const subResult = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );

    const bioResult = await pool.query(
      'SELECT * FROM biometric_info WHERE user_id = $1',
      [req.user.id]
    );

    const onboardingResult = await pool.query(
      'SELECT * FROM onboarding_progress WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        avatarUrl: req.user.avatar_url,
        emailVerified: req.user.email_verified,
        createdAt: req.user.created_at
      },
      settings: settingsResult.rows[0] || null,
      subscription: subResult.rows[0] || { plan: 'free', status: 'active' },
      biometrics: bioResult.rows[0] || null,
      onboarding: onboardingResult.rows[0] || null
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.patch('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           avatar_url = COALESCE($2, avatar_url),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, name, role, avatar_url, email_verified, created_at`,
      [name, avatarUrl, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.patch('/api/users/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;

    // Upsert settings
    await pool.query(
      `INSERT INTO user_settings (user_id, theme, language, timezone, voice_enabled, voice_language, tts_enabled, tts_provider, editor_font_size, editor_tab_size, auto_save)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id) DO UPDATE SET
         theme = COALESCE($2, user_settings.theme),
         language = COALESCE($3, user_settings.language),
         timezone = COALESCE($4, user_settings.timezone),
         voice_enabled = COALESCE($5, user_settings.voice_enabled),
         voice_language = COALESCE($6, user_settings.voice_language),
         tts_enabled = COALESCE($7, user_settings.tts_enabled),
         tts_provider = COALESCE($8, user_settings.tts_provider),
         editor_font_size = COALESCE($9, user_settings.editor_font_size),
         editor_tab_size = COALESCE($10, user_settings.editor_tab_size),
         auto_save = COALESCE($11, user_settings.auto_save),
         updated_at = NOW()`,
      [
        req.user.id,
        settings.theme,
        settings.language,
        settings.timezone,
        settings.voiceEnabled,
        settings.voiceLanguage,
        settings.ttsEnabled,
        settings.ttsProvider,
        settings.editorFontSize,
        settings.editorTabSize,
        settings.autoSave
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ==========================================
// Stripe Routes (Basic)
// ==========================================
app.get('/api/stripe/plans', (req, res) => {
  res.json({
    plans: {
      free: {
        name: 'Free',
        price: 0,
        features: ['5 projects', 'Basic templates', 'Community support']
      },
      pro: {
        name: 'Pro',
        price: 29,
        features: ['Unlimited projects', 'All templates', 'Priority support', 'Custom domains']
      },
      enterprise: {
        name: 'Enterprise',
        price: 99,
        features: ['Everything in Pro', 'Team collaboration', 'SSO', 'Dedicated support']
      }
    }
  });
});

app.get('/api/stripe/subscription', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      subscription: result.rows[0] || { plan: 'free', status: 'active' }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// ==========================================
// Admin Routes
// ==========================================
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const projectsResult = await pool.query('SELECT COUNT(*) as count FROM projects');
    const subsResult = await pool.query(
      "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND plan != 'free'"
    );

    res.json({
      totalUsers: parseInt(usersResult.rows[0].count),
      totalProjects: parseInt(projectsResult.rows[0].count),
      activeSubscriptions: parseInt(subsResult.rows[0].count),
      monthlyRevenue: 0 // Calculate from Stripe
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, email_verified, created_at, last_signed_in FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// ==========================================
// Serve Static Frontend
// ==========================================
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
========================================
ADELE Server Started
========================================
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Time: ${new Date().toISOString()}
========================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
