const electronInstaller = require('electron-winstaller');

async function ss()
{
    

  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: '/',
      outputDirectory: './tmp/build/installer64',
     // authors: 'My App Inc.',
      exe: 'SLAMonitorTool.exe'
    });
    console.log('It worked!');
  } catch (e) {
    console.log(`No dice: ${e.message}`);
  }
}
ss();