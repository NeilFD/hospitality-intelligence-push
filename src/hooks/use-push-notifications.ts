
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';

// Convert URL-safe base64 string to ArrayBuffer
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

  // Check if the browser supports push notifications
  const checkBrowserSupport = useCallback(() => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }, []);

  // Check if notifications are blocked
  const checkNotificationPermission = useCallback(() => {
    if (Notification.permission === 'denied') {
      console.log('Push notifications are blocked by the browser settings');
      setIsPermissionBlocked(true);
      return false;
    }
    return true;
  }, []);

  // Initialize service worker and fetch VAPID key
  useEffect(() => {
    const initialize = async () => {
      // Check if service workers and push messaging is supported
      if (!checkBrowserSupport()) {
        console.log('Push notifications are not supported in this browser');
        return;
      }
      
      // Check if notifications are blocked
      if (!checkNotificationPermission()) {
        return;
      }
      
      try {
        console.log('Initializing push notifications service...');
        
        // Unregister any existing service worker to get a fresh one
        const existingReg = await navigator.serviceWorker.getRegistration('/service-worker.js');
        if (existingReg) {
          console.log('Unregistering existing service worker for clean start');
          await existingReg.unregister();
        }
        
        await registerServiceWorker();
        
        // Fetch the VAPID public key from Supabase
        const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
        if (error) {
          console.error('Failed to fetch VAPID public key:', error);
          toast.error('Failed to initialize push notifications');
          return;
        }
        
        if (data && data.vapidPublicKey) {
          console.log('VAPID public key retrieved successfully');
          setVapidPublicKey(data.vapidPublicKey);
        } else {
          console.error('No VAPID public key found in response');
          toast.error('Push notification setup incomplete');
        }
      } catch (err) {
        console.error('Error during push notification initialization:', err);
      }
    };
    
    initialize();
  }, [checkBrowserSupport, checkNotificationPermission]);

  // Check subscription when registration is available
  useEffect(() => {
    if (registration) {
      checkSubscription();
    }
  }, [registration]);

  // Update subscription status on user change
  useEffect(() => {
    if (registration && user) {
      checkSubscription();
    }
  }, [user]);

  // Register service worker
  async function registerServiceWorker() {
    try {
      // Use the top-level window to register the service worker
      const swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
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
      return swRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      toast.error('Failed to register service worker');
      throw error;
    }
  }

  // Check if user is already subscribed
  async function checkSubscription() {
    try {
      console.log('Checking push subscription status...');
      const subscription = await registration?.pushManager.getSubscription();
      console.log('Current subscription:', subscription);
      setIsSubscribed(!!subscription);
      setSubscription(subscription);
      
      // If user is subscribed, store the subscription in Supabase
      if (subscription && user) {
        console.log('Saving subscription to database...');
        const existingSubscription = await checkExistingSubscription(subscription.endpoint);
        
        if (!existingSubscription) {
          await storeSubscription(subscription);
        }
      }
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  }

  // Check if subscription already exists in database
  async function checkExistingSubscription(endpoint: string) {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('endpoint', endpoint)
        .eq('user_id', user?.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking subscription in database:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error in checkExistingSubscription:', error);
      return false;
    }
  }

  // Store subscription in database
  async function storeSubscription(subscription: PushSubscription) {
    if (!user) return;
    
    try {
      // Get p256dh and auth keys
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      if (!p256dhKey || !authKey) {
        console.error('Missing required subscription keys');
        return;
      }
      
      const p256dhBase64 = btoa(String.fromCharCode.apply(null, 
        Array.from(new Uint8Array(p256dhKey))));
      const authBase64 = btoa(String.fromCharCode.apply(null, 
        Array.from(new Uint8Array(authKey))));
      
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: p256dhBase64,
        auth: authBase64
      });

      if (error) {
        console.error('Error storing subscription:', error);
      } else {
        console.log('Subscription stored successfully');
      }
    } catch (error) {
      console.error('Error in storeSubscription:', error);
    }
  }

  // Subscribe user to push notifications
  async function subscribeUser() {
    try {
      if (!registration || !user || !vapidPublicKey) {
        if (!vapidPublicKey) {
          console.error('VAPID public key not available');
          toast.error('Push notification setup incomplete');
        }
        return;
      }

      console.log('Requesting notification permission...');
      
      // First, request notification permission explicitly
      let permission;
      try {
        permission = await Notification.requestPermission();
        console.log('Notification permission result:', permission);
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

      console.log('Creating subscription with VAPID key...');
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Unsubscribe from any existing subscriptions
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }
      
      // Create the subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      console.log('Push subscription created:', subscription);

      // Store subscription in Supabase
      await storeSubscription(subscription);

      setIsSubscribed(true);
      setSubscription(subscription);
      toast.success('Successfully subscribed to push notifications');
      
      // Create a test notification to confirm everything is working
      console.log('Sending test notification...');
      try {
        await new Promise<void>(resolve => {
          setTimeout(() => {
            registration.showNotification('Notifications Enabled', {
              body: 'You will now receive notifications when mentioned in chats',
              icon: '/lovable-uploads/867c4809-f55f-4880-aa49-e12c12c65af6.png'
            }).then(() => resolve());
          }, 1000);
        });
      } catch (error) {
        console.error('Error showing test notification:', error);
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to subscribe to push notifications');
    }
  }

  // Unsubscribe user from push notifications
  async function unsubscribeUser() {
    try {
      if (!subscription || !user) return;

      console.log('Unsubscribing from push notifications...');
      await subscription.unsubscribe();

      // Remove subscription from Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('Error removing subscription from database:', error);
        throw error;
      }

      setIsSubscribed(false);
      setSubscription(null);
      toast.success('Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to unsubscribe from push notifications');
    }
  }

  return {
    isSupported: checkBrowserSupport(),
    isSubscribed,
    isPermissionBlocked,
    subscription,
    subscribeUser,
    unsubscribeUser
  };
}
