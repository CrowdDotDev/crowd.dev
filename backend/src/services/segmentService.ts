
import SegmentRepository from '../database/repositories/segmentRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { SegmentCriteria, SegmentData, SegmentUpdateData } from '../types/segmentTypes'
import { IServiceOptions } from './IServiceOptions'

import { LoggingBase } from './loggingBase'

export default class SegmentService extends LoggingBase {
    options: IServiceOptions

    constructor(options: IServiceOptions) {
        super(options)
        this.options = options
    }




    async createProjectGroup(data: SegmentData): Promise<SegmentData> {
        // project groups shouldn't have parentSlug or grandparentSlug
        if (data.parentSlug || data.grandparentSlug) {
            throw new Error(`Project groups can't have parent or grandparent segments.`)
        }

        const transaction = await SequelizeRepository.createTransaction(this.options)


        const segmentRepository = new SegmentRepository({...this.options, transaction})

        // create project group
        const projectGroup = await segmentRepository.create(data)

        // create project counterpart
        await segmentRepository.create({...data, parentSlug: data.slug})

        // create subproject counterpart
        await segmentRepository.create({ ...data, parentSlug: data.slug, grandparentSlug: data.slug })

        return this.findById(projectGroup.id)

        
    }

    async createProject(data: SegmentData): Promise<SegmentData> {
        // project groups shouldn't have parentSlug or grandparentSlug
        if (data.grandparentSlug) {
            throw new Error(`Projects can't have grandparent segments.`)
        }

        if (!data.parentSlug){
            throw new Error('Missing parentSlug. Projects must belong to a project group.')
        }

        const transaction = await SequelizeRepository.createTransaction(this.options)


        const segmentRepository = new SegmentRepository({...this.options, transaction})

        // create project
        const project = await segmentRepository.create(data)

        // create subproject counterpart
        await segmentRepository.create({ ...data, grandparentSlug: data.slug })

        return this.findById(project.id)
        
    }

    async createSubproject(data:SegmentData): Promise<SegmentData> {
        if (!data.parentSlug){
            throw new Error('Missing parentSlug. Subprojects must belong to a project.')
        }

        if (!data.grandparentSlug){
            throw new Error('Missing grandparentSlug. Subprojects must belong to a project group.')
        }

        const segmentRepository = new SegmentRepository(this.options)

        
        const subproject =  await segmentRepository.create(data)

        return this.findById(subproject.id)

    }

    // each foundation will also have a project and subproject counterparts
    // async createFoundation(data) {
    //     // create foundation
    // 
    //     // create project
    // 
    //     // create subproject
    // }
    // 
    // // each project will also have a subproject counterpart
    // async createProject() {
    //     
    // }
    // 
    // async createSubproject() {
    //     
    // }

    async findById(id) {
        return new SegmentRepository(this.options).findById(id)
    }

    async query(search:SegmentCriteria) {
        return new SegmentRepository(this.options).queryProjectGroups(search)
    }

    async update(id: string, data: SegmentUpdateData): Promise<SegmentData> {
        const segment = await this.findById(id)

        
    }
}
