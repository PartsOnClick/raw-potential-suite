# WooCommerce Auto Parts Importer Plugin

## Project Overview
Build a comprehensive WooCommerce plugin that automates the import of automotive parts data from CSV files, enriches product information by scraping Autodoc.parts, and generates SEO-optimized content using DeepSeek AI.

## Detailed Module Architecture

### Module 1: Core Plugin Foundation
**Files & Structure:**
```
/wc-autoparts-importer.php (main plugin file)
/includes/class-plugin-core.php
/includes/class-plugin-activator.php
/includes/class-plugin-deactivator.php
```

**Responsibilities:**
- Plugin initialization and WordPress hooks
- Database table creation for import logs and settings
- Plugin activation/deactivation handling
- Global constants and configuration
- Module registration and dependency injection

**Key Methods/Interfaces:**
```php
// Core Plugin Interface
interface WC_AutoParts_Core_Interface {
    public function init();
    public function register_modules();
    public function get_module($module_name);
}

// Module Registration
public function register_modules() {
    $this->modules = [
        'csv_processor' => new CSV_Processor_Module(),
        'autodoc_scraper' => new Autodoc_Scraper_Module(),
        'deepseek_api' => new DeepSeek_API_Module(),
        'product_creator' => new Product_Creator_Module(),
        'admin_interface' => new Admin_Interface_Module()
    ];
}
```

### Module 2: CSV Processing Engine
**Files & Structure:**
```
/modules/csv-processor/
├── class-csv-processor.php
├── class-csv-validator.php
├── class-csv-parser.php
└── interfaces/csv-processor-interface.php
```

**Responsibilities:**
- CSV file upload handling and validation
- Data parsing and structure verification
- Batch preparation (10 items per batch)
- Data sanitization and type conversion
- Integration with other modules via standardized data format

**Key Methods/Interfaces:**
```php
interface CSV_Processor_Interface {
    public function validate_csv($file_path);
    public function parse_csv($file_path);
    public function prepare_batches($data, $batch_size = 10);
    public function get_validation_errors();
}

// Standardized Data Format
public function get_standardized_format() {
    return [
        'sku_number' => '',
        'brand_name' => '',
        'cost' => 0.00,
        'oem_number' => '',
        'title' => '',
        'batch_id' => '',
        'row_number' => 0
    ];
}
```

**Pages This Module Serves:**
- Main import page (file upload interface)
- Batch processing status page

### Module 3: Autodoc Web Scraper
**Files & Structure:**
```
/modules/autodoc-scraper/
├── class-autodoc-scraper.php
├── class-web-client.php
├── class-data-extractor.php
├── class-rate-limiter.php
└── interfaces/scraper-interface.php
```

**Responsibilities:**
- Web scraping from Autodoc.parts with rate limiting
- HTML parsing and data extraction
- Image URL collection and validation
- Error handling for missing/unavailable products
- Anti-bot detection and handling

**Key Methods/Interfaces:**
```php
interface Autodoc_Scraper_Interface {
    public function scrape_product($brand, $sku);
    public function extract_product_data($html);
    public function get_product_images($html);
    public function is_product_available($html);
}

// Standardized Autodoc Data Format
public function get_autodoc_data_format() {
    return [
        'item_name' => '',
        'fitting_position' => '',
        'weight_kg' => 0.00,
        'ean_number' => '',
        'oem_numbers' => [],
        'packaging_length_cm' => 0,
        'packaging_width_cm' => 0,
        'packaging_height_cm' => 0,
        'images' => [],
        'scrape_success' => false,
        'error_message' => ''
    ];
}
```

**Pages This Module Serves:**
- Processing status page (real-time scraping updates)
- Error log page (failed scraping attempts)

### Module 4: DeepSeek AI Integration
**Files & Structure:**
```
/modules/deepseek-api/
├── class-deepseek-client.php
├── class-content-generator.php
├── class-prompt-builder.php
└── interfaces/ai-interface.php
```

**Responsibilities:**
- DeepSeek API communication and authentication
- SEO content generation (titles, descriptions)
- Prompt engineering for automotive context
- API error handling and fallback content
- Content quality validation

