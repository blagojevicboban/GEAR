# Changelog

All notable changes to this project will be documented in this file.

## [2.5.0] - 2026-03-07

### Added
- **Global Localization Engine**: Dynamic i18n system with `i18next-http-backend` for code-free language expansion.
- **Admin Translation Manager**: New administrative tab for managing all platform strings with side-by-side English reference.
- **Dynamic Language Expansion**: Support for 100+ languages with automated one-click installation and English fallback.
- **Improved UI/UX**: New "Translations" section in Help page and polished Admin Settings navigation.

### Technical
- Migrated from static imports to dynamic API-driven translation loading.
- Optimized JSON storage with structure-preserving nested-to-flat conversion.
- Added English-Reference Model to prevent UI breakage from missing translations.

## [2.4.0] - 2026-03-01

### Added
- **Materials Engine**: PBR material library for real-time model texturing.
- **Dark Mode Support**: System-wide dark/light theme toggle with persistent storage.
- **Crystal Structure Enhancements**: Visualized atomic positions, energy above hull, and band gap data.
- **Rendering Optimization**: Enhanced WebGL performance for high-poly materials.

### Technical
- Implemented `ThemeContext` for unified styling management.
- Integrated Materials Project API v2 (stable release).

## [2.3.0] - 2026-02-25

### Added
- **AI Lesson Generator**: One-click lesson creation using Google Gemini.
- **3D Analytics & Heatmaps**: Visualize student engagement directly on 3D models.
- **Advanced Workbook Builder**: New interactive task types (Find Part, Quiz, True/False).
- **GEAR Academy**: Video training section for educators.

### Technical
- Added point-cloud aggregator for gaze data tracking.
- Implemented Gemini Pro 1.5 for instructional content generation.




## [2.2.0] - 2026-02-18

### Added
- **Materials Project API v2 Integration**: Switched to the new Materials Project API for enhanced material data fetching.
- **Advanced Crystal Rendering**:
    - **Periodic Boundary Repeats**: View atoms repeating across unit cell boundaries.
    - **External Bonding**: Visualize bonds extending to atoms outside the primary unit cell.
- **Minimizable Controls**: Gear icon toggle added to Crystal and PDB viewers to maximize visual space on mobile devices.
- **New Visual Styles**: Added "Bone" and "Spacefill" rendering modes to Crystal and PDB viewers.
- **Laser Cutting Speed Calculator**: Integrated physics-based calculation for laser parameters within the Crystal viewer.

### Fixed
- PDB Viewer layout flickering during style switches.
- Responsive scaling for 3D overlays on portrait mobile screens.

## [2.1.0] - 2026-02-05

### Added
- **File Management Overhaul**: Cascading deletes and orphan file detection.
- **Smart Storage**: Automatic folder organization for model and lesson assets.

## [2.0.0] - 2026-02-01

### Added
- **LTI 1.3 Certification**: Seamless integration with Moodle/Canvas.
- **Platform Administration**: New configuration panel for branding and AI tweaks.
- **System Diagnostics**: Automatic HTTPS and WebXR support checks.
