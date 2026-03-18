Hugging Face Spaces deployment 

1. Create a new Space
- Go to Hugging Face, New Space.
- Owner: your account.
- Space name: Paiperwork (or any name).
- SDK: Docker.
- Visibility: Public or Private.

2. Compile the project first
- Build distribution artifacts:
  cd dev/server
  bash build.sh

3. Prepare files from this repo
- Copy deployment/huggingface-space/Dockerfile
- Copy deployment/huggingface-space/README.md
- Copy dist/linux/Paiperwork-server
- Copy dist/linux/app/ (entire folder)

The Space repository root must contain exactly these runtime files.

4. Create a local staging folder (recommended)
- Create and enter a working folder:
  mkdir -p ~/Paiperwork
  cd ~/Paiperwork
- Copy files into the staging folder root:
  cp /Users/your_user/paiperwork-main/deployment/huggingface-space/Dockerfile .
  cp /Users/your_user/paiperwork-main/deployment/huggingface-space/README.md .
  cp /Users/your_user/paiperwork-main/dist/linux/Paiperwork-server .
  cp -R /Users/your_user/paiperwork-main/dist/linux/app ./app

5. Install required upload tools
- Required for this guide (hf upload):
  curl -LsSf https://hf.co/cli/install.sh | bash
  hf --help
- Recommended to have installed (especially if you also use git push workflows):
  brew install git-lfs
  git lfs install
  brew install git-xet
  git xet install
  git xet --version

6. Upload to Space (recommended)
- Log in to the correct HF account:
  hf auth whoami
- If needed:
  hf auth logout
  hf auth login --token YOUR_TOKEN
- Upload directly (avoids binary push issues in git):
  hf upload your_user/Paiperwork Dockerfile Dockerfile --repo-type space
  hf upload your_user/Paiperwork README.md README.md --repo-type space
  hf upload your_user/Paiperwork dist/linux/Paiperwork-server Paiperwork-server --repo-type space
  hf upload your_user/Paiperwork dist/linux/app app --repo-type space

6.1 Total mirror deployment (deletes stale remote files)
- Use this when you want the Space repo to exactly mirror your local runtime payload.
- Prerequisites:
  - Hugging Face CLI installed and authenticated (`hf auth login`).
  - Local build already generated in dist/linux.
- Command sequence:
  cd /Users/your_user/paiperwork-main
  ./deployment/huggingface-space/deploy-mirror.sh your_user/Paiperwork "Mirror deploy"
- What it does:
  - Stages only Dockerfile, README.md, Paiperwork-server, and app/ from local build.
  - Runs a root upload with `--delete "*"` so removed/renamed files are also removed remotely.

7. Wait for build
- Open the Space page and watch Build Logs.
- First build can take a few minutes.

8. Validate
- Open the Space URL.
- Confirm UI loads.
- Confirm cloud model calls work from chat.

Troubleshooting

- If App shows "Configuration error":
  ensure README.md starts with valid frontmatter:
  ---
  title: Paiperwork
  emoji: 🚀
  colorFrom: gray
  colorTo: gray
  sdk: docker
  app_port: 7860
  pinned: false
  ---

- If build fails with missing executable permissions:
  Dockerfile already runs chmod +x /app/Paiperwork-server.

- If app shows blank page:
  Ensure app/ folder exists at repository root and includes index.html.

- If browser console shows 404 for tabLoader.js:
  ensure generation page references js/utils/tabloader.js (lowercase l).

- If request errors appear for local Ollama endpoints:
  Use the latest codebase version that includes cloud-only fetch rewrites in dev/app/core/js/app.js.
