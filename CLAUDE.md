# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is reppie, an AB Repeat Video Player built with React, TypeScript, and Vite. It's a web application that allows users to loop specific sections of videos by setting A and B points for language learning, music practice, or repeated viewing of video segments.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build production bundle with TypeScript compilation
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS with PostCSS
- **Icons**: Lucide React
- **Linting**: ESLint with TypeScript and React plugins

## Architecture

### Single Page Application Structure
- `src/main.tsx` - Application entry point with React StrictMode
- `src/App.tsx` - Main application component containing all functionality
- `index.html` - HTML template with root div for React mount

### Key Features in App.tsx
- Video player with HTML5 video element
- AB loop functionality for repeating video segments
- Interactive progress bar with draggable A/B points
- Bookmark system for saving specific timestamps
- Keyboard shortcuts (Space, A, B, L, R keys)
- Playback speed and volume controls
- File upload and URL input for video sources
- Sample video URLs for testing

### State Management
All state is managed locally in the main App component using React hooks:
- `videoInfo` - Current video metadata and playback state
- `aPoint`/`bPoint` - Loop boundaries with time and label
- `isLooping`/`loopCount` - Loop status and iteration counter
- `bookmarks` - Array of saved timestamp positions
- `dragState` - UI interaction state for dragging A/B points

### Video Handling
- Supports direct video URLs and local file uploads
- Uses HTML5 video events: `onTimeUpdate`, `onLoadedData`, `onPlay`, `onPause`
- Implements custom controls (not browser default controls)
- Handles CORS with `crossOrigin="anonymous"`

### UI Components
- Responsive grid layout (desktop: 2/3 video + 1/3 sidebar)
- Progress bar with visual A/B point indicators and loop range
- Control buttons for play/pause, A/B point setting, loop toggle
- Settings modal for speed and volume preferences
- Keyboard shortcut reference panel

## Code Conventions

- Use TypeScript interfaces for all data structures
- Prefer functional components with hooks over class components
- Use Tailwind CSS classes for styling
- Handle video events properly with useEffect cleanup
- Maintain responsive design principles
- Use proper event handling with preventDefault/stopPropagation where needed

## File Structure

```
src/
  App.tsx          # Main application component (single file architecture)
  main.tsx         # React application entry point
  index.css        # Global styles and Tailwind imports
  vite-env.d.ts    # Vite type declarations
```