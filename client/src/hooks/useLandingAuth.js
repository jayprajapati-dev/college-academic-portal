import { useEffect, useState } from 'react';

const useLandingAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsLoggedIn(true);
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);

      if (parsedUser.role === 'student') {
        fetch('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setUserProfile(data.data);
            }
          })
          .catch((err) => console.error('Error fetching profile:', err));

        fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setNotifications(data.data || []);
            }
          })
          .catch((err) => console.error('Error fetching notifications:', err));
      }
    }
  }, []);

  return { isLoggedIn, currentUser, userProfile, notifications };
};

export default useLandingAuth;
