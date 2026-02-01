import pool from '../db.js';

export const getSetting = async (key, defaultValue = '') => {
  try {
    const [rows] = await pool.query('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
    return rows.length > 0 ? rows[0].setting_value : defaultValue;
  } catch (err) {
    console.error(`Error getting setting ${key}:`, err);
    return defaultValue;
  }
};

export const updateSetting = async (key, value) => {
  try {
    await pool.query(
      'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, String(value), String(value)]
    );
    return true;
  } catch (err) {
    console.error(`Error updating setting ${key}:`, err);
    return false;
  }
};

export const getAllSettings = async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM system_settings');
        return rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
    } catch (err) {
        console.error('Error getting all settings:', err);
        return {};
    }
};
