import net from 'net';

/**
 * Find an available port starting from the given port
 * @param {number} startPort - Starting port number
 * @param {number} maxTries - Maximum number of ports to try
 * @returns {Promise<number>} Available port number
 */
export function findAvailablePort(startPort = 3000, maxTries = 10) {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    function tryPort(port) {
      if (attempts >= maxTries) {
        reject(new Error(`Could not find available port after ${maxTries} attempts`));
        return;
      }

      const server = net.createServer();
      
      server.listen(port, '0.0.0.0', () => {
        server.close(() => {
          console.log(`✅ Found available port: ${port}`);
          resolve(port);
        });
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${port} is busy, trying ${port + 1}...`);
          attempts++;
          currentPort++;
          tryPort(currentPort);
        } else {
          reject(err);
        }
      });
    }

    tryPort(currentPort);
  });
}