# Outline labels truncate with ellipsis and hover full title

Long outline entry titles use single-line ellipsis inside the Outline panel; the full title is exposed on hover (`title`/tooltip). The panel default width is raised (about 280px) while remaining user-resizable with persisted width. Horizontal scrolling of outline labels is rejected as the primary way to read truncated titles, matching common IDE/doc TOC practice (fixed or bounded width + ellipsis) rather than never-truncating wraps that inflate the sidebar.
