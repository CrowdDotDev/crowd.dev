CREATE TABLE "orgAttributes" (
    "id" uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "organizationId" uuid REFERENCES "organizations" ("id") NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "source" VARCHAR(255) NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT FALSE,
    "value" TEXT
);

-- make sure there is only one default attribute
CREATE UNIQUE INDEX "orgAttributes_organizationId_name_default" ON "orgAttributes" ("organizationId", "name", "default") WHERE "default";

-- make sure there are no duplicate values for the same attribute and the same source
CREATE UNIQUE INDEX "orgAttributes_organizationId_name_source_value" ON "orgAttributes" ("organizationId", "name", "source", "value");

DO $$
DECLARE
    _org RECORD;
    _value TEXT;
BEGIN
    -- types: string | decimal | integer | boolean | object | array
    FOR _org IN SELECT * FROM organizations WHERE id = 'ce2853ea-6b2b-4a3d-a995-6e7cd3042b59' LOOP
        INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
        VALUES
            (_org.id, 'string', 'description', 'peopledatalabs', TRUE, _org.description),
            (_org.id, 'string', 'logo', 'peopledatalabs', TRUE, _org.logo),
            (_org.id, 'string', 'location', 'peopledatalabs', TRUE, _org.location),
            (_org.id, 'string', 'type', 'peopledatalabs', TRUE, _org.type),
            (_org.id, 'string', 'geoLocation', 'peopledatalabs', TRUE, _org."geoLocation"),
            (_org.id, 'string', 'size', 'peopledatalabs', TRUE, _org.size),
            (_org.id, 'string', 'ticker', 'peopledatalabs', TRUE, _org.ticker),
            (_org.id, 'string', 'headline', 'peopledatalabs', TRUE, _org.headline),
            (_org.id, 'string', 'industry', 'peopledatalabs', TRUE, _org.industry),
            (_org.id, 'string', 'gicsSector', 'peopledatalabs', TRUE, _org."gicsSector"),
            (_org.id, 'string', 'ultimateParent', 'peopledatalabs', TRUE, _org."ultimateParent"),
            (_org.id, 'string', 'immediateParent', 'peopledatalabs', TRUE, _org."immediateParent"),

            (_org.id, 'integer', 'employees', 'peopledatalabs', TRUE, _org.employees),
            (_org.id, 'integer', 'founded', 'peopledatalabs', TRUE, _org.founded),

            (_org.id, 'decimal', 'averageEmployeeTenure', 'peopledatalabs', TRUE, _org."averageEmployeeTenure"),

            (_org.id, 'object', 'revenueRange', 'peopledatalabs', TRUE, _org."revenueRange"),
            (_org.id, 'object', 'employeeCountByCountry', 'peopledatalabs', TRUE, _org."employeeCountByCountry"),
            (_org.id, 'object', 'address', 'peopledatalabs', TRUE, _org.address),
            (_org.id, 'object', 'averageTenureByLevel', 'peopledatalabs', TRUE, _org."averageTenureByLevel"),
            (_org.id, 'object', 'averageTenureByRole', 'peopledatalabs', TRUE, _org."averageTenureByRole"),
            (_org.id, 'object', 'employeeChurnRate', 'peopledatalabs', TRUE, _org."employeeChurnRate"),
            (_org.id, 'object', 'employeeCountByMonth', 'peopledatalabs', TRUE, _org."employeeCountByMonth"),
            (_org.id, 'object', 'employeeGrowthRate', 'peopledatalabs', TRUE, _org."employeeGrowthRate"),
            (_org.id, 'object', 'employeeCountByMonthByLevel', 'peopledatalabs', TRUE, _org."employeeCountByMonthByLevel"),
            (_org.id, 'object', 'employeeCountByMonthByRole', 'peopledatalabs', TRUE, _org."employeeCountByMonthByRole"),
            (_org.id, 'object', 'grossAdditionsByMonth', 'peopledatalabs', TRUE, _org."grossAdditionsByMonth"),
            (_org.id, 'object', 'grossDeparturesByMonth', 'peopledatalabs', TRUE, _org."grossDeparturesByMonth"),
            (_org.id, 'object', 'naics', 'peopledatalabs', TRUE, _org.naics)
        ON CONFLICT DO NOTHING;

        FOR _value IN SELECT UNNEST(_org."emails") AS value LOOP
            INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
            VALUES (_org.id, 'string', 'email', 'peopledatalabs', FALSE, _value)
            ON CONFLICT DO NOTHING;
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."names") AS value LOOP
            INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
            VALUES (_org.id, 'string', 'name', 'peopledatalabs', FALSE, _value)
            ON CONFLICT DO NOTHING;
        END LOOP;
        INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
        VALUES (_org.id, 'string', 'name', 'peopledatalabs', TRUE, _org."displayName")
        ON CONFLICT DO NOTHING;
        FOR _value IN SELECT UNNEST(_org."phoneNumbers") AS value LOOP
            INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
            VALUES (_org.id, 'string', 'phoneNumber', 'peopledatalabs', FALSE, _value)
            ON CONFLICT DO NOTHING;
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."tags") AS value LOOP
            INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
            VALUES (_org.id, 'string', 'tag', 'peopledatalabs', FALSE, _value)
            ON CONFLICT DO NOTHING;
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."profiles") AS value LOOP
            INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
            VALUES (_org.id, 'string', 'profile', 'peopledatalabs', FALSE, _value)
            ON CONFLICT DO NOTHING;
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."allSubsidiaries") AS value LOOP
            INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
            VALUES (_org.id, 'string', 'subsidiary', 'peopledatalabs', FALSE, _value)
            ON CONFLICT DO NOTHING;
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."alternativeNames") AS value LOOP
            INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
            VALUES (_org.id, 'string', 'alternativeName', 'peopledatalabs', FALSE, _value)
            ON CONFLICT DO NOTHING;
        END LOOP;
        FOR _value IN SELECT UNNEST(_org."directSubsidiaries") AS value LOOP
            INSERT INTO "orgAttributes" ("organizationId", "type", "name", "source", "default", "value")
            VALUES (_org.id, 'string', 'directSubsidiary', 'peopledatalabs', FALSE, _value)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$;


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
