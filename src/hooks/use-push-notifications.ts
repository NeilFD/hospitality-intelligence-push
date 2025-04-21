
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';

// The API is stored as a URL, but we need the actual base64 VAPID public key
// Function to convert the URL-safe base64 string to an ArrayBuffer
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isPermissionBlocked, setIsPermissionBlocked] = useState(false);
  const { user } = useAuthStore();

  // This will be set when the component mounts by fetching from Supabase
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  useEffect(() => {
    // Check if service workers and push messaging is supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Check if notifications are blocked
      if (Notification.permission === 'denied') {
        setIsPermissionBlocked(true);
        console.log('Push notifications are blocked by the browser settings');
        return;
      }
      
      registerServiceWorker();
      
      // Fetch the VAPID public key from Supabase
      const fetchVapidKey = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
          if (error) throw error;
          if (data && data.vapidPublicKey) {
            setVapidPublicKey(data.vapidPublicKey);
          }
        } catch (err) {
          console.error('Failed to fetch VAPID public key:', err);
          toast.error('Failed to initialize push notifications');
        }
      };
      
      fetchVapidKey();
    }
  }, []);

  useEffect(() => {
    if (registration) {
      checkSubscription();
    }
  }, [registration]);

  async function registerServiceWorker() {
    try {
      // Use the top-level window to register the service worker
      const swRegistration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', swRegistration);
      
      // Wait until the service worker is active
      if (swRegistration.installing) {
        console.log('Service worker installing');
        const worker = swRegistration.installing;
        
        // Create a promise that resolves when the service worker is activated
        await new Promise<void>((resolve) => {
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') {
              console.log('Service worker now activated');
              resolve();
            }
          });
        });
      } else if (swRegistration.waiting) {
        console.log('Service worker is waiting');
        // Force activation if waiting
        await swRegistration.waiting.postMessage({type: 'SKIP_WAITING'});
      } else {
        console.log('Service worker is already active');
      }
      
      setRegistration(swRegistration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      toast.error('Failed to register service worker');
    }
  }

  async function checkSubscription() {
    try {
      const subscription = await registration?.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      setSubscription(subscription);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  }

  async function subscribeUser() {
    try {
      if (!registration || !user || !vapidPublicKey) {
        if (!vapidPublicKey) {
          toast.error('VAPID public key not available');
        }
        return;
      }

      // First, request notification permission explicitly
      let permission;
      try {
        permission = await Notification.requestPermission();
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        // If iframe restriction error occurred
        if (error instanceof Error && error.message.includes('cross-origin iframe')) {
          toast.error('Cannot request notification permission in an iframe. Please open the app in a new tab.');
          setIsPermissionBlocked(true);
          return;
        }
        toast.error('Failed to request notification permission');
        return;
      }
      
      if (permission !== 'granted') {
        console.log('Notification permission denied:', permission);
        toast.error('Notification permission was denied');
        setIsPermissionBlocked(permission === 'denied');
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Store subscription in Supabase
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(subscription.getKey('auth')!)))
      });

      if (error) throw error;

      setIsSubscribed(true);
      setSubscription(subscription);
      toast.success('Successfully subscribed to push notifications');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to subscribe to push notifications');
    }
  }

  async function unsubscribeUser() {
    try {
      if (!subscription || !user) return;

      await subscription.unsubscribe();

      // Remove subscription from Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      if (error) throw error;

      setIsSubscribed(false);
      setSubscription(null);
      toast.success('Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to unsubscribe from push notifications');
    }
  }

  return {
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
    isSubscribed,
    isPermissionBlocked,
    subscription,
    subscribeUser,
    unsubscribeUser
  };
}