**Key Methods/Interfaces:**
```php
interface DeepSeek_AI_Interface {
    public function generate_product_title($product_data);
    public function generate_long_description($product_data);
    public function generate_short_description($product_data);
    public function validate_api_key();
}

// Content Generation Input Format
public function get_content_input_format() {
    return [
        'brand' => '',
        'sku' => '',
        'item_name' => '',
        'technical_specs' => [],
        'oem_numbers' => [],
        'fitting_position' => '',
        'price' => 0.00
    ];
}
```

**Pages This Module Serves:**
- Settings page (API key configuration)
- Content preview page (before finalizing products)

### Module 5: Product Creation Engine
**Files & Structure:**
```
/modules/product-creator/
├── class-product-creator.php
├── class-pricing-calculator.php
├── class-image-handler.php
├── class-taxonomy-manager.php
└── interfaces/product-creator-interface.php
```

**Responsibilities:**
- WooCommerce product creation and management
- Price calculation using provided formula
- Image downloading and WordPress media handling
- Taxonomy creation and assignment
- Duplicate detection and SKU management

**Key Methods/Interfaces:**
```php
interface Product_Creator_Interface {
    public function create_product($csv_data, $autodoc_data, $ai_content);
    public function calculate_price($cost);
    public function handle_product_images($image_urls);
    public function create_taxonomies($brand, $fitting_position);
    public function check_duplicate_sku($sku);
}

// Product Creation Data Format
public function get_product_creation_format() {
    return [
        'sku' => '',
        'title' => '',
        'description' => '',
        'short_description' => '',
        'price' => 0.00,
        'weight' => 0.00,
        'images' => [],
        'taxonomies' => [],
        'attributes' => [],
        'status' => 'publish'
    ];
}
```

**Pages This Module Serves:**
- Product creation status page
- Import summary page

### Module 6: Admin Interface & UI
**Files & Structure:**
```
/modules/admin/
├── pages/
│   ├── class-main-import-page.php
│   ├── class-settings-page.php
│   ├── class-history-page.php
│   ├── class-status-page.php
│   └── class-error-log-page.php
├── assets/
│   ├── css/admin-styles.css
│   ├── js/admin-scripts.js
│   └── js/ajax-handlers.js
├── templates/
│   ├── import-form.php
│   ├── progress-tracker.php
│   ├── settings-form.php
│   └── history-table.php
└── class-admin-interface.php
```

**Page-by-Page Breakdown:**

**Main Import Page (`class-main-import-page.php`):**
- CSV file upload with drag-and-drop
- File validation and preview (first 5 rows)
- Batch processing controls and progress bar
- Real-time status updates via AJAX
- **Integrates with:** CSV Processor, Product Creator modules

**Settings Page (`class-settings-page.php`):**
- DeepSeek API key configuration and testing
- Pricing formula adjustment interface
- Scraping delay and rate limit settings
- Default taxonomy assignments
- **Integrates with:** DeepSeek API, Core Plugin modules

**Processing Status Page (`class-status-page.php`):**
- Real-time batch processing status
- Current item being processed
- Success/failure counters
- Server resource monitoring
- **Integrates with:** All processing modules

**Import History Page (`class-history-page.php`):**
- Complete log of all import sessions
- Detailed statistics and metrics
- Downloadable reports (CSV/PDF)
- Import session replay functionality
- **Integrates with:** Core Plugin, Product Creator modules

**Error Log Page (`class-error-log-page.php`):**
- Detailed error reports by category
- Skipped items with reasons
- Retry functionality for failed items
- Error pattern analysis
- **Integrates with:** All modules for error collection

### Module 7: Data Flow & Integration Layer
**Files & Structure:**
```
/modules/integration/
├── class-data-flow-manager.php
├── class-event-dispatcher.php
├── class-module-communicator.php
└── interfaces/integration-interface.php
```

**Responsibilities:**
- Orchestrate data flow between all modules
- Event-driven communication system
- Error propagation and handling
- Progress tracking across modules
- Module dependency management

**Key Integration Points:**
```php
// Data Flow Pipeline
public function process_import_batch($csv_batch) {
    foreach ($csv_batch as $csv_row) {
        // Step 1: Scrape Autodoc
        $autodoc_data = $this->autodoc_scraper->scrape_product(
            $csv_row['brand_name'], 
            $csv_row['sku_number']
        );
        
        // Step 2: Generate AI Content
        if ($autodoc_data['scrape_success']) {
            $ai_content = $this->deepseek_api->generate_content(
                array_merge($csv_row, $autodoc_data)
            );
            
            // Step 3: Create Product
            $product_result = $this->product_creator->create_product(
                $csv_row, $autodoc_data, $ai_content
            );
            
            // Step 4: Log Results
            $this->log_processing_result($csv_row, $product_result);
        }
    }
}
```

## Cross-Module Communication Standards

### 1. Event System
```php
// Event Broadcasting
do_action('wc_autoparts_batch_started', $batch_id, $batch_data);
do_action('wc_autoparts_product_created', $product_id, $source_data);
do_action('wc_autoparts_scraping_failed', $sku, $error_message);

// Event Listening
add_action('wc_autoparts_batch_started', [$this, 'update_progress_bar']);
add_action('wc_autoparts_product_created', [$this, 'increment_success_counter']);
```

### 2. Standardized Error Handling
```php
interface Error_Handler_Interface {
    public function log_error($module_name, $error_code, $error_message, $context);
    public function get_errors_by_module($module_name);
    public function clear_error_log();
}
```

### 3. Configuration Management
```php
// Centralized configuration accessible by all modules
class Config_Manager {
    public function get_setting($module, $setting_key, $default = null);
    public function update_setting($module, $setting_key, $value);
    public function get_module_config($module_name);
}
```

## User Interface Requirements

### Admin Dashboard Features
1. **Main Import Page:**
   - CSV file upload interface with drag-and-drop
   - Progress bar showing import status
   - Real-time processing feedback
   - Batch processing controls

2. **Settings Page:**
   - DeepSeek API key configuration
   - Pricing formula adjustment options
   - Scraping delay settings
   - Default product categories

3. **Import History:**
   - Log of all import sessions
   - Success/failure statistics
   - Downloadable error reports
   - Skipped items list with reasons

4. **Status Dashboard:**
   - Current processing queue
   - Server resource monitoring
   - Import performance metrics

## Technical Specifications

### Plugin Architecture
- **Modular Design:** Each module is self-contained with clear interfaces
- **Dependency Injection:** Modules receive dependencies through constructor injection
- **Event-Driven:** Loose coupling through WordPress action/filter system
- **AJAX Processing:** Non-blocking batch processing with real-time updates
- **Database Integration:** Efficient WooCommerce product creation with logging

### Inter-Module Compatibility
- **Standardized Data Formats:** All modules use consistent data structures
- **Interface-Based Design:** Modules communicate through well-defined interfaces
- **Version Compatibility:** Each module maintains backward compatibility
- **Independent Testing:** Modules can be tested and developed separately
- **Hot-Swappable:** Modules can be replaced without affecting others

### Development Flexibility
- **Tool Agnostic:** Each module can be built with different tools/frameworks
- **API First:** All module interactions happen through defined APIs
- **Documentation:** Each module includes comprehensive PHPDoc comments
- **Unit Testable:** Each module includes test suites and mock interfaces

### Security & Performance
- **Module Isolation:** Security issues in one module don't affect others
- **Permission Management:** Each module handles its own capability checks
- **Caching Strategy:** Inter-module data caching to improve performance
- **Memory Management:** Each module manages its own memory usage
- **Error Boundaries:** Module failures don't crash the entire system

### Dependencies & Compatibility
- WordPress 5.0+ (all modules)
- WooCommerce 4.0+ (Product Creator, Admin modules)
- PHP 7.4+ (all modules)
- cURL extension (Web Scraper module)
- GD library (Product Creator module for images)
- JSON extension (DeepSeek API module) large CSV files

## Module Integration & Data Flow Diagram

