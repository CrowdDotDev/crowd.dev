CREATE TABLE "orgAttributes" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "organizationId" uuid REFERENCES "organizations" ("id") NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "source" VARCHAR(255) NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT FALSE,
    "value" TEXT NOT NULL
);

-- make sure there is only one default attribute
CREATE UNIQUE INDEX "orgAttributes_organizationId_name_default" ON "orgAttributes" ("organizationId", "name", "default") WHERE "default";

CREATE OR REPLACE FUNCTION add_org_attribute(
   _org_id UUID,
   _type TEXT,
   _name TEXT,
   _source TEXT,
   _default BOOLEAN,
   _value anyelement
)
RETURNS VOID AS $$
BEGIN
    IF _value IS NOT NULL THEN
        INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
        VALUES (_org_id, _type, _name, _source, _default, _value::TEXT)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;


DO $$
DECLARE
    _org RECORD;
    _value TEXT;
    _source TEXT;
BEGIN
    -- types: string | decimal | integer | boolean | object | array
    FOR _org IN SELECT * FROM organizations LOOP
        _source := CASE
             WHEN _org."lastEnrichedAt" is null and NOT _org."manuallyCreated" THEN 'integration'
             WHEN _org."lastEnrichedAt" is null and _org."manuallyCreated" THEN 'custom'
             WHEN _org."lastEnrichedAt" is not null THEN 'peopledatalabs'
             ELSE 'unknown'
         END;

        PERFORM add_org_attribute(_org.id, 'string', 'description', _source, TRUE, _org.description);

        PERFORM add_org_attribute(_org.id, 'string', 'logo', _source, TRUE, _org.logo);
        PERFORM add_org_attribute(_org.id, 'string', 'location', _source, TRUE, _org.location);
        PERFORM add_org_attribute(_org.id, 'string', 'type', _source, TRUE, _org.type);
        PERFORM add_org_attribute(_org.id, 'string', 'geoLocation', _source, TRUE, _org."geoLocation");
        PERFORM add_org_attribute(_org.id, 'string', 'size', _source, TRUE, _org.size);
        PERFORM add_org_attribute(_org.id, 'string', 'ticker', _source, TRUE, _org.ticker);
        PERFORM add_org_attribute(_org.id, 'string', 'headline', _source, TRUE, _org.headline);
        PERFORM add_org_attribute(_org.id, 'string', 'industry', _source, TRUE, _org.industry);
        PERFORM add_org_attribute(_org.id, 'string', 'gicsSector', _source, TRUE, _org."gicsSector");
        PERFORM add_org_attribute(_org.id, 'string', 'ultimateParent', _source, TRUE, _org."ultimateParent");
        PERFORM add_org_attribute(_org.id, 'string', 'immediateParent', _source, TRUE, _org."immediateParent");

        PERFORM add_org_attribute(_org.id, 'integer', 'employees', _source, TRUE, _org.employees);
        PERFORM add_org_attribute(_org.id, 'integer', 'founded', _source, TRUE, _org.founded);

        PERFORM add_org_attribute(_org.id, 'decimal', 'averageEmployeeTenure', _source, TRUE, _org."averageEmployeeTenure");

        PERFORM add_org_attribute(_org.id, 'object', 'revenueRange', _source, TRUE, _org."revenueRange");
        PERFORM add_org_attribute(_org.id, 'object', 'employeeCountByCountry', _source, TRUE, _org."employeeCountByCountry");
        PERFORM add_org_attribute(_org.id, 'object', 'address', _source, TRUE, _org.address);
        PERFORM add_org_attribute(_org.id, 'object', 'averageTenureByLevel', _source, TRUE, _org."averageTenureByLevel");
        PERFORM add_org_attribute(_org.id, 'object', 'averageTenureByRole', _source, TRUE, _org."averageTenureByRole");
        PERFORM add_org_attribute(_org.id, 'object', 'employeeChurnRate', _source, TRUE, _org."employeeChurnRate");
        PERFORM add_org_attribute(_org.id, 'object', 'employeeCountByMonth', _source, TRUE, _org."employeeCountByMonth");
        PERFORM add_org_attribute(_org.id, 'object', 'employeeGrowthRate', _source, TRUE, _org."employeeGrowthRate");
        PERFORM add_org_attribute(_org.id, 'object', 'employeeCountByMonthByLevel', _source, TRUE, _org."employeeCountByMonthByLevel");
        PERFORM add_org_attribute(_org.id, 'object', 'employeeCountByMonthByRole', _source, TRUE, _org."employeeCountByMonthByRole");
        PERFORM add_org_attribute(_org.id, 'object', 'grossAdditionsByMonth', _source, TRUE, _org."grossAdditionsByMonth");
        PERFORM add_org_attribute(_org.id, 'object', 'grossDeparturesByMonth', _source, TRUE, _org."grossDeparturesByMonth");
        PERFORM add_org_attribute(_org.id, 'object', 'naics', _source, TRUE, _org.naics);

        FOR _value IN SELECT UNNEST(_org."emails") AS value LOOP
            PERFORM add_org_attribute(_org.id, 'string', 'email', _source, FALSE, _value);
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."names") AS value LOOP
            PERFORM add_org_attribute(_org.id, 'string', 'name', _source, FALSE, _value);
        END LOOP;
        PERFORM add_org_attribute(_org.id, 'string', 'name', _source, TRUE, _org."displayName");
        FOR _value IN SELECT UNNEST(_org."phoneNumbers") AS value LOOP
            PERFORM add_org_attribute(_org.id, 'string', 'phoneNumber', _source, FALSE, _value);
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."tags") AS value LOOP
            PERFORM add_org_attribute(_org.id, 'string', 'tag', _source, FALSE, _value);
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."profiles") AS value LOOP
            PERFORM add_org_attribute(_org.id, 'string', 'profile', _source, FALSE, _value);
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."allSubsidiaries") AS value LOOP
            PERFORM add_org_attribute(_org.id, 'string', 'subsidiary', _source, FALSE, _value);
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."alternativeNames") AS value LOOP
            PERFORM add_org_attribute(_org.id, 'string', 'alternativeName', _source, FALSE, _value);
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."directSubsidiaries") AS value LOOP
            PERFORM add_org_attribute(_org.id, 'string', 'directSubsidiary', _source, FALSE, _value);
        END LOOP;
--         EXCEPTION WHEN OTHERS THEN
--             RAISE EXCEPTION '_org: %', _org.id;
--         END;
    END LOOP;
END;
$$;

DROP FUNCTION add_org_attribute(UUID, TEXT, TEXT, TEXT, BOOLEAN, anyelement);

ALTER TABLE organizations RENAME COLUMN "emails" TO "old_emails";
ALTER TABLE organizations RENAME COLUMN "phoneNumbers" TO "old_phoneNumbers";
ALTER TABLE organizations RENAME COLUMN "employeeCountByCountry" TO "old_employeeCountByCountry";
ALTER TABLE organizations RENAME COLUMN "geoLocation" TO "old_geoLocation";
ALTER TABLE organizations RENAME COLUMN "ticker" TO "old_ticker";
ALTER TABLE organizations RENAME COLUMN "profiles" TO "old_profiles";
ALTER TABLE organizations RENAME COLUMN "address" TO "old_address";
ALTER TABLE organizations RENAME COLUMN "attributes" TO "old_attributes";
ALTER TABLE organizations RENAME COLUMN "allSubsidiaries" TO "old_allSubsidiaries";
ALTER TABLE organizations RENAME COLUMN "alternativeNames" TO "old_alternativeNames";
ALTER TABLE organizations RENAME COLUMN "averageEmployeeTenure" TO "old_averageEmployeeTenure";
ALTER TABLE organizations RENAME COLUMN "averageTenureByLevel" TO "old_averageTenureByLevel";
ALTER TABLE organizations RENAME COLUMN "averageTenureByRole" TO "old_averageTenureByRole";
ALTER TABLE organizations RENAME COLUMN "directSubsidiaries" TO "old_directSubsidiaries";
ALTER TABLE organizations RENAME COLUMN "employeeCountByMonth" TO "old_employeeCountByMonth";
ALTER TABLE organizations RENAME COLUMN "employeeCountByMonthByLevel" TO "old_employeeCountByMonthByLevel";
ALTER TABLE organizations RENAME COLUMN "employeeCountByMonthByRole" TO "old_employeeCountByMonthByRole";
ALTER TABLE organizations RENAME COLUMN "gicsSector" TO "old_gicsSector";
ALTER TABLE organizations RENAME COLUMN "grossAdditionsByMonth" TO "old_grossAdditionsByMonth";
ALTER TABLE organizations RENAME COLUMN "grossDeparturesByMonth" TO "old_grossDeparturesByMonth";
ALTER TABLE organizations RENAME COLUMN "ultimateParent" TO "old_ultimateParent";
ALTER TABLE organizations RENAME COLUMN "immediateParent" TO "old_immediateParent";
ALTER TABLE organizations RENAME COLUMN "manuallyChangedFields" TO "old_manuallyChangedFields";
ALTER TABLE organizations RENAME COLUMN "naics" TO "old_naics";
ALTER TABLE organizations RENAME COLUMN "names" TO "old_names";
