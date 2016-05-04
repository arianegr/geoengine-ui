import {Projection, Projections} from "./projection.model";

export interface ProjectConfig {
    name: string;
    workingProjection: Projection;
    mapProjection: Projection;
}

export class Project {
    name: string;
    workingProjection: Projection;
    mapProjection: Projection;

    constructor(config: ProjectConfig) {
        this.name = config.name;
        this.workingProjection = config.workingProjection;
        this.mapProjection = config.mapProjection;
    }

    toJSON(): string {
        return JSON.stringify({
            name: this.name,
            workingProjection: this.workingProjection.getCode(),
            mapProjection: this.mapProjection.getCode(),
        });
    }

    static fromJSON(json: string): Project {
        let config = JSON.parse(json);
        // console.log(json, config);
        return new Project({
            name: config.name,
            workingProjection: Projections.fromCode(config.workingProjection),
            mapProjection: Projections.fromCode(config.mapProjection)
        });
    }

}
