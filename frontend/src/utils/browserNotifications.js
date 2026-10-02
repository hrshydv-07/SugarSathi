// Browser Notification Utility for DiaCare Senior Scheduled Reminders

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return Notification.permission;
  }
}

export function sendBrowserNotification({ title, body, icon, tag }) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: tag || `diacare-rem-${Date.now()}`,
      silent: false
    });

    notif.onclick = () => {
      try {
        window.focus();
      } catch (e) {}
      notif.close();
    };

    return notif;
  } catch (err) {
    console.warn('Failed to fire browser notification:', err);
    return null;
  }
}
