<?php
// export_ebay_credentials.php - Add this to partsonclick.ae to export credentials

// Include WordPress (adjust path if needed)
require_once('wp-config.php');

?>
<!DOCTYPE html>
<html>
<head>
    <title>eBay Credentials Export - partsonclick.ae</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: #f1f1f1; 
        }
        .container { 
            max-width: 800px; 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .credentials { 
            background: #e8f5e9; 
            padding: 20px; 
            border-radius: 5px; 
            margin: 20px 0; 
            border-left: 4px solid #4caf50; 
        }
        .code-block { 
            background: #f5f5f5; 
            padding: 15px; 
            border-radius: 5px; 
            font-family: 'Courier New', monospace; 
            margin: 10px 0; 
            border: 1px solid #ddd; 
            white-space: pre-wrap; 
            word-wrap: break-word; 
        }
        .copy-button { 
            background: #2196f3; 
            color: white; 
            border: none; 
            padding: 8px 15px; 
            border-radius: 3px; 
            cursor: pointer; 
            margin-left: 10px; 
        }
        .status { 
            padding: 15px; 
            border-radius: 5px; 
            margin: 10px 0; 
        }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .warning { background: #fff3cd; color: #856404; }
        .info { background: #d1ecf1; color: #0c5460; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
        }
        th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
        }
        th { background: #f2f2f2; }
        .masked { 
            font-family: monospace; 
            background: #f8f9fa; 
            padding: 2px 4px; 
            border-radius: 3px; 
        }
        .test-section { 
            background: #fff3e0; 
            padding: 20px; 
            border-radius: 5px; 
            margin: 20px 0; 
            border-left: 4px solid #ff9800; 
        }
    </style>
</head>
<body>

<div class="container">
    <h1>🔧 eBay Credentials Export</h1>
    <p><strong>Source:</strong> partsonclick.ae WordPress Database</p>
    <p><strong>Generated:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>

    <?php
    // Get all eBay credentials from WordPress options
    $client_id = get_option('ebay_client_id', '');
    $client_secret = get_option('ebay_client_secret', '');
    $dev_id = get_option('ebay_dev_id', '');
    $access_token = get_option('ebay_access_token', '');
    $refresh_token = get_option('ebay_refresh_token', '');
    $expires_at = get_option('ebay_expires_in_next', '');
    $token_type = get_option('ebay_token_type', '');
    $expires_in = get_option('ebay_expires_in', '');

    // Check if credentials exist
    if (empty($client_id) || empty($client_secret) || empty($dev_id)) {
        echo '<div class="status error">';
        echo '❌ <strong>Error:</strong> eBay credentials not found in WordPress database!<br>';
        echo 'Make sure the eBay Motor plugin is properly configured on partsonclick.ae';
        echo '</div>';
    } else {
        echo '<div class="status success">';
        echo '✅ <strong>Success:</strong> eBay credentials found and ready to export!';
        echo '</div>';
    }

    // Check token status
    $token_valid = !empty($access_token) && time() < $expires_at;
    if ($token_valid) {
        echo '<div class="status success">';
        echo '✅ <strong>Token Status:</strong> Valid until ' . date('Y-m-d H:i:s', $expires_at);
        echo '</div>';
    } else {
        echo '<div class="status warning">';
        echo '⚠️ <strong>Token Status:</strong> Expired or invalid';
        echo '</div>';
    }
    ?>

    <h2>📋 Credentials Summary</h2>
    <table>
        <tr>
            <th>Setting</th>
            <th>Value</th>
            <th>Status</th>
        </tr>
        <tr>
            <td><strong>Client ID</strong></td>
            <td><span class="masked"><?php echo $client_id ? substr($client_id, 0, 15) . '...' : 'Not set'; ?></span></td>
            <td><?php echo $client_id ? '✅ Set' : '❌ Missing'; ?></td>
        </tr>
        <tr>
            <td><strong>Client Secret</strong></td>
            <td><span class="masked"><?php echo $client_secret ? substr($client_secret, 0, 15) . '...' : 'Not set'; ?></span></td>
            <td><?php echo $client_secret ? '✅ Set' : '❌ Missing'; ?></td>
        </tr>
        <tr>
            <td><strong>Dev ID</strong></td>
            <td><span class="masked"><?php echo $dev_id ? substr($dev_id, 0, 10) . '...' : 'Not set'; ?></span></td>
            <td><?php echo $dev_id ? '✅ Set' : '❌ Missing'; ?></td>
        </tr>
        <tr>
            <td><strong>Access Token</strong></td>
            <td><span class="masked"><?php echo $access_token ? substr($access_token, 0, 20) . '...' : 'Not set'; ?></span></td>
            <td><?php echo $access_token ? '✅ Set' : '❌ Missing'; ?></td>
        </tr>
        <tr>
            <td><strong>Refresh Token</strong></td>
            <td><span class="masked"><?php echo $refresh_token ? substr($refresh_token, 0, 20) . '...' : 'Not set'; ?></span></td>
            <td><?php echo $refresh_token ? '✅ Set' : '❌ Missing'; ?></td>
        </tr>
        <tr>
            <td><strong>Token Expires</strong></td>
            <td><?php echo $expires_at ? date('Y-m-d H:i:s', $expires_at) : 'Not set'; ?></td>
            <td><?php echo $token_valid ? '✅ Valid' : '⚠️ Expired'; ?></td>
        </tr>
    </table>

    <h2>📄 Full Credentials (Copy These)</h2>
    <div class="credentials">
        <p><strong>⚠️ Important:</strong> Copy these exact values to your standalone eBay search tool.</p>
        
        <div class="code-block" id="credentials-output">Client ID: <?php echo htmlspecialchars($client_id); ?>
Client Secret: <?php echo htmlspecialchars($client_secret); ?>
Dev ID: <?php echo htmlspecialchars($dev_id); ?>
Access Token: <?php echo htmlspecialchars($access_token); ?>
Refresh Token: <?php echo htmlspecialchars($refresh_token); ?>
Expires At: <?php echo $expires_at; ?>
Token Type: <?php echo htmlspecialchars($token_type); ?>
Expires In: <?php echo $expires_in; ?></div>
        
        <button class="copy-button" onclick="copyCredentials()">📋 Copy All Credentials</button>
    </div>

    <h2>🔧 Configuration Code</h2>
    <p>Use this exact code in your standalone eBay search tool:</p>
    
    <div class="code-block" id="config-code">$EBAY_CONFIG = [
    'client_id' => '<?php echo addslashes($client_id); ?>',
    'client_secret' => '<?php echo addslashes($client_secret); ?>',
    'dev_id' => '<?php echo addslashes($dev_id); ?>',
    'access_token' => '<?php echo addslashes($access_token); ?>',
    'refresh_token' => '<?php echo addslashes($refresh_token); ?>',
    'token_expires_at' => <?php echo $expires_at; ?>,
    'sandbox_mode' => false // partsonclick.ae uses production
];</div>
    
    <button class="copy-button" onclick="copyConfig()">📋 Copy Configuration</button>

    <?php if ($client_id && $client_secret && $dev_id): ?>
    <div class="test-section">
        <h2>🧪 Test eBay Connection</h2>
        <p>Testing connection with current credentials...</p>
        
        <?php
        // Test the eBay connection using the current credentials
        if ($access_token && $token_valid) {
            echo '<p>🔍 <strong>Testing search API...</strong></p>';
            
            // Create eBayMoter instance (your existing class)
            if (class_exists('eBayMoter')) {
                $eBayMoter = new eBayMoter();
                $test_result = $eBayMoter->ebay_search_item('test', '');
                
                if (isset($test_result['total'])) {
                    echo '<div class="status success">';
                    echo '✅ <strong>API Test Success!</strong> Found ' . $test_result['total'] . ' results for "test" search.';
                    echo '</div>';
                } elseif (isset($test_result['errors'])) {
                    echo '<div class="status error">';
                    echo '❌ <strong>API Test Failed:</strong> ' . json_encode($test_result['errors']);
                    echo '</div>';
                } else {
                    echo '<div class="status warning">';
                    echo '⚠️ <strong>API Test:</strong> Unexpected response format';
                    echo '</div>';
                }
            } else {
                echo '<div class="status warning">';
                echo '⚠️ <strong>eBayMoter class not found.</strong> Make sure eBay plugin is active.';
                echo '</div>';
            }
        } else {
            echo '<div class="status warning">';
            echo '⚠️ <strong>Cannot test:</strong> Access token is missing or expired.';
            echo '</div>';
        }
        ?>
    </div>
    <?php endif; ?>

    <h2>📋 Next Steps</h2>
    <div class="info">
        <ol>
            <li><strong>Copy the configuration code</strong> above</li>
            <li><strong>Paste it</strong> into your standalone eBay search tool</li>
            <li><strong>Replace the $EBAY_CONFIG array</strong> with the values above</li>
            <li><strong>Test the search functionality</strong></li>
        </ol>
        
        <p><strong>Note:</strong> If the access token is expired, your standalone tool will automatically refresh it using the refresh token.</p>
    </div>

    <h2>🔒 Security Notice</h2>
    <div class="status warning">
        <p><strong>⚠️ Important Security Notes:</strong></p>
        <ul>
            <li>These credentials provide access to your eBay API account</li>
            <li>Never share these credentials publicly</li>
            <li>Remove this export page after copying the credentials</li>
            <li>The access token will expire and be automatically refreshed</li>
        </ul>
    </div>

</div>

<script>
function copyCredentials() {
    const text = document.getElementById('credentials-output').textContent;
    navigator.clipboard.writeText(text).then(function() {
        alert('✅ Credentials copied to clipboard!');
    }, function(err) {
        alert('❌ Failed to copy credentials');
    });
}

function copyConfig() {
    const text = document.getElementById('config-code').textContent;
    navigator.clipboard.writeText(text).then(function() {
        alert('✅ Configuration code copied to clipboard!');
    }, function(err) {
        alert('❌ Failed to copy configuration');
    });
}
</script>

</body>
</html>