import {Observable, BehaviorSubject, of as observableOf, from as observableFrom, combineLatest, partition} from 'rxjs';
import {toArray, filter, map, tap, first, flatMap} from 'rxjs/operators';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    HostListener, Inject,
    OnInit,
    ViewChild, ViewContainerRef
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconRegistry} from '@angular/material/icon';
import {MatSidenav} from '@angular/material/sidenav';
import {MatTabGroup} from '@angular/material/tabs';
import {
    Layer,
    SidenavContainerComponent,
    VectorLayer,
    MapContainerComponent,
    AbstractSymbology,
    LayerService,
    LayoutService,
    ProjectService,
    UserService,
    StorageService,
    RandomColorService,
    MappingQueryService,
    NotificationService,
    MapService,
    Config,
    ResultTypes,
    ComplexPointSymbology,
    ComplexVectorSymbology,
    PlotListComponent,
    SplashDialogComponent,
    UnexpectedResultType,
    IBasketPangaeaResult,
    IBasketGroupedAbcdResult,
    PangaeaBasketResultComponent,
    GroupedAbcdBasketResultComponent,
    Operator,
    AbstractVectorSymbology,
    BasketResult,
    BasketAvailability,
    WorkflowParameterChoiceDialogComponent,
    StorageStatus,
    NavigationButton,
    SourceOperatorListComponent,
    NavigationComponent,
    OperatorListComponent,
    TimeConfigComponent,
    WorkspaceSettingsComponent,
    HelpComponent,
} from 'wave-core';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';
import {AppConfig} from './app-config.service';

