-- =============================================
-- Auto-update updated_at trigger function
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Users table
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login VARCHAR(10) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) DEFAULT NULL,
    last_name VARCHAR(255) DEFAULT NULL,
    email_confirmation_code VARCHAR(255) DEFAULT NULL,
    email_confirmation_expiration_date TIMESTAMPTZ DEFAULT NULL,
    email_is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    password_recovery_code VARCHAR(255) DEFAULT NULL,
    password_recovery_expiration_date TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Partial unique indexes (only for non-deleted rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_unique
    ON users (login) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
    ON users (email) WHERE deleted_at IS NULL;

-- Index for confirmation code lookup
CREATE INDEX IF NOT EXISTS idx_users_email_confirmation_code
    ON users (email_confirmation_code) WHERE deleted_at IS NULL AND email_confirmation_code IS NOT NULL;

-- Index for recovery code lookup
CREATE INDEX IF NOT EXISTS idx_users_password_recovery_code
    ON users (password_recovery_code) WHERE deleted_at IS NULL AND password_recovery_code IS NOT NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Security devices table
-- =============================================
CREATE TABLE IF NOT EXISTS security_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL UNIQUE,
    ip VARCHAR(45) NOT NULL,
    title VARCHAR(255) NOT NULL,
    last_active_date INTEGER NOT NULL,
    expiration_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_security_devices_user_id
    ON security_devices (user_id) WHERE deleted_at IS NULL;

-- Index for device_id lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_devices_device_id_unique
    ON security_devices (device_id) WHERE deleted_at IS NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_security_devices_updated_at
    BEFORE UPDATE ON security_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Blogs table
-- =============================================
CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(15) NOT NULL,
    description VARCHAR(500) NOT NULL,
    website_url VARCHAR(100) NOT NULL,
    is_membership BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Posts table
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(30) NOT NULL,
    short_description VARCHAR(100) NOT NULL,
    content VARCHAR(1000) NOT NULL,
    blog_id UUID NOT NULL REFERENCES blogs(id),
    blog_name VARCHAR(15) NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    dislikes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for blog_id lookups
CREATE INDEX IF NOT EXISTS idx_posts_blog_id
    ON posts (blog_id) WHERE deleted_at IS NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Comments table
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content VARCHAR(300) NOT NULL,
    commentator_user_id UUID NOT NULL REFERENCES users(id),
    commentator_user_login VARCHAR(10) NOT NULL,
    post_id UUID NOT NULL REFERENCES posts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for post_id lookups
CREATE INDEX IF NOT EXISTS idx_comments_post_id
    ON comments (post_id);

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Likes table
-- =============================================
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID NOT NULL,
    parent_type VARCHAR(10) NOT NULL CHECK (parent_type IN ('comment', 'post')),
    status VARCHAR(10) NOT NULL CHECK (status IN ('None', 'Like', 'Dislike')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on (user_id, parent_id, parent_type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_user_parent_unique
    ON likes (user_id, parent_id, parent_type);

-- Index for parent lookups
CREATE INDEX IF NOT EXISTS idx_likes_parent
    ON likes (parent_id, parent_type);

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_likes_updated_at
    BEFORE UPDATE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
