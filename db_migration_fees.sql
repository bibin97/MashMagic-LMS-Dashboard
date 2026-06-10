CREATE TABLE IF NOT EXISTS fee_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('student', 'staff') NOT NULL,
    entity_id INT NOT NULL,
    total_fee DECIMAL(10,2) DEFAULT 0,
    total_hours DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_entity (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS fee_installments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_structure_id INT NOT NULL,
    installment_date DATE NOT NULL,
    installment_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE
);
