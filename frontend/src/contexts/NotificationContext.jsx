import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Student Registered',
      message: 'John Smith has joined Computer Science program',
      type: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      read: false,
    },
    {
      id: 2,
      title: 'Survey Response Received',
      message: 'Career Interests Survey has 3 new responses',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      read: false,
    },
    {
      id: 3,
      title: 'Weekly Report Ready',
      message: 'Your analytics report for this week is ready to view',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: true,
    },
    {
      id: 4,
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight at 11 PM',
      type: 'warning',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      read: false,
    },
    {
      id: 5,
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated',
      type: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true,
    },
  ]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Simulate receiving new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const randomNotifications = [
        {
          title: 'New Student Activity',
          message: 'Student completed Skills Assessment',
          type: 'info',
        },
        {
          title: 'Survey Deadline Approaching',
          message: 'Career Planning survey deadline in 2 days',
          type: 'warning',
        },
        {
          title: 'Goal Achievement',
          message: 'Sarah Johnson completed her learning goals',
          type: 'success',
        },
      ];

      // 20% chance to add a random notification every 30 seconds
      if (Math.random() < 0.2) {
        const randomNotification = randomNotifications[
          Math.floor(Math.random() * randomNotifications.length)
        ];
        addNotification(randomNotification);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};