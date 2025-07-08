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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  IconButton,
} from '@mui/material';
import {
  People,
  Assignment,
  TrendingUp,
  School,
  MoreVert,
  PersonAdd,
  AssignmentTurnedIn,
} from '@mui/icons-material';
import axios from 'axios';

const StatCard = ({ title, value, icon, color, change }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {change && (
            <Typography variant="body2" color={change > 0 ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
              {change > 0 ? '+' : ''}{change}% from last month
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const SimpleDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeSurveys: 0,
    completionRate: 0,
    avgSkills: 0,
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, surveysRes] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/surveys'),
      ]);

      const studentsData = studentsRes.data;
      const surveysData = surveysRes.data;

      setStudents(studentsData);

      setStats({
        totalStudents: studentsData.length,
        activeSurveys: surveysData.filter(s => s.is_active).length,
        completionRate: 85,
        avgSkills: studentsData.reduce((acc, student) => {
          const skillCount = student.skill_names ? student.skill_names.split(',').length : 0;
          return acc + skillCount;
        }, 0) / studentsData.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard Overview
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back! Here's what's happening with your students today.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<People />}
            color="primary.main"
            change={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Surveys"
            value={stats.activeSurveys}
            icon={<Assignment />}
            color="success.main"
            change={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            icon={<TrendingUp />}
            color="warning.main"
            change={-2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Skills"
            value={Math.round(stats.avgSkills)}
            icon={<School />}
            color="secondary.main"
            change={8}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Students */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Students
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <List>
                {students.slice(0, 5).map((student) => (
                  <ListItem key={student.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {student.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={student.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {student.major_focus} • {student.year_grade}
                          </Typography>
                          <Chip 
                            label={`${student.skill_names ? student.skill_names.split(',').length : 0} skills`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <PersonAdd />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Add New Student
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Register a new student profile
                    </Typography>
                  </Box>
                </Paper>
                
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <AssignmentTurnedIn />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Create Survey
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Design a new survey or assessment
                    </Typography>
                  </Box>
                </Paper>

                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      View Analytics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Check student performance metrics
                    </Typography>
                  </Box>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleDashboard;