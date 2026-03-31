# Skills Prompt Enhancement Design

## Goal

Add a `skills` layer to prompt creation and editing so users can attach a small set of reusable capability labels to a prompt. The first release should help users choose the right mental model for a prompt, improve prompt quality, and make prompts easier to browse and understand.

## Context

PromptMinder already has:

- Prompt creation and editing through `components/prompt/PromptForm.jsx`
- Tag-based categorization
- AI-assisted metadata generation
- Prompt detail, public prompt, and workflow views

The proposed `skills` feature is intentionally narrower than tags. Tags describe topic or domain. Skills describe the capability or task style the prompt is meant to support.

Examples:

- Tags: `marketing`, `customer-support`, `coding`
- Skills: `summarization`, `rewrite`, `analysis`, `brainstorming`

## Scope

### In scope

- Prompt authors can select 1 to 3 skills while creating or editing a prompt
- Skills are chosen from a curated built-in library
- Each skill has a short description and usage guidance
- Selected skills are stored with the prompt as structured metadata
- Prompt detail and list surfaces can display the chosen skills
- AI-assisted metadata generation can use selected skills as context

### Out of scope

- User-created skills
- Skill marketplace or sharing system
- Skill execution runtime for the `/agent` experience
- Team-admin skill governance UI
- Full recommendation engine or personalized ranking

## Product Rules

- Skills are optional for existing prompts, but the UI should encourage selection during creation
- A prompt can have multiple skills, but the UI should recommend a maximum of 3
- Skills must come from a curated list to keep naming consistent
- Skills should not replace tags; both fields remain separate and complementary

## Proposed Data Model

Use a small, structured representation for the skill catalog and prompt associations.

### Skill catalog

Each skill entry should include:

- `id`
- `name`
- `slug`
- `category`
- `summary`
- `usage_tips`
- `status` (`active`, `beta`, `deprecated`)

Optional later additions:

- `inputs`
- `outputs`
- `pitfalls`
- `related_skills`
- `sort_order`

### Prompt association

Prompts should store selected skills as a JSON array of skill slugs on the prompt record.

This keeps the MVP simple while still supporting:

- multiple selected skills
- stable skill identifiers via slug
- ordered skill selection
- backward-compatible reads for prompts with no skills

The JSON array contract should be treated as the source of truth for the first release.

## UX Design

### Prompt form

Add a `Skills` section to `components/prompt/PromptForm.jsx`.

Suggested placement:

- After `content`
- Before or alongside `tags`

Interaction:

- Show a searchable multi-select
- Show curated default suggestions
- Limit selection guidance to 3 skills
- Render selected skills as chips
- Selecting a skill reveals a short help card with summary and usage tips

### Prompt detail

Display selected skills near tags or metadata. Keep the presentation compact:

- skill name
- short description on hover or click

### List and public views

Show skills as secondary metadata only. They should support scannability without competing with title, description, and tags.

## AI Behavior

When generating title, description, or optimization suggestions, include the selected skills in the input context.

Expected effect:

- A prompt with `summarization` should generate more concise suggestions
- A prompt with `brainstorming` should generate more open-ended suggestions
- A prompt with `analysis` should generate more structured suggestions

This is a product inference, not a hard guarantee. The implementation should treat skills as guidance, not a strict execution policy.

## API and Storage Impact

The prompt create and update flows must accept skills as part of the request payload.

Required behavior:

- Save selected skill slugs with the prompt
- Return selected skills in prompt list and detail responses
- Preserve compatibility for prompts that do not yet have skills

API endpoints likely to change:

- `app/api/prompts/route.js`
- prompt detail and update routes
- AI metadata generation route used by `PromptForm`

## Rollout Plan

### Phase 1

- Add skill catalog data
- Add prompt form selection UI
- Store and return selected skills

### Phase 2

- Show skills in prompt detail and list views
- Use skills in AI-generated metadata

### Phase 3

- Add filtering or search by skill
- Add team-level skill curation if user demand is strong

## Error Handling

- If the skill catalog fails to load, the prompt form should continue to work with tags and core fields
- If a submitted skill is unknown or inactive, reject it with a clear validation error
- If a prompt has no skills, the rest of the prompt workflow should remain unchanged

## Testing Strategy

Add tests covering:

- Prompt form rendering with skills selection
- Validation for max skill count
- API create/update payload handling
- Response serialization of selected skills
- Backward compatibility for prompts without skills

## Open Questions

- Should skills be filterable in the prompt list during Phase 1, or wait for Phase 2?
