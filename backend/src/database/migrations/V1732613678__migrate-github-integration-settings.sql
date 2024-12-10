DO $$
DECLARE
    _record RECORD;
    _new_settings JSONB;
    _org JSONB;
BEGIN
    FOR _record IN SELECT * FROM integrations WHERE platform = 'github' LOOP
        /*
            old settings:
            {
                "repos": [
                    {
                        "url": "https://github.com/camaraproject/Governance",
                        "fork": false,
                        "name": "Governance",
                        "owner": "camaraproject",
                        "private": false,
                        "cloneUrl": "https://github.com/camaraproject/Governance.git",
                        "createdAt": "2021-06-28T04:15:55Z"
                    },
                    {
                        "url": "https://github.com/camaraproject/QualityOnDemand",
                        "fork": false,
                        "name": "QualityOnDemand",
                        "owner": "camaraproject",
                        "private": false,
                        "cloneUrl": "https://github.com/camaraproject/QualityOnDemand.git",
                        "createdAt": "2022-02-22T10:05:50Z"
                    },
                    ...
                ],
                "orgAvatar": "https://avatars.githubusercontent.com/u/91603532?v=4",
                "unavailableRepos": [],
                "updateMemberAttributes": false
            }
        */
        /*
            new settings:
            {
                orgs: [
                    {
                        name: "ASWF",
                        logo: "https://blah...png",
                        url: "https://github.com/ASWF",
                        fullSync: true|false,
                        updatedAt: "2024-11-18T12:03:09",
                        repos: [
                            {
                                name: "foundation",
                                url: "https://github.com/ASWF/foundation",
                                updatedAt: "2024-11-18T12:03:09",
                            },
                            {
                                name: "something-else",
                                url: "https://github.com/ASWF/something-else",
                                updatedAt: "2024-11-18T12:03:09",
                            }
                        ]
                    },
                    ...
                ]
            }
         */

        -- Skip if settings already have orgs key
        IF _record.settings ? 'orgs' THEN
            RAISE NOTICE 'integration: %, skipping', _record.id;
            CONTINUE;
        END IF;

        -- Extract org name and avatar from first repo if available
        IF jsonb_array_length(_record.settings->'repos') > 0 THEN
            -- Create org object with repos
            _org = jsonb_build_object(
                'name', (_record.settings->'repos'->0->>'owner'),
                'logo', _record.settings->>'orgAvatar',
                'url', 'https://github.com/' || (_record.settings->'repos'->0->>'owner'),
                'fullSync', true,
                'updatedAt', CURRENT_TIMESTAMP,
                'repos', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'name', repo->>'name',
                            'url', repo->>'url',
                            'updatedAt', repo->>'createdAt'
                        )
                    )
                    FROM jsonb_array_elements(_record.settings->'repos') repo
                )
            );

            -- Create new settings object with orgs array
            _new_settings = jsonb_build_object('orgs', jsonb_build_array(_org));

            UPDATE integrations
            SET settings = _new_settings
            WHERE id = _record.id;
        END IF;
    END LOOP;
END;
$$;
