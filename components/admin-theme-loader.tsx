'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { hexToHslString, isLightColor } from '@/lib/color-utils';

export function AdminThemeLoader() {
  const pathname = usePathname();
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  // Fetch settings favicon on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.ok ? res.json() : { success: false })
      .then(json => {
        if (json.success && json.data?.favicon_url) {
          setFaviconUrl(json.data.favicon_url);
        }
      })
      .catch(err => console.error('Failed to load dynamic favicon', err));
  }, []);

  // Enforce favicon link tag on path updates
  useEffect(() => {
    if (typeof window !== 'undefined' && faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [faviconUrl, pathname]);
  useEffect(() => {
    // Function to map the stored colors (specifically the `admin` property) to the CSS variables
    const applyAdminColors = (colors: any) => {
      if (!colors || !colors.admin) return;

      const root = document.documentElement;
      const admin = colors.admin;

      if (admin.background) {
        root.style.setProperty('--background', hexToHslString(admin.background));
        // If it's the light theme, map popover to background too for consistency
        root.style.setProperty('--popover', hexToHslString(admin.background));
      }
      if (admin.foreground) {
        root.style.setProperty('--foreground', hexToHslString(admin.foreground));
        root.style.setProperty('--popover-foreground', hexToHslString(admin.foreground));
      }
      if (admin.card) {
        root.style.setProperty('--card', hexToHslString(admin.card));
      }
      if (admin.cardForeground) {
        root.style.setProperty('--card-foreground', hexToHslString(admin.cardForeground));
      }
      if (admin.primary) {
        root.style.setProperty('--primary', hexToHslString(admin.primary));
        root.style.setProperty('--ring', hexToHslString(admin.primary));
        root.style.setProperty('--sidebar-primary', hexToHslString(admin.primary));
        
        // Auto-calculate foreground if not provided by user, but since we provide it:
        if (!admin.primaryForeground) {
          const isLight = isLightColor(admin.primary);
          root.style.setProperty('--primary-foreground', isLight ? '0 0% 0%' : '0 0% 100%');
          root.style.setProperty('--sidebar-primary-foreground', isLight ? '0 0% 0%' : '0 0% 100%');
        }
      }
      if (admin.primaryForeground) {
        root.style.setProperty('--primary-foreground', hexToHslString(admin.primaryForeground));
        root.style.setProperty('--sidebar-primary-foreground', hexToHslString(admin.primaryForeground));
      }
      if (admin.border) {
        root.style.setProperty('--border', hexToHslString(admin.border));
        root.style.setProperty('--input', hexToHslString(admin.border));
        root.style.setProperty('--sidebar-border', hexToHslString(admin.border));
      }
      if (admin.sidebarBackground) {
        root.style.setProperty('--sidebar-background', hexToHslString(admin.sidebarBackground));
      }
      if (admin.sidebarForeground) {
        root.style.setProperty('--sidebar-foreground', hexToHslString(admin.sidebarForeground));
      }
      if (admin.success) {
        root.style.setProperty('--success', hexToHslString(admin.success));
      }
      if (admin.successForeground) {
        root.style.setProperty('--success-foreground', hexToHslString(admin.successForeground));
      }
    };

    // 1. Check local storage first (fastest application)
    try {
      const saved = localStorage.getItem('bexon-colors');
      if (saved) {
        const parsed = JSON.parse(saved);
        applyAdminColors(parsed);
      }
    } catch (e) {
      console.error('Failed to parse colors from localStorage', e);
    }

    // 2. Fallback to API check just in case
    fetch('/api/colors', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.colors) {
          applyAdminColors(data.data.colors);
        }
      })
      .catch(err => console.error('Failed to fetch colors from API', err));

    // 3. Listen for updates coming from the ColorManagerPage
    const handleThemeUpdate = (e: any) => {
      if (e.detail) {
        applyAdminColors(e.detail);
      }
    };

    window.addEventListener('admin-theme:update', handleThemeUpdate);
    return () => window.removeEventListener('admin-theme:update', handleThemeUpdate);
  }, []);

  return null;
}
