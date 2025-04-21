
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/services/auth-service';

const VAPID_PUBLIC_KEY = "https://kfiergoryrnjkewmeriy.supabase.co";

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    // Check if service workers and push messaging is supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerServiceWorker();
    }
  }, []);

  useEffect(() => {
    if (registration) {
      checkSubscription();
    }
  }, [registration]);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      setRegistration(registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
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
      if (!registration || !user) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
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
    subscription,
    subscribeUser,
    unsubscribeUser
  };
}
