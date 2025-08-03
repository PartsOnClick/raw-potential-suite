<?php
// complete_ebay_search.php - Complete working version

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuration - UPDATE WITH YOUR REAL CREDENTIALS
$EBAY_CONFIG = [
    'client_id' => 'SUBAIRKO-PartsOnC-PRD-2fe4c757a-e4209c69',
    'client_secret' => 'PRD-fe4c757a074b-1d73-4158-a04d-af6e',
    'dev_id' => '44b5b1ed-9a79-4ff2-940c-925105233683',
    'access_token' => 'v^1.1#i^1#r^0#I^3#p^3#f^0#t^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',
    'refresh_token' => 'v^1.1#i^1#I^3#r^1#p^3#f^0#t^Ul4xMF81OjI1OTMzMDZBNzI1MTBCRDIwMTFBQUE1NUM2RDY4MjE4XzFfMSNFXjI2MA==',
    'token_expires_at' => 1754255800,
    'sandbox_mode' => false // partsonclick.ae uses production
];
// Check configuration
if ($EBAY_CONFIG['access_token'] === 'YOUR_ACCESS_TOKEN_HERE') {
    die('<h1 style="color:red;">? Please update the $EBAY_CONFIG array with your real credentials</h1>');
}

class EbaySearch {
    
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
    }
    
    public function searchItems($brand, $oeNumber, $make, $limit = 10) {
        $endpoint = "https://api.ebay.com/buy/browse/v1/item_summary/search";
        $searchQuery = trim($brand . ' ' . $oeNumber);
	//$searchQuery = $oeNumber;
        
        $params = [
            'q' => $searchQuery,
            'category_ids' => 6030,
	    //'filter' => 'compatibilityMatch:ALL', // Filter for items with compatibility data
	     // 'filter' => 'itemLocationCountry:US',	
            'fieldgroups' => 'COMPATIBILITY', // Include compatibility properties   
	    'limit' => $limit,
	   //'sort' => 'newlyListed',
	   'offset' => 0
        ];
        
        $url = $endpoint . '?' . http_build_query($params);
        
        $headers = [
            "Authorization: Bearer " . $this->config['access_token'],
            "Content-Type: application/json",
            "X-EBAY-C-MARKETPLACE-ID: EBAY_US",
            "Accept-Language: en-US,en;q=0.9"
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return ['error' => "Search API returned HTTP $httpCode"];
        }
        
        $data = json_decode($response, true);
        if (!$data) {
            return ['error' => 'Invalid JSON response from search API'];
        }
        
        // Filter English listings only
        if (isset($data['itemSummaries'])) {
            $data['itemSummaries'] = $this->filterEnglishListings($data['itemSummaries']);
            $data['total'] = count($data['itemSummaries']); // Update total count
        }
        
        return $data;
    }
    
    private function filterEnglishListings($items) {
        $englishItems = [];
        
        foreach ($items as $item) {
            if ($this->isEnglishListing($item)) {
                $englishItems[] = $item;
            }
        }
        
        return $englishItems;
    }
    
    private function isEnglishListing($item) {
        $title = $item['title'] ?? '';
        $sellerCountry = $item['itemLocation']['country'] ?? '';
        
        // Priority checks for English listings
        
        // 1. Check seller location (US, UK, Canada, Australia = likely English)
        $englishCountries = ['US', 'GB', 'CA', 'AU', 'IE', 'NZ'];
        if (in_array($sellerCountry, $englishCountries)) {
            return true;
        }
        
        // 2. Check for non-English characters in title
        if ($this->hasNonEnglishCharacters($title)) {
            return false;
        }
        
        // 3. Check for common non-English words/patterns
        if ($this->hasNonEnglishWords($title)) {
            return false;
        }
        
        // 4. Check title length and structure (very short titles often non-English)
        if (strlen(trim($title)) < 10) {
            return false;
        }
        
        return true;
    }
    
    private function hasNonEnglishCharacters($text) {
        // Check for non-Latin characters (Chinese, Japanese, Korean, Arabic, etc.)
        if (preg_match('/[\x{4e00}-\x{9fff}]/u', $text)) return true; // Chinese
        if (preg_match('/[\x{3040}-\x{309f}]/u', $text)) return true; // Hiragana
        if (preg_match('/[\x{30a0}-\x{30ff}]/u', $text)) return true; // Katakana
        if (preg_match('/[\x{ac00}-\x{d7af}]/u', $text)) return true; // Korean
        if (preg_match('/[\x{0600}-\x{06ff}]/u', $text)) return true; // Arabic
        if (preg_match('/[\x{0400}-\x{04ff}]/u', $text)) return true; // Cyrillic
        if (preg_match('/[\x{0370}-\x{03ff}]/u', $text)) return true; // Greek
        
        return false;
    }
    
    private function hasNonEnglishWords($text) {
        $text = strtolower($text);
        
        // Common non-English words/patterns to exclude
        $nonEnglishPatterns = [
            // German
            'für', 'mit', 'und', 'der', 'die', 'das', 'von', 'zu', 'im', 'am',
            // French  
            'pour', 'avec', 'et', 'le', 'la', 'les', 'de', 'du', 'au', 'aux',
            // Spanish
            'para', 'con', 'y', 'el', 'la', 'los', 'las', 'de', 'del', 'al',
            // Italian
            'per', 'con', 'e', 'il', 'lo', 'la', 'i', 'gli', 'le', 'di', 'del',
            // Common non-English patterns
            '???', '??', '???', '????', '?????', '??????????', '??????'
        ];
        
        foreach ($nonEnglishPatterns as $pattern) {
            if (strpos($text, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    public function getBestItemId($searchResults, $targetBrand) {
        if (!isset($searchResults['itemSummaries']) || empty($searchResults['itemSummaries'])) {
            return null;
        }
        
        $targetBrand = strtolower(trim($targetBrand));
        
        // Look for brand match first
        foreach ($searchResults['itemSummaries'] as $item) {
            $title = strtolower($item['title'] ?? '');
            if (strpos($title, $targetBrand) !== false) {
                return $this->extractItemId($item['itemId']);
            }
        }
        
        // If no brand match, return first item
        $firstItem = $searchResults['itemSummaries'][0];
        return $this->extractItemId($firstItem['itemId']);
    }
    
    private function extractItemId($fullItemId) {
        $parts = explode('|', $fullItemId);
        return isset($parts[1]) ? $parts[1] : $fullItemId;
    }
    
    public function getItemDetails($itemId) {
        $endpoint = "https://api.ebay.com/ws/api.dll";
        
        $headers = [
            'Content-Type: text/xml',
            'X-EBAY-API-CALL-NAME: GetItem',
            'X-EBAY-API-SITEID: 0',
            'X-EBAY-API-DEV-NAME: ' . $this->config['dev_id'],
            'X-EBAY-API-APP-NAME: ' . $this->config['client_id'],
            'X-EBAY-API-CERT-NAME: ' . $this->config['client_secret'],
            'X-EBAY-API-COMPATIBILITY-LEVEL: 967'
        ];
        
        $requestXml = '<?xml version="1.0" encoding="utf-8"?>
        <GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
            <RequesterCredentials>
                <eBayAuthToken>' . $this->config['access_token'] . '</eBayAuthToken>
            </RequesterCredentials>
            <ErrorLanguage>en_US</ErrorLanguage>
            <WarningLevel>High</WarningLevel>
            <IncludeItemCompatibilityList>true</IncludeItemCompatibilityList>
            <IncludeItemSpecifics>true</IncludeItemSpecifics>
            <ItemID>' . htmlspecialchars($itemId) . '</ItemID>
        </GetItemRequest>';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $requestXml);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return ['error' => "Details API returned HTTP $httpCode"];
        }
        
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($response);
        
        if ($xml === false) {
            return ['error' => 'Failed to parse XML response'];
        }
        
        if (isset($xml->Error)) {
            return ['error' => 'eBay API Error: ' . (string)$xml->Error->LongMessage];
        }
        
        return $xml;
    }
    
    public function isBrandMatch($searchResults, $targetBrand, $selectedItemId) {
        $targetBrand = strtolower(trim($targetBrand));
        
        foreach ($searchResults['itemSummaries'] as $item) {
            $actualId = $this->extractItemId($item['itemId']);
            if ($actualId === $selectedItemId) {
                $title = strtolower($item['title'] ?? '');
                return strpos($title, $targetBrand) !== false;
            }
        }
        
        return false;
    }
    
    public function getSelectedItem($searchResults, $selectedItemId) {
        foreach ($searchResults['itemSummaries'] as $item) {
            $actualId = $this->extractItemId($item['itemId']);
            if ($actualId === $selectedItemId) {
                return $item;
            }
        }
        
        return null;
    }
    
    public function poundsToKg($pounds) {
        return round($pounds * 0.45359237, 2);
    }
    
    public function ouncesToGrams($ounces) {
        return round($ounces * 28.3495, 2);
    }
}

// Initialize
$ebaySearch = new EbaySearch($EBAY_CONFIG);
?>
<!DOCTYPE html>
<html>
<head>
    <title>eBay Motor Parts Advanced Search</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .search-form {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr auto;
            gap: 15px;
            margin-bottom: 20px;
        }
        .search-form input {
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
        }
        .search-form input:focus {
            border-color: #667eea;
            outline: none;
        }
        .search-btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }
        .search-btn:hover {
            transform: translateY(-2px);
        }
        .card {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .analysis-section {
            background: rgba(255,255,255,0.98);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .product-header {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .detail-section {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            border-left: 5px solid #667eea;
        }
        .detail-section h4 {
            color: #495057;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .table th, .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        .table th {
            background-color: #e9ecef;
            font-weight: 600;
            color: #495057;
        }
        .compat-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .compat-table th {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 12px;
            font-weight: 500;
        }
        .compat-table td {
            padding: 10px;
            border: 1px solid #dee2e6;
        }
        .compat-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .product-image {
            max-width: 300px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            margin-bottom: 20px;
        }
        .price-tag {
            background: linear-gradient(45deg, #fd7e14, #ffc107);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 24px;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
        }
        .badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
            margin: 2px;
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 10px;
            border-left: 5px solid #dc3545;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .stat-item {
            text-align: center;
            padding: 15px;
            background: rgba(255,255,255,0.8);
            border-radius: 10px;
        }
        .brand-match {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
        }
        .first-item {
            background: linear-gradient(45deg, #ffc107, #fd7e14);
            color: white;
        }
        .samples-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .sample-card {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-decoration: none;
            text-align: center;
            transition: transform 0.2s;
        }
        .sample-card:hover {
            transform: translateY(-3px);
            text-decoration: none;
            color: white;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1 style="text-align: center; color: #495057; margin-bottom: 30px;">
            ?? Advanced eBay Motor Parts Search
        </h1>
        
        <form method="GET" class="search-form">
            <input type="text" name="brand" placeholder="??? Brand (e.g., INA)" 
                   value="<?php echo htmlspecialchars($_GET['brand'] ?? ''); ?>" required>
            <input type="text" name="oe_number" placeholder="?? OE Number (e.g., 11287530314)" 
                   value="<?php echo htmlspecialchars($_GET['oe_number'] ?? ''); ?>" required>
            <input type="text" name="make" placeholder="?? Make (e.g., BMW)" 
                   value="<?php echo htmlspecialchars($_GET['make'] ?? ''); ?>" required>
            <button type="submit" class="search-btn">?? Analyze</button>
        </form>
        
        <div style="text-align: center; color: #6c757d;">
            <small>?? Using authentication from: <strong>partsonclick.ae</strong></small>
        </div>
    </div>

<?php

// Handle search
if (isset($_GET['brand'], $_GET['oe_number'], $_GET['make']) && 
    !empty($_GET['brand']) && !empty($_GET['oe_number']) && !empty($_GET['make'])) {
    
    $brand = trim($_GET['brand']);
    $oeNumber = trim($_GET['oe_number']);
    $make = trim($_GET['make']);
    
    echo '<div class="card">';
    echo '<h3>?? Search Analysis</h3>';
    echo '<p><strong>Parameters:</strong> ' . htmlspecialchars("$brand $oeNumber for $make vehicles") . '</p>';
    
    $startTime = microtime(true);
    $searchResults = $ebaySearch->searchItems($brand, $oeNumber, $make, 10);
    $endTime = microtime(true);
    $searchTime = round(($endTime - $startTime) * 1000, 2);
    
    if (isset($searchResults['error'])) {
        echo '<div class="error">? Search Error: ' . htmlspecialchars($searchResults['error']) . '</div>';
        echo '</div>';
    } elseif (isset($searchResults['itemSummaries']) && !empty($searchResults['itemSummaries'])) {
        $total = $searchResults['total'] ?? 0;
        $returned = count($searchResults['itemSummaries']);
        
        echo '<div class="stats-grid">';
        echo '<div class="stat-item"><div class="badge badge-info">?? Total Found</div><br><strong>' . number_format($total) . '</strong></div>';
        echo '<div class="stat-item"><div class="badge badge-info">?? Showing</div><br><strong>' . $returned . '</strong></div>';
        echo '<div class="stat-item"><div class="badge badge-success">?? Search Time</div><br><strong>' . $searchTime . 'ms</strong></div>';
        echo '</div>';
        echo '</div>';
        
        // Get best matching item
        $bestItemId = $ebaySearch->getBestItemId($searchResults, $brand);
        
        if ($bestItemId) {
            $isBrandMatch = $ebaySearch->isBrandMatch($searchResults, $brand, $bestItemId);
            $selectedItem = $ebaySearch->getSelectedItem($searchResults, $bestItemId);
            
            $matchType = $isBrandMatch ? "Brand Match" : "First Available";
            $matchIcon = $isBrandMatch ? "??" : "??";
            $cardClass = $isBrandMatch ? "brand-match" : "first-item";
            
            echo '<div class="card ' . $cardClass . '">';
            echo '<h3>' . $matchIcon . ' Selected Item - ' . $matchType . '</h3>';
            echo '<p><strong>Item ID:</strong> ' . htmlspecialchars($bestItemId) . '</p>';
            if ($selectedItem && isset($selectedItem['price'])) {
                echo '<p><strong>Price:</strong> $' . $selectedItem['price']['value'] . ' ' . $selectedItem['price']['currency'] . '</p>';
            }
            if ($selectedItem) {
                echo '<p><strong>Title:</strong> ' . htmlspecialchars($selectedItem['title']) . '</p>';
            }
            echo '<p>?? Fetching detailed analysis...</p>';
            echo '</div>';
            
            // Get detailed information
            $detailStartTime = microtime(true);
            $itemDetails = $ebaySearch->getItemDetails($bestItemId);
            $detailEndTime = microtime(true);
            $detailTime = round(($detailEndTime - $detailStartTime) * 1000, 2);
            
            if (isset($itemDetails['error'])) {
                echo '<div class="error">? Details Error: ' . htmlspecialchars($itemDetails['error']) . '</div>';
            } else {
                $item = $itemDetails->Item;
                
                echo '<div class="analysis-section">';
                echo '<div class="product-header">';
                echo '<h2>?? Complete Product Analysis</h2>';
                echo '<p>Selected by: <strong>' . $matchType . '</strong> | Analysis completed in ' . $detailTime . 'ms</p>';
                echo '</div>';
                
                // Product Information
                echo '<div class="detail-section">';
                echo '<h4>?? Product Information</h4>';
                echo '<h3 style="color: #0066cc; margin-bottom: 15px;">' . htmlspecialchars((string)$item->Title) . '</h3>';
                echo '<div class="price-tag">$' . (string)$item->SellingStatus->CurrentPrice . ' ' . (string)$item->SellingStatus->CurrentPrice['currencyID'] . '</div>';
                echo '<p><strong>Item ID:</strong> ' . htmlspecialchars((string)$item->ItemID) . '</p>';
                echo '<p><strong>SKU:</strong> ' . htmlspecialchars((string)$item->SKU) . '</p>';
                echo '<p><strong>Condition:</strong> <span class="badge badge-success">' . htmlspecialchars((string)$item->SellingStatus->ListingStatus) . '</span></p>';
                echo '<p><strong>Location:</strong> ' . htmlspecialchars((string)$item->Location) . '</p>';
                echo '</div>';
                
                // Images
                if (isset($item->PictureDetails->PictureURL)) {
                    echo '<div class="detail-section">';
                    echo '<h4>??? Product Images</h4>';
                    $imageUrl = (string)$item->PictureDetails->PictureURL;
                    echo '<img src="' . htmlspecialchars($imageUrl) . '" class="product-image" alt="Product Image">';
                    echo '</div>';
                }
                
                // Item Specifics
                if (isset($item->ItemSpecifics->NameValueList)) {
                    echo '<div class="detail-section">';
                    echo '<h4>?? Item Specifications</h4>';
                    echo '<table class="table">';
                    echo '<thead><tr><th>Specification</th><th>Value</th></tr></thead><tbody>';
                    
                    foreach ($item->ItemSpecifics->NameValueList as $specific) {
                        $name = (string)$specific->Name;
                        $value = (string)$specific->Value;
                        echo '<tr>';
                        echo '<td><strong>' . htmlspecialchars($name) . '</strong></td>';
                        echo '<td>' . htmlspecialchars($value) . '</td>';
                        echo '</tr>';
                    }
                    echo '</tbody></table>';
                    echo '</div>';
                }
                
                // Vehicle Compatibility
                if (isset($item->ItemCompatibilityList->Compatibility)) {
                    echo '<div class="detail-section">';
                    echo '<h4>?? Vehicle Compatibility</h4>';
                    
                    $compatibilities = $item->ItemCompatibilityList->Compatibility;
                    $compatibilityCount = is_array($compatibilities) ? count($compatibilities) : 1;
                    
                    echo '<p><span class="badge badge-warning">Total Compatible Vehicles: ' . $compatibilityCount . '</span></p>';
                    
                    echo '<table class="compat-table">';
                    echo '<thead><tr><th>Year</th><th>Make</th><th>Model</th><th>Trim</th><th>Engine</th></tr></thead><tbody>';
                    
                    $compatibilityArray = is_array($compatibilities) ? $compatibilities : [$compatibilities];
                    $showLimit = 8;
                    
                    foreach (array_slice($compatibilityArray, 0, $showLimit) as $compatibility) {
                        $year = $makeVal = $model = $trim = $engine = '';
                        
                        if (isset($compatibility->NameValueList)) {
                            $nameValueArray = is_array($compatibility->NameValueList) ? $compatibility->NameValueList : [$compatibility->NameValueList];
                            
                            foreach ($nameValueArray as $nameValue) {
                                if (isset($nameValue->Name) && isset($nameValue->Value)) {
                                    $name = (string)$nameValue->Name;
                                    $value = (string)$nameValue->Value;
                                    
                                    switch ($name) {
                                        case 'Year': $year = $value; break;
                                        case 'Make': $makeVal = $value; break;
                                        case 'Model': $model = $value; break;
                                        case 'Trim': $trim = $value; break;
                                        case 'Engine': $engine = $value; break;
                                    }
                                }
                            }
                        }
                        
                        echo '<tr>';
                        echo '<td>' . htmlspecialchars($year) . '</td>';
                        echo '<td>' . htmlspecialchars($makeVal) . '</td>';
                        echo '<td>' . htmlspecialchars($model) . '</td>';
                        echo '<td>' . htmlspecialchars($trim) . '</td>';
                        echo '<td style="font-size: 11px;">' . htmlspecialchars($engine) . '</td>';
                        echo '</tr>';
                    }
                    echo '</tbody></table>';
                    
                    if ($compatibilityCount > $showLimit) {
                        echo '<p style="margin-top: 15px;"><em>... and ' . ($compatibilityCount - $showLimit) . ' more compatible vehicles</em></p>';
                    }
                    echo '</div>';
                }
                
                // Shipping Package Details
                if (isset($item->ShippingPackageDetails)) {
                    echo '<div class="detail-section">';
                    echo '<h4>?? Shipping & Package Details</h4>';
                    
                    $shipping = $item->ShippingPackageDetails;
                    echo '<table class="table">';
                    echo '<thead><tr><th>Detail</th><th>Value</th></tr></thead><tbody>';
                    
                    if (isset($shipping->WeightMajor) && $shipping->WeightMajor > 0) {
                        $weightLbs = (float)$shipping->WeightMajor;
                        $weightKg = $ebaySearch->poundsToKg($weightLbs);
                        echo '<tr><td><strong>Weight (Major)</strong></td><td>' . $weightLbs . ' lbs <span class="badge badge-info">' . $weightKg . ' kg</span></td></tr>';
                    }
                    
                    if (isset($shipping->WeightMinor) && $shipping->WeightMinor > 0) {
                        $weightOz = (float)$shipping->WeightMinor;
                        $weightGrams = $ebaySearch->ouncesToGrams($weightOz);
                        echo '<tr><td><strong>Weight (Minor)</strong></td><td>' . $weightOz . ' oz <span class="badge badge-info">' . $weightGrams . ' g</span></td></tr>';
                    }
                    
                    if (isset($shipping->ShippingIrregular)) {
                        $irregular = ((string)$shipping->ShippingIrregular === 'true') ? 'Yes' : 'No';
                        $badgeClass = $irregular === 'Yes' ? 'badge-warning' : 'badge-success';
                        echo '<tr><td><strong>Irregular Package</strong></td><td><span class="badge ' . $badgeClass . '">' . $irregular . '</span></td></tr>';
                    }
                    
                    if (isset($shipping->ShippingPackage)) {
                        echo '<tr><td><strong>Package Type</strong></td><td>' . htmlspecialchars((string)$shipping->ShippingPackage) . '</td></tr>';
                    }
                    
                    echo '</tbody></table>';
                    echo '</div>';
                }
                
                echo '</div>'; // End analysis section
            }
        } else {
            echo '<div class="error">? Could not find any suitable item for analysis</div>';
        }
        
    } else {
        echo '<div class="error">? No items found for the specified search criteria</div>';
        echo '</div>';
    }

} else {
    // Show sample searches
    echo '<div class="card">';
    echo '<h3>?? Try these sample searches:</h3>';
    echo '<div class="samples-grid">';
    
    $samples = [
        ['brand' => 'INA', 'oe_number' => '11287530314', 'make' => 'BMW'],
        ['brand' => 'SACHS', 'oe_number' => '315313', 'make' => 'BMW'],
        ['brand' => 'BOSCH', 'oe_number' => '0280158501', 'make' => 'Mercedes-Benz'],
    ];
    
    foreach ($samples as $sample) {
        $url = '?' . http_build_query($sample);
        echo '<a href="' . $url . '" class="sample-card">';
        echo '<strong>' . $sample['brand'] . ' ' . $sample['oe_number'] . '</strong><br>';
        echo '<small>for ' . $sample['make'] . ' vehicles</small>';
        echo '</a>';
    }
    
    echo '</div>';
    echo '</div>';
}

?>

</div>

</body>
</html>