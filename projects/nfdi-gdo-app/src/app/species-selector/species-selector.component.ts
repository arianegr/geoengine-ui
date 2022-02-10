import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {ClusteredPointSymbology, PointSymbology, ProjectService, UUID, VectorLayer, WorkflowDict} from 'wave-core';
import {mergeMap} from 'rxjs';
import {DataSelectionService} from '../data-selection.service';

@Component({
    selector: 'wave-species-selector',
    templateUrl: './species-selector.component.html',
    styleUrls: ['./species-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeciesSelectorComponent implements OnInit, OnDestroy {
    species: string[] = [
        'Aeshna affinis',
        'Aeshna caerulea',
        'Aeshna cyanea',
        'Aeshna grandis',
        'Aeshna isoceles',
        'Aeshna juncea',
        'Aeshna mixta',
        'Aeshna subarctica',
        'Aeshna viridis',
        'Anax ephippiger',
        'Anax imperator',
        'Anax parthenope',
        'Boyeria irene',
        'Brachytron pratense',
        'Calopteryx splendens',
        'Calopteryx virgo',
        'Ceriagrion tenellum',
        'Chalcolestes viridis',
        'Coenagrion armatum',
        'Coenagrion hastulatum',
        'Coenagrion lunulatum',
        'Coenagrion mercuriale',
        'Coenagrion ornatum',
        'Coenagrion puella',
        'Coenagrion pulchellum',
        'Coenagrion scitulum',
        'Cordulegaster bidentata',
        'Cordulegaster boltonii',
        'Cordulia aenea',
        'Crocothemis erythraea',
        'Enallagma cyathigerum',
        'Epitheca bimaculata',
        'Erythromma lindenii',
        'Erythromma najas',
        'Erythromma viridulum',
        'Gomphus flavipes',
        'Gomphus pulchellus',
        'Gomphus simillimus',
        'Gomphus vulgatissimus',
        'Ischnura elegans',
        'Ischnura pumilio',
        'Lestes barbarus',
        'Lestes dryas',
        'Lestes sponsa',
        'Lestes virens',
        'Leucorrhinia albifrons',
        'Leucorrhinia caudalis',
        'Leucorrhinia dubia',
        'Leucorrhinia pectoralis',
        'Leucorrhinia rubicunda',
        'Libellula depressa',
        'Libellula fulva',
        'Libellula quadrimaculata',
        'Nehalennia speciosa',
        'Onychogomphus forcipatus',
        'Onychogomphus uncatus',
        'Ophiogomphus cecilia',
        'Orthetrum albistylum',
        'Orthetrum brunneum',
        'Orthetrum cancellatum',
        'Orthetrum coerulescens',
        'Oxygastra curtisii',
        'Platycnemis pennipes',
        'Pyrrhosoma nymphula',
        'Somatochlora alpestris',
        'Somatochlora arctica',
        'Somatochlora flavomaculata',
        'Somatochlora metallica',
        'Sympecma fusca',
        'Sympecma paedisca',
        'Sympetrum danae',
        'Sympetrum depressiusculum',
        'Sympetrum flaveolum',
        'Sympetrum fonscolombii',
        'Sympetrum meridionale',
        'Sympetrum pedemontanum',
        'Sympetrum sanguineum',
        'Sympetrum striolatum',
        'Sympetrum vulgatum',
    ];

    private datasetId: UUID = 'd9dd4530-7a57-44da-a650-ce7d81dcc216';

    constructor(private readonly projectService: ProjectService, private readonly dataSelectionService: DataSelectionService) {}

    ngOnInit(): void {}

    ngOnDestroy(): void {}

    selectSpecies(species: string): void {
        const workflow: WorkflowDict = {
            type: 'Vector',
            operator: {
                type: 'ColumnRangeFilter',
                params: {
                    column: 'Species',
                    ranges: [[species, species]],
                    keepNulls: false,
                },
                sources: {
                    vector: {
                        type: 'OgrSource',
                        params: {
                            dataset: {
                                type: 'internal',
                                datasetId: this.datasetId,
                            },
                        },
                    },
                },
            },
        };

        this.projectService
            .registerWorkflow(workflow)
            .pipe(
                mergeMap((workflowId) =>
                    this.dataSelectionService.setSpeciesLayer(
                        new VectorLayer({
                            workflowId,
                            name: species,
                            symbology: ClusteredPointSymbology.fromPointSymbologyDict({
                                type: 'point',
                                radius: {
                                    type: 'static',
                                    value: PointSymbology.DEFAULT_POINT_RADIUS,
                                },
                                stroke: {
                                    width: {
                                        type: 'static',
                                        value: 1,
                                    },
                                    color: {
                                        type: 'static',
                                        color: [0, 0, 0, 255],
                                    },
                                },
                                fillColor: {
                                    type: 'static',
                                    color: [189, 42, 11, 255],
                                },
                            }),
                            isLegendVisible: false,
                            isVisible: true,
                        }),
                    ),
                ),
            )
            .subscribe();
    }
}