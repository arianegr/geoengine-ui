import {APP_INITIALIZER, Injector, NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';

import {AppComponent} from './app.component';
import {
    Config,
    LayoutService,
    MapService,
    NotificationService,
    ProjectService,
    RandomColorService,
    SidenavRef,
    SpatialReferenceService,
    TabsService,
    UserService,
    CoreModule,
} from '@geoengine/core';
import {AppConfig} from './app-config.service';
import {AppRoutingModule} from './app-routing.module';
import {environment} from '../environments/environment';
import {routes} from './routes';
import {Router} from '@angular/router';

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserAnimationsModule, BrowserModule, HttpClientModule, AppRoutingModule, CoreModule],
    providers: [
        {provide: Config, useClass: AppConfig},
        {
            provide: APP_INITIALIZER,
            useFactory: (config: AppConfig) => (): Promise<void> => config.load(),
            deps: [Config],
            multi: true,
        },
        {
            provide: APP_INITIALIZER,
            useFactory: loadRoutes,
            deps: [Injector],
            multi: true,
        },
        LayoutService,
        MapService,
        NotificationService,
        ProjectService,
        RandomColorService,
        SidenavRef,
        SpatialReferenceService,
        UserService,
        TabsService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}

export function loadRoutes(injector: Injector) {
    return () => {
        const moduleId = environment.moduleId;
        const filteredRoutes = routes.filter((r) => {
            return r.data?.modules.find((r: string) => r === 'all') || r.data?.modules.find((r: string) => r === moduleId);
        });
        const router: Router = injector.get(Router);
        router.resetConfig(filteredRoutes);
    };
}
