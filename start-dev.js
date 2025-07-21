const { spawn, exec } = require('child_process');
const http = require('http');
const https = require('https');

// Check if port 3000 is in use and kill the process if needed
function checkAndKillPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`Port ${port} is in use. Killing existing process...`);
      // Kill processes using port 3000
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          const pids = new Set();
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
              const pid = parts[parts.length - 1];
              if (pid && !isNaN(pid)) {
                pids.add(pid);
              }
            }
          });
          
          const promises = Array.from(pids).map(pid => {
            return new Promise((resolvePid) => {
              exec(`taskkill /PID ${pid} /F`, (killError) => {
                if (!killError) {
                  console.log(`Killed process with PID ${pid}`);
                }
                resolvePid();
              });
            });
          });
          
          Promise.all(promises).then(() => {
            setTimeout(resolve, 2000); // Wait 2 seconds after killing
          });
        } else {
          resolve();
        }
      });
    });
    
    req.on('error', () => {
      // Port is not in use, proceed
      resolve();
    });
  });
}

// Check if server is running and responding
function checkServerHealth(port, retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (attempt) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        if (res.statusCode === 200) {
          console.log(`✓ Server is running on port ${port}`);
          resolve(true);
        } else {
          console.log(`Server responded with status ${res.statusCode}, retrying...`);
          if (attempt < retries) {
            setTimeout(() => check(attempt + 1), 1000);
          } else {
            reject(new Error(`Server health check failed after ${retries} attempts`));
          }
        }
      });
      
      req.on('error', () => {
        if (attempt < retries) {
          console.log(`Waiting for server to start... (${attempt}/${retries})`);
          setTimeout(() => check(attempt + 1), 1000);
        } else {
          reject(new Error(`Server failed to start after ${retries} attempts`));
        }
      });
    };
    
    check(1);
  });
}

async function startDev() {
  console.log('Checking for existing processes on port 3000...');
  await checkAndKillPort(3000);
  
  console.log('Starting development server...');
  const devProcess = spawn('npm', ['run', 'dev:renderer'], {
    stdio: 'inherit',
    shell: true
  });
  
  devProcess.on('error', (error) => {
    console.error('Failed to start dev server:', error);
  });
  
  devProcess.on('exit', (code) => {
    console.log(`Dev server exited with code ${code}`);
  });

  // Wait for server to be ready
  setTimeout(async () => {
    try {
      await checkServerHealth(3000);
      console.log('✓ Development server is ready and responding');
      console.log('✓ You can now run Playwright tests');
    } catch (error) {
      console.error('✗ Server health check failed:', error.message);
      console.error('✗ Please check if the application is running correctly');
    }
  }, 3000);
}

startDev();