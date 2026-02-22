-- =============================================================
-- PHASE 3 MIGRATION — Albion Events Multi-Guild
-- Run this ONCE after npx prisma db push (Phase 1 schema)
--
-- What this does:
--   1. Creates a "default" guild owned by the first ADMIN user
--   2. Adds all existing users as ACTIVE members of that guild
--      (existing ADMINs become OFFICER, everyone else PLAYER)
--   3. Assigns guildId to all events, roles, categories, templates
--      that don't yet have one
--
-- Safe to re-run (uses INSERT ... WHERE NOT EXISTS / UPDATE ... WHERE NULL)
-- =============================================================

BEGIN;

-- ---------------------------------------------------------------
-- STEP 1: Create default guild owned by the first admin user
-- ---------------------------------------------------------------
DO $$
DECLARE
  v_admin_id TEXT;
  v_guild_id TEXT;
  v_invite   TEXT;
BEGIN

  -- Find first admin user
  SELECT id INTO v_admin_id FROM users WHERE role = 'ADMIN' ORDER BY created_at ASC LIMIT 1;
  IF v_admin_id IS NULL THEN
    -- No admin? Use first user and make them owner
    SELECT id INTO v_admin_id FROM users ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No users found in database. Create an account first.';
  END IF;

  -- Check if default guild already exists
  SELECT id INTO v_guild_id FROM guilds LIMIT 1;
  IF v_guild_id IS NULL THEN
    -- Generate a unique invite code
    v_invite := upper(substr(md5(random()::text), 1, 8));
    -- Keep regenerating if it collides (extremely unlikely)
    WHILE EXISTS (SELECT 1 FROM guilds WHERE invite_code = v_invite) LOOP
      v_invite := upper(substr(md5(random()::text), 1, 8));
    END LOOP;

    INSERT INTO guilds (id, name, slug, description, invite_code, owner_id, created_at)
    VALUES (
      gen_random_uuid()::text,
      'My Guild',
      'my-guild',
      'Default guild migrated from single-guild setup.',
      v_invite,
      v_admin_id,
      now()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO v_guild_id;

    -- If slug collided, get the existing one
    IF v_guild_id IS NULL THEN
      SELECT id INTO v_guild_id FROM guilds WHERE slug = 'my-guild';
    END IF;

    RAISE NOTICE 'Created default guild: id=%, invite=%', v_guild_id, v_invite;
  ELSE
    RAISE NOTICE 'Guild already exists: id=%', v_guild_id;
  END IF;

  -- ---------------------------------------------------------------
  -- STEP 2: Add owner membership (OWNER role)
  -- ---------------------------------------------------------------
  INSERT INTO guild_memberships (id, user_id, guild_id, role, status, verified_at, joined_at)
  VALUES (gen_random_uuid()::text, v_admin_id, v_guild_id, 'OWNER', 'ACTIVE', now(), now())
  ON CONFLICT (user_id, guild_id) DO NOTHING;

  -- ---------------------------------------------------------------
  -- STEP 3: Add all other users as ACTIVE members
  --   Former ADMINs (platform role) → OFFICER in the guild
  --   Everyone else → PLAYER
  -- ---------------------------------------------------------------
  INSERT INTO guild_memberships (id, user_id, guild_id, role, status, verified_at, joined_at)
  SELECT
    gen_random_uuid()::text,
    u.id,
    v_guild_id,
    CASE WHEN u.role = 'ADMIN' THEN 'OFFICER' ELSE 'PLAYER' END,
    'ACTIVE',
    now(),
    COALESCE(u.created_at, now())
  FROM users u
  WHERE u.id != v_admin_id
  ON CONFLICT (user_id, guild_id) DO NOTHING;

  RAISE NOTICE 'Memberships created/verified for all users';

  -- ---------------------------------------------------------------
  -- STEP 4: Assign guildId to orphaned events
  -- ---------------------------------------------------------------
  UPDATE events SET guild_id = v_guild_id WHERE guild_id IS NULL;
  RAISE NOTICE 'Updated events with guild_id';

  -- ---------------------------------------------------------------
  -- STEP 5: Assign guildId to orphaned roles and categories
  -- ---------------------------------------------------------------
  UPDATE guild_categories SET guild_id = v_guild_id WHERE guild_id IS NULL;
  UPDATE guild_roles2 SET guild_id = v_guild_id WHERE guild_id IS NULL;
  RAISE NOTICE 'Updated roles and categories with guild_id';

  -- ---------------------------------------------------------------
  -- STEP 6: Assign guildId to orphaned templates
  -- ---------------------------------------------------------------
  UPDATE guild_templates SET guild_id = v_guild_id WHERE guild_id IS NULL;
  RAISE NOTICE 'Updated templates with guild_id';

  -- ---------------------------------------------------------------
  -- STEP 7: Fix any duplicate role/category names within the guild
  --   (the new schema has UNIQUE(guildId, name) so duplicates must go)
  -- ---------------------------------------------------------------
  -- Deduplicate guild_categories: keep lowest id, delete rest
  DELETE FROM guild_categories
  WHERE id NOT IN (
    SELECT MIN(id) FROM guild_categories GROUP BY guild_id, name
  );

  -- Deduplicate guild_roles2: keep lowest id, delete rest
  -- Must null out categoryId references first to avoid FK violation
  UPDATE guild_roles2 r
  SET category_id = NULL
  WHERE category_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM guild_categories c WHERE c.id = r.category_id);

  DELETE FROM guild_roles2
  WHERE id NOT IN (
    SELECT MIN(id) FROM guild_roles2 GROUP BY guild_id, name
  );

  -- Deduplicate guild_templates: keep lowest id, delete rest
  DELETE FROM guild_templates
  WHERE id NOT IN (
    SELECT MIN(id) FROM guild_templates GROUP BY guild_id, name
  );

  RAISE NOTICE 'Deduplication complete';

END $$;

COMMIT;

-- ---------------------------------------------------------------
-- VERIFICATION QUERIES (run these manually to check results)
-- ---------------------------------------------------------------
-- SELECT id, name, slug, invite_code, owner_id FROM guilds;
-- SELECT COUNT(*) as total_members, status FROM guild_memberships GROUP BY status;
-- SELECT COUNT(*) as events_without_guild FROM events WHERE guild_id IS NULL;
-- SELECT COUNT(*) as roles_without_guild FROM guild_roles2 WHERE guild_id IS NULL;
-- SELECT COUNT(*) as templates_without_guild FROM guild_templates WHERE guild_id IS NULL;
