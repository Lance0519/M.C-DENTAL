import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface SettingsTabProps {
  role?: 'admin' | 'staff';
}

export function SettingsTab({ role = 'admin' }: SettingsTabProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSettings();
      // Handle both direct response and wrapped response
      const responseData = (response as any)?.data ?? response;
      const data = typeof responseData === 'object' && responseData !== null
        ? responseData as Record<string, string>
        : {};

      // If no settings exist, use defaults
      if (Object.keys(data).length === 0) {
        const defaults = {
          promo_banner_title: 'Special Promotions',
          promo_banner_subtitle: 'Limited time offers on selected dental services',
          promo_banner_bg_image: '',
          active_occasion: 'none',
        };
        setSettings(defaults);
        setEditedSettings(defaults);
      } else {
        // Ensure bg_image exists even if not in database
        const settingsWithDefaults = {
          promo_banner_title: data.promo_banner_title || 'Special Promotions',
          promo_banner_subtitle: data.promo_banner_subtitle || 'Limited time offers on selected dental services',
          promo_banner_bg_image: data.promo_banner_bg_image || '',
          active_occasion: data.active_occasion || 'none',
        };
        setSettings(settingsWithDefaults);
        setEditedSettings(settingsWithDefaults);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      // Set defaults if settings don't exist or error occurs
      const defaults = {
        promo_banner_title: 'Special Promotions',
        promo_banner_subtitle: 'Limited time offers on selected dental services',
        promo_banner_bg_image: '',
        active_occasion: 'none',
      };
      setSettings(defaults);
      setEditedSettings(defaults);

      // Only show error if it's not a "table doesn't exist" type error
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      if (!errorMessage.includes('not found') && !errorMessage.includes('does not exist')) {
        setError('Note: Settings table may not be initialized. Using default values. Please run the database migration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save each setting
      const promises = Object.entries(editedSettings).map(([key, value]) =>
        api.updateSetting(key, value || '')
      );

      await Promise.all(promises);
      setSettings({ ...editedSettings });
      setSuccessMessage('Settings saved successfully!');

      // Notify other components like HolidayOverlay that settings changed
      window.dispatchEvent(new CustomEvent('settingsUpdated'));

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-black-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Site Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage editable content on your website
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Holiday Animations */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Holiday Effects
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add festive animations over the entire application
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Active Occasion
              </label>
              <select
                value={editedSettings.active_occasion || 'none'}
                onChange={(e) => handleChange('active_occasion', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">None (Disabled)</option>
                <option value="xmas">Christmas (Falling Snow)</option>
                <option value="newyear">New Year (Fireworks)</option>
                <option value="cny">Chinese New Year (Floating Lanterns)</option>
                <option value="valentines">Valentine's Day (Floating Hearts)</option>
                <option value="halloween">Halloween (Floating Ghosts)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select a visual effect to show on all pages. Set to 'None' to disable.
              </p>
            </div>
          </div>

          {/* Promotion Banner Settings */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Promotion Banner
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Customize the banner text displayed on the Services page
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banner Title
                </label>
                <input
                  type="text"
                  value={editedSettings.promo_banner_title || ''}
                  onChange={(e) => handleChange('promo_banner_title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Special Promotions"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Main heading for the promotions section
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banner Subtitle
                </label>
                <textarea
                  value={editedSettings.promo_banner_subtitle || ''}
                  onChange={(e) => handleChange('promo_banner_subtitle', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Limited time offers on selected dental services"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Subtitle or description text below the title
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Image URL
                </label>
                <input
                  type="url"
                  value={editedSettings.promo_banner_bg_image || ''}
                  onChange={(e) => handleChange('promo_banner_bg_image', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  URL of the background image for the promotions banner. Leave empty to use gradient background.
                </p>
                {editedSettings.promo_banner_bg_image && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                      <img
                        src={editedSettings.promo_banner_bg_image}
                        alt="Banner background preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-sm">Invalid image URL</div>';
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={loadSettings}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-black-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-black-700 transition-colors"
            disabled={saving}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

