# NeuroDiverse Application

## Project Overview
NeuroDiverse is an application designed to support individuals with neurodevelopmental conditions such as ADHD, autism, and dyslexia through specialized tools, games, and resources.

## Repository Size Management
This repository has been optimized for GitHub upload by:

1. **Removing Duplicate Model Files**: Face recognition model files were duplicated in both the root directory and the public/models folder. The root directory copies have been removed.

2. **Adding .gitignore**: A comprehensive .gitignore file has been added to exclude:
   - Build artifacts (.next directory)
   - Environment files (.env.local)
   - Node modules
   - Debug files
   - Duplicate model files

## Working with Large Files
If you need to add large files to this project in the future:

1. Consider using Git LFS (Large File Storage) for files over 100MB
2. Store large media files externally and load them at runtime
3. Keep model files only in the public/models directory

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Project Structure
- `/src`: Application source code
- `/public`: Static assets including models and audio files
- `/components`: Reusable UI components