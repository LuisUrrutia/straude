# Papercuts

2026-08-09T03:51:58.290Z — gpt-5.6-sol — ohong

running the Mac mini Straude usage upload -> npx hit EPERM because /Users/ohong/.npm contains root-owned files; workaround was a fresh NPM_CONFIG_CACHE under /tmp, which uploaded successfully, but the CLI still exited 1 on /Users/ohong/.straude/config.json permissions

