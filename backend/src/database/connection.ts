import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

// Enable verbose mode for debugging
const sqlite = sqlite3.verbose();

let db: sqlite3.Database;

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create database file in the backend directory
    const dbPath = path.join(__dirname, '../../data/cryptoscore.db');
    
    db = new sqlite.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Create tables
      createTables()
        .then(() => resolve())
        .catch(reject);
    });
  });
}

async function createTables(): Promise<void> {
  const runAsync = promisify(db.run.bind(db));
  
  try {
    // Create credit_scores table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS credit_scores (
        address TEXT PRIMARY KEY,
        score INTEGER NOT NULL,
        breakdown TEXT NOT NULL,
        last_updated INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
    
    // Create score_history table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS score_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        score INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create enhanced_score_history table with intelligence data fields
    await runAsync(`
      CREATE TABLE IF NOT EXISTS enhanced_score_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        score INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        version TEXT NOT NULL,
        
        -- Component scores
        volume_score INTEGER,
        frequency_score INTEGER,
        staking_score INTEGER,
        defi_score INTEGER,
        gas_efficiency_score INTEGER,
        consistency_score INTEGER,
        diversification_score INTEGER,
        
        -- Risk assessment
        risk_score INTEGER,
        risk_level TEXT,
        risk_flags TEXT, -- JSON
        
        -- Behavioral insights
        activity_pattern TEXT,
        user_archetype TEXT,
        sophistication_level TEXT,
        growth_trend TEXT,
        
        -- Metadata
        calculation_time_ms INTEGER,
        data_quality_score INTEGER,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create behavioral_patterns table for pattern tracking and analysis
    await runAsync(`
      CREATE TABLE IF NOT EXISTS behavioral_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        pattern_type TEXT NOT NULL,
        pattern_data TEXT NOT NULL, -- JSON
        confidence REAL NOT NULL,
        first_detected INTEGER NOT NULL,
        last_updated INTEGER NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create recommendations table for personalized suggestion management
    await runAsync(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        recommendation_id TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        expected_impact INTEGER,
        difficulty TEXT,
        created_at INTEGER NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        progress INTEGER DEFAULT 0,
        completed_at INTEGER,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);
    
    // Create indexes for better query performance on existing tables
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_score_history_address 
      ON score_history(address)
    `);
    
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_score_history_timestamp 
      ON score_history(timestamp)
    `);

    // Create indexes for enhanced_score_history table for real-time analytics
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_enhanced_score_history_address 
      ON enhanced_score_history(address)
    `);
    
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_enhanced_score_history_timestamp 
      ON enhanced_score_history(timestamp)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_enhanced_score_history_address_timestamp 
      ON enhanced_score_history(address, timestamp)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_enhanced_score_history_risk_level 
      ON enhanced_score_history(risk_level)
    `);

    // Create indexes for behavioral_patterns table
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_address 
      ON behavioral_patterns(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_type 
      ON behavioral_patterns(pattern_type)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_status 
      ON behavioral_patterns(status)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_address_type 
      ON behavioral_patterns(address, pattern_type)
    `);

    // Create indexes for recommendations table
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_recommendations_address 
      ON recommendations(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_recommendations_category 
      ON recommendations(category)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_recommendations_priority 
      ON recommendations(priority)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_recommendations_status 
      ON recommendations(status)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_recommendations_address_status 
      ON recommendations(address, status)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_recommendations_created_at 
      ON recommendations(created_at)
    `);

    // Create anomaly_detection_results table for storing comprehensive anomaly analysis
    await runAsync(`
      CREATE TABLE IF NOT EXISTS anomaly_detection_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        overall_anomaly_score INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        
        -- Detection flags
        has_statistical_anomalies BOOLEAN DEFAULT FALSE,
        has_wash_trading BOOLEAN DEFAULT FALSE,
        has_bot_behavior BOOLEAN DEFAULT FALSE,
        has_coordinated_activity BOOLEAN DEFAULT FALSE,
        requires_investigation BOOLEAN DEFAULT FALSE,
        
        -- Detailed results (JSON)
        statistical_anomalies TEXT, -- JSON array
        wash_trading_result TEXT,   -- JSON object
        bot_behavior_result TEXT,   -- JSON object
        coordinated_activity_result TEXT, -- JSON object
        
        -- Risk assessment
        risk_explanation TEXT,
        recommendations TEXT, -- JSON array
        
        -- Metadata
        analysis_version TEXT DEFAULT '1.0',
        processing_time_ms INTEGER,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create statistical_anomalies table for detailed anomaly tracking
    await runAsync(`
      CREATE TABLE IF NOT EXISTS statistical_anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        detection_id INTEGER NOT NULL,
        anomaly_type TEXT NOT NULL, -- AMOUNT, GAS_PRICE, TIMING, FREQUENCY, PATTERN
        severity TEXT NOT NULL,     -- LOW, MEDIUM, HIGH, CRITICAL
        score INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        
        description TEXT NOT NULL,
        statistical_method TEXT NOT NULL, -- Z_SCORE, IQR, ISOLATION_FOREST, CLUSTERING
        threshold_value REAL NOT NULL,
        actual_value REAL NOT NULL,
        expected_min REAL,
        expected_max REAL,
        
        affected_transactions TEXT, -- JSON array of transaction hashes
        evidence TEXT,              -- JSON array of evidence strings
        
        detected_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address),
        FOREIGN KEY (detection_id) REFERENCES anomaly_detection_results(id)
      )
    `);

    // Create wash_trading_patterns table for tracking wash trading detection
    await runAsync(`
      CREATE TABLE IF NOT EXISTS wash_trading_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        detection_id INTEGER NOT NULL,
        pattern_type TEXT NOT NULL, -- RAPID_REVERSAL, CIRCULAR_FLOW, AMOUNT_MATCHING, TIMING_COORDINATION
        confidence INTEGER NOT NULL,
        time_window INTEGER NOT NULL,
        amount_similarity REAL NOT NULL,
        
        description TEXT NOT NULL,
        affected_transactions TEXT, -- JSON array of transaction hashes
        evidence TEXT,              -- JSON array of evidence strings
        
        detected_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address),
        FOREIGN KEY (detection_id) REFERENCES anomaly_detection_results(id)
      )
    `);

    // Create bot_behavior_patterns table for tracking bot detection
    await runAsync(`
      CREATE TABLE IF NOT EXISTS bot_behavior_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        detection_id INTEGER NOT NULL,
        pattern_type TEXT NOT NULL, -- REGULAR_INTERVALS, IDENTICAL_PARAMETERS, BURST_ACTIVITY, MECHANICAL_PRECISION
        strength INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        
        description TEXT NOT NULL,
        evidence TEXT,              -- JSON array of evidence strings
        affected_transactions TEXT, -- JSON array of transaction hashes
        
        -- Timing analysis data
        interval_consistency REAL,
        average_interval INTEGER,
        coefficient_of_variation REAL,
        regularity_score INTEGER,
        human_like_score INTEGER,
        
        -- Parameter consistency data
        gas_price_consistency REAL,
        gas_limit_consistency REAL,
        amount_pattern_consistency REAL,
        
        detected_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address),
        FOREIGN KEY (detection_id) REFERENCES anomaly_detection_results(id)
      )
    `);

    // Create coordination_patterns table for tracking coordinated activity
    await runAsync(`
      CREATE TABLE IF NOT EXISTS coordination_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        detection_id INTEGER NOT NULL,
        pattern_type TEXT NOT NULL, -- SYNCHRONIZED_TIMING, IDENTICAL_PARAMETERS, COORDINATED_AMOUNTS, NETWORK_EFFECTS
        strength INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        
        description TEXT NOT NULL,
        evidence TEXT,              -- JSON array of evidence strings
        indicative_transactions TEXT, -- JSON array of transaction hashes
        
        -- Coordination metrics
        synchronization_score INTEGER,
        parameter_matching_score INTEGER,
        coordination_window INTEGER,
        
        detected_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address),
        FOREIGN KEY (detection_id) REFERENCES anomaly_detection_results(id)
      )
    `);

    // Create indexes for anomaly detection tables for performance optimization
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_anomaly_detection_results_address 
      ON anomaly_detection_results(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_anomaly_detection_results_timestamp 
      ON anomaly_detection_results(timestamp)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_anomaly_detection_results_score 
      ON anomaly_detection_results(overall_anomaly_score)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_anomaly_detection_results_flags 
      ON anomaly_detection_results(requires_investigation, has_wash_trading, has_bot_behavior)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_statistical_anomalies_address_type 
      ON statistical_anomalies(address, anomaly_type)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_statistical_anomalies_severity 
      ON statistical_anomalies(severity)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_wash_trading_patterns_address_type 
      ON wash_trading_patterns(address, pattern_type)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_bot_behavior_patterns_address_type 
      ON bot_behavior_patterns(address, pattern_type)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_coordination_patterns_address_type 
      ON coordination_patterns(address, pattern_type)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_anomaly_detection_timestamp 
      ON anomaly_detection_results(timestamp DESC)
    `);

    // Create risk_monitoring_history table for ongoing risk level tracking
    await runAsync(`
      CREATE TABLE IF NOT EXISTS risk_monitoring_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        
        -- Individual risk factor scores
        concentration_risk INTEGER NOT NULL,
        volatility_risk INTEGER NOT NULL,
        inactivity_risk INTEGER NOT NULL,
        new_account_risk INTEGER NOT NULL,
        anomaly_risk INTEGER NOT NULL,
        liquidity_risk INTEGER NOT NULL,
        
        -- Risk flags and recommendations (JSON)
        flags TEXT, -- JSON object
        recommendations TEXT, -- JSON array
        
        timestamp INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create risk_monitoring_alerts table for alert management
    await runAsync(`
      CREATE TABLE IF NOT EXISTS risk_monitoring_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        alert_type TEXT NOT NULL, -- RISK_INCREASE, RISK_DECREASE, NEW_RISK_FACTOR, RISK_THRESHOLD_BREACH
        severity TEXT NOT NULL,   -- LOW, MEDIUM, HIGH, CRITICAL
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        
        current_risk_level TEXT NOT NULL,
        previous_risk_level TEXT,
        risk_score INTEGER NOT NULL,
        previous_risk_score INTEGER,
        
        triggered_factors TEXT, -- JSON array
        recommendations TEXT,   -- JSON array
        
        timestamp INTEGER NOT NULL,
        acknowledged BOOLEAN DEFAULT FALSE,
        acknowledged_at INTEGER,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create risk_thresholds table for customizable risk monitoring
    await runAsync(`
      CREATE TABLE IF NOT EXISTS risk_thresholds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        risk_factor TEXT NOT NULL,
        threshold_type TEXT NOT NULL, -- SCORE, LEVEL, CHANGE_RATE
        threshold_value REAL NOT NULL,
        alert_severity TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
        enabled BOOLEAN DEFAULT TRUE,
        last_triggered INTEGER,
        created_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create indexes for risk monitoring tables
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_monitoring_history_address 
      ON risk_monitoring_history(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_monitoring_history_timestamp 
      ON risk_monitoring_history(timestamp)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_monitoring_history_address_timestamp 
      ON risk_monitoring_history(address, timestamp DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_monitoring_history_risk_level 
      ON risk_monitoring_history(risk_level)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_monitoring_alerts_address 
      ON risk_monitoring_alerts(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_monitoring_alerts_timestamp 
      ON risk_monitoring_alerts(timestamp DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_monitoring_alerts_severity 
      ON risk_monitoring_alerts(severity)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_monitoring_alerts_acknowledged 
      ON risk_monitoring_alerts(acknowledged)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_monitoring_alerts_address_acknowledged 
      ON risk_monitoring_alerts(address, acknowledged)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_thresholds_address 
      ON risk_thresholds(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_thresholds_enabled 
      ON risk_thresholds(enabled)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_thresholds_address_enabled 
      ON risk_thresholds(address, enabled)
    `);

    // Create competitive_positioning_data table for storing competitive intelligence
    await runAsync(`
      CREATE TABLE IF NOT EXISTS competitive_positioning_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        
        -- Market position analysis
        overall_market_rank INTEGER NOT NULL,
        total_market_size INTEGER NOT NULL,
        market_percentile REAL NOT NULL,
        market_segment_name TEXT NOT NULL,
        market_segment_data TEXT, -- JSON object
        competitive_landscape_data TEXT, -- JSON object
        market_share_data TEXT, -- JSON object
        
        -- Trend comparison analysis
        user_trends_data TEXT, -- JSON object
        peer_group_trends_data TEXT, -- JSON object
        market_average_trends_data TEXT, -- JSON object
        trend_velocity_data TEXT, -- JSON object
        trend_positioning_data TEXT, -- JSON object
        
        -- Competitive advantages (JSON array)
        competitive_advantages TEXT,
        
        -- Market opportunities (JSON array)
        market_opportunities TEXT,
        
        -- Competitive threats (JSON array)
        competitive_threats TEXT,
        
        -- Strategic recommendations (JSON array)
        strategic_recommendations TEXT,
        
        -- Metadata
        analysis_version TEXT DEFAULT '1.0',
        processing_time_ms INTEGER,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create competitive_advantages table for detailed advantage tracking
    await runAsync(`
      CREATE TABLE IF NOT EXISTS competitive_advantages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        positioning_id INTEGER NOT NULL,
        
        area TEXT NOT NULL,
        advantage_type TEXT NOT NULL, -- SUSTAINABLE, TEMPORARY, EMERGING
        strength TEXT NOT NULL,       -- DOMINANT, STRONG, MODERATE
        market_gap REAL NOT NULL,
        defensibility INTEGER NOT NULL,
        monetization_potential TEXT NOT NULL, -- HIGH, MEDIUM, LOW
        
        description TEXT NOT NULL,
        supporting_metrics TEXT, -- JSON array
        threats TEXT,           -- JSON array
        
        created_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address),
        FOREIGN KEY (positioning_id) REFERENCES competitive_positioning_data(id)
      )
    `);

    // Create market_opportunities table for opportunity tracking
    await runAsync(`
      CREATE TABLE IF NOT EXISTS market_opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        positioning_id INTEGER NOT NULL,
        
        area TEXT NOT NULL,
        opportunity_size TEXT NOT NULL, -- LARGE, MEDIUM, SMALL
        difficulty TEXT NOT NULL,       -- EASY, MEDIUM, HARD
        time_to_capture TEXT NOT NULL,  -- SHORT_TERM, MEDIUM_TERM, LONG_TERM
        market_demand INTEGER NOT NULL,
        competition_level TEXT NOT NULL, -- LOW, MEDIUM, HIGH
        
        potential_score_improvement INTEGER NOT NULL,
        potential_market_position_gain INTEGER NOT NULL,
        potential_competitive_advantage_gain INTEGER NOT NULL,
        
        description TEXT NOT NULL,
        action_plan TEXT,       -- JSON array
        success_metrics TEXT,   -- JSON array
        
        created_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address),
        FOREIGN KEY (positioning_id) REFERENCES competitive_positioning_data(id)
      )
    `);

    // Create competitive_threats table for threat tracking
    await runAsync(`
      CREATE TABLE IF NOT EXISTS competitive_threats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        positioning_id INTEGER NOT NULL,
        
        threat TEXT NOT NULL,
        severity TEXT NOT NULL,     -- CRITICAL, HIGH, MEDIUM, LOW
        probability INTEGER NOT NULL,
        timeframe TEXT NOT NULL,    -- IMMEDIATE, SHORT_TERM, MEDIUM_TERM, LONG_TERM
        impact_areas TEXT,          -- JSON array
        
        potential_score_impact INTEGER NOT NULL,
        potential_market_position_loss INTEGER NOT NULL,
        potential_competitive_disadvantage INTEGER NOT NULL,
        
        description TEXT NOT NULL,
        mitigation_strategies TEXT, -- JSON array
        early_warning_signals TEXT, -- JSON array
        
        created_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address),
        FOREIGN KEY (positioning_id) REFERENCES competitive_positioning_data(id)
      )
    `);

    // Create strategic_recommendations table for strategic guidance tracking
    await runAsync(`
      CREATE TABLE IF NOT EXISTS strategic_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        positioning_id INTEGER NOT NULL,
        
        priority TEXT NOT NULL,     -- CRITICAL, HIGH, MEDIUM, LOW
        category TEXT NOT NULL,     -- OFFENSIVE, DEFENSIVE, GROWTH, EFFICIENCY
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        rationale TEXT NOT NULL,
        expected_outcome TEXT NOT NULL,
        
        implementation_steps TEXT, -- JSON array
        timeline TEXT NOT NULL,
        resources TEXT,           -- JSON array
        risks TEXT,              -- JSON array
        success_metrics TEXT,    -- JSON array
        
        created_at INTEGER NOT NULL,
        status TEXT DEFAULT 'ACTIVE', -- ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED
        progress INTEGER DEFAULT 0,
        completed_at INTEGER,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address),
        FOREIGN KEY (positioning_id) REFERENCES competitive_positioning_data(id)
      )
    `);

    // Create indexes for competitive positioning tables
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_positioning_data_address 
      ON competitive_positioning_data(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_positioning_data_timestamp 
      ON competitive_positioning_data(timestamp DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_positioning_data_address_timestamp 
      ON competitive_positioning_data(address, timestamp DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_positioning_data_market_percentile 
      ON competitive_positioning_data(market_percentile)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_positioning_data_market_segment 
      ON competitive_positioning_data(market_segment_name)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_advantages_address 
      ON competitive_advantages(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_advantages_positioning_id 
      ON competitive_advantages(positioning_id)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_advantages_strength 
      ON competitive_advantages(strength)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_advantages_advantage_type 
      ON competitive_advantages(advantage_type)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_market_opportunities_address 
      ON market_opportunities(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_market_opportunities_positioning_id 
      ON market_opportunities(positioning_id)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_market_opportunities_opportunity_size 
      ON market_opportunities(opportunity_size)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_market_opportunities_difficulty 
      ON market_opportunities(difficulty)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_threats_address 
      ON competitive_threats(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_threats_positioning_id 
      ON competitive_threats(positioning_id)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_threats_severity 
      ON competitive_threats(severity)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_competitive_threats_timeframe 
      ON competitive_threats(timeframe)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_strategic_recommendations_address 
      ON strategic_recommendations(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_strategic_recommendations_positioning_id 
      ON strategic_recommendations(positioning_id)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_strategic_recommendations_priority 
      ON strategic_recommendations(priority)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_strategic_recommendations_category 
      ON strategic_recommendations(category)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_strategic_recommendations_status 
      ON strategic_recommendations(status)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_strategic_recommendations_address_status 
      ON strategic_recommendations(address, status)
    `);

    // Create real-time benchmarking tables
    await runAsync(`
      CREATE TABLE IF NOT EXISTS real_time_benchmark_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        peer_group_id TEXT NOT NULL,
        overall_percentile REAL NOT NULL,
        component_percentiles TEXT NOT NULL, -- JSON string
        benchmark_timestamp INTEGER NOT NULL,
        last_updated INTEGER NOT NULL,
        update_frequency INTEGER NOT NULL, -- seconds
        is_stale BOOLEAN DEFAULT FALSE,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    await runAsync(`
      CREATE TABLE IF NOT EXISTS benchmark_update_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_type TEXT NOT NULL, -- PEER_GROUP_REFRESH, PERCENTILE_RECALC, BENCHMARK_UPDATE
        target_address TEXT,
        peer_group_id TEXT,
        priority TEXT NOT NULL, -- HIGH, MEDIUM, LOW
        scheduled_at INTEGER NOT NULL,
        started_at INTEGER,
        completed_at INTEGER,
        status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3
      )
    `);

    await runAsync(`
      CREATE TABLE IF NOT EXISTS peer_group_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        peer_group_id TEXT NOT NULL,
        member_count INTEGER NOT NULL,
        average_score REAL NOT NULL,
        score_distribution TEXT NOT NULL, -- JSON string with percentiles
        snapshot_timestamp INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Create indexes for real-time benchmarking tables
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_real_time_benchmark_data_address 
      ON real_time_benchmark_data(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_real_time_benchmark_data_peer_group 
      ON real_time_benchmark_data(peer_group_id)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_real_time_benchmark_data_last_updated 
      ON real_time_benchmark_data(last_updated DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_real_time_benchmark_data_is_stale 
      ON real_time_benchmark_data(is_stale)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_real_time_benchmark_data_address_updated 
      ON real_time_benchmark_data(address, last_updated DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_benchmark_update_jobs_status 
      ON benchmark_update_jobs(status)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_benchmark_update_jobs_scheduled 
      ON benchmark_update_jobs(scheduled_at)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_benchmark_update_jobs_priority 
      ON benchmark_update_jobs(priority, scheduled_at)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_benchmark_update_jobs_target_address 
      ON benchmark_update_jobs(target_address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_benchmark_update_jobs_peer_group 
      ON benchmark_update_jobs(peer_group_id)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_peer_group_snapshots_peer_group 
      ON peer_group_snapshots(peer_group_id)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_peer_group_snapshots_timestamp 
      ON peer_group_snapshots(snapshot_timestamp DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_peer_group_snapshots_active 
      ON peer_group_snapshots(is_active)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_peer_group_snapshots_peer_group_active 
      ON peer_group_snapshots(peer_group_id, is_active, snapshot_timestamp DESC)
    `);

    // Create predictive analytics tables

    // Create predictions table for storing individual predictions
    await runAsync(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prediction_id TEXT UNIQUE NOT NULL,
        address TEXT NOT NULL,
        prediction_date INTEGER NOT NULL,
        target_date INTEGER NOT NULL,
        predicted_score INTEGER NOT NULL,
        confidence_lower INTEGER NOT NULL,
        confidence_upper INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        methodology TEXT NOT NULL,
        factors TEXT NOT NULL, -- JSON array
        prediction_data TEXT NOT NULL, -- JSON object with full prediction
        created_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create prediction_accuracy table for tracking prediction performance
    await runAsync(`
      CREATE TABLE IF NOT EXISTS prediction_accuracy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prediction_id TEXT NOT NULL,
        address TEXT NOT NULL,
        prediction_date INTEGER NOT NULL,
        target_date INTEGER NOT NULL,
        predicted_score INTEGER NOT NULL,
        actual_score INTEGER NOT NULL,
        accuracy REAL NOT NULL,
        absolute_error REAL NOT NULL,
        relative_error REAL NOT NULL,
        confidence_lower INTEGER NOT NULL,
        confidence_upper INTEGER NOT NULL,
        was_within_interval BOOLEAN NOT NULL,
        methodology TEXT NOT NULL,
        factors TEXT NOT NULL, -- JSON array
        created_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create model_performance table for tracking model metrics
    await runAsync(`
      CREATE TABLE IF NOT EXISTS model_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_name TEXT NOT NULL,
        version TEXT NOT NULL,
        total_predictions INTEGER NOT NULL,
        average_accuracy REAL NOT NULL,
        average_absolute_error REAL NOT NULL,
        average_relative_error REAL NOT NULL,
        confidence_interval_accuracy REAL NOT NULL,
        performance_by_timeframe TEXT NOT NULL, -- JSON object
        performance_by_score_range TEXT NOT NULL, -- JSON object
        recommendations TEXT NOT NULL, -- JSON array
        last_updated INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        
        UNIQUE(model_name, version)
      )
    `);

    // Create score_forecasts table for storing comprehensive forecasts
    await runAsync(`
      CREATE TABLE IF NOT EXISTS score_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        current_score INTEGER NOT NULL,
        trend_direction TEXT NOT NULL,
        trend_strength REAL NOT NULL,
        confidence INTEGER NOT NULL,
        prediction_horizon INTEGER NOT NULL,
        methodology TEXT NOT NULL,
        key_factors TEXT NOT NULL, -- JSON array
        uncertainty_factors TEXT NOT NULL, -- JSON array
        predicted_scores TEXT NOT NULL, -- JSON array
        last_updated INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create behavioral_trend_predictions table for behavioral forecasting
    await runAsync(`
      CREATE TABLE IF NOT EXISTS behavioral_trend_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        current_behavior TEXT NOT NULL, -- JSON object
        predicted_behavior TEXT NOT NULL, -- JSON array
        trend_analysis TEXT NOT NULL, -- JSON object
        risk_factors TEXT NOT NULL, -- JSON array
        opportunities TEXT NOT NULL, -- JSON array
        confidence INTEGER NOT NULL,
        prediction_horizon INTEGER NOT NULL,
        last_updated INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        
        FOREIGN KEY (address) REFERENCES credit_scores(address)
      )
    `);

    // Create indexes for predictive analytics tables
    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_predictions_address 
      ON predictions(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_predictions_prediction_id 
      ON predictions(prediction_id)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_predictions_target_date 
      ON predictions(target_date)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_predictions_methodology 
      ON predictions(methodology)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_address 
      ON prediction_accuracy(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_prediction_id 
      ON prediction_accuracy(prediction_id)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_methodology 
      ON prediction_accuracy(methodology)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_accuracy 
      ON prediction_accuracy(accuracy)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_model_performance_model_name 
      ON model_performance(model_name)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_model_performance_last_updated 
      ON model_performance(last_updated DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_score_forecasts_address 
      ON score_forecasts(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_score_forecasts_last_updated 
      ON score_forecasts(last_updated DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_score_forecasts_address_updated 
      ON score_forecasts(address, last_updated DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_score_forecasts_trend_direction 
      ON score_forecasts(trend_direction)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_trend_predictions_address 
      ON behavioral_trend_predictions(address)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_trend_predictions_last_updated 
      ON behavioral_trend_predictions(last_updated DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_trend_predictions_address_updated 
      ON behavioral_trend_predictions(address, last_updated DESC)
    `);

    await runAsync(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_trend_predictions_confidence 
      ON behavioral_trend_predictions(confidence)
    `);
    
    console.log('Database tables and indexes created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connection...');
  await closeDatabase();
  process.exit(0);
});