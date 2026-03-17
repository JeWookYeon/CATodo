CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gold_price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    price_date DATE NOT NULL,
    close_usd_per_oz DECIMAL(12, 4) NOT NULL,
    close_usd_per_g DECIMAL(12, 4) NOT NULL,
    usd_krw DECIMAL(12, 4) NOT NULL,
    close_krw_per_g DECIMAL(14, 2) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gold_price_history_price_date_source (price_date, source_name)
);