@Component({
    selector: 'wave-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent: MapContainerComponent;
    @ViewChild(MatTabGroup, {static: true}) bottomTabs: MatTabGroup;

    @ViewChild(MatSidenav, {static: true}) rightSidenav: MatSidenav;
    @ViewChild(SidenavContainerComponent, {static: true}) rightSidenavContainer: SidenavContainerComponent;

    readonly ResultTypes = ResultTypes;
    readonly LayoutService = LayoutService;

    readonly layersReverse$: Observable<Array<Layer<AbstractSymbology>>>;
    readonly layerListVisible$: Observable<boolean>;
    readonly layerDetailViewVisible$: Observable<boolean>;

    readonly navigationInput = this.setupNavigation();

    middleContainerHeight$: Observable<number>;
    bottomContainerHeight$: Observable<number>;
    mapIsGrid$: Observable<boolean>;

    private windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    constructor(@Inject(Config) readonly config: AppConfig,
                readonly layerService: LayerService,
                readonly layoutService: LayoutService,
                readonly projectService: ProjectService,
                readonly vcRef: ViewContainerRef, // reference used by color picker
                private userService: UserService,
                private storageService: StorageService,
                private changeDetectorRef: ChangeDetectorRef,
                private dialog: MatDialog,
                private iconRegistry: MatIconRegistry,
                private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                private activatedRoute: ActivatedRoute,
                private notificationService: NotificationService,
                private mapService: MapService,
                private sanitizer: DomSanitizer) {
        this.registerIcons();

        vcRef.length; // tslint:disable-line:no-unused-expression // just get rid of unused warning

        this.storageService.toString(); // just register

        this.layersReverse$ = this.projectService.getLayerStream().pipe(
            map(layers => layers.slice(0).reverse())
        );

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.layerDetailViewVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();
    }

    private registerIcons() {
        this.iconRegistry.addSvgIconInNamespace(
            'vat',
            'logo',
            this.sanitizer.bypassSecurityTrustResourceUrl('assets/vat_logo.svg'),
        );

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));

        switch (this.config.PROJECT) { // project-specific icons
            case 'EUMETSAT':
                break;
            case 'GFBio':
                break;
            case 'GeoBon':
                this.iconRegistry.addSvgIconInNamespace(
                    'geobon',
                    'logo',
                    this.sanitizer.bypassSecurityTrustResourceUrl('assets/geobon-logo.svg'),
                );
                break;
            case 'Nature40':
                this.iconRegistry.addSvgIconInNamespace(
                    'nature40',
                    'icon',
                    this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/natur_40_logo.svg'),
                );
                break;
        }
    }

    ngOnInit() {
        this.mapService.registerMapComponent(this.mapComponent);
        this.mapIsGrid$ = this.mapService.isGrid$;

        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(this.windowHeight$).pipe(
            tap(() => this.mapComponent.resize()),
        );
        this.bottomContainerHeight$ = this.layoutService.getLayerDetailViewStream(this.windowHeight$);
    }

    ngAfterViewInit() {
        this.layoutService.getSidenavContentComponentStream().subscribe(sidenavConfig => {
            this.rightSidenavContainer.load(sidenavConfig);
            if (sidenavConfig) {
                this.rightSidenav.open();
            } else {
                this.rightSidenav.close();
            }
        });
        this.projectService.getNewPlotStream()
            .subscribe(() => this.layoutService.setSidenavContentComponent({component: PlotListComponent}));

        // set the stored tab index
        this.layoutService.getLayerDetailViewTabIndexStream().subscribe(tabIndex => {
            if (this.bottomTabs.selectedIndex !== tabIndex) {
                this.bottomTabs.selectedIndex = tabIndex;
                setTimeout(() => this.changeDetectorRef.markForCheck());
            }
        });

        // show splash screen
        if (this.config.PROJECT === 'GFBio' && this.userService.shouldShowIntroductoryPopup()) {
            setTimeout(() => {
                this.dialog.open(SplashDialogComponent, {});
            });
        }

        // notify window parent that this component is ready
        if (parent !== window) {
            parent.postMessage({
                type: 'STATUS',
                status: 'READY',
            }, '*');
        } else {

            // handle query parameters directly if it is not embedded and using an auto login
            this.handleQueryParameters();

        }
    }

    setTabIndex(index: number) {
        this.layoutService.setLayerDetailViewTabIndex(index);
        this.layoutService.setLayerDetailViewVisibility(true);
    }

    @HostListener('window:message', ['$event.data'])
    public handleMessage(message: { type: string }) {
        switch (message.type) {
            case 'TOKEN_LOGIN':
                const tokenMessage = message as { type: string, token: string };
                this.userService.gfbioTokenLogin(tokenMessage.token).subscribe(() => {
                    this.storageService.getStatus().pipe(
                        filter(status => status === StorageStatus.OK),
                        first()
                    ).subscribe(() => {
                        this.handleQueryParameters();
                    });
                });
                break;
            default:
            // unhandled message
        }
    }

    private setupNavigation(): Array<NavigationButton> {
        return [
            NavigationComponent.createLoginButton(this.userService, this.layoutService, this.config),
            {
                sidenavConfig: {component: SourceOperatorListComponent},
                icon: 'add',
                tooltip: 'Add Data',
            },
            {
                sidenavConfig: {component: OperatorListComponent},
                icon: '',
                svgIcon: 'cogs',
                tooltip: 'Operators',
            },
            {
                sidenavConfig: {component: PlotListComponent},
                icon: 'equalizer',
                tooltip: 'Plots',
            },
            {
                sidenavConfig: {component: TimeConfigComponent},
                icon: 'access_time',
                tooltip: 'Time',
            },
            {
                sidenavConfig: {component: WorkspaceSettingsComponent},
                icon: 'settings',
                tooltip: 'Workspace',
            },
            {
                sidenavConfig: {component: HelpComponent},
                icon: 'help',
                tooltip: 'Help',
            },
        ];
    }

    @HostListener('window:resize')
    private windowHeight() {
        this.windowHeight$.next(window.innerHeight);
    }

    private handleQueryParameters() {
        this.activatedRoute.queryParams.subscribe(p => {
            for (const parameter of Object.keys(p)) {
                const value = p[parameter];
                switch (parameter) {
                    case 'workflow':
                        try {
                            const newLayer = Layer.fromDict(JSON.parse(value));
                            this.projectService.getProjectStream().pipe(first()).subscribe(project => {
                                if (project.layers.length > 0) {
                                    // show popup
                                    this.dialog.open(WorkflowParameterChoiceDialogComponent, {
                                        data: {
                                            dialogTitle: 'Workflow URL Parameter',
                                            sourceName: 'URL parameter',
                                            layers: [newLayer],
                                            nonAvailableNames: [],
                                            numberOfLayersInProject: project.layers.length,
                                        }
                                    });
                                } else {
                                    // just add the layer if the layer array is empty
                                    this.projectService.addLayer(newLayer);
                                }
                            });
                        } catch (error) {
                            this.notificationService.error(`Invalid Workflow: »${error}«`);
                        }
                        break;
                    case 'gfbioBasketId':
                        try {
                            const gfbioBasketId: number = JSON.parse(value);
                            this.projectService.getProjectStream().pipe(
                                first()
                            ).subscribe(project => {
                                this.gfbioBasketIdToLayers(gfbioBasketId)
                                    .subscribe((importResult: BasketAvailability) => {
                                            // show popup
                                            this.dialog.open(WorkflowParameterChoiceDialogComponent, {
                                                data: {
                                                    dialogTitle: 'GFBio Basket Import',
                                                    sourceName: 'GFBio Basket',
                                                    layers: importResult.availableLayers,
                                                    nonAvailableNames: importResult.nonAvailableNames,
                                                    numberOfLayersInProject: project.layers.length,
                                                },
                                            });
                                        },
                                        error => {
                                            this.notificationService.error(`GFBio Basket Loading Error: »${error}«`);
                                        },
                                    );
                            });
                        } catch (error) {
                            this.notificationService.error(`Invalid Workflow: »${error}«`);
                        }
                        break;
                    case 'jws':
                    case 'jwt':
                        this.nature40JwtLogin(parameter, value);
                        break;
                    default:
                        this.notificationService.error(`Unknown URL Parameter »${parameter}«`);
                }
            }
        });
    }

    private nature40JwtLogin(parameter: string, token: string) {
        this.userService.nature40JwtTokenLogin(token).pipe(first()).subscribe(
            success => {
                if (success) {
                    this.notificationService.info(`Logged in using ${parameter.toUpperCase()}`);
                } else {
                    this.notificationService.error(`Login with ${parameter.toUpperCase()} unsuccessful`);
                    // log out, because mapping session exists, but JWT token has become invalid
                    this.userService.guestLogin().pipe(first()).subscribe();
                }
            },
            error => {
                this.notificationService.error(`Cant handle provided ${parameter.toUpperCase()} parameters: »${error}«`);
            },
        );
    }

    private gfbioBasketIdToLayers(basketId: number): Observable<BasketAvailability> {
        const [availableEntries, nonAvailableEntries]: [Observable<BasketResult>, Observable<BasketResult>] =
            partition(
                this.mappingQueryService
                    .getGFBioBasket(basketId)
                    .pipe(
                        flatMap(basket => observableFrom(basket.results)),
                    ),
                (basketResult: BasketResult) => basketResult.available,
            );

        const availableLayers: Observable<Array<VectorLayer<AbstractVectorSymbology>>> = availableEntries
            .pipe(
                flatMap(basketResult => this.gfbioBasketResultToLayer(basketResult)),
                toArray(),
            );

        const nonAvailableNames: Observable<Array<string>> = nonAvailableEntries
            .pipe(
                map(basketResult => basketResult.title),
                toArray(),
            );

        return combineLatest([availableLayers, nonAvailableNames])
            .pipe(
                map(([layers, names]: [Array<VectorLayer<AbstractVectorSymbology>>, Array<string>]) => {
                    return {
                        availableLayers: layers,
                        nonAvailableNames: names,
                    } as BasketAvailability;
                })
            );
    }

    private gfbioBasketResultToLayer(result: BasketResult): Observable<VectorLayer<AbstractVectorSymbology>> {
        let operator$: Observable<Operator>;
        if (result.type === 'abcd_grouped') {
            operator$ = this.userService
                .getSourceSchemaAbcd().pipe(
                    map(
                        sourceSchema => GroupedAbcdBasketResultComponent.createOperatorFromGroupedABCDData(
                            result as IBasketGroupedAbcdResult,
                            sourceSchema,
                            true
                        )
                    )
                );
        } else if (result.type === 'pangaea') {
            operator$ = observableOf(
                PangaeaBasketResultComponent.createOperatorFromPangaeaData(result as IBasketPangaeaResult)
            );
        }

        return operator$.pipe(
            map(operator => {
                let clustered = false;
                let symbology;

                switch (operator.resultType) {
                    case ResultTypes.POINTS:
                        symbology = ComplexPointSymbology.createClusterSymbology({
                            fillRGBA: this.randomColorService.getRandomColorRgba(),
                        });
                        clustered = true;
                        break;
                    case ResultTypes.POLYGONS:
                        symbology = ComplexVectorSymbology.createSimpleSymbology({
                            fillRGBA: this.randomColorService.getRandomColorRgba(),
                        });
                        break;
                    default:
                        throw new UnexpectedResultType();
                }

                return new VectorLayer({
                    name: result.title,
                    operator,
                    symbology,
                    clustered,
                });
            })
        );
    }
}