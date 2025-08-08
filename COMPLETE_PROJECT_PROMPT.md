# Complete Automotive Parts Processing System - Project Recreation Prompt

## Project Overview
Create a comprehensive web application for automotive parts import, processing, and management with the following technology stack:
- **Backend**: PHP 8+ with MySQL database
- **Frontend**: Bootstrap 5 for responsive UI
- **Architecture**: MVC pattern with modular structure
- **APIs**: eBay API integration, DeepSeek AI API integration

## Core Functionality Summary
This system processes automotive parts data through CSV import, enriches it with eBay marketplace data, generates SEO-optimized content using AI, and manages the entire workflow through batch processing.

## Database Schema (MySQL)

### 1. import_batches
```sql
CREATE TABLE import_batches (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    total_items INT DEFAULT 0,
    processed_items INT DEFAULT 0,
    successful_items INT DEFAULT 0,
    failed_items INT DEFAULT 0,
    csv_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);
```

### 2. products
```sql
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    batch_id VARCHAR(36),
    brand VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    oe_number VARCHAR(255),
    original_title TEXT,
    product_name TEXT,
    category VARCHAR(255),
    price DECIMAL(10,2),
    weight VARCHAR(50),
    dimensions VARCHAR(100),
    short_description TEXT,
    long_description TEXT,
    seo_title VARCHAR(255),
    meta_description TEXT,
    autodoc_url TEXT,
    ebay_item_id VARCHAR(50),
    ebay_data JSON,
    part_number_tags JSON,
    images JSON,
    oem_numbers JSON,
    technical_specs JSON,
    raw_scraped_data JSON,
    scraping_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    ai_content_status ENUM('pending', 'processing', 'generated', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES import_batches(id) ON DELETE CASCADE
);
```

### 3. ebay_tokens
```sql
CREATE TABLE ebay_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    dev_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    sandbox_mode BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4. processing_logs
```sql
CREATE TABLE processing_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36),
    batch_id VARCHAR(36),
    operation_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    operation_details JSON,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES import_batches(id) ON DELETE CASCADE
);
```

### 5. ai_generations
```sql
CREATE TABLE ai_generations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36),
    prompt_type VARCHAR(100) NOT NULL,
    prompt_input JSON NOT NULL,
    generated_content TEXT NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    generation_cost DECIMAL(8,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### 6. prompt_settings
```sql
CREATE TABLE prompt_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    prompts JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Page Structure & Features

### 1. Dashboard/Home Page (index.php)
- **Purpose**: Main landing page with navigation and overview
- **Features**:
  - Quick stats cards (total batches, products processed, success rate)
  - Recent activity feed
  - Quick action buttons to upload, view status, manage settings
- **Bootstrap Components**: Cards, badges, progress bars, navigation

### 2. CSV Upload Page (upload.php)
- **Purpose**: Handle CSV file uploads and batch creation
- **Features**:
  - Drag & drop CSV upload with Bootstrap file input
  - CSV validation (required columns: Brand, SKU, OE_Number)
  - Preview table showing first 10 rows
  - Batch naming and configuration
  - Start processing button
- **Validation**: Brand and SKU are required, OE_Number optional
- **Process**: Parse CSV → Create batch → Insert products → Redirect to status

### 3. Processing Status Page (status.php)
- **Purpose**: Real-time monitoring of batch processing
- **Features**:
  - Live progress bars for each batch
  - Status indicators (pending, processing, completed, failed)
  - Detailed product-level status table
  - Retry failed items functionality
  - Export completed batches
- **Real-time Updates**: AJAX polling every 3 seconds for status updates

### 4. Product Review Page (review.php)
- **Purpose**: Review and edit processed products before export
- **Features**:
  - Filterable product table (by batch, status, category)
  - Inline editing of generated content
  - Bulk actions (approve, reject, regenerate content)
  - Product detail modal with all data fields
  - Image gallery for eBay images

### 5. Export Manager (export.php)
- **Purpose**: Export processed products to various formats
- **Features**:
  - Export to CSV, XML, JSON formats
  - WooCommerce CSV format support
  - Custom field mapping
  - Batch export with progress tracking
  - Download links for completed exports

### 6. eBay Token Manager (ebay-tokens.php)
- **Purpose**: Manage eBay API credentials and tokens
- **Features**:
  - Add/edit eBay API credentials
  - OAuth token refresh functionality
  - Test API connection
  - Switch between sandbox/production modes
  - Token expiry monitoring

### 7. Settings Page (settings.php)
- **Purpose**: Configure AI prompts and system settings
- **Features**:
  - Custom prompt templates for different content types
  - DeepSeek AI settings (model, temperature, max tokens)
  - Processing batch size configuration
  - System preferences

## Core Processing Workflow

### 1. CSV Processing Engine
```php
class CSVProcessor {
    public function validateCSV($file) {
        // Validate required columns: Brand, SKU
        // Check file format and size
        // Return validation results
    }
    
    public function parseCSV($file) {
        // Parse CSV into structured array
        // Clean and normalize data
        // Return processed data
    }
    
    public function createBatch($data, $name) {
        // Create batch record
        // Insert products with 'pending' status
        // Return batch ID
    }
}
```

### 2. eBay Integration Service
```php
class EbayService {
    public function searchProducts($brand, $sku, $oeNumber) {
        // Multiple search strategies:
        // 1. Brand + SKU
        // 2. Brand + OE Number  
        // 3. OE Number only
        // Filter English listings only
        // Return best matching item
    }
    
    public function getItemDetails($itemId) {
        // Get detailed item information
        // Extract images, specifications, pricing
        // Parse item specifics for part numbers
        // Return structured data
    }
    
    public function refreshToken() {
        // Handle OAuth token refresh
        // Update database with new tokens
    }
}
```

### 3. DeepSeek AI Content Generator
```php
class DeepSeekAI {
    public function generateContent($productData, $contentType, $customPrompt = null) {
        // Content types: seo_title, short_description, long_description, meta_description
        // Use custom prompts or default templates
        // Variable replacement in prompts
        // Call DeepSeek API
        // Return generated content
    }
    
    private function buildPrompt($productData, $contentType, $customPrompt) {
        // Replace variables like {brand}, {sku}, {ebay_title}
        // Include eBay data if available
        // Automotive parts context
    }
}
```

### 4. Batch Processing Engine
```php
class BatchProcessor {
    public function processBatch($batchId) {
        // Process products in small chunks (3-5 at a time)
        // For each product:
        //   1. Search eBay
        //   2. Generate AI content
        //   3. Update status
        // Handle failures with retry logic
        // Update batch progress
    }
    
    public function processProduct($productId) {
        // Single product processing
        // Error handling and logging
        // Status updates
    }
}
```

## API Integration Details

### eBay API Integration
- **Search API**: eBay Browse API for product search
- **Details API**: eBay Trading API for detailed item information
- **Authentication**: OAuth 2.0 with token refresh
- **Rate Limiting**: Implement proper rate limiting
- **English Filtering**: Filter out non-English listings

### DeepSeek AI API
- **Endpoint**: https://api.deepseek.com/v1/chat/completions
- **Model**: deepseek-chat
- **System Prompt**: "You are an expert automotive parts copywriter"
- **Temperature**: 0.7
- **Max Tokens**: 500-1000 depending on content type

## Frontend Requirements (Bootstrap 5)

### Design System
- **Color Scheme**: Professional automotive theme (blues, grays, whites)
- **Typography**: Clean, readable fonts
- **Components**: Cards, tables, modals, progress bars, alerts
- **Responsive**: Mobile-first design
- **Icons**: Font Awesome or Bootstrap Icons

### Key UI Components
- **File Upload**: Drag & drop with progress indication
- **Data Tables**: Sortable, filterable, paginated
- **Progress Bars**: Real-time progress indication
- **Modals**: Product details, confirmations, forms
- **Alerts**: Success/error notifications
- **Navigation**: Clean sidebar or top navigation

## Background Processing

### AJAX Implementation
- **Status Updates**: Poll every 3 seconds for batch progress
- **Product Actions**: Inline editing, bulk operations
- **File Uploads**: Progress tracking
- **Error Handling**: User-friendly error messages

### Queue System
- **Background Processing**: Process batches without blocking UI
- **Retry Logic**: Automatic retry for failed operations
- **Logging**: Comprehensive operation logging
- **Progress Tracking**: Real-time progress updates

## Security Requirements
- **Input Validation**: Sanitize all user inputs
- **File Upload Security**: Validate file types and sizes
- **API Key Protection**: Secure storage of API credentials
- **SQL Injection Prevention**: Use prepared statements
- **XSS Protection**: Escape output data

## Performance Optimization
- **Database Indexing**: Optimize queries with proper indexes
- **Caching**: Cache API responses and processed data
- **Pagination**: Efficient data loading
- **Lazy Loading**: Load data on demand
- **Compression**: Gzip compression for responses

## Error Handling
- **Graceful Failures**: Don't stop entire batch for single failures
- **Retry Mechanisms**: Automatic retry with exponential backoff
- **Detailed Logging**: Log all operations and errors
- **User Notifications**: Clear error messages for users

## Configuration Management
- **Environment Variables**: Store sensitive data securely
- **Settings Panel**: User-configurable options
- **Default Values**: Sensible defaults for all settings
- **Validation**: Validate all configuration inputs

## Export Functionality
- **Multiple Formats**: CSV, XML, JSON support
- **WooCommerce Integration**: Compatible CSV format
- **Custom Mapping**: Allow field customization
- **Bulk Export**: Handle large datasets efficiently

## File Structure Suggestion
```
/autoparts-system/
├── index.php (Dashboard)
├── upload.php (CSV Upload)
├── status.php (Processing Status)
├── review.php (Product Review)
├── export.php (Export Manager)
├── ebay-tokens.php (eBay Token Manager)
├── settings.php (Settings)
├── /classes/
│   ├── Database.php
│   ├── CSVProcessor.php
│   ├── EbayService.php
│   ├── DeepSeekAI.php
│   └── BatchProcessor.php
├── /ajax/
│   ├── upload-csv.php
│   ├── process-batch.php
│   ├── get-status.php
│   └── update-product.php
├── /assets/
│   ├── /css/
│   ├── /js/
│   └── /images/
└── /config/
    ├── database.php
    └── settings.php
```

This prompt contains all the essential information needed to recreate your automotive parts processing system using PHP, Bootstrap, and MySQL while maintaining the same functionality and user experience.