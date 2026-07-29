const net = require('net');
const dns = require('dns');

function testConnect(host, port, label) {
    return new Promise((resolve) => {
          const start = Date.now();
          const socket = net.createConnection({ host, port, timeout: 8000 });
          socket.on('connect', () => {
                  console.log('[NETCHECK] ' + label + ' (' + host + ':' + port + ') -> CONNECTED in ' + (Date.now() - start) + 'ms');
                  socket.end();
                  resolve();
          });
          socket.on('timeout', () => {
                  console.log('[NETCHECK] ' + label + ' (' + host + ':' + port + ') -> TIMEOUT after ' + (Date.now() - start) + 'ms');
                  socket.destroy();
                  resolve();
          });
          socket.on('error', (err) => {
                  console.log('[NETCHECK] ' + label + ' (' + host + ':' + port + ') -> ERROR after ' + (Date.now() - start) + 'ms: ' + err.message);
                  resolve();
          });
    });
}

function testDns(host) {
    return new Promise((resolve) => {
          dns.lookup(host, { all: true, verbatim: true }, (err, addresses) => {
                  if (err) {
                            console.log('[NETCHECK] DNS lookup ' + host + ' -> ERROR: ' + err.message);
                  } else {
                            console.log('[NETCHECK] DNS lookup ' + host + ' -> ' + JSON.stringify(addresses));
                  }
                  resolve();
          });
    });
}

async function main() {
    console.log('[NETCHECK] Starting network diagnostics...');
    await testDns('aws-0-eu-west-1.pooler.supabase.com');
    await testDns('db.nwdchqvouuoohienaeoh.supabase.co');
    await testConnect('aws-0-eu-west-1.pooler.supabase.com', 6543, 'transaction-pooler');
    await testConnect('aws-0-eu-west-1.pooler.supabase.com', 5432, 'session-pooler');
    await testConnect('db.nwdchqvouuoohienaeoh.supabase.co', 5432, 'direct');
    await testConnect('www.google.com', 443, 'sanity-google');
    await testConnect('8.8.8.8', 53, 'sanity-dns-ip');
    console.log('[NETCHECK] Diagnostics complete.');
    process.exit(0);
}

main();
