#!/bin/bash

# GitHub username
GITHUB_USER="enochodu1"
REPO_NAME="edylicious-clone"

# Create repository using GitHub API
echo "Creating GitHub repository..."
curl -u "$GITHUB_USER" https://api.github.com/user/repos -d "{\"name\":\"$REPO_NAME\",\"description\":\"Static clone of Edylicious tea room website\",\"public\":true}"

# Add remote origin
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

# Push to GitHub
echo "Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "Repository created and pushed to: https://github.com/$GITHUB_USER/$REPO_NAME"