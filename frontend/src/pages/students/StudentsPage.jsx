import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Add,
  Email,
  School,
  TrendingUp,
  Close,
} from '@mui/icons-material';
import axios from 'axios';

const StudentCard = ({ student, onEdit, onView }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const skills = student.skill_names ? student.skill_names.split(',') : [];
  const skillLevels = student.skill_levels ? student.skill_levels.split(',') : [];

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getSkillColor = (level) => {
    switch (level.trim().toLowerCase()) {
      case 'advanced': return 'success';
      case 'intermediate': return 'warning';
      case 'beginner': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 48,
              height: 48,
              mr: 2,
              fontSize: '1.25rem',
              fontWeight: 'bold',
            }}
          >
            {student.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {student.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Email sx={{ fontSize: 16, mr: 0.5 }} />
              {student.email}
            </Typography>
          </Box>
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Academic Info
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip 
              icon={<School />}
              label={student.major_focus}
              variant="outlined"
              size="small"
            />
            <Chip 
              label={student.year_grade}
              variant="outlined"
              size="small"
            />
          </Stack>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Skills ({skills.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {skills.slice(0, 3).map((skill, index) => (
              <Chip
                key={index}
                label={skill.trim()}
                size="small"
                color={getSkillColor(skillLevels[index] || 'beginner')}
                variant="filled"
              />
            ))}
            {skills.length > 3 && (
              <Chip
                label={`+${skills.length - 3} more`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Goals Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={75} 
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            75% goal completion
          </Typography>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onView(student); handleMenuClose(); }}>
            View Profile
          </MenuItem>
          <MenuItem onClick={() => { onEdit(student); handleMenuClose(); }}>
            Edit Student
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    major_focus: '',
    skill_names: '',
    skill_levels: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.major_focus.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setViewDialog(true);
  };

  const handleEditStudent = (student) => {
    // TODO: Implement edit functionality
    console.log('Edit student:', student);
  };

  const handleAddStudent = () => {
    setAddDialogOpen(true);
  };

  const handleSaveNewStudent = async () => {
    try {
      const response = await axios.post('/api/students', newStudent);
      setStudents([...students, response.data]);
      setNewStudent({
        name: '',
        email: '',
        major_focus: '',
        skill_names: '',
        skill_levels: '',
      });
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleNewStudentChange = (field, value) => {
    setNewStudent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Students
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track student profiles, skills, and academic progress
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="large"
          onClick={handleAddStudent}
          sx={{ borderRadius: 2 }}
        >
          Add Student
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search students by name, email, or major..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{ borderRadius: 2 }}
              >
                Filter
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Stats */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredStudents.length} of {students.length} students
        </Typography>
      </Box>

      {/* Students Grid */}
      <Grid container spacing={3}>
        {filteredStudents.map((student) => (
          <Grid item xs={12} sm={6} lg={4} key={student.id}>
            <StudentCard
              student={student}
              onView={handleViewStudent}
              onEdit={handleEditStudent}
            />
          </Grid>
        ))}
      </Grid>

      {filteredStudents.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No students found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search criteria' : 'Add your first student to get started'}
          </Typography>
        </Box>
      )}

      {/* Student Detail Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Student Profile</Typography>
          <IconButton onClick={() => setViewDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: 'primary.main',
                        fontSize: '2rem',
                      }}
                    >
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedStudent.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStudent.email}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Academic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Major
                          </Typography>
                          <Typography variant="body1">
                            {selectedStudent.major_focus}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Year
                          </Typography>
                          <Typography variant="body1">
                            {selectedStudent.year_grade}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Goals
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Short-term Goals
                        </Typography>
                        <Typography variant="body1">
                          {selectedStudent.short_term_goals || 'No short-term goals set'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Long-term Goals
                        </Typography>
                        <Typography variant="body1">
                          {selectedStudent.long_term_goals || 'No long-term goals set'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Skills & Interests
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Skills
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedStudent.skill_names?.split(',').map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill.trim()}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Interests
                        </Typography>
                        <Typography variant="body1">
                          {selectedStudent.interests || 'No interests specified'}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>
            Close
          </Button>
          <Button variant="contained">
            Edit Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Add New Student</Typography>
          <IconButton onClick={() => setAddDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={newStudent.name}
                  onChange={(e) => handleNewStudentChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => handleNewStudentChange('email', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Major/Focus Area"
                  value={newStudent.major_focus}
                  onChange={(e) => handleNewStudentChange('major_focus', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Skills (comma-separated)"
                  value={newStudent.skill_names}
                  onChange={(e) => handleNewStudentChange('skill_names', e.target.value)}
                  placeholder="e.g., Python, JavaScript, Data Analysis"
                  helperText="Enter skills separated by commas"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Skill Levels (comma-separated)"
                  value={newStudent.skill_levels}
                  onChange={(e) => handleNewStudentChange('skill_levels', e.target.value)}
                  placeholder="e.g., Intermediate, Beginner, Advanced"
                  helperText="Skill levels corresponding to skills above"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveNewStudent}
            disabled={!newStudent.name || !newStudent.email || !newStudent.major_focus}
          >
            Add Student
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add student"
        onClick={handleAddStudent}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default StudentsPage;