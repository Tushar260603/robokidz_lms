
USE robokidz_lms;

INSERT IGNORE INTO users (name, email, password_hash, role, bio, is_active)
VALUES (
    'Super Admin',
    'admin@robokidz.com',
    '$2b$12$eWUOFTlBT0b.Fuq.qHYd8.A2u8FB.wawo.1Mur5GAl3gWmijIQ.ie',
    'admin',
    'Platform administrator',
    1
);

-- ── Categories ───────────────────────────────────────────────
INSERT IGNORE INTO categories (name) VALUES
    ('Robotics'),
    ('Programming'),
    ('Electronics');
