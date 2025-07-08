import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
  Chip,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Add,
  Close,
  Edit,
  Delete,
  Visibility,
  Assignment,
  People,
  TrendingUp,
  DateRange,
  PlayArrow,
  Pause,
  PollOutlined,
  QuestionAnswer,
  BarChart,
} from '@mui/icons-material';
import axios from 'axios';

const SurveyCard = ({ survey, onEdit, onView, onToggle, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1, mr: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {survey.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {survey.description}
            </Typography>
          </Box>
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Chip 
            label={getStatusText(survey.is_active)}
            color={getStatusColor(survey.is_active)}
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`${JSON.parse(survey.questions || '[]').length} questions`}
            variant="outlined"
            size="small"
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {survey.unique_responses || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Responses
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {Math.round((survey.unique_responses / (survey.total_responses || 1)) * 100) || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completion
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <DateRange sx={{ fontSize: 16, mr: 0.5 }} />
          Created {new Date(survey.created_at).toLocaleDateString()}
        </Typography>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onView(survey); handleMenuClose(); }}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View Details
          </MenuItem>
          <MenuItem onClick={() => { onEdit(survey); handleMenuClose(); }}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit Survey
          </MenuItem>
          <MenuItem onClick={() => { onToggle(survey); handleMenuClose(); }}>
            <ListItemIcon>
              {survey.is_active ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
            </ListItemIcon>
            {survey.is_active ? 'Deactivate' : 'Activate'}
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { onDelete(survey); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

const CreateSurveyDialog = ({ open, onClose, onSave }) => {
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    questions: [],
    is_active: true,
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    type: 'text',
    options: [''],
  });

  const handleAddQuestion = () => {
    if (currentQuestion.question.trim()) {
      setSurveyData(prev => ({
        ...prev,
        questions: [...prev.questions, { ...currentQuestion, id: Date.now() }]
      }));
      setCurrentQuestion({
        question: '',
        type: 'text',
        options: [''],
      });
    }
  };

  const handleSave = () => {
    onSave(surveyData);
    setSurveyData({ title: '', description: '', questions: [], is_active: true });
    onClose();
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Create New Survey</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Survey Title"
            value={surveyData.title}
            onChange={(e) => setSurveyData(prev => ({ ...prev, title: e.target.value }))}
          />
          
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={surveyData.description}
            onChange={(e) => setSurveyData(prev => ({ ...prev, description: e.target.value }))}
          />

          <FormControlLabel
            control={
              <Switch
                checked={surveyData.is_active}
                onChange={(e) => setSurveyData(prev => ({ ...prev, is_active: e.target.checked }))}
              />
            }
            label="Activate survey immediately"
          />

          <Divider />

          <Typography variant="h6">Questions ({surveyData.questions.length})</Typography>
          
          {surveyData.questions.map((q, index) => (
            <Paper key={q.id} sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {index + 1}. {q.question}
              </Typography>
              <Chip label={q.type} size="small" sx={{ mt: 1 }} />
            </Paper>
          ))}

          <Paper sx={{ p: 3, border: '2px dashed', borderColor: 'grey.300' }}>
            <Typography variant="subtitle1" gutterBottom>Add Question</Typography>
            
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Question"
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
              />
              
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={currentQuestion.type}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, type: e.target.value }))}
                  label="Question Type"
                >
                  <MenuItem value="text">Text Response</MenuItem>
                  <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                  <MenuItem value="multiple-select">Multiple Select</MenuItem>
                  <MenuItem value="scale">Rating Scale</MenuItem>
                </Select>
              </FormControl>

              {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'multiple-select') && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Options</Typography>
                  {currentQuestion.options.map((option, index) => (
                    <TextField
                      key={index}
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      sx={{ mb: 1 }}
                    />
                  ))}
                  <Button onClick={addOption} size="small">
                    Add Option
                  </Button>
                </Box>
              )}

              <Button variant="contained" onClick={handleAddQuestion}>
                Add Question
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!surveyData.title.trim()}>
          Create Survey
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SurveysPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [filteredSurveys, setFilteredSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    let filtered = surveys;
    
    if (searchTerm) {
      filtered = filtered.filter(survey =>
        survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        survey.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tabValue === 1) {
      filtered = filtered.filter(survey => survey.is_active);
    } else if (tabValue === 2) {
      filtered = filtered.filter(survey => !survey.is_active);
    }

    setFilteredSurveys(filtered);
  }, [surveys, searchTerm, tabValue]);

  const fetchSurveys = async () => {
    try {
      const response = await axios.get('/api/surveys');
      setSurveys(response.data);
      setFilteredSurveys(response.data);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = (surveyData) => {
    // Add new survey to the list
    const newSurvey = {
      id: Date.now(),
      ...surveyData,
      questions: JSON.stringify(surveyData.questions),
      created_at: new Date().toISOString(),
      created_by_email: 'admin@test.com',
      unique_responses: 0,
      total_responses: 0,
    };
    setSurveys(prev => [newSurvey, ...prev]);
  };

  const handleViewSurvey = (survey) => {
    setSelectedSurvey(survey);
    setViewDialog(true);
  };

  const handleEditSurvey = (survey) => {
    console.log('Edit survey:', survey);
  };

  const handleToggleSurvey = (survey) => {
    setSurveys(prev => prev.map(s => 
      s.id === survey.id ? { ...s, is_active: !s.is_active } : s
    ));
  };

  const handleDeleteSurvey = (survey) => {
    setSurveys(prev => prev.filter(s => s.id !== survey.id));
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
            Surveys & Assessments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, manage, and analyze student surveys and assessments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="large"
          onClick={() => setCreateDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Create Survey
        </Button>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <Assignment />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {surveys.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Surveys
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <PlayArrow />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {surveys.filter(s => s.is_active).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Surveys
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <People />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {surveys.reduce((acc, s) => acc + (s.unique_responses || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Responses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {surveys.length > 0 ? Math.round(surveys.reduce((acc, s) => acc + (s.unique_responses || 0), 0) / surveys.length) : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. Responses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search surveys by title or description..."
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
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="All Surveys" />
              <Tab label={<Badge badgeContent={surveys.filter(s => s.is_active).length} color="success">Active</Badge>} />
              <Tab label="Inactive" />
            </Tabs>
          </Grid>
        </Grid>
      </Box>

      {/* Surveys Grid */}
      <Grid container spacing={3}>
        {filteredSurveys.map((survey) => (
          <Grid item xs={12} sm={6} lg={4} key={survey.id}>
            <SurveyCard
              survey={survey}
              onView={handleViewSurvey}
              onEdit={handleEditSurvey}
              onToggle={handleToggleSurvey}
              onDelete={handleDeleteSurvey}
            />
          </Grid>
        ))}
      </Grid>

      {filteredSurveys.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PollOutlined sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No surveys found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first survey to get started'}
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
            Create Survey
          </Button>
        </Box>
      )}

      {/* Create Survey Dialog */}
      <CreateSurveyDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        onSave={handleCreateSurvey}
      />

      {/* View Survey Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Survey Details</Typography>
          <IconButton onClick={() => setViewDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedSurvey && (
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {selectedSurvey.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {selectedSurvey.description}
              </Typography>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {selectedSurvey.unique_responses || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unique Responses
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {Math.round((selectedSurvey.unique_responses / (selectedSurvey.total_responses || 1)) * 100) || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completion Rate
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Questions ({JSON.parse(selectedSurvey.questions || '[]').length})
              </Typography>
              
              <List>
                {JSON.parse(selectedSurvey.questions || '[]').map((question, index) => (
                  <ListItem key={index} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
                    <ListItemIcon>
                      <QuestionAnswer />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${index + 1}. ${question.question}`}
                      secondary={`Type: ${question.type}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>
            Close
          </Button>
          <Button variant="contained" startIcon={<BarChart />}>
            View Analytics
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create survey"
        onClick={() => setCreateDialog(true)}
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

export default SurveysPage;