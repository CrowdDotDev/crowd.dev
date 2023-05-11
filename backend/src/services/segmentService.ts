
import SegmentRepository from '../database/repositories/segmentRepository'
import { SegmentCriteria, SegmentData } from '../types/segmentTypes'
import { IServiceOptions } from './IServiceOptions'

import { LoggingBase } from './loggingBase'

export default class SegmentService extends LoggingBase {
    options: IServiceOptions

    constructor(options: IServiceOptions) {
        super(options)
        this.options = options
    }

    async createProjectGroup(data: SegmentData) {
        // project groups shouldn't have parentSlug or grandparentSlug
        if (data.parentSlug || data.grandparentSlug) {
            throw new Error(`Project groups can't have parent or grandparent segments.`)
        }

        const segmentRepository = new SegmentRepository(this.options)

        // create project group

        const projectGroup = await segmentRepository.create(data)

        // create project counterpart
        const project = await segmentRepository.create({...data, parentSlug: data.slug})

        // create subproject counterpart
        const subproject = await segmentRepository.create({ ...data, parentSlug: data.slug, grandparentSlug: data.slug })



        
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
}
