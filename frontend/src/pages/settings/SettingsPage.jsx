import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  Paper,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  RadioGroup,
  Radio,
  Slider,
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Palette,
  Language,
  Storage,
  CloudDownload,
  Shield,
  Email,
  Sms,
  VolumeUp,
  Brightness4,
  Brightness7,
  Edit,
  Save,
  Cancel,
  Delete,
  Visibility,
  VisibilityOff,
  Lock,
  Key,
  Backup,
  GetApp,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';

const SettingCard = ({ title, description, children }) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const ProfileSettings = ({ user }) => {
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.email?.split('@')[0] || 'Admin User',
    email: user?.email || 'admin@test.com',
    role: user?.role || 'admin',
    department: 'Computer Science',
    phone: '+1 (555) 123-4567',
    bio: 'System administrator for the Student Success Platform.',
  });

  const handleSave = () => {
    setEditing(false);
    // Save profile data
  };

  return (
    <SettingCard
      title="Profile Information"
      description="Manage your personal information and account details"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          sx={{
            width: 80,
            height: 80,
            mr: 2,
            bgcolor: 'primary.main',
            fontSize: '2rem',
          }}
        >
          {profileData.name[0]}
        </Avatar>
        <Box>
          <Typography variant="h6">{profileData.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {profileData.role}
          </Typography>
          <Button size="small" startIcon={<Edit />} onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Full Name"
            value={profileData.name}
            disabled={!editing}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email Address"
            value={profileData.email}
            disabled={!editing}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Department"
            value={profileData.department}
            disabled={!editing}
            onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={profileData.phone}
            disabled={!editing}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Bio"
            multiline
            rows={3}
            value={profileData.bio}
            disabled={!editing}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
          />
        </Grid>
      </Grid>

      {editing && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="outlined" startIcon={<Cancel />} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </Box>
      )}
    </SettingCard>
  );
};

