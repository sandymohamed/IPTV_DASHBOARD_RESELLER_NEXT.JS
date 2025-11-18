// scripts/unblock-ip.js
// Simple script to unblock IP addresses
// Run with: node scripts/unblock-ip.js

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function unblockIP() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    });

    console.log('🔌 Connected to database');

    // Unblock specific IP
    const ipToUnblock = process.argv[2] || '127.0.0.1';
    
    if (process.argv[2] === '--all') {
      // Unblock all IPs
      const [result] = await connection.execute('DELETE FROM maa_login_ips');
      console.log(`✅ Unblocked all IPs (${result.affectedRows} records deleted)`);
    } else {
      // Unblock specific IP
      const [result] = await connection.execute(
        'DELETE FROM maa_login_ips WHERE ip = ?',
        [ipToUnblock]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✅ Unblocked IP: ${ipToUnblock}`);
      } else {
        console.log(`ℹ️  IP ${ipToUnblock} is not blocked`);
      }
    }

    // Show remaining blocked IPs
    const [blocked] = await connection.execute(
      'SELECT ip, username, tries, FROM_UNIXTIME(timeDiff) as blocked_until FROM maa_login_ips WHERE tries >= 3'
    );
    
    if (blocked.length > 0) {
      console.log('\n📋 Remaining blocked IPs:');
      blocked.forEach(row => {
        console.log(`  - ${row.ip} (${row.username || 'N/A'}) - Tries: ${row.tries} - Until: ${row.blocked_until}`);
      });
    } else {
      console.log('\n✅ No blocked IPs remaining');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

unblockIP();

