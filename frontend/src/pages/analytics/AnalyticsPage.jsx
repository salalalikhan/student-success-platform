import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
  Stack,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  School,
  Assignment,
  Star,
  Timeline,
  PieChart,
  BarChart,
  Assessment,
  EmojiEvents,
  WorkspacePremium,
  Psychology,
  Group,
  Insights,
} from '@mui/icons-material';
import axios from 'axios';

const MetricCard = ({ title, value, change, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {change >= 0 ? (
                <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
              )}
              <Typography 
                variant="body2" 
                color={change >= 0 ? 'success.main' : 'error.main'}
              >
                {Math.abs(change)}% vs last month
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const SkillDistributionChart = ({ data }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Skills Distribution
      </Typography>
      <Box sx={{ mt: 2 }}>
        {data.map((skill, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{skill.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {skill.count} students
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={skill.percentage}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

const TopPerformers = ({ students }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Top Performers
      </Typography>
      <List>
        {students.slice(0, 5).map((student, index) => (
          <ListItem key={student.id} sx={{ px: 0 }}>
            <ListItemIcon>
              <Badge badgeContent={index + 1} color="primary">
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <EmojiEvents />
                </Avatar>
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary={student.name}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {student.major_focus}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Chip
                      label={`${student.skill_names ? student.skill_names.split(',').length : 0} skills`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label="95% completion"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);

const GoalProgress = ({ goals }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Goal Achievement
      </Typography>
      <Stack spacing={2}>
        {goals.map((goal, index) => (
          <Paper key={index} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="medium">
                {goal.category}
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight="bold">
                {goal.completion}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={goal.completion}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {goal.achieved} of {goal.total} goals completed
            </Typography>
          </Paper>
        ))}
      </Stack>
    </CardContent>
  </Card>
);

const SurveyInsights = ({ surveys }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Survey Insights
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Survey</TableCell>
              <TableCell align="right">Responses</TableCell>
              <TableCell align="right">Completion</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {surveys.map((survey) => (
              <TableRow key={survey.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {survey.title}
                  </Typography>
                </TableCell>
                <TableCell align="right">{survey.unique_responses || 0}</TableCell>
                <TableCell align="right">
                  {Math.round((survey.unique_responses / (survey.total_responses || 1)) * 100) || 0}%
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={survey.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={survey.is_active ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);

const AnalyticsPage = () => {
  const [students, setStudents] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const [studentsRes, surveysRes] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/surveys'),
      ]);

      setStudents(studentsRes.data);
      setSurveys(surveysRes.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics data
  const totalStudents = students.length;
  const totalSkills = students.reduce((acc, student) => {
    const skillCount = student.skill_names ? student.skill_names.split(',').length : 0;
    return acc + skillCount;
  }, 0);
  const avgSkillsPerStudent = totalStudents > 0 ? Math.round(totalSkills / totalStudents) : 0;
  const activeSurveys = surveys.filter(s => s.is_active).length;
  const totalResponses = surveys.reduce((acc, s) => acc + (s.unique_responses || 0), 0);

  // Skills distribution data
  const allSkills = students.flatMap(student => 
    student.skill_names ? student.skill_names.split(',').map(skill => skill.trim()) : []
  );
  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {});
  const skillsData = Object.entries(skillCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalStudents) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Goals data
  const goalsData = [
    { category: 'Short-term Goals', completion: 78, achieved: 156, total: 200 },
    { category: 'Long-term Goals', completion: 65, achieved: 130, total: 200 },
    { category: 'Skill Development', completion: 82, achieved: 164, total: 200 },
    { category: 'Career Planning', completion: 71, achieved: 142, total: 200 },
  ];

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
            Analytics & Insights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive analytics and performance metrics for student success
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 3 months</MenuItem>
            <MenuItem value="365">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<Assessment />} label="Overview" />
          <Tab icon={<People />} label="Students" />
          <Tab icon={<Assignment />} label="Surveys" />
          <Tab icon={<TrendingUp />} label="Performance" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {tabValue === 0 && (
        <>
          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Students"
                value={totalStudents}
                change={12}
                icon={<People />}
                color="primary.main"
                subtitle="Enrolled students"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Active Surveys"
                value={activeSurveys}
                change={8}
                icon={<Assignment />}
                color="success.main"
                subtitle="Currently running"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Responses"
                value={totalResponses}
                change={-3}
                icon={<Timeline />}
                color="info.main"
                subtitle="Survey responses"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Avg Skills"
                value={avgSkillsPerStudent}
                change={15}
                icon={<Star />}
                color="warning.main"
                subtitle="Per student"
              />
            </Grid>
          </Grid>

          {/* Charts and Insights */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SkillDistributionChart data={skillsData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <GoalProgress goals={goalsData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TopPerformers students={students} />
            </Grid>
            <Grid item xs={12} md={6}>
              <SurveyInsights surveys={surveys} />
            </Grid>
          </Grid>
        </>
      )}

      {/* Students Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <MetricCard
              title="Total Students"
              value={totalStudents}
              change={12}
              icon={<People />}
              color="primary.main"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MetricCard
              title="Average Skills"
              value={avgSkillsPerStudent}
              change={8}
              icon={<School />}
              color="success.main"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MetricCard
              title="Goal Completion"
              value="78%"
              change={5}
              icon={<EmojiEvents />}
              color="warning.main"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <SkillDistributionChart data={skillsData} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TopPerformers students={students} />
          </Grid>
        </Grid>
      )}

      {/* Surveys Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Total Surveys"
              value={surveys.length}
              change={20}
              icon={<Assignment />}
              color="primary.main"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Active Surveys"
              value={activeSurveys}
              change={15}
              icon={<Timeline />}
              color="success.main"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Total Responses"
              value={totalResponses}
              change={-2}
              icon={<BarChart />}
              color="info.main"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Avg Completion"
              value="84%"
              change={7}
              icon={<PieChart />}
              color="warning.main"
            />
          </Grid>
          <Grid item xs={12}>
            <SurveyInsights surveys={surveys} />
          </Grid>
        </Grid>
      )}

      {/* Performance Tab */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
                </Typography>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Insights sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Performance Analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed performance metrics and trends analysis
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <GoalProgress goals={goalsData} />
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Student Progress Overview
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Major</TableCell>
                        <TableCell align="right">Skills</TableCell>
                        <TableCell align="right">Goals Progress</TableCell>
                        <TableCell align="right">Survey Participation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.slice(0, 10).map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.major_focus}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={student.skill_names ? student.skill_names.split(',').length : 0}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.random() * 100}
                                sx={{ width: 60, mr: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="body2">
                                {Math.round(Math.random() * 100)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${Math.round(Math.random() * 10)}/10`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalyticsPage;