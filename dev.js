const { spawn } = require('child_process')
const path = require('path')

// Start Vite dev server
const viteProcess = spawn('npm', ['run', 'dev:renderer'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
})

// Wait a bit for Vite to start, then start Electron
setTimeout(() => {
  const electronProcess = spawn('npm', ['run', 'dev:main'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  })

  // Handle process termination
  process.on('SIGINT', () => {
    viteProcess.kill()
    electronProcess.kill()
    process.exit()
  })
}, 3000)