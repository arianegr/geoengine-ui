import {BehaviorSubject, concat, first, ignoreElements, Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Inject,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconRegistry} from '@angular/material/icon';
import {MatDrawerToggleResult, MatSidenav} from '@angular/material/sidenav';
import {MatTabGroup} from '@angular/material/tabs';
import {
    AddDataButton,
    AddDataComponent,
    Config,
    Layer,
    LayoutService,
    MapContainerComponent,
    MapService,
    NavigationButton,
    NotificationService,
    OidcComponent,
    OperatorListButtonGroups,
    OperatorListComponent,
    PlotListComponent,
    ProjectService,
    RandomColorService,
    SidenavConfig,
    SidenavContainerComponent,
    SpatialReferenceService,
    TimeConfigComponent,
    UserService,
    WorkspaceSettingsComponent,
} from '@geoengine/core';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {AppConfig} from '../../app-config.service';
import {HelpComponent} from '../../features/help/help.component';
import {SplashDialogComponent} from '../../features/splash-dialog/splash-dialog.component';
import {BasketService} from '../../features/basket/basket.service';
import {BasketDialogComponent} from '../../features/basket/basket-dialog/basket-dialog.component';

@Component({
    selector: 'geoengine-root',
    templateUrl: './gfbio-module.component.html',
    styleUrls: ['./gfbio-module.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GfbioModuleComponent implements OnInit, AfterViewInit {
    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;
    @ViewChild(MatTabGroup, {static: true}) bottomTabs!: MatTabGroup;

    @ViewChild(MatSidenav, {static: true}) rightSidenav!: MatSidenav;
    @ViewChild(SidenavContainerComponent, {static: true}) rightSidenavContainer!: SidenavContainerComponent;

    @ViewChild('topToolbar', {static: true, read: ElementRef}) topToolbar!: ElementRef;

    readonly layersReverse$: Observable<Array<Layer>>;
    readonly layerListVisible$: Observable<boolean>;
    readonly layerDetailViewVisible$: Observable<boolean>;

    readonly navigationButtons = GfbioModuleComponent.setupNavigation();
    readonly addAFirstLayerConfig = GfbioModuleComponent.setupAddDataConfig();

    middleContainerHeight$: Observable<number>;
    bottomContainerHeight$: Observable<number>;
    mapIsGrid$: Observable<boolean>;

    private windowHeight$ = new BehaviorSubject<number>(window.innerHeight);

    constructor(
        @Inject(Config) readonly config: AppConfig,
        readonly layoutService: LayoutService,
        readonly projectService: ProjectService,
        readonly vcRef: ViewContainerRef, // reference used by color picker
        readonly userService: UserService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly dialog: MatDialog,
        private readonly iconRegistry: MatIconRegistry,
        private readonly randomColorService: RandomColorService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly notificationService: NotificationService,
        private readonly mapService: MapService,
        private readonly spatialReferenceService: SpatialReferenceService,
        private readonly basketService: BasketService,
        private readonly sanitizer: DomSanitizer,
    ) {
        this.registerIcons();

        vcRef.length; // eslint-disable-line @typescript-eslint/no-unused-expressions

        this.layersReverse$ = this.projectService.getLayerStream().pipe(map((layers) => layers.slice(0).reverse()));

        this.layerListVisible$ = this.layoutService.getLayerListVisibilityStream();
        this.layerDetailViewVisible$ = this.layoutService.getLayerDetailViewVisibilityStream();

        this.mapIsGrid$ = this.mapService.isGrid$;

        const totalHeight$ = this.windowHeight$.pipe(map((height) => height - this.topToolbar.nativeElement.offsetHeight));

        this.middleContainerHeight$ = this.layoutService.getMapHeightStream(totalHeight$).pipe(tap(() => this.mapComponent.resize()));
        this.bottomContainerHeight$ = this.layoutService.getLayerDetailViewStream(totalHeight$);
    }

    ngOnInit(): void {
        this.mapService.registerMapComponent(this.mapComponent);

        // TODO: remove if table is back
        this.layoutService.setLayerDetailViewVisibility(false);
    }

    ngAfterViewInit(): void {
        this.layoutService.getSidenavContentComponentStream().subscribe((sidenavConfig) => {
            this.rightSidenavContainer.load(sidenavConfig);

            let openClosePromise: Promise<MatDrawerToggleResult>;
            if (sidenavConfig) {
                openClosePromise = this.rightSidenav.open();
            } else {
                openClosePromise = this.rightSidenav.close();
            }

            openClosePromise.then(() => this.mapComponent.resize());
        });
        this.projectService
            .getNewPlotStream()
            .subscribe(() => this.layoutService.setSidenavContentComponent({component: PlotListComponent}));

        setTimeout(() => {
            // emit window height once to resize components if necessary
            this.windowHeight();
        });
        this.handleQueryParameters();
    }

    setTabIndex(index: number): void {
        this.layoutService.setLayerDetailViewTabIndex(index);
        this.layoutService.setLayerDetailViewVisibility(true);
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    private registerIcons(): void {
        this.iconRegistry.addSvgIconInNamespace('vat', 'logo', this.sanitizer.bypassSecurityTrustResourceUrl('assets/vat_logo.svg'));

        // used for navigation
        this.iconRegistry.addSvgIcon('cogs', this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cogs.svg'));
    }

    private static setupNavigation(): Array<NavigationButton> {
        return [
            {
                sidenavConfig: {component: OidcComponent},
                icon: 'account_circle',
                tooltip: 'Login',
            },
            {
                sidenavConfig: GfbioModuleComponent.setupAddDataConfig(),
                icon: 'add',
                tooltip: 'Add Data',
            },
            {
                sidenavConfig: {component: OperatorListComponent, config: {operators: GfbioModuleComponent.createOperatorListButtons()}},
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

    private static setupAddDataConfig(): SidenavConfig {
        return {component: AddDataComponent, config: {buttons: GfbioModuleComponent.createAddDataListButtons()}};
    }

    private static createAddDataListButtons(): Array<AddDataButton> {
        return [
            AddDataComponent.createDatasetListButton(),
            AddDataComponent.createUploadButton(),
            AddDataComponent.createDrawFeaturesButton(),
            AddDataComponent.createAddWorkflowByIdButton(),

            // ...SourceOperatorListComponent.createCustomFeaturesButtons(),
            // {
            //     name: 'Species Occurrences',
            //     description: 'Query data from GBIF',
            //     iconSrc: GFBioSourceType.ICON_URL,
            //     sidenavConfig: {component: GbifOperatorComponent, keepParent: true},
            // },
            // SourceOperatorListComponent.createCountryPolygonsButton(),
        ];
    }

    private static createOperatorListButtons(): OperatorListButtonGroups {
        return [
            {name: 'Mixed', list: OperatorListComponent.DEFAULT_MIXED_OPERATOR_DIALOGS},
            {name: 'Plots', list: OperatorListComponent.DEFAULT_PLOT_OPERATOR_DIALOGS},
            {name: 'Raster', list: OperatorListComponent.DEFAULT_RASTER_OPERATOR_DIALOGS},
            {name: 'Vector', list: OperatorListComponent.DEFAULT_VECTOR_OPERATOR_DIALOGS},
        ];
    }

    @HostListener('window:resize')
    private windowHeight(): void {
        this.windowHeight$.next(window.innerHeight);
    }

    /**
     * @private
     * @return true, if the splash dialog should be skipped, false otherwise
     */
    private handleQueryParameters(): void {
        const params = new URLSearchParams(window.location.search);
        const sessionState = params.get('session_state');
        const code = params.get('code');
        const state = params.get('state');

        let login;
        if (sessionState && code && state) {
            login = this.userService.oidcLogin({sessionState, code, state}).pipe(first());
        }

        const handleBasketSubscription: (p: ParamMap) => void = (p: ParamMap) => {
            const basketId = p.get('basket_id');
            if (basketId != null) {
                this.basketService.handleBasket(basketId).subscribe((result) => {
                    this.dialog.open(BasketDialogComponent, {data: {result}});
                });
            } else {
                const showSplash = this.userService.getSettingFromLocalStorage(SplashDialogComponent.SPLASH_DIALOG_NAME);
                if (showSplash === null || JSON.parse(showSplash)) {
                    this.dialog.open(SplashDialogComponent, {});
                }
            }
        };
        const routeParams = this.activatedRoute.queryParamMap;

        if (login) concat(login.pipe(ignoreElements()), routeParams).subscribe(handleBasketSubscription);
        else routeParams.subscribe(handleBasketSubscription);
    }
}
