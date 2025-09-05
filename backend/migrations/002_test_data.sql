-- Gateway Manager Test Data
-- Migration: 002_test_data.sql
-- Description: Insert sample data for development and testing

-- Insert sample gateways
INSERT INTO gateways (serial_number, name, ipv4_address, status, location) VALUES
    ('GW-001-2024', 'Main Office Gateway', '192.168.1.100', 'active', 'Main Office - Floor 1'),
    ('GW-002-2024', 'Warehouse Gateway', '192.168.1.101', 'active', 'Warehouse - Building A'),
    ('GW-003-2024', 'Lab Gateway', '192.168.1.102', 'active', 'Research Lab - Floor 2'),
    ('GW-004-2024', 'Backup Gateway', '192.168.1.103', 'inactive', 'Server Room - Floor 1'),
    ('GW-005-2024', 'Old Gateway', '192.168.1.104', 'decommissioned', 'Storage Room');

-- Insert sample peripheral devices
INSERT INTO peripheral_devices (uid, vendor, status, gateway_id, device_type_id, last_seen_at) VALUES
    -- Devices for Main Office Gateway (GW-001)
    (10001, 'TechCorp', 'online', (SELECT id FROM gateways WHERE serial_number = 'GW-001-2024'), 1, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
    (10002, 'TechCorp', 'online', (SELECT id FROM gateways WHERE serial_number = 'GW-001-2024'), 1, CURRENT_TIMESTAMP - INTERVAL '2 minutes'),
    (10003, 'SmartDevices Inc', 'online', (SELECT id FROM gateways WHERE serial_number = 'GW-001-2024'), 2, CURRENT_TIMESTAMP - INTERVAL '1 minute'),
    (10004, 'IoT Solutions', 'maintenance', (SELECT id FROM gateways WHERE serial_number = 'GW-001-2024'), 3, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    
    -- Devices for Warehouse Gateway (GW-002)
    (20001, 'WarehouseTech', 'online', (SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 1, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
    (20002, 'WarehouseTech', 'online', (SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 1, CURRENT_TIMESTAMP - INTERVAL '8 minutes'),
    (20003, 'SensorPro', 'offline', (SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 1, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    (20004, 'ActuatorCorp', 'online', (SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 2, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
    (20005, 'ControlTech', 'online', (SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 3, CURRENT_TIMESTAMP - INTERVAL '3 minutes'),
    
    -- Devices for Lab Gateway (GW-003)
    (30001, 'LabTech', 'online', (SELECT id FROM gateways WHERE serial_number = 'GW-003-2024'), 1, CURRENT_TIMESTAMP - INTERVAL '1 minute'),
    (30002, 'ResearchDevices', 'online', (SELECT id FROM gateways WHERE serial_number = 'GW-003-2024'), 1, CURRENT_TIMESTAMP - INTERVAL '30 seconds'),
    (30003, 'LabTech', 'maintenance', (SELECT id FROM gateways WHERE serial_number = 'GW-003-2024'), 2, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
    
    -- Devices for Backup Gateway (GW-004) - inactive
    (40001, 'BackupTech', 'offline', (SELECT id FROM gateways WHERE serial_number = 'GW-004-2024'), 1, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (40002, 'BackupTech', 'offline', (SELECT id FROM gateways WHERE serial_number = 'GW-004-2024'), 3, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    
    -- Orphaned devices (no gateway assigned)
    (50001, 'OrphanTech', 'offline', NULL, 1, CURRENT_TIMESTAMP - INTERVAL '1 week'),
    (50002, 'OrphanTech', 'offline', NULL, 2, CURRENT_TIMESTAMP - INTERVAL '1 week'),
    (50003, 'OrphanTech', 'offline', NULL, 3, CURRENT_TIMESTAMP - INTERVAL '1 week');

-- Insert sample gateway logs
INSERT INTO gateway_logs (gateway_id, action, details) VALUES
    -- Main Office Gateway logs
    ((SELECT id FROM gateways WHERE serial_number = 'GW-001-2024'), 'CREATED', '{"serial_number": "GW-001-2024", "name": "Main Office Gateway"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-001-2024'), 'DEVICE_ATTACHED', '{"deviceId": "10001", "uid": 10001, "vendor": "TechCorp"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-001-2024'), 'DEVICE_ATTACHED', '{"deviceId": "10002", "uid": 10002, "vendor": "TechCorp"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-001-2024'), 'DEVICE_ATTACHED', '{"deviceId": "10003", "uid": 10003, "vendor": "SmartDevices Inc"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-001-2024'), 'DEVICE_ATTACHED', '{"deviceId": "10004", "uid": 10004, "vendor": "IoT Solutions"}'),
    
    -- Warehouse Gateway logs
    ((SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 'CREATED', '{"serial_number": "GW-002-2024", "name": "Warehouse Gateway"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 'DEVICE_ATTACHED', '{"deviceId": "20001", "uid": 20001, "vendor": "WarehouseTech"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 'DEVICE_ATTACHED', '{"deviceId": "20002", "uid": 20002, "vendor": "WarehouseTech"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 'DEVICE_ATTACHED', '{"deviceId": "20003", "uid": 20003, "vendor": "SensorPro"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 'DEVICE_ATTACHED', '{"deviceId": "20004", "uid": 20004, "vendor": "ActuatorCorp"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-002-2024'), 'DEVICE_ATTACHED', '{"deviceId": "20005", "uid": 20005, "vendor": "ControlTech"}'),
    
    -- Lab Gateway logs
    ((SELECT id FROM gateways WHERE serial_number = 'GW-003-2024'), 'CREATED', '{"serial_number": "GW-003-2024", "name": "Lab Gateway"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-003-2024'), 'DEVICE_ATTACHED', '{"deviceId": "30001", "uid": 30001, "vendor": "LabTech"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-003-2024'), 'DEVICE_ATTACHED', '{"deviceId": "30002", "uid": 30002, "vendor": "ResearchDevices"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-003-2024'), 'DEVICE_ATTACHED', '{"deviceId": "30003", "uid": 30003, "vendor": "LabTech"}'),
    
    -- Backup Gateway logs
    ((SELECT id FROM gateways WHERE serial_number = 'GW-004-2024'), 'CREATED', '{"serial_number": "GW-004-2024", "name": "Backup Gateway"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-004-2024'), 'DEVICE_ATTACHED', '{"deviceId": "40001", "uid": 40001, "vendor": "BackupTech"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-004-2024'), 'DEVICE_ATTACHED', '{"deviceId": "40002", "uid": 40002, "vendor": "BackupTech"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-004-2024'), 'UPDATED', '{"fields": ["status"], "oldStatus": "active", "newStatus": "inactive"}'),
    
    -- Old Gateway logs (decommissioned)
    ((SELECT id FROM gateways WHERE serial_number = 'GW-005-2024'), 'CREATED', '{"serial_number": "GW-005-2024", "name": "Old Gateway"}'),
    ((SELECT id FROM gateways WHERE serial_number = 'GW-005-2024'), 'UPDATED', '{"fields": ["status"], "oldStatus": "active", "newStatus": "decommissioned"}');

-- Create a view for gateway device counts
CREATE OR REPLACE VIEW gateway_device_summary AS
SELECT 
    g.id,
    g.serial_number,
    g.name,
    g.ipv4_address,
    g.status as gateway_status,
    g.location,
    COUNT(p.id) as device_count,
    COUNT(CASE WHEN p.status = 'online' THEN 1 END) as online_devices,
    COUNT(CASE WHEN p.status = 'offline' THEN 1 END) as offline_devices,
    COUNT(CASE WHEN p.status = 'maintenance' THEN 1 END) as maintenance_devices,
    g.created_at,
    g.updated_at
FROM gateways g
LEFT JOIN peripheral_devices p ON g.id = p.gateway_id
GROUP BY g.id, g.serial_number, g.name, g.ipv4_address, g.status, g.location, g.created_at, g.updated_at;

-- Create a view for orphaned devices
CREATE OR REPLACE VIEW orphaned_devices AS
SELECT 
    p.id,
    p.uid,
    p.vendor,
    p.status,
    dt.name as device_type,
    p.created_at,
    p.last_seen_at
FROM peripheral_devices p
LEFT JOIN device_types dt ON p.device_type_id = dt.id
WHERE p.gateway_id IS NULL;

-- Create a view for gateway activity
CREATE OR REPLACE VIEW gateway_activity AS
SELECT 
    g.id,
    g.serial_number,
    g.name,
    gl.action,
    gl.details,
    gl.created_at
FROM gateways g
JOIN gateway_logs gl ON g.id = gl.gateway_id
ORDER BY gl.created_at DESC;

-- Grant permissions on views
-- GRANT SELECT ON gateway_device_summary TO your_user;
-- GRANT SELECT ON orphaned_devices TO your_user;
-- GRANT SELECT ON gateway_activity TO your_user;

-- Insert comments for the views
COMMENT ON VIEW gateway_device_summary IS 'Summary view showing device counts and status for each gateway';
COMMENT ON VIEW orphaned_devices IS 'View showing devices that are not attached to any gateway';
COMMENT ON VIEW gateway_activity IS 'View showing recent activity logs for all gateways';
