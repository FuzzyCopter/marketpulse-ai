-- MarketPulse AI - Initial Database Schema
-- Multi-tenant architecture for SEO & SEM Command Center

CREATE TABLE IF NOT EXISTS tenants (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50) DEFAULT 'analyst',
    is_active       BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    name            VARCHAR(255) NOT NULL,
    industry        VARCHAR(100),
    logo_url        VARCHAR(500),
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    client_id       INTEGER NOT NULL REFERENCES clients(id),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL,
    description     TEXT,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(50) DEFAULT 'active',
    budget          JSONB,
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS campaign_channels (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    campaign_id     INTEGER NOT NULL REFERENCES campaigns(id),
    channel_type    VARCHAR(50) NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    config          JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, channel_type)
);

CREATE TABLE IF NOT EXISTS kpi_targets (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    campaign_id     INTEGER NOT NULL REFERENCES campaigns(id),
    channel_id      INTEGER REFERENCES campaign_channels(id),
    metric_name     VARCHAR(100) NOT NULL,
    target_value    DECIMAL(15,2) NOT NULL,
    target_unit     VARCHAR(50) DEFAULT 'count',
    period          VARCHAR(50) DEFAULT 'campaign',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_metrics (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    campaign_id     INTEGER NOT NULL REFERENCES campaigns(id),
    channel_id      INTEGER NOT NULL REFERENCES campaign_channels(id),
    metric_date     DATE NOT NULL,
    impressions     BIGINT DEFAULT 0,
    clicks          BIGINT DEFAULT 0,
    visits          BIGINT DEFAULT 0,
    conversions     INTEGER DEFAULT 0,
    cost            DECIMAL(15,2) DEFAULT 0,
    ctr             DECIMAL(8,4) DEFAULT 0,
    cpc             DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(8,4) DEFAULT 0,
    quality_score   DECIMAL(4,2),
    extra_metrics   JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, channel_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(campaign_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_tenant ON daily_metrics(tenant_id, metric_date);

CREATE TABLE IF NOT EXISTS sem_keywords (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    campaign_id     INTEGER NOT NULL REFERENCES campaigns(id),
    channel_id      INTEGER NOT NULL REFERENCES campaign_channels(id),
    keyword         VARCHAR(500) NOT NULL,
    match_type      VARCHAR(50) DEFAULT 'broad',
    status          VARCHAR(50) DEFAULT 'active',
    max_cpc         DECIMAL(10,2),
    quality_score   INTEGER,
    ad_group        VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sem_keyword_metrics (
    id              SERIAL PRIMARY KEY,
    keyword_id      INTEGER NOT NULL REFERENCES sem_keywords(id),
    metric_date     DATE NOT NULL,
    impressions     BIGINT DEFAULT 0,
    clicks          BIGINT DEFAULT 0,
    cost            DECIMAL(15,2) DEFAULT 0,
    ctr             DECIMAL(8,4) DEFAULT 0,
    avg_cpc         DECIMAL(10,2) DEFAULT 0,
    avg_position    DECIMAL(4,2),
    conversions     INTEGER DEFAULT 0,
    quality_score   INTEGER,
    UNIQUE(keyword_id, metric_date)
);

CREATE TABLE IF NOT EXISTS seo_rankings (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    campaign_id     INTEGER NOT NULL REFERENCES campaigns(id),
    keyword         VARCHAR(500) NOT NULL,
    url             VARCHAR(1000),
    position        INTEGER,
    previous_position INTEGER,
    search_volume   INTEGER,
    difficulty      DECIMAL(4,2),
    metric_date     DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_page_audits (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    campaign_id     INTEGER NOT NULL REFERENCES campaigns(id),
    url             VARCHAR(1000) NOT NULL,
    page_score      INTEGER,
    load_time_ms    INTEGER,
    mobile_score    INTEGER,
    issues          JSONB DEFAULT '[]',
    audit_date      DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    campaign_id     INTEGER NOT NULL REFERENCES campaigns(id),
    insight_type    VARCHAR(100) NOT NULL,
    title           VARCHAR(500) NOT NULL,
    content         TEXT NOT NULL,
    severity        VARCHAR(50),
    data_context    JSONB,
    is_read         BOOLEAN DEFAULT false,
    is_dismissed    BOOLEAN DEFAULT false,
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS alert_rules (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    campaign_id     INTEGER REFERENCES campaigns(id),
    name            VARCHAR(255) NOT NULL,
    metric_name     VARCHAR(100) NOT NULL,
    condition       VARCHAR(50) NOT NULL,
    threshold       DECIMAL(15,2) NOT NULL,
    channel_type    VARCHAR(50),
    notification    JSONB DEFAULT '{}',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_events (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    rule_id         INTEGER NOT NULL REFERENCES alert_rules(id),
    campaign_id     INTEGER REFERENCES campaigns(id),
    triggered_at    TIMESTAMPTZ DEFAULT NOW(),
    metric_value    DECIMAL(15,2),
    threshold_value DECIMAL(15,2),
    message         TEXT,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reports (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    campaign_id     INTEGER REFERENCES campaigns(id),
    title           VARCHAR(500) NOT NULL,
    report_type     VARCHAR(100) NOT NULL,
    date_range_start DATE,
    date_range_end  DATE,
    config          JSONB DEFAULT '{}',
    generated_data  JSONB,
    file_url        VARCHAR(500),
    status          VARCHAR(50) DEFAULT 'draft',
    created_by      INTEGER REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
