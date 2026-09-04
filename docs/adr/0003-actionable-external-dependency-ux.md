# External dependency failures must be actionable

When a feature needs an external capability (PlantUML Server, future remote services, diagram renderers), failure and unconfigured states use an Actionable Empty State: short title, secondary explanation, and a primary next step (Open Settings or Retry). Host-side messages use the same contract (`showWarningMessage` with an Open Settings action). Silent failure and Welcome-style marketing empty pages are rejected so WYSIWYG editing is not interrupted and users always know the next step.