### Complete Processing Pipeline
```
CSV Upload → Module 2 (CSV Processor) → Validation & Batching
    ↓
Batch Queue → Module 7 (Integration Layer) → Orchestration
    ↓
For Each Item:
    ↓
Module 3 (Autodoc Scraper) → Web Scraping & Data Extraction
    ↓
Module 4 (DeepSeek AI) → Content Generation
    ↓
Module 5 (Product Creator) → WooCommerce Product Creation
    ↓
Module 6 (Admin UI) → Progress Updates & Logging
    ↓
Module 1 (Core) → Final Status & Cleanup
```

## Development Best Practices

### 1. Module Independence
**Each module should be developable separately:**
- Independent repositories/folders for each module
- Standardized composer.json for dependencies
- Docker containers for isolated development
- Mock interfaces for testing without other modules
- CI/CD pipelines per module

### 2. API Documentation
**Every module must provide:**
```php
/**
 * Module API Documentation
 * 
 * @version 1.0.0
 * @author Your Team
 * @requires WordPress 5.0+
 * @requires PHP 7.4+
 */

// Input/Output specifications
interface Module_API_Spec {
    /**
     * Process data according to module responsibility
     * 
     * @param array $input_data Standardized input format
     * @return array|WP_Error Standardized output or error
     */
    public function process($input_data);
    
    /**
     * Get module health status
     * 
     * @return array Module status information
     */
    public function get_health_status();
    
    /**
     * Get module configuration schema
     * 
     * @return array Configuration options and validation rules
     */
    public function get_config_schema();
}
```

### 3. Error Handling Standards
**Consistent error handling across all modules:**
```php
class WC_AutoParts_Error_Handler {
    const ERROR_CODES = [
        'CSV_INVALID_FORMAT' => 1001,
        'AUTODOC_SCRAPING_FAILED' => 2001,
        'DEEPSEEK_API_ERROR' => 3001,
        'PRODUCT_CREATION_FAILED' => 4001,
        'INTEGRATION_ERROR' => 5001
    ];
    
    public function create_error($code, $message, $context = []) {
        return new WP_Error($code, $message, $context);
    }
    
    public function log_error($error, $module_name) {
        // Centralized error logging
    }
}
```

### 4. Testing Framework
**Each module includes comprehensive tests:**
```php
// Unit Tests
class CSV_Processor_Test extends WP_UnitTestCase {
    public function test_csv_validation() {
        // Test CSV validation logic
    }
    
    public function test_batch_preparation() {
        // Test batch creation
    }
}

// Integration Tests
class Module_Integration_Test extends WP_UnitTestCase {
    public function test_csv_to_autodoc_flow() {
        // Test data flow between modules
    }
}

// Mock Interfaces for isolated testing
class Mock_Autodoc_Scraper implements Autodoc_Scraper_Interface {
    public function scrape_product($brand, $sku) {
        return $this->get_mock_data();
    }
}
```

## Performance Optimization

### 1. Caching Strategy
```php
class WC_AutoParts_Cache_Manager {
    // Cache Autodoc data for 24 hours
    public function cache_autodoc_data($brand_sku, $data) {
        set_transient("autodoc_data_{$brand_sku}", $data, DAY_IN_SECONDS);
    }
    
    // Cache AI-generated content for 7 days
    public function cache_ai_content($product_hash, $content) {
        set_transient("ai_content_{$product_hash}", $content, WEEK_IN_SECONDS);
    }
    
    // Cache product images
    public function cache_product_images($sku, $image_urls) {
        update_option("cached_images_{$sku}", $image_urls);
    }
}
```

### 2. Queue Management
```php
class WC_AutoParts_Queue_Manager {
    // Background processing for large imports
    public function add_to_queue($batch_data) {
        wp_schedule_single_event(time(), 'process_autoparts_batch', [$batch_data]);
    }
    
    // Rate limiting for external API calls
    public function rate_limit_check($api_name) {
        $calls = get_transient("api_calls_{$api_name}");
        if ($calls >= $this->get_rate_limit($api_name)) {
            return false; // Rate limit exceeded
        }
        return true;
    }
}
```

### 3. Memory Management
```php
class WC_AutoParts_Memory_Manager {
    public function process_large_csv($file_path) {
        // Stream processing for large files
        $handle = fopen($file_path, 'r');
        while (($row = fgetcsv($handle)) !== FALSE) {
            $this->process_single_row($row);
            
            // Memory cleanup every 100 rows
            if ($this->row_count % 100 === 0) {
                wp_cache_flush();
                if (function_exists('gc_collect_cycles')) {
                    gc_collect_cycles();
                }
            }
        }
        fclose($handle);
    }
}
```

## Security Implementation

### 1. Input Validation
```php
class WC_AutoParts_Validator {
    public function validate_csv_row($row) {
        return [
            'sku_number' => sanitize_text_field($row['sku_number']),
            'brand_name' => sanitize_text_field($row['brand_name']),
            'cost' => floatval($row['cost']),
            'oem_number' => sanitize_text_field($row['oem_number']),
            'title' => sanitize_text_field($row['title'])
        ];
    }
    
    public function validate_api_key($api_key) {
        return preg_match('/^[a-zA-Z0-9_-]+$/', $api_key);
    }
}
```

### 2. Permission Checks
```php
class WC_AutoParts_Permissions {
    public function can_import_products() {
        return current_user_can('manage_woocommerce') && 
               current_user_can('edit_products');
    }
    
    public function can_modify_settings() {
        return current_user_can('manage_options');
    }
    
    public function verify_nonce($action) {
        return wp_verify_nonce($_POST['nonce'], $action);
    }
}
```

## Database Schema

### 1. Import Logs Table
```sql
CREATE TABLE {$wpdb->prefix}wc_autoparts_import_logs (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    session_id varchar(100) NOT NULL,
    sku varchar(100) NOT NULL,
    status enum('pending','processing','success','failed','skipped') DEFAULT 'pending',
    csv_data longtext,
    autodoc_data longtext,
    ai_content longtext,
    error_message text,
    processing_time float,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY session_id (session_id),
    KEY sku (sku),
    KEY status (status)
);
```

### 2. Settings Table
```sql
CREATE TABLE {$wpdb->prefix}wc_autoparts_settings (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    module_name varchar(50) NOT NULL,
    setting_key varchar(100) NOT NULL,
    setting_value longtext,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY module_setting (module_name, setting_key)
);
```

## Deployment & Maintenance

### 1. Plugin Activation
```php
class WC_AutoParts_Activator {
    public static function activate() {
        // Create database tables
        self::create_tables();
        
        // Set default settings
        self::set_default_settings();
        
        // Create upload directories
        self::create_directories();
        
        // Schedule cleanup tasks
        wp_schedule_event(time(), 'daily', 'wc_autoparts_cleanup');
    }
}
```

### 2. Update Mechanism
```php
class WC_AutoParts_Updater {
    public function check_for_updates() {
        $current_version = get_option('wc_autoparts_version');
        $latest_version = $this->get_latest_version();
        
        if (version_compare($current_version, $latest_version, '<')) {
            $this->perform_update($current_version, $latest_version);
        }
    }
    
    public function perform_update($from_version, $to_version) {
        // Database migrations
        // File updates
        // Setting migrations
    }
}
```

### 3. Monitoring & Logging
```php
class WC_AutoParts_Monitor {
    public function log_performance_metrics() {
        $metrics = [
            'memory_usage' => memory_get_usage(true),
            'processing_time' => microtime(true) - $this->start_time,
            'products_processed' => $this->processed_count,
            'error_rate' => $this->error_count / $this->total_count
        ];
        
        update_option('wc_autoparts_metrics', $metrics);
    }
    
    public function health_check() {
        return [
            'database_connection' => $this->check_database(),
            'external_apis' => $this->check_external_apis(),
            'file_permissions' => $this->check_file_permissions(),
            'memory_available' => $this->check_memory_limit()
        ];
    }
}
```

## Final File Structure
```
/wp-content/plugins/wc-autoparts-importer/
├── wc-autoparts-importer.php (Main plugin file)
├── includes/
│   ├── class-plugin-core.php
│   ├── class-plugin-activator.php
│   ├── class-plugin-deactivator.php
│   ├── class-error-handler.php
│   ├── class-cache-manager.php
│   ├── class-queue-manager.php
│   ├── class-validator.php
│   └── class-permissions.php
├── modules/
│   ├── csv-processor/
│   │   ├── class-csv-processor.php
│   │   ├── class-csv-validator.php
│   │   ├── class-csv-parser.php
│   │   ├── interfaces/csv-processor-interface.php
│   │   └── tests/csv-processor-test.php
│   ├── autodoc-scraper/
│   │   ├── class-autodoc-scraper.php
│   │   ├── class-web-client.php
│   │   ├── class-data-extractor.php
│   │   ├── class-rate-limiter.php
│   │   ├── interfaces/scraper-interface.php
│   │   └── tests/scraper-test.php
│   ├── deepseek-api/
│   │   ├── class-deepseek-client.php
│   │   ├── class-content-generator.php
│   │   ├── class-prompt-builder.php
│   │   ├── interfaces/ai-interface.php
│   │   └── tests/deepseek-test.php
│   ├── product-creator/
│   │   ├── class-product-creator.php
│   │   ├── class-pricing-calculator.php
│   │   ├── class-image-handler.php
│   │   ├── class-taxonomy-manager.php
│   │   ├── interfaces/product-creator-interface.php
│   │   └── tests/product-creator-test.php
│   ├── admin/
│   │   ├── pages/
│   │   │   ├── class-main-import-page.php
│   │   │   ├── class-settings-page.php
│   │   │   ├── class-history-page.php
│   │   │   ├── class-status-page.php
│   │   │   └── class-error-log-page.php
│   │   ├── assets/
│   │   │   ├── css/admin-styles.css
│   │   │   ├── js/admin-scripts.js
│   │   │   └── js/ajax-handlers.js
│   │   ├── templates/
│   │   │   ├── import-form.php
│   │   │   ├── progress-tracker.php
│   │   │   ├── settings-form.php
│   │   │   └── history-table.php
│   │   ├── class-admin-interface.php
│   │   └── tests/admin-test.php
│   └── integration/
│       ├── class-data-flow-manager.php
│       ├── class-event-dispatcher.php
│       ├── class-module-communicator.php
│       ├── interfaces/integration-interface.php
│       └── tests/integration-test.php
├── assets/
│   ├── images/
│   ├── documentation/
│   └── sql/
│       ├── create-tables.sql
│       └── migrations/
├── tests/
│   ├── bootstrap.php
│   ├── integration-tests/
│   └── mock-data/
├── composer.json
├── package.json
├── README.md
└── CHANGELOG.md
```

This enhanced structure ensures maximum modularity, testability, and maintainability while providing clear integration points between modules.

### Dependencies & Compatibility
- WordPress 5.0+
- WooCommerce 4.0+
- PHP 7.4+
- cURL for web scraping
- GD library for image processing

## Suggested Additional Features
1. **Import Templates:** Save and reuse import configurations
2. **Product Updates:** Update existing products with new data
3. **Bulk Actions:** Mass edit imported products
4. **Export Functionality:** Export processed data back to CSV
5. **Integration Hooks:** Allow other plugins to extend functionality
6. **Multilingual Support:** Basic translation readiness
7. **Backup/Restore:** Create product backups before import
8. **Analytics:** Track import success rates and performance metrics

## Success Criteria
- Successfully import 100+ products per hour
- 95%+ data accuracy from Autodoc scraping
- Zero server crashes during processing
- User-friendly interface requiring minimal training
- Comprehensive error reporting and recovery options
- SEO-optimized content generation with 90%+ relevance score

## File Structure
```
/wp-content/plugins/wc-autoparts-importer/
├── wc-autoparts-importer.php (main plugin file)
├── includes/
│   ├── class-csv-processor.php
│   ├── class-autodoc-scraper.php
│   ├── class-deepseek-api.php
│   ├── class-product-creator.php
│   └── class-pricing-calculator.php
├── admin/
│   ├── class-admin-interface.php
│   ├── css/admin-styles.css
│   └── js/admin-scripts.js
├── templates/
│   ├── import-page.php
│   ├── settings-page.php
│   └── history-page.php
└── assets/
    ├── images/
    └── documentation/
```

Build this as a production-ready WordPress plugin with clean, maintainable code and comprehensive error handling.