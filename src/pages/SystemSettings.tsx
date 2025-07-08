import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './styles/SystemSettings.css';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface SystemSetting {
    id: number;
    key: string;
    value: string;
    description: string;
    category: string;
    isEditable: boolean;
    dataType: string;
}

interface SystemStats {
    users: { total: number; growth: string; color: string };
    branches: { total: number; growth: string; color: string };
    orders: { total: number; growth: string; color: string };
    menuItems: { total: number; growth: string; color: string };
    reservations: { total: number; growth: string; color: string };
}

interface SystemLog {
    id: number;
    timestamp: string;
    level: string;
    message: string;
    source: string;
    details: any;
}

const SystemSettings: React.FC = () => {    const [activeTab, setActiveTab] = useState<'settings' | 'stats' | 'logs' | 'maintenance'>('settings');
    const [settings, setSettings] = useState<Record<string, SystemSetting[]>>({});
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
    const [logLevel, setLogLevel] = useState('ALL');
    
    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/system/logs?level=${logLevel}`);
            setLogs(response.data.logs);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }, [logLevel]);
    
    useEffect(() => {
        if (activeTab === 'settings') {
            fetchSettings();
        } else if (activeTab === 'stats') {
            fetchStats();
        } else if (activeTab === 'logs') {
            fetchLogs();
        }
    }, [activeTab, fetchLogs]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/system/settings');
            setSettings(response.data.settings);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/system/stats');
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }    };

    const handleSettingEdit = (key: string, value: string) => {
        setEditingSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSetting = async (key: string) => {
        try {
            const newValue = editingSettings[key];
            await api.put(`/system/settings/${key}`, { value: newValue });
            
            // Update local state
            setSettings(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(category => {
                    updated[category] = updated[category].map(setting => 
                        setting.key === key ? { ...setting, value: newValue } : setting
                    );
                });
                return updated;
            });
            
            // Clear editing state
            setEditingSettings(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });
            
            alert('Setting updated successfully!');
        } catch (error) {
            console.error('Error updating setting:', error);
            alert('Error updating setting');
        }
    };

    const clearCache = async () => {
        try {
            await api.post('/system/cache/clear');
            alert('System cache cleared successfully!');
        } catch (error) {
            console.error('Error clearing cache:', error);
            alert('Error clearing cache');
        }
    };

    const createBackup = async () => {
        try {
            const response = await api.post('/system/backup');
            alert(`Backup created successfully! ID: ${response.data.backupId}`);
        } catch (error) {
            console.error('Error creating backup:', error);
            alert('Error creating backup');
        }
    };

    const renderValue = (setting: SystemSetting) => {
        const isEditing = editingSettings.hasOwnProperty(setting.key);
        const currentValue = isEditing ? editingSettings[setting.key] : setting.value;

        if (!setting.isEditable) {
            return <span className="readonly-value">{setting.value}</span>;
        }

        if (isEditing) {
            if (setting.dataType === 'BOOLEAN') {
                return (
                    <select
                        value={currentValue}
                        onChange={(e) => handleSettingEdit(setting.key, e.target.value)}
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                );
            } else {
                return (
                    <input
                        type={setting.dataType === 'NUMBER' ? 'number' : 'text'}
                        value={currentValue}
                        onChange={(e) => handleSettingEdit(setting.key, e.target.value)}
                    />
                );
            }
        }

        return (
            <span 
                className="editable-value" 
                onClick={() => handleSettingEdit(setting.key, setting.value)}
            >
                {setting.dataType === 'BOOLEAN' ? (setting.value === 'true' ? '✅ True' : '❌ False') : setting.value}
            </span>
        );
    };

    return (
        <div className="system-settings">
            <div className="settings-header">
                <h1>System Settings</h1>
                <p>Manage system configuration, view statistics, and monitor system health</p>
            </div>

            <div className="settings-tabs">
                <button 
                    className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Settings
                </button>
                <button 
                    className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    📊 Statistics
                </button>
                <button 
                    className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    📝 System Logs
                </button>
                <button 
                    className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('maintenance')}
                >
                    🛠️ Maintenance
                </button>
            </div>

            <div className="settings-content">
                {loading && <div className="loading">Loading...</div>}

                {activeTab === 'settings' && !loading && (
                    <div className="settings-panel">
                        {Object.entries(settings).map(([category, categorySettings]) => (
                            <div key={category} className="settings-category">
                                <h3>{category.replace('_', ' ')}</h3>
                                <div className="settings-grid">
                                    {categorySettings.map((setting) => (
                                        <div key={setting.key} className="setting-item">
                                            <div className="setting-info">
                                                <label>{setting.key.replace(/_/g, ' ').toUpperCase()}</label>
                                                <p className="setting-description">{setting.description}</p>
                                            </div>
                                            <div className="setting-control">
                                                {renderValue(setting)}
                                                {editingSettings.hasOwnProperty(setting.key) && (
                                                    <div className="setting-actions">
                                                        <button 
                                                            className="save-btn"
                                                            onClick={() => saveSetting(setting.key)}
                                                        >
                                                            Save
                                                        </button>
                                                        <button 
                                                            className="cancel-btn"
                                                            onClick={() => setEditingSettings(prev => {
                                                                const updated = { ...prev };
                                                                delete updated[setting.key];
                                                                return updated;
                                                            })}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'stats' && !loading && stats && (
                    <div className="stats-panel">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>👥 Users</h3>
                                <div className="stat-value">{stats.users.total}</div>
                                <div className={`stat-growth ${stats.users.color}`}>{stats.users.growth}</div>
                            </div>
                            <div className="stat-card">
                                <h3>🏢 Branches</h3>
                                <div className="stat-value">{stats.branches.total}</div>
                                <div className={`stat-growth ${stats.branches.color}`}>{stats.branches.growth}</div>
                            </div>
                            <div className="stat-card">
                                <h3>📦 Orders</h3>
                                <div className="stat-value">{stats.orders.total}</div>
                                <div className={`stat-growth ${stats.orders.color}`}>{stats.orders.growth}</div>
                            </div>
                            <div className="stat-card">
                                <h3>🍽️ Menu Items</h3>
                                <div className="stat-value">{stats.menuItems.total}</div>
                                <div className={`stat-growth ${stats.menuItems.color}`}>{stats.menuItems.growth}</div>
                            </div>
                            <div className="stat-card">
                                <h3>📅 Reservations</h3>
                                <div className="stat-value">{stats.reservations.total}</div>
                                <div className={`stat-growth ${stats.reservations.color}`}>{stats.reservations.growth}</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && !loading && (
                    <div className="logs-panel">
                        <div className="logs-controls">
                            <select 
                                value={logLevel} 
                                onChange={(e) => setLogLevel(e.target.value)}
                            >
                                <option value="ALL">All Levels</option>
                                <option value="ERROR">Error</option>
                                <option value="WARNING">Warning</option>
                                <option value="INFO">Info</option>
                                <option value="DEBUG">Debug</option>
                            </select>
                            <button onClick={fetchLogs}>Refresh</button>
                        </div>
                        <div className="logs-list">
                            {logs.map((log) => (
                                <div key={log.id} className={`log-entry ${log.level.toLowerCase()}`}>
                                    <div className="log-header">
                                        <span className="log-level">{log.level}</span>
                                        <span className="log-source">{log.source}</span>
                                        <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="log-message">{log.message}</div>
                                    {log.details && (
                                        <div className="log-details">
                                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div className="maintenance-panel">
                        <div className="maintenance-actions">
                            <div className="action-card">
                                <h3>🗂️ Clear System Cache</h3>
                                <p>Clear all cached data to improve performance</p>
                                <button onClick={clearCache} className="action-btn">
                                    Clear Cache
                                </button>
                            </div>
                            <div className="action-card">
                                <h3>💾 Create System Backup</h3>
                                <p>Create a full backup of the system data</p>
                                <button onClick={createBackup} className="action-btn">
                                    Create Backup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemSettings;
