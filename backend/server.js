const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const mariadb = require('mariadb');
const path = require('path');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const PORT = process.env.PORT || 3001;

// Minimal middleware setup as per simplified tech stack
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Database connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_profiles',
  connectionLimit: 5
});

// Helper function to convert BigInt to Number for JSON serialization
function convertBigIntToNumber(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "bigint") {
    return Number(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  if (typeof obj === "object") {
    const result = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertBigIntToNumber(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

// File upload configuration (10MB limit as per challenge requirements)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Helper function to convert BigInt to Number for JSON serialization
function convertBigIntToNumber(obj) {
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }
  return obj;
}

// In-memory user storage (temporary solution until database is set up)
let users = [
  { id: 1, email: 'admin@test.com', password: 'admin123', role: 'teacher' },
  { id: 2, email: 'user@test.com', password: 'user123', role: 'student' },
  { id: 3, email: 'test@test.com', password: 'test123', role: 'student' }
];

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user in memory store
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password (first check if it's hashed, then plain text for backward compatibility)
    let isValidPassword = false;
    
    if (user.password.startsWith('$2b$')) {
      // Password is hashed
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password (for demo users)
      isValidPassword = password === user.password;
    }
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    res.json({ 
      message: 'Login successful',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, confirmPassword, name, role = 'student' } = req.body;
    
    // Basic validation
    if (!email || !password || !confirmPassword || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if user already exists in memory store
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user in memory store
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      role,
      name
    };
    
    users.push(newUser);
    
    console.log('New user created:', { email, role, name });
    
    res.status(201).json({ 
      message: 'Account created successfully',
      user: { 
        id: newUser.id, 
        email: newUser.email, 
        name: newUser.name,
        role: newUser.role 
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/check', async (req, res) => {
  if (req.session.userId) {
    try {
      const user = users.find(u => u.id === req.session.userId);
      
      if (!user) {
        req.session.destroy();
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email,
          role: user.role 
        } 
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});


// Student profile CRUD operations
app.get('/api/students', requireAuth, async (req, res) => {
  try {
    // Mock data for testing
    const mockStudents = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@university.edu',
        year_grade: 'Senior',
        major_focus: 'Computer Science',
        short_term_goals: 'Complete capstone project successfully',
        long_term_goals: 'Secure a software engineering position at a tech company',
        interests: 'Machine Learning, Web Development, Gaming',
        extracurricular: 'Programming Club President, Hackathon participant',
        skill_names: 'JavaScript, Python, React, Node.js, SQL',
        skill_levels: 'advanced, intermediate, advanced, intermediate, beginner'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@university.edu',
        year_grade: 'Junior',
        major_focus: 'Data Science',
        short_term_goals: 'Master deep learning frameworks',
        long_term_goals: 'Become a data scientist at a research institution',
        interests: 'Artificial Intelligence, Statistics, Research',
        extracurricular: 'Research Assistant, Data Science Club',
        skill_names: 'Python, R, TensorFlow, SQL, Statistics',
        skill_levels: 'advanced, intermediate, beginner, intermediate, advanced'
      },
      {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike.johnson@university.edu',
        year_grade: 'Sophomore',
        major_focus: 'Information Systems',
        short_term_goals: 'Learn cloud computing technologies',
        long_term_goals: 'Work as a systems architect',
        interests: 'Cloud Computing, Cybersecurity, System Design',
        extracurricular: 'IT Help Desk, Cybersecurity Club',
        skill_names: 'Java, AWS, Linux, Docker, Networking',
        skill_levels: 'intermediate, beginner, intermediate, beginner, intermediate'
      }
    ];
    
    res.json(mockStudents);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update student profile
app.put('/api/students/:id', requireAuth, async (req, res) => {
  try {
    const { name, email, year_grade, major_focus, short_term_goals, long_term_goals, interests, extracurricular, skills } = req.body;
    const studentId = req.params.id;
    
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    
    try {
      // Update student basic info
      await conn.query(
        'UPDATE students SET name = ?, email = ?, year_grade = ?, major_focus = ?, short_term_goals = ?, long_term_goals = ?, interests = ?, extracurricular = ? WHERE id = ?',
        [name, email, year_grade, major_focus, short_term_goals, long_term_goals, interests, extracurricular, studentId]
      );
      
      // Delete existing skills
      await conn.query('DELETE FROM student_skills WHERE student_id = ?', [studentId]);
      
      // Insert updated skills
      if (skills && skills.length > 0) {
        for (const skill of skills) {
          await conn.query(
            'INSERT INTO student_skills (student_id, skill_name, proficiency_level) VALUES (?, ?, ?)',
            [studentId, skill.name, skill.level || 'beginner']
          );
        }
      }
      
      await conn.commit();
      conn.release();
      
      res.json({ message: 'Student updated successfully' });
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete student profile
app.delete('/api/students/:id', requireAuth, async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    
    try {
      // Delete related skills (cascade will handle this, but being explicit)
      await conn.query('DELETE FROM student_skills WHERE student_id = ?', [studentId]);
      
      // Delete student
      const result = await conn.query('DELETE FROM students WHERE id = ?', [studentId]);
      
      if (result.affectedRows === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ error: 'Student not found' });
      }
      
      await conn.commit();
      conn.release();
      
      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/students', requireAuth, async (req, res) => {
  try {
    const { name, email, year_grade, major_focus, short_term_goals, long_term_goals, interests, extracurricular, skills } = req.body;
    
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    
    try {
      const result = await conn.query(
        'INSERT INTO students (name, email, year_grade, major_focus, short_term_goals, long_term_goals, interests, extracurricular) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, year_grade, major_focus, short_term_goals, long_term_goals, interests, extracurricular]
      );
      
      const studentId = result.insertId;
      
      if (skills && skills.length > 0) {
        for (const skill of skills) {
          await conn.query(
            'INSERT INTO student_skills (student_id, skill_name, proficiency_level) VALUES (?, ?, ?)',
            [studentId, skill.name, skill.level || 'beginner']
          );
        }
      }
      
      await conn.commit();
      conn.release();
      
      res.json({ id: studentId, message: 'Student created successfully' });
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/students/:id', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const students = await conn.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    const skills = await conn.query('SELECT * FROM student_skills WHERE student_id = ?', [req.params.id]);
    conn.release();
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ ...students[0], skills });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resume upload with parsing and version history
app.post('/api/students/:id/resume', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const studentId = req.params.id;
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    
    try {
      // Check for existing versions
      const existingFiles = await conn.query(
        'SELECT MAX(version) as max_version FROM uploaded_files WHERE student_id = ?',
        [studentId]
      );
      
      const nextVersion = (existingFiles[0].max_version || 0) + 1;
      
      // Store the resume file
      const result = await conn.query(
        'INSERT INTO uploaded_files (student_id, file_name, file_type, file_size, file_data, file_hash, version) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [studentId, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer, fileHash, nextVersion]
      );
      
      // Parse resume content
      let parsedData = null;
      try {
        parsedData = await parseResumeContent(req.file.buffer, req.file.mimetype);
        
        // Auto-populate student profile with extracted data
        if (parsedData) {
          await autoPopulateFromResume(conn, studentId, parsedData);
        }
      } catch (parseError) {
        console.warn('Resume parsing failed:', parseError);
        // Continue with upload even if parsing fails
      }
      
      await conn.commit();
      conn.release();
      
      res.json({ 
        id: result.insertId,
        message: 'Resume uploaded successfully',
        version: nextVersion,
        filename: req.file.originalname,
        parsed: parsedData ? true : false,
        extractedData: parsedData
      });
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get resume versions for a student
app.get('/api/students/:id/resumes', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const resumes = await conn.query(`
      SELECT id, file_name, file_type, file_size, file_hash, version, upload_date
      FROM uploaded_files 
      WHERE student_id = ? 
      ORDER BY version DESC
    `, [req.params.id]);
    conn.release();
    
    res.json(resumes);
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download specific resume version
app.get('/api/resumes/:id/download', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const files = await conn.query(
      'SELECT file_name, file_type, file_data FROM uploaded_files WHERE id = ?',
      [req.params.id]
    );
    conn.release();
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = files[0];
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.send(file.file_data);
  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Parse resume content based on file type
async function parseResumeContent(buffer, mimeType) {
  let text = '';
  
  try {
    if (mimeType === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const docxData = await mammoth.extractRawText({ buffer });
      text = docxData.value;
    } else {
      throw new Error('Unsupported file type');
    }
    
    // Extract structured information from text
    return extractResumeData(text);
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw error;
  }
}

// Extract structured data from resume text
function extractResumeData(text) {
  const data = {
    skills: [],
    experience: [],
    education: [],
    contact: {},
    summary: ''
  };
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Common skill keywords to look for
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css',
    'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'mongodb',
    'postgresql', 'mysql', 'typescript', 'angular', 'vue', 'express',
    'spring', 'django', 'flask', 'laravel', 'php', 'ruby', 'go',
    'communication', 'leadership', 'teamwork', 'problem solving',
    'project management', 'analytical', 'creative', 'organizational'
  ];
  
  // Extract skills
  const skillsSection = findSectionText(text, ['skills', 'technical skills', 'competencies']);
  if (skillsSection) {
    for (const keyword of skillKeywords) {
      if (skillsSection.toLowerCase().includes(keyword.toLowerCase())) {
        data.skills.push(keyword);
      }
    }
  }
  
  // Also scan entire document for skills
  const lowerText = text.toLowerCase();
  for (const keyword of skillKeywords) {
    if (lowerText.includes(keyword.toLowerCase()) && !data.skills.includes(keyword)) {
      data.skills.push(keyword);
    }
  }
  
  // Extract contact information
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    data.contact.email = emailMatch[0];
  }
  
  const phoneMatch = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
  if (phoneMatch) {
    data.contact.phone = phoneMatch[0];
  }
  
  // Extract experience (simplified)
  const experienceSection = findSectionText(text, ['experience', 'work experience', 'employment']);
  if (experienceSection) {
    // Look for years to identify experience entries
    const yearMatches = experienceSection.match(/\b(19|20)\d{2}\b/g);
    if (yearMatches) {
      data.experience.push({
        years: yearMatches.length > 1 ? `${Math.min(...yearMatches)} - ${Math.max(...yearMatches)}` : yearMatches[0],
        description: experienceSection.substring(0, 200) + '...'
      });
    }
  }
  
  // Extract education
  const educationSection = findSectionText(text, ['education', 'academic background']);
  if (educationSection) {
    const degreeMatch = educationSection.match(/\b(bachelor|master|phd|associate|diploma|certificate)/i);
    if (degreeMatch) {
      data.education.push({
        degree: degreeMatch[0],
        description: educationSection.substring(0, 100) + '...'
      });
    }
  }
  
  return data;
}

// Find text content of a specific section
function findSectionText(text, sectionHeaders) {
  const lowerText = text.toLowerCase();
  
  for (const header of sectionHeaders) {
    const headerIndex = lowerText.indexOf(header.toLowerCase());
    if (headerIndex !== -1) {
      // Find the end of this section (next section header or end of document)
      const afterHeader = text.substring(headerIndex + header.length);
      const nextSectionMatch = afterHeader.match(/\n\s*[A-Z][A-Z\s]{2,}:/);
      const sectionEnd = nextSectionMatch ? nextSectionMatch.index : Math.min(afterHeader.length, 500);
      
      return afterHeader.substring(0, sectionEnd);
    }
  }
  
  return null;
}

// Auto-populate student profile from parsed resume data
async function autoPopulateFromResume(conn, studentId, resumeData) {
  try {
    // Get current student data for comparison
    const currentStudent = await conn.query('SELECT * FROM students WHERE id = ?', [studentId]);
    const currentSkills = await conn.query('SELECT skill_name FROM student_skills WHERE student_id = ?', [studentId]);
    
    if (currentStudent.length === 0) return;
    
    const student = currentStudent[0];
    const existingSkills = currentSkills.map(s => s.skill_name.toLowerCase());
    
    // Add new skills from resume
    for (const skill of resumeData.skills) {
      if (!existingSkills.includes(skill.toLowerCase())) {
        await conn.query(
          'INSERT INTO student_skills (student_id, skill_name, proficiency_level) VALUES (?, ?, ?)',
          [studentId, skill, 'intermediate'] // Default to intermediate for resume skills
        );
      }
    }
    
    // Store discrepancies for review
    const discrepancies = [];
    
    // Check for email discrepancies
    if (resumeData.contact.email && student.email !== resumeData.contact.email) {
      discrepancies.push({
        field: 'email',
        profile_value: student.email,
        resume_value: resumeData.contact.email
      });
    }
    
    // Check for skill discrepancies (skills in profile but not in resume)
    const resumeSkillsLower = resumeData.skills.map(s => s.toLowerCase());
    for (const existingSkill of existingSkills) {
      if (!resumeSkillsLower.includes(existingSkill)) {
        discrepancies.push({
          field: 'skills',
          profile_value: existingSkill,
          resume_value: 'not found in resume'
        });
      }
    }
    
    // Store discrepancies for later review
    if (discrepancies.length > 0) {
      await conn.query(
        'INSERT INTO resume_discrepancies (student_id, discrepancies, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE discrepancies = VALUES(discrepancies), updated_at = NOW()',
        [studentId, JSON.stringify(discrepancies)]
      );
    }
    
  } catch (error) {
    console.error('Auto-populate from resume error:', error);
    throw error;
  }
}

// Survey management routes
app.get('/api/surveys', requireAuth, async (req, res) => {
  try {
    // Mock survey data for testing
    const mockSurveys = [
      {
        id: 1,
        title: 'Career Interests Survey',
        description: 'Help us understand your career goals and interests',
        questions: JSON.stringify([
          { id: 1, question: 'What is your preferred work environment?', type: 'multiple-choice', options: ['Remote', 'Hybrid', 'On-site', 'No preference'] },
          { id: 2, question: 'Which industry interests you most?', type: 'multiple-choice', options: ['Technology', 'Finance', 'Healthcare', 'Education', 'Other'] },
          { id: 3, question: 'Describe your ideal job role', type: 'text' }
        ]),
        is_active: true,
        created_at: '2024-01-15T10:00:00Z',
        created_by: 1,
        created_by_email: 'admin@test.com',
        total_responses: 25,
        unique_responses: 20
      },
      {
        id: 2,
        title: 'Skills Assessment',
        description: 'Evaluate your current skill levels and identify areas for improvement',
        questions: JSON.stringify([
          { id: 1, question: 'Rate your programming skills', type: 'scale', min: 1, max: 10 },
          { id: 2, question: 'Which programming languages do you know?', type: 'multiple-select', options: ['JavaScript', 'Python', 'Java', 'C++', 'R', 'SQL'] },
          { id: 3, question: 'What skills would you like to develop?', type: 'text' }
        ]),
        is_active: true,
        created_at: '2024-02-01T09:00:00Z',
        created_by: 1,
        created_by_email: 'admin@test.com',
        total_responses: 18,
        unique_responses: 15
      }
    ];
    
    res.json(mockSurveys);
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/surveys', requireAuth, async (req, res) => {
  let conn;
  try {
    const { title, description, questions } = req.body;
    
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Survey title is required' });
    }
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Survey must have at least one question' });
    }
    
    // Validate each question structure
    for (const question of questions) {
      if (!question.id || !question.text || !question.type) {
        return res.status(400).json({ error: 'Invalid question structure - each question must have id, text, and type' });
      }
      
      // Validate question types
      const validTypes = ['text', 'multiple_choice', 'checkboxes', 'rating'];
      if (!validTypes.includes(question.type)) {
        return res.status(400).json({ error: `Invalid question type: ${question.type}` });
      }
    }
    
    if (!req.session.userId) {
      return res.status(401).json({ error: 'User session invalid' });
    }
    
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO surveys (title, description, questions, created_by) VALUES (?, ?, ?, ?)',
      [title, description, JSON.stringify(questions), req.session.userId]
    );
    
    const responseData = { id: result.insertId, message: 'Survey created successfully' };
    res.json(convertBigIntToNumber(responseData));
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/surveys/:id', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const surveys = await conn.query('SELECT * FROM surveys WHERE id = ?', [req.params.id]);
    conn.release();
    
    if (surveys.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    const survey = surveys[0];
    survey.questions = JSON.parse(survey.questions);
    res.json(survey);
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/surveys/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, questions, is_active } = req.body;
    
    const conn = await pool.getConnection();
    const result = await conn.query(
      'UPDATE surveys SET title = ?, description = ?, questions = ?, is_active = ? WHERE id = ? AND created_by = ?',
      [title, description, JSON.stringify(questions), is_active, req.params.id, req.session.userId]
    );
    conn.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Survey not found or not authorized' });
    }
    
    res.json({ message: 'Survey updated successfully' });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Survey response routes
app.post('/api/surveys/:id/responses', requireAuth, async (req, res) => {
  try {
    const { student_id, responses } = req.body;
    const surveyId = req.params.id;
    
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    
    try {
      // Insert or update survey response
      await conn.query(
        'INSERT INTO survey_responses (survey_id, student_id, responses) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE responses = VALUES(responses), completed_at = CURRENT_TIMESTAMP',
        [surveyId, student_id, JSON.stringify(responses)]
      );
      
      // Auto-populate student profile based on survey responses
      await autoPopulateStudentProfile(conn, student_id, responses);
      
      await conn.commit();
      conn.release();
      
      res.json({ message: 'Survey response saved successfully' });
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error('Save survey response error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/surveys/:id/responses', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const responses = await conn.query(`
      SELECT sr.*, s.name as student_name, s.email as student_email
      FROM survey_responses sr
      JOIN students s ON sr.student_id = s.id
      WHERE sr.survey_id = ?
      ORDER BY sr.completed_at DESC
    `, [req.params.id]);
    conn.release();
    
    // Parse responses JSON
    responses.forEach(response => {
      response.responses = JSON.parse(response.responses);
    });
    
    res.json(responses);
  } catch (error) {
    console.error('Get survey responses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Survey templates
app.get('/api/survey-templates', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const templates = await conn.query(`
      SELECT * FROM survey_templates 
      WHERE created_by = ? OR template_type IN ('beginning_term', 'mid_term', 'project_preferences')
      ORDER BY template_type, name
    `, [req.session.userId]);
    conn.release();
    
    // Parse questions JSON
    templates.forEach(template => {
      template.questions = JSON.parse(template.questions);
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Get survey templates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/survey-templates', requireAuth, async (req, res) => {
  try {
    const { name, template_type, questions } = req.body;
    
    const conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO survey_templates (name, template_type, questions, created_by) VALUES (?, ?, ?, ?)',
      [name, template_type, JSON.stringify(questions), req.session.userId]
    );
    conn.release();
    
    res.json({ id: result.insertId, message: 'Survey template created successfully' });
  } catch (error) {
    console.error('Create survey template error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Auto-populate student profile from survey responses
async function autoPopulateStudentProfile(conn, studentId, responses) {
  const updates = {};
  
  // Map common survey questions to student profile fields
  for (const [questionId, answer] of Object.entries(responses)) {
    const lowerAnswer = String(answer).toLowerCase();
    
    if (questionId.includes('goal') || questionId.includes('objective')) {
      if (questionId.includes('short') || questionId.includes('current')) {
        updates.short_term_goals = answer;
      } else if (questionId.includes('long') || questionId.includes('career')) {
        updates.long_term_goals = answer;
      }
    } else if (questionId.includes('interest')) {
      updates.interests = answer;
    } else if (questionId.includes('activity') || questionId.includes('extracurricular')) {
      updates.extracurricular = answer;
    } else if (questionId.includes('skill')) {
      // Handle skills array
      const skills = Array.isArray(answer) ? answer : [answer];
      for (const skill of skills) {
        await conn.query(
          'INSERT INTO student_skills (student_id, skill_name, proficiency_level) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level)',
          [studentId, skill, 'beginner']
        );
      }
    }
  }
  
  // Update student profile with survey data
  if (Object.keys(updates).length > 0) {
    const fields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updates);
    await conn.query(
      `UPDATE students SET ${fields} WHERE id = ?`,
      [...values, studentId]
    );
  }
}

// Analytics and dashboard routes
app.get('/api/analytics/overview', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Get class-wide statistics
    const totalStudents = await conn.query('SELECT COUNT(*) as count FROM students');
    const totalSkills = await conn.query('SELECT COUNT(DISTINCT skill_name) as count FROM student_skills');
    const avgSkillsPerStudent = await conn.query(`
      SELECT AVG(skill_count) as avg_skills FROM (
        SELECT student_id, COUNT(*) as skill_count 
        FROM student_skills 
        GROUP BY student_id
      ) as skill_counts
    `);
    
    // Skill distribution
    const skillDistribution = await conn.query(`
      SELECT skill_name, COUNT(*) as student_count, 
             GROUP_CONCAT(proficiency_level) as levels
      FROM student_skills 
      GROUP BY skill_name 
      ORDER BY student_count DESC 
      LIMIT 20
    `);
    
    // Goal analysis
    const goalStats = await conn.query(`
      SELECT 
        COUNT(CASE WHEN short_term_goals IS NOT NULL AND short_term_goals != '' THEN 1 END) as students_with_short_goals,
        COUNT(CASE WHEN long_term_goals IS NOT NULL AND long_term_goals != '' THEN 1 END) as students_with_long_goals
      FROM students
    `);
    
    // Interest analysis
    const interestStats = await conn.query(`
      SELECT interests, COUNT(*) as count 
      FROM students 
      WHERE interests IS NOT NULL AND interests != ''
      GROUP BY interests 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    // Survey completion rates
    const surveyStats = await conn.query(`
      SELECT s.title, COUNT(sr.id) as responses, s.is_active
      FROM surveys s
      LEFT JOIN survey_responses sr ON s.id = sr.survey_id
      GROUP BY s.id, s.title, s.is_active
      ORDER BY responses DESC
    `);
    
    conn.release();
    
    const responseData = {
      overview: {
        total_students: totalStudents[0].count,
        total_skills: totalSkills[0].count,
        avg_skills_per_student: Math.round(avgSkillsPerStudent[0].avg_skills || 0)
      },
      skill_distribution: skillDistribution,
      goal_stats: goalStats[0],
      interest_stats: interestStats,
      survey_stats: surveyStats
    };
    
    res.json(convertBigIntToNumber(responseData));
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/analytics/skills', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Detailed skill analytics
    const skillsByLevel = await conn.query(`
      SELECT proficiency_level, COUNT(*) as count
      FROM student_skills
      GROUP BY proficiency_level
    `);
    
    const topSkills = await conn.query(`
      SELECT skill_name, COUNT(*) as student_count,
             COUNT(CASE WHEN proficiency_level = 'beginner' THEN 1 END) as beginner_count,
             COUNT(CASE WHEN proficiency_level = 'intermediate' THEN 1 END) as intermediate_count,
             COUNT(CASE WHEN proficiency_level = 'advanced' THEN 1 END) as advanced_count
      FROM student_skills
      GROUP BY skill_name
      ORDER BY student_count DESC
      LIMIT 15
    `);
    
    const skillTrends = await conn.query(`
      SELECT DATE(ss.created_at) as date, COUNT(*) as skills_added
      FROM student_skills ss
      WHERE ss.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(ss.created_at)
      ORDER BY date
    `);
    
    conn.release();
    
    const responseData = {
      skills_by_level: skillsByLevel,
      top_skills: topSkills,
      skill_trends: skillTrends
    };
    
    res.json(convertBigIntToNumber(responseData));
  } catch (error) {
    console.error('Skills analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/analytics/students/:id', requireAuth, async (req, res) => {
  try {
    const studentId = req.params.id;
    const conn = await pool.getConnection();
    
    // Individual student summary
    const student = await conn.query(`
      SELECT s.*, 
             COUNT(DISTINCT sk.skill_name) as total_skills,
             COUNT(DISTINCT uf.id) as resume_versions,
             COUNT(DISTINCT sr.survey_id) as surveys_completed
      FROM students s
      LEFT JOIN student_skills sk ON s.id = sk.student_id
      LEFT JOIN uploaded_files uf ON s.id = uf.student_id
      LEFT JOIN survey_responses sr ON s.id = sr.student_id
      WHERE s.id = ?
      GROUP BY s.id
    `, [studentId]);
    
    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Student's skills breakdown
    const skillsBreakdown = await conn.query(`
      SELECT skill_name, proficiency_level, created_at
      FROM student_skills
      WHERE student_id = ?
      ORDER BY created_at DESC
    `, [studentId]);
    
    // Survey responses summary
    const surveyResponses = await conn.query(`
      SELECT s.title, sr.completed_at
      FROM survey_responses sr
      JOIN surveys s ON sr.survey_id = s.id
      WHERE sr.student_id = ?
      ORDER BY sr.completed_at DESC
    `, [studentId]);
    
    // Goal progress (simplified tracking)
    const goalProgress = await conn.query(`
      SELECT short_term_goals, long_term_goals, updated_at
      FROM students
      WHERE id = ?
    `, [studentId]);
    
    conn.release();
    
    res.json({
      student: student[0],
      skills_breakdown: skillsBreakdown,
      survey_responses: surveyResponses,
      goal_progress: goalProgress[0]
    });
  } catch (error) {
    console.error('Student analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/analytics/goals', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Goal alignment analysis
    const shortTermGoals = await conn.query(`
      SELECT short_term_goals as goal, COUNT(*) as count
      FROM students 
      WHERE short_term_goals IS NOT NULL AND short_term_goals != ''
      GROUP BY short_term_goals
      ORDER BY count DESC
      LIMIT 10
    `);
    
    const longTermGoals = await conn.query(`
      SELECT long_term_goals as goal, COUNT(*) as count
      FROM students 
      WHERE long_term_goals IS NOT NULL AND long_term_goals != ''
      GROUP BY long_term_goals
      ORDER BY count DESC
      LIMIT 10
    `);
    
    // Goal completion tracking (based on profile updates)
    const goalUpdates = await conn.query(`
      SELECT DATE(updated_at) as date, COUNT(*) as updates
      FROM students
      WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND (short_term_goals IS NOT NULL OR long_term_goals IS NOT NULL)
      GROUP BY DATE(updated_at)
      ORDER BY date
    `);
    
    conn.release();
    
    const responseData = {
      short_term_goals: shortTermGoals,
      long_term_goals: longTermGoals,
      goal_updates: goalUpdates
    };
    
    res.json(convertBigIntToNumber(responseData));
  } catch (error) {
    console.error('Goals analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search and filter routes
app.get('/api/students/search', requireAuth, async (req, res) => {
  try {
    const { query, skills, interests, goals, year_grade, major_focus } = req.query;
    const conn = await pool.getConnection();
    
    let sql = `
      SELECT DISTINCT s.*, 
             GROUP_CONCAT(DISTINCT sk.skill_name) as skill_names,
             GROUP_CONCAT(DISTINCT sk.proficiency_level) as skill_levels
      FROM students s
      LEFT JOIN student_skills sk ON s.id = sk.student_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // General text search across multiple fields
    if (query) {
      sql += ` AND (
        s.name LIKE ? OR 
        s.email LIKE ? OR 
        s.short_term_goals LIKE ? OR 
        s.long_term_goals LIKE ? OR 
        s.interests LIKE ? OR 
        s.extracurricular LIKE ? OR
        sk.skill_name LIKE ?
      )`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Specific skill filter
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      const skillPlaceholders = skillArray.map(() => '?').join(',');
      sql += ` AND sk.skill_name IN (${skillPlaceholders})`;
      params.push(...skillArray);
    }
    
    // Interests filter
    if (interests) {
      sql += ` AND s.interests LIKE ?`;
      params.push(`%${interests}%`);
    }
    
    // Goals filter
    if (goals) {
      sql += ` AND (s.short_term_goals LIKE ? OR s.long_term_goals LIKE ?)`;
      params.push(`%${goals}%`, `%${goals}%`);
    }
    
    // Year/Grade filter
    if (year_grade) {
      sql += ` AND s.year_grade = ?`;
      params.push(year_grade);
    }
    
    // Major/Focus filter
    if (major_focus) {
      sql += ` AND s.major_focus LIKE ?`;
      params.push(`%${major_focus}%`);
    }
    
    sql += ` GROUP BY s.id ORDER BY s.name`;
    
    const results = await conn.query(sql, params);
    conn.release();
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Advanced filtering with multiple criteria
app.post('/api/students/filter', requireAuth, async (req, res) => {
  try {
    const { filters, sortBy, groupBy } = req.body;
    const conn = await pool.getConnection();
    
    let sql = `
      SELECT DISTINCT s.*, 
             GROUP_CONCAT(DISTINCT sk.skill_name) as skill_names,
             GROUP_CONCAT(DISTINCT sk.proficiency_level) as skill_levels,
             COUNT(DISTINCT sk.skill_name) as skill_count
      FROM students s
      LEFT JOIN student_skills sk ON s.id = sk.student_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply multiple filters
    if (filters.skills && filters.skills.length > 0) {
      const skillPlaceholders = filters.skills.map(() => '?').join(',');
      sql += ` AND sk.skill_name IN (${skillPlaceholders})`;
      params.push(...filters.skills);
    }
    
    if (filters.skill_levels && filters.skill_levels.length > 0) {
      const levelPlaceholders = filters.skill_levels.map(() => '?').join(',');
      sql += ` AND sk.proficiency_level IN (${levelPlaceholders})`;
      params.push(...filters.skill_levels);
    }
    
    if (filters.year_grades && filters.year_grades.length > 0) {
      const yearPlaceholders = filters.year_grades.map(() => '?').join(',');
      sql += ` AND s.year_grade IN (${yearPlaceholders})`;
      params.push(...filters.year_grades);
    }
    
    if (filters.majors && filters.majors.length > 0) {
      const majorConditions = filters.majors.map(() => 's.major_focus LIKE ?').join(' OR ');
      sql += ` AND (${majorConditions})`;
      params.push(...filters.majors.map(major => `%${major}%`));
    }
    
    if (filters.min_skills) {
      sql += ` HAVING skill_count >= ?`;
      params.push(filters.min_skills);
    }
    
    sql += ` GROUP BY s.id`;
    
    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'name':
          sql += ` ORDER BY s.name`;
          break;
        case 'skills_count':
          sql += ` ORDER BY skill_count DESC`;
          break;
        case 'recent':
          sql += ` ORDER BY s.updated_at DESC`;
          break;
        default:
          sql += ` ORDER BY s.name`;
      }
    }
    
    const results = await conn.query(sql, params);
    
    // Group results if requested
    let groupedResults = results;
    if (groupBy === 'major') {
      groupedResults = groupByField(results, 'major_focus');
    } else if (groupBy === 'year') {
      groupedResults = groupByField(results, 'year_grade');
    } else if (groupBy === 'skills') {
      groupedResults = groupBySkillCount(results);
    }
    
    conn.release();
    res.json(groupedResults);
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Team formation based on complementary skills
app.post('/api/students/form-teams', requireAuth, async (req, res) => {
  try {
    const { teamSize, criteria } = req.body;
    const conn = await pool.getConnection();
    
    // Get all students with their skills
    const students = await conn.query(`
      SELECT s.id, s.name, s.major_focus, s.interests,
             GROUP_CONCAT(DISTINCT sk.skill_name) as skills,
             GROUP_CONCAT(DISTINCT sk.proficiency_level) as skill_levels
      FROM students s
      LEFT JOIN student_skills sk ON s.id = sk.student_id
      GROUP BY s.id
    `);
    
    // Simple team formation algorithm
    const teams = formTeams(students, teamSize || 3, criteria);
    
    conn.release();
    res.json({ teams, total_teams: teams.length });
  } catch (error) {
    console.error('Team formation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get filter options for frontend
app.get('/api/students/filter-options', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    const skills = await conn.query(`
      SELECT DISTINCT skill_name as value, skill_name as label
      FROM student_skills
      ORDER BY skill_name
    `);
    
    const skillLevels = await conn.query(`
      SELECT DISTINCT proficiency_level as value, proficiency_level as label
      FROM student_skills
      ORDER BY 
        CASE proficiency_level 
          WHEN 'beginner' THEN 1 
          WHEN 'intermediate' THEN 2 
          WHEN 'advanced' THEN 3 
        END
    `);
    
    const yearGrades = await conn.query(`
      SELECT DISTINCT year_grade as value, year_grade as label
      FROM students
      WHERE year_grade IS NOT NULL
      ORDER BY year_grade
    `);
    
    const majors = await conn.query(`
      SELECT DISTINCT major_focus as value, major_focus as label
      FROM students
      WHERE major_focus IS NOT NULL
      ORDER BY major_focus
    `);
    
    conn.release();
    
    res.json({
      skills,
      skill_levels: skillLevels,
      year_grades: yearGrades,
      majors
    });
  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper functions
function groupByField(results, field) {
  const grouped = {};
  results.forEach(student => {
    const key = student[field] || 'Other';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(student);
  });
  return grouped;
}

function groupBySkillCount(results) {
  const grouped = {
    'High (5+ skills)': [],
    'Medium (3-4 skills)': [],
    'Low (1-2 skills)': []
  };
  
  results.forEach(student => {
    const skillCount = student.skill_count || 0;
    if (skillCount >= 5) {
      grouped['High (5+ skills)'].push(student);
    } else if (skillCount >= 3) {
      grouped['Medium (3-4 skills)'].push(student);
    } else {
      grouped['Low (1-2 skills)'].push(student);
    }
  });
  
  return grouped;
}

function formTeams(students, teamSize, criteria) {
  const teams = [];
  const usedStudents = new Set();
  
  for (const student of students) {
    if (usedStudents.has(student.id)) continue;
    
    const team = [student];
    usedStudents.add(student.id);
    
    // Find complementary team members
    for (const candidate of students) {
      if (usedStudents.has(candidate.id) || team.length >= teamSize) continue;
      
      if (isComplementary(team, candidate, criteria)) {
        team.push(candidate);
        usedStudents.add(candidate.id);
      }
    }
    
    teams.push({
      id: teams.length + 1,
      members: team,
      size: team.length,
      combined_skills: getCombinedSkills(team),
      diversity_score: calculateDiversityScore(team)
    });
  }
  
  return teams;
}

function isComplementary(team, candidate, criteria) {
  const teamSkills = new Set();
  team.forEach(member => {
    if (member.skills) {
      member.skills.split(',').forEach(skill => teamSkills.add(skill.trim()));
    }
  });
  
  const candidateSkills = candidate.skills ? 
    candidate.skills.split(',').map(s => s.trim()) : [];
  
  // Check for skill complementarity
  const hasNewSkills = candidateSkills.some(skill => !teamSkills.has(skill));
  
  // Check for major diversity if specified
  let majorDiversity = true;
  if (criteria?.diverse_majors) {
    const teamMajors = team.map(m => m.major_focus);
    majorDiversity = !teamMajors.includes(candidate.major_focus);
  }
  
  return hasNewSkills && majorDiversity;
}

function getCombinedSkills(team) {
  const allSkills = new Set();
  team.forEach(member => {
    if (member.skills) {
      member.skills.split(',').forEach(skill => allSkills.add(skill.trim()));
    }
  });
  return Array.from(allSkills);
}

function calculateDiversityScore(team) {
  const majors = new Set(team.map(m => m.major_focus));
  const skills = getCombinedSkills(team);
  return (majors.size * 2) + skills.length; // Simple diversity calculation
}

// Export data (CSV/JSON as per requirements)
app.get('/api/export/:format', requireAuth, async (req, res) => {
  try {
    const format = req.params.format;
    if (!['csv', 'json'].includes(format)) {
      return res.status(400).json({ error: 'Format must be csv or json' });
    }
    
    const conn = await pool.getConnection();
    const students = await conn.query('SELECT * FROM students');
    conn.release();
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=students.json');
      res.json(students);
    } else if (format === 'csv') {
      const csv = convertToCSV(students);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
      res.send(csv);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Catch-all handler for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Student Profile Server running on port ${PORT}`);
});