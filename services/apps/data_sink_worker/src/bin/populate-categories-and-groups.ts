import {parse} from 'csv'
import fs from 'fs'
import path from 'path'

import {getDbConnection} from '@crowd/data-access-layer/src/database'
import {getServiceLogger} from '@crowd/logging'
import slugify from 'slugify'
import {DB_CONFIG} from '../conf'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

setImmediate(async () => {
    const dbClient = await getDbConnection(DB_CONFIG())

    log.info('Reading csv file...')

    const csvFilePath = path.resolve(__dirname, './csv/collections.csv')
    const fileContent = fs.readFileSync(csvFilePath)
    const records: any[] = await new Promise((resolve, reject) => parse(
        fileContent,
        {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        },
        (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        }))


    const categoryGroups = Array.from(new Map(records.map((record) => {
        const slug = `${slugify(record.category_group, {lower: true, replacement: '-'})}`;
        return [slug, {
            name: record.category_group,
            type: record.type,
            slug: slug,

        }]
    })).values());



    for (const categoryGroup of categoryGroups) {
        const {name, type, slug} = categoryGroup;
        try{
            await dbClient.none(
                `
                INSERT INTO "categoryGroups" (name, type, slug)
                VALUES ($1, $2, $3)
            `,
                [name, type, slug]
            )
        }
        catch (_){

        }
    }

    const categoryGroupsRecords = await dbClient.query(
        `
                SELECT id, slug from "categoryGroups"
            `,
    )

    const categoryGroupsMap = Object.fromEntries(categoryGroupsRecords.map((group) => [group.slug, group.id]));


    const categories = Array.from(new Map(records.map((record) => {
        const slug = `${slugify(record.category, {lower: true, replacement: '-'})}`;
        const groupSlug = `${slugify(record.category_group, {lower: true, replacement: '-'})}`;
        const groupId = categoryGroupsMap[groupSlug];
        return [slug, {
            name: record.category,
            slug: slug,
            groupId: groupId,
        }]
    })).values());

    for (const category of categories) {
        const {name, slug, groupId} = category;
        try{
            await dbClient.none(
                `
                INSERT INTO "categories" (name, slug, "categoryGroupId")
                VALUES ($1, $2, $3)
            `,
                [name, slug, groupId]
            )
        }
        catch (_){

        }
    }

    const categoriesRecords = await dbClient.query(
        `
                SELECT id, slug from "categories"
            `,
    )
    const categoriesMap = Object.fromEntries(categoriesRecords.map((category) => [category.slug, category.id]));

    for(const collection of records) {
        const categorySlug = `${slugify(collection.category, {lower: true, replacement: '-'})}`;
        const categoryId = categoriesMap[categorySlug];
        try{
            await dbClient.none(
                `
                    UPDATE "collections"
                    SET "categoryId" = $1
                    WHERE name = $2
                `,
                [categoryId, collection.name]
            )
        }
        catch (_){

        }
    }

    process.exit(0)
})