const SecuritySettings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);

  return (
    <>
      <SettingCard
        title="Security & Privacy"
        description="Manage your account security and privacy settings"
      >
        <List>
          <ListItem>
            <ListItemIcon>
              <Lock />
            </ListItemIcon>
            <ListItemText
              primary="Change Password"
              secondary="Update your account password"
            />
            <ListItemSecondaryAction>
              <Button onClick={() => setPasswordDialog(true)}>
                Change
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Shield />
            </ListItemIcon>
            <ListItemText
              primary="Two-Factor Authentication"
              secondary="Add an extra layer of security to your account"
            />
            <ListItemSecondaryAction>
              <Switch />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <Visibility />
            </ListItemIcon>
            <ListItemText
              primary="Profile Visibility"
              secondary="Control who can see your profile information"
            />
            <ListItemSecondaryAction>
              <FormControl size="small">
                <Select value="public" size="small">
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="contacts">Contacts Only</MenuItem>
                </Select>
              </FormControl>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </SettingCard>

      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showPassword ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained">Update Password</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    surveys: true,
    students: true,
    analytics: false,
  });

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <SettingCard
      title="Notifications"
      description="Configure how you receive notifications and updates"
    >
      <Typography variant="subtitle2" gutterBottom>
        Notification Methods
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <Email />
          </ListItemIcon>
          <ListItemText
            primary="Email Notifications"
            secondary="Receive notifications via email"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={notifications.email}
              onChange={() => handleToggle('email')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Notifications />
          </ListItemIcon>
          <ListItemText
            primary="Push Notifications"
            secondary="Browser push notifications"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={notifications.push}
              onChange={() => handleToggle('push')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Sms />
          </ListItemIcon>
          <ListItemText
            primary="SMS Notifications"
            secondary="Text message notifications"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={notifications.sms}
              onChange={() => handleToggle('sms')}
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Notification Types
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="New Student Registrations"
            secondary="Get notified when new students join"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={notifications.students}
              onChange={() => handleToggle('students')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Survey Responses"
            secondary="Notifications for new survey responses"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={notifications.surveys}
              onChange={() => handleToggle('surveys')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Analytics Reports"
            secondary="Weekly analytics and performance reports"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={notifications.analytics}
              onChange={() => handleToggle('analytics')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Marketing Updates"
            secondary="Product updates and feature announcements"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={notifications.marketing}
              onChange={() => handleToggle('marketing')}
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </SettingCard>
  );
};

const AppearanceSettings = () => {
  const { mode, toggleMode } = useThemeMode();
  const [language, setLanguage] = useState('en');
  const [fontSize, setFontSize] = useState(14);

  return (
    <SettingCard
      title="Appearance & Display"
      description="Customize the look and feel of your interface"
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Theme
          </Typography>
          <RadioGroup
            value={mode}
            onChange={(e) => {
              if (e.target.value !== mode) {
                toggleMode();
              }
            }}
          >
            <FormControlLabel
              value="light"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Brightness7 sx={{ mr: 1 }} />
                  Light Mode
                </Box>
              }
            />
            <FormControlLabel
              value="dark"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Brightness4 sx={{ mr: 1 }} />
                  Dark Mode
                </Box>
              }
            />
          </RadioGroup>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Language
          </Typography>
          <FormControl fullWidth>
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="de">German</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            Font Size
          </Typography>
          <Slider
            value={fontSize}
            onChange={(e, value) => setFontSize(value)}
            min={12}
            max={18}
            step={1}
            marks
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}px`}
          />
        </Grid>
      </Grid>
    </SettingCard>
  );
};

const DataSettings = () => {
  return (
    <SettingCard
      title="Data & Storage"
      description="Manage your data, backups, and storage preferences"
    >
      <List>
        <ListItem>
          <ListItemIcon>
            <Backup />
          </ListItemIcon>
          <ListItemText
            primary="Data Backup"
            secondary="Automatically backup your data daily"
          />
          <ListItemSecondaryAction>
            <Switch defaultChecked />
          </ListItemSecondaryAction>
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <GetApp />
          </ListItemIcon>
          <ListItemText
            primary="Export Data"
            secondary="Download your data in CSV or JSON format"
          />
          <ListItemSecondaryAction>
            <Button>Export</Button>
          </ListItemSecondaryAction>
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <Storage />
          </ListItemIcon>
          <ListItemText
            primary="Storage Usage"
            secondary="2.3 GB of 10 GB used"
          />
          <ListItemSecondaryAction>
            <Chip label="23%" color="success" />
          </ListItemSecondaryAction>
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <Delete color="error" />
          </ListItemIcon>
          <ListItemText
            primary="Delete All Data"
            secondary="Permanently delete all your data and close account"
          />
          <ListItemSecondaryAction>
            <Button color="error">Delete</Button>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </SettingCard>
  );
};

const SettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();

  const tabs = [
    { label: 'Profile', icon: <Person /> },
    { label: 'Security', icon: <Security /> },
    { label: 'Notifications', icon: <Notifications /> },
    { label: 'Appearance', icon: <Palette /> },
    { label: 'Data', icon: <Storage /> },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account preferences, security settings, and application configuration
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sidebar Navigation */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 1 }}>
            <List>
              {tabs.map((tab, index) => (
                <ListItem
                  key={index}
                  button
                  selected={tabValue === index}
                  onClick={() => setTabValue(index)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    {tab.icon}
                  </ListItemIcon>
                  <ListItemText primary={tab.label} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Content Area */}
        <Grid item xs={12} md={9}>
          {tabValue === 0 && <ProfileSettings user={user} />}
          {tabValue === 1 && <SecuritySettings />}
          {tabValue === 2 && <NotificationSettings />}
          {tabValue === 3 && <AppearanceSettings />}
          {tabValue === 4 && <DataSettings />}
        </Grid>
      </Grid>

      {/* Save Changes Alert */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small">
              Save All Changes
            </Button>
          }
          sx={{ display: 'none' }}
        >
          You have unsaved changes
        </Alert>
      </Box>
    </Box>
  );
};

export default SettingsPage